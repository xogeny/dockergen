#! /usr/bin/env node
let yargs = require('yargs');
let fs = require('fs');
let process = require('process');
let path = require('path');

let build = require('./build');
let gen = require('./gen');
let ecs = require('./ecs');

const spawn = require('child_process').spawn;

build.addBuildCommand(yargs);

gen.addGenCommand(yargs);

ecs.addPushCommand(yargs);

// provide a minimum demand and a minimum demand message 
yargs
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .argv
