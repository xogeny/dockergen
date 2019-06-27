#! /usr/bin/env node
import * as build from "./build";
import * as gen from "./gen";
import * as ecs from "./ecs";
import yargs from "yargs";

import { spawn } from "child_process";

build.addBuildCommand(yargs);

gen.addGenCommand(yargs);

ecs.addPushCommand(yargs);

// provide a minimum demand and a minimum demand message
yargs.demandCommand(1, "You need at least one command before moving on").help()
  .argv;
