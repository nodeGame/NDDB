#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander'),
    smoosh = require('smoosh'),
    os = require('os'),
    util = require('util'),
    exec = require('child_process').exec,
    path = require('path'),
    pkg = require('../package.json'),
    version = pkg.version;

var build = require('./build.nddb.js').build;

program
  .version(version)
  .command('build [options]')
  .description('Create NDDB ustom build')
  .option('-J, --JSUS', 'build with JSUS (OBJ and ARRAY)')
  .option('-c, --cycle', 'build with support for cyclyc objects')
  .option('-s, --shelf', 'build with Shelf.JS')
  .option('-e, --es5', 'build with support for old browsers')
  .option('-a, --all', 'full build of NDDB')
  .option('-o, --output <file>', 'output file (without .js)')
  .action(function(env, options){
	  build(options);
  });
  

program
.command('doc')
.description('Build documentation files')
.action(function(){
	console.log('Building documentation for NDDB v.' + version);
	// http://nodejs.org/api.html#_child_processes
	var root =  __dirname + '/../';
	var command = root + 'node_modules/.bin/docker -i ' + root + ' nddb.js -s true -o ' + root + 'docs/';
	var child = exec(command, function (error, stdout, stderr) {
		util.print(stdout);
		util.print(stderr);
		if (error !== null) {
			console.log('build error: ' + error);
		}
	});

});

// Parsing options
program.parse(process.argv);