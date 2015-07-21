#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander'),
smoosh = require('smoosh'),
fs = require('fs'),
os = require('os'),
util = require('util'),
exec = require('child_process').exec,
path = require('path'),
J = require('JSUS').JSUS;

var pkg = require('../package.json'),
version = pkg.version;

var build = require('./build.js').build;

var rootDir = path.resolve(__dirname, '..') + '/';
var buildDir = rootDir + 'build/';


program
    .version(version);

program
    .command('clean')
    .description('Removes all files from build folder')
    .action(function(){
        J.cleanDir(buildDir);
    });

program
    .command('build [options]')
    .description('Creates a custom NDDB build')
    .option('-B, --bare', 'bare naked NDDB (no dependencies)')
    .option('-J, --JSUS', 'with JSUS (OBJ and ARRAY)')
    .option('-c, --cycle', 'with support for cyclyc objects')
    .option('-s, --shelf', 'with Shelf.js')
    .option('-e, --es5', 'with support for old browsers')
    .option('-a, --all', 'full build of NDDB')
    .option('-A, --analyse', 'analyse build')
    .option('-C, --clean', 'clean build directory')
    .option('-o, --output <file>', 'output file (without .js)')
    .action(function(env, options){
        build(options);
    });

program
    .command('multibuild')
    .description('Creates pre-defined NDDB builds')
    .action(function(){
        console.log('Multi-build for NDDB v.' + version);
        build({
            all: true,
            output: "nddb-full",
        });
        build({
            bare: true,
            output: "nddb-bare",
        });
        build({
            JSUS: true,
            output: "nddb",
        });

    });

program
    .command('doc')
    .description('Builds documentation files')
    .action(function() {
        var dockerDir, command, child;
        console.log('Building documentation for NDDB v.' + version);
        try {
            dockerDir = J.resolveModuleDir('docker');
        }
        catch(e) {
            console.log('module Docker not found. Cannot build doc. ' +
                        'Do \'npm install docker\' to install it.');
            return false;
        }
        command = dockerDir + 'docker -i ' + rootDir +
            ' nddb.js lib/ -s true -o ' + rootDir + 'docs/ -u';

        child = exec(command, function (error, stdout, stderr) {
            if (stdout) console.log(stdout);
            if (stderr) console.log(stderr);
            if (error !== null) {
                console.log('build error: ' + error);
            }
        });

    });

// Parsing options
program.parse(process.argv);
