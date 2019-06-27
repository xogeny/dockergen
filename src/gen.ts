let fs = require('fs');
let config = require('./config');

let template = require('./template').template

let defaults = config.configDefaults();

function scriptCommands(argv) {
    let scripts = argv.script || [];
    let test = argv.test;

    if (test && scripts.indexOf("test") == -1) {
        scripts.push("test");
    }

    return "# NPM Scripts to run *during build*\n" + scripts.map((script) => {
        return `RUN npm run ${script}`
    }).join("\n");
}

function exposeCommands(argv) {
    let exps = argv.expose;
    if (!exps || exps.length == 0) return "# No ports are exposed by this image\n";

    return "# Ports to EXPOSE\n" + exps.map((exp) => `EXPOSE ${exp}`).join("\n");
}

function envCommands(argv) {
    let envs = argv.env;
    if (!envs || envs.length == 0) return "";

    let ret = "# Environment variables that can be set via 'docker run -e ...'\n";
    ret += envs.map((env) => {
        let parts = env.split("=");
        if (parts.length != 2) {
            throw new Error("Environment variables must be of the form NAME=VALUE")
        }
        return `ENV ${parts[0]} ${parts[1]}`
    }).join("\n")
    return ret;
}

function npmFileCommands(argv) {
    let scope = argv["scope"];
    let ret = "RUN echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' > .npmrc\n";
    if (!scope) {
        return ret;
    }

    if (!scope.startsWith("@")) {
        scope = "@" + scope
    }

    if (scope) {
        ret = ret + "\n# User specified scope of " + scope + "\n"
        ret = ret + "RUN echo 'scope=" + scope + "' >> .npmrc\n"
        ret = ret + "RUN echo '" + scope + ":registry=https://registry.npmjs.org/' >> .npmrc\n";
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

    if (argv.dryrun) {
        console.log(output);
    } else {
        if (fs.existsSync("Dockerfile") && !argv.overwrite) {
            console.error("Dockerfile already exists, use --overwrite to overwrite it")
            process.exit(1);
        } else {
            fs.writeFileSync("Dockerfile", output);
            console.log("Dockerfile written");
        }
    }
}

function addGenCommand(yargs) {
    yargs
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
                    .options({
                        'k': {
                            alias: 'dryrun',
                            default: false,
                            describe: 'Perform a dryrun generation (output to standard out)',
                            type: 'boolean'
                        }
                    })
                    .help()
            },
            handler: (argv) => {
                generate(argv);
            }
        })
}

module.exports = {
    addGenCommand: addGenCommand,
}