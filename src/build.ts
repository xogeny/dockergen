import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { Argv, Arguments } from "yargs";

var config = require("./config");

var defaults = config.configDefaults();

export function addBuildCommand(yargs: Argv<any>) {
  yargs.command({
    command: "build",
    handler: (argv: Arguments<any>) => {
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

      let token = process.env["NPM_TOKEN"];
      let name = argv.name;

      if (!name) {
        throw new Error("No name specified");
      }

      let args = ["build", "-t", name, "."];
      if (token) {
        args = ["build", "--build-arg", "NPM_TOKEN=" + token, "-t", name, "."];
      }

      let cmd = argv.docker + " " + args.join(" ");
      if (argv.dryrun) {
        console.log("Build details...");
        console.log("  command: '" + cmd + "'");
        console.log("  token: ", token);
      } else {
        console.log("Running '" + cmd + "'...");

        let s = spawn(argv.docker, args);

        s.stdout.on("data", data => {
          process.stdout.write(data);
        });

        s.stderr.on("data", data => {
          process.stderr.write(data);
        });

        s.on("close", code => {
          if (code == 0) {
            console.log("Build successful!");
          } else {
            console.error("Build failed!");
          }
          process.exit(code);
        });
      }
    },
    describe: "Build a Docker image from a Dockerfile",
    builder: (yargs: Argv<{}>) => {
      return yargs
        .options({
          n: {
            alias: "name",
            demand: true,
            default: defaults.name,
            describe: "Name to give image being built",
            type: "string"
          }
        })
        .options({
          k: {
            alias: "dryrun",
            default: false,
            describe: "Perform a dryrun build",
            type: "boolean"
          }
        })
        .options({
          d: {
            alias: "docker",
            default: "docker",
            describe: "Docker command",
            type: "string"
          }
        })
        .help();
    }
  });
}
