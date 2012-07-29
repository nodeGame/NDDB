#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander'),
    smoosh = require('smoosh'),
    os = require('os'),
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
  .option('-a, --all', 'full build of NDDB')
  .option('-o, --output <file>', 'output file (without .js)')
  .action(function(env, options){
	  build(options);
  });
  

//program
//.command('build-doc')
//.description('Build documentation files')
//.action(function(){
//  //console.log(arguments[arguments.length-1])
//  //build(arguments);
//});

// Parsing options
program.parse(process.argv);