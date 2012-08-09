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
    pkg = require('../package.json'),
    version = pkg.version;

var build = require('./build.js').build;

var buildDir =  __dirname + '/../build/';

var deleteIfExist = function(file) {
	file = file || filename;
	if (path.existsSync(file)) {
		var stats = fs.lstatSync(file);
		if (stats.isDirectory()) {
			fs.rmdir(file, function (err) {
				if (err) throw err;  
			});
		}
		else {
			fs.unlink(file, function (err) {
				if (err) throw err;  
			});
		}
		
	}
};

var cleanBuildDir = function(dir, ext) {
	ext = ext || '.js';
	dir = dir || buildDir;
	if (dir[dir.length] !== '/') dir = dir + '/';
	fs.readdir(dir, function(err, files) {
	    files.filter(function(file) { return path.extname(file) ===  ext; })
	         .forEach(function(file) { deleteIfExist(dir + file); });
	    
	    console.log('Build directory cleaned');
	});
}

function list(val) {
	return val.split(',');
}

program
  .version(version);

program  
	.command('clean')
	.description('Removes all files from build folder')
	.action(function(){
		cleanBuildDir();
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