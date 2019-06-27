import path from "path";
import process from "process";
import fs from "fs";

import { DockergenArguments } from "./arguments";

let pkgjson = path.join(fs.realpathSync(process.cwd()), "package.json");

let pkg = require(pkgjson);

export function defaultValue(key: string, def: any) {
  if (pkg && pkg.dockergen && pkg.dockergen.hasOwnProperty(key)) {
    let val = pkg.dockergen[key];
    if (key == "env") {
      val = Object.keys(val).map(key => `${key}=${val[key]}`);
    }
    return val;
  }
  return def;
}

export function configDefaults(): DockergenArguments {
  return {
    docker: defaultValue("docker", "docker"),
    image: defaultValue("image", "node:latest"),
    env: defaultValue("env", []),
    expose: defaultValue("expose", []),
    script: defaultValue("script", []),
    scope: defaultValue("scope", null),
    test: defaultValue("test", true),
    registry: defaultValue("registry", "https://registry.npmjs.org"),
    overwrite: defaultValue("overwrite", false),
    runcmd: defaultValue("runcmd", "start"),
    name: defaultValue("name", null),
    ecr: defaultValue("ecr", null),
    dryrun: defaultValue("dryrun", false)
  };
}
