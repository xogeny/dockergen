// docker tag xogeny/modelica-university:latest 897359269905.dkr.ecr.us-east-1.amazonaws.com/xogeny/modelica-university:latest && docker push 897359269905.dkr.ecr.us-east-1.amazonaws.com/xogeny/modelica-university:latest
import * as config from "./config";
import { Argv } from "yargs";
import { spawn } from "child_process";

import { runcmd } from "./runcmd";

let defaults = config.configDefaults();

export function addPushCommand(yargs: Argv<any>) {
  yargs.command({
    command: "pushecr",
    describe: "Push to Amazon ECR",
    builder: (yargs: Argv<any>) => {
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
          r: {
            alias: "ecr",
            demand: true,
            default: defaults.ecr,
            describe: "ECR host name",
            type: "string"
          }
        })
        .options({
          f: {
            alias: "from",
            demand: true,
            default: "latest",
            describe: "Local tag",
            type: "string"
          }
        })
        .options({
          t: {
            alias: "to",
            demand: true,
            default: "latest",
            describe: "Remote tag",
            type: "string"
          }
        })
        .options({
          k: {
            alias: "dryrun",
            default: false,
            describe: "Perform a dryrun generation (output to standard out)",
            type: "boolean"
          }
        });
    },
    handler: argv => {
      let local = argv.name + ":" + argv.from;
      let remote = argv.ecr + "/" + argv.name + ":" + argv.to;
      let args1 = ["tag", local, remote];
      let args2 = ["push", remote];

      if (argv.dryrun) {
        console.log("Push image: ", argv.name);
        console.log("  from local tag: ", argv.from);
        console.log("   to remote tag: ", argv.to);
        console.log("     on ECR host: ", argv.ecr);

        console.log("docker " + args1.join(" "));
        console.log("docker " + args2.join(" "));
      } else {
        console.log("Running 'docker " + args1.join(" ") + "'");
        runcmd("docker", args1).then(
          v => {
            console.log("Running 'docker " + args2.join(" ") + "'");
            runcmd("docker", args2).then(
              x => {
                console.log("Image successfully pushed to " + remote);
              },
              e => {
                console.error(
                  "Push command, 'docker " + args2.join(" ") + "', failed"
                );
              }
            );
          },
          e => {
            console.error(
              "Tag command, 'docker " + args1.join(" ") + "', failed"
            );
          }
        );
      }
    }
  });
}
