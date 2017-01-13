let yargs = require('yargs');

function scriptCommands(argv) {
    let scripts = argv.scripts;
    let test = argv.test;
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
        return "ENV "+parts[0]+" "+parts[1]
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

function template(image, npmfile, envs, exps) {
  return `
# Base image
FROM ${image}

# Install yarn
# N.B. - We don't use the preferred method because it has to be implemented 
# differently on different platforms (depending on whether sudo is preset)
RUN npm install --global yarn

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
ARG NPM_TOKEN
${npmfile}
COPY . /usr/src/app

# Install dependencies using Yarn
RUN yarn install 

# Now get rid of the embedded "secret" used to access private repositories
RUN rm -f .npmrc

${envs}

${exps}

# Run tests to make sure everything got installed correctly
RUN npm test

CMD [ "npm", "start" ]
`    
}

function generate(argv) {
    let npmfile = npmFileCommands(argv);
    let image = argv.image;
    let envs = envCommands(argv);
    let exps = exposeCommands(argv);
    let output = template(image, npmfile, envs, exps);
    console.log(output);
}

yargs
    .command({
        command: 'generate',
        aliases: ['gen'],
        desc: 'Generate a Dockerfile',
        builder: (yargs) => {
            yargs
                .describe('image', "Base Docker image")
                .default('image', "node:latest")
                .describe('env', "Settable environment variables (NAME=VAL)")
                .array('env')
                .describe('expose', "Ports to EXPOSE")
                .array('expose')
                .describe('scripts', "Scripts to run during build")
                .array('scripts')
                .describe('scope', "Scope to use for repos")
                .default('scope', null)
                .describe('test', "Run tests during build")
                .default('test', true)
                .describe('production', "Run in production mode")
                .default('production', true)
                .describe('runcmd', "NPM script to run application")
                .default('runcmd', "start")
                .help()
        },
        handler: (argv) => {
            console.log("argv = ", argv);
            generate(argv);
        }
    })
    // provide a minimum demand and a minimum demand message 
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .argv
