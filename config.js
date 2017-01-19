let path = require('path');
let process = require('process');
let fs = require('fs');

let pkgjson = path.join(fs.realpathSync(process.cwd()), "package.json");

let pkg = require(pkgjson);

function defaultValue(key, def) {
    if (pkg && pkg.dockergen && pkg.dockergen.hasOwnProperty(key)) {
        let val = pkg.dockergen[key];
        if (key == "env") {
            val = Object.keys(val).map((key) => `${key}=${val[key]}`)
        }
        return val
    }
    return def;
}

function configDefaults() {
    return {
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
}

module.exports = {
    configDefaults: configDefaults,
}