#! /usr/bin/env node
let yargs = require('yargs');
let fs = require('fs');
let process = require('process');
let path = require('path');

let pkgjson = path.join(fs.realpathSync(process.cwd()), "package.json");

let pkg = require(pkgjson);

const spawn = require('child_process').spawn;

let template = require('./template').template

function scriptCommands(argv) {
    let scripts = argv.script || [];
    let test = argv.test;

    if (test && scripts.indexOf("test")==-1) {
        scripts.push("test");
    }

    return "# NPM Scripts to run *during build*\n" + scripts.map((script) => {
        return `RUN npm run ${script}`
    }).join("\n");
}

function exposeCommands(argv) {
    let exps = argv.expose;
    if (!exps || exps.length==0) return "# No ports are exposed by this image\n";

    return "# Ports to EXPOSE\n"+exps.map((exp) => `EXPOSE ${exp}`).join("\n");
}

function envCommands(argv) {
    let envs = argv.env;
    if (!envs || envs.length==0) return "";

    let ret = "# Environment variables that can be set via 'docker run -e ...'\n";
    ret += envs.map((env) => {
        let parts = env.split("=");
        if (parts.length!=2) {
            throw new Error("Environment variables must be of the form NAME=VALUE")
        }
        return `ENV ${parts[0]} ${parts[1]}`
    }).join("\n")
    return ret;
}

function npmFileCommands(argv) {
    let scope = argv["scope"];
    if (!scope) return "";
    
    if (!scope.startsWith("@")) {
        scope = "@"+scope
    }
    let ret = "RUN echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' > .npmrc\n\n"
    if (scope) {
        ret = ret + "# User specified scope of "+scope+"\n"
        ret = ret + "RUN echo 'scope="+scope+"' >> .npmrc\n"
        ret = ret + "RUN echo '"+scope+":registry=https://registry.npmjs.org/' >> .npmrc\n";
    }
    return ret;
}

function generate(argv) {
    let npmfile = npmFileCommands(argv);
    let image = argv.image;
    let envs = envCommands(argv);
    let exps = exposeCommands(argv);
    let scripts = scriptCommands(argv);
    let output = template(image, npmfile, envs, exps, scripts, argv.runcmd);

    if (fs.existsSync("Dockerfile") && !argv.overwrite) {
        console.error("Dockerfile already exists, use --overwrite to overwrite it")
        process.exit(1);
    } else {
        fs.writeFileSync("Dockerfile", output);
        console.log("Dockerfile written");
    }
}

function defaultValue(key, def) {
    if (pkg && pkg.dockergen && pkg.dockergen[key]) {
        let val = pkg.dockergen[key];
        if (key=="env") {
            val = Object.keys(val).map((key) => `${key}=${val[key]}`)
        }
        return val
    }
    return def;
}

const defaults = {
    "image": defaultValue("image", "node:latest"),
    "env": defaultValue("env", []),
    "expose": defaultValue("expose", []),
    "script": defaultValue("script", []),
    "scope": defaultValue("scope", null),
    "test": defaultValue("test", true),
    "overwrite": defaultValue("overwrite", false),
    "runcmd": defaultValue("runcmd", "start"),
    "name": defaultValue("name", null),
}

yargs
    .command({
        command: "build",
        handler: (argv) => {
            let gitignore = path.join(process.cwd(), ".gitignore");
            let npmignore = path.join(process.cwd(), ".npmignore");
            let dignore = fs.existsSync(path.join(process.cwd(), ".dockerignore"));
            let gignore = fs.existsSync(gitignore);
            let nignore = fs.existsSync(npmignore);
            let git = fs.existsSync(path.join(process.cwd(), ".git"));

            if (!dignore && (git || gignore || nignore)) {
                console.warn("WARNING, no .dockerignore file found!");
                console.warn("We strongly advise that you create a .dockerignore");
                console.warn("file and include the following:");
                console.warn("");
                console.warn(".git");
                if (nignore) {
                    console.warn(fs.readFileSync(npmignore).toString());
                } else {
                    if (gignore) {
                        console.warn(fs.readFileSync(gitignore).toString());
                    } else {
                        console.warn("node_modules");
                    }
                }
            }

            let token = process.env["NPM_TOKEN"]
            let name = argv.name;

            let args = ['build', '-t', name, '.'];
            if (token) {
                args = ['build', '--build-arg', 'NPM_TOKEN='+token,
                            '-t', name, '.'];
            }

            let cmd = argv.docker+" "+args.join(" ");
            if (argv.dryrun) {
                console.log("Build details...");
                console.log("  command: '"+cmd+"'");
                console.log("  token: ", token);
            } else {
                console.log("Running '"+cmd+"'...");

                let s = spawn(argv.docker, args);

                s.stdout.on('data', (data) => {
                    process.stdout.write(data);
                });

                s.stderr.on('data', (data) => {
                    process.stderr.write(data);
                });

                s.on('close', (code) => {
                    if (code==0) {
                        console.log("Build successful!");
                    } else {
                        console.error("Build failed!");
                    }
                    process.exit(code);
                });
            }
        },
        desc: 'Generate a Dockerfile',
        builder: (yargs) => {
            yargs
                .options({
                    'n': {
                        alias: 'name',
                        demand: true,
                        default: defaults.name,
                        describe: 'Name to give image being built',
                        type: 'string'
                    }
                })
                .options({
                    'k': {
                        alias: 'dryrun',
                        default: false,
                        describe: 'Perform a dryrun build',
                        type: 'boolean'
                    }
                })
                .options({
                    'd': {
                        alias: 'docker',
                        default: "docker",
                        describe: "Docker command",
                        type: 'string'
                    }
                })
                .help()
        },
    })
    .command({
        command: 'generate',
        aliases: ['gen'],
        desc: 'Generate a Dockerfile',
        builder: (yargs) => {
            yargs
                .options({
                    'i': {
                        alias: 'image',
                        demand: false,
                        default: defaults.image,
                        describe: 'Base Docker image',
                        type: 'string'
                    }
                })
                .options({
                    'e': {
                        alias: 'env',
                        demand: false,
                        default: defaults.env,
                        describe: 'Settable environment variables (NAME=VAL)',
                        type: 'array'
                    }
                })
                .options({
                    'x': {
                        alias: 'expose',
                        demand: false,
                        default: defaults.expose,
                        describe: 'Ports to EXPOSE',
                        type: 'array'
                    }
                })
                .options({
                    's': {
                        alias: 'script',
                        demand: false,
                        default: defaults.script,
                        describe: 'Scripts to run during build',
                        type: 'array'
                    }
                })
                .options({
                    'c': {
                        alias: 'scope',
                        demand: false,
                        default: defaults.scope,
                        describe: 'Scope to use for repos',
                        type: 'string'
                    }
                })
                .options({
                    'o': {
                        alias: 'overwrite',
                        demand: false,
                        default: defaults.overwrite,
                        describe: 'Overwrite existing Dockerfile',
                        type: 'boolean'
                    }
                })
                .options({
                    't': {
                        alias: 'test',
                        demand: false,
                        default: defaults.test,
                        describe: 'Run tests during build',
                        type: 'boolean'
                    }
                })
                .options({
                    'r': {
                        alias: 'runcmd',
                        demand: false,
                        default: defaults.runcmd,
                        describe: 'NPM script to launch application',
                        type: 'string'
                    }
                })
                .help()
        },
        handler: (argv) => {
            generate(argv);
        }
    })
// provide a minimum demand and a minimum demand message 
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .argv
