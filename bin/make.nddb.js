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

program
  .version(version)
  .command('build [options]')
  .option('-J', '--JSUS', 'Build with JSUS')
  .option('-c', '--cycle', 'Build with support for cyclyc objects')
  .option('-Sh', '--shelf', 'Build with Shelf.JS')
  .option('-s', '--standard', 'Build with JSUS, and support for cyclic objects')
  .option('-a, --all', 'Full build of NDDB')
  .option('-d, --doc', 'Build doc')
  .action(function(env, options){
	  buildIt(options);
  });
  
// Parsing options
program.parse(process.argv);

function buildIt(program) {
	
	console.log('Building NDDB v.' + version + ' with:');
	
	// Defining variables
	
	var re = new RegExp('node_modules.+');
	
	var rootDir = __dirname + '/../';
	var distDir =  rootDir + 'build/';
	
	// jsus
	var nddb_jsus = [
	  rootDir + "node_modules/JSUS/jsus.js",
	  rootDir + "node_modules/JSUS/lib/array.js",
	  rootDir + "node_modules/JSUS/lib/dom.js",
	  rootDir + "node_modules/JSUS/lib/eval.js",
	  rootDir + "node_modules/JSUS/lib/obj.js",
	  rootDir + "node_modules/JSUS/lib/random.js",
	  rootDir + "node_modules/JSUS/lib/time.js",
	  rootDir + "node_modules/JSUS/lib/parse.js",
	];
	
	//shelf.js
	var nddb_shelf = [
	  rootDir + "node_modules/shelf.js/build/shelf.js",
	];
	
	// nddb
	var nddb = [
	  rootDir + "nddb.js",           
	];
	
	//nddb
	var nddb_cycle = [
	  rootDir + "external/cycle.js",
	];	
	
	// CREATING build array
	var files = [];
	
	// 1. Shelf.js
	if (program.shelf || program.all || program.standard) {
		var shelfjs_build = './../node_modules/shelf.js/build/shelf.js';
		var shelfjs_make = './../node_modules/shelf.js/bin/build.js';
		// Build custom shelf.js if not existing
		if (!path.existsSync(shelfjs_build)) {
			console.log('Building custom Shelf.js')
			var buildShelf = require(shelfjs_make);
			buildShelf.build({cycle: true});
		}
		
		console.log('  - shelf');
		files = files.concat(nddb_shelf);
	}
	
	// 2. Cyclic objects support
	if (!(program.shelf || program.all || program.standard) && program.cycle) {
		console.log('  - cycle');
		files = files.concat(nddb_cycle);
	}
	
	// 3. JSUS
	if (program.JSUS || program.all || program.standard) {
	  console.log('  - JSUS');
	  files = files.concat(nddb_jsus);
	}
	
	
	// 4. NDDB: always built
	files = files.concat(nddb);
	
	console.log(files.length)
	
	// Configurations for file smooshing.
	var config = {
	    // VERSION : "0.0.1",
	    
	    // Use JSHINT to spot code irregularities.
	    JSHINT_OPTS: {
	        boss: true,
	        forin: true,
	        browser: true,
	    },
	    
	    JAVASCRIPT: {
	        DIST_DIR: '/' + distDir,
	        
	        "nddb": files
	    }
	};
	
	var run_it = function(){
	    // Smooshing callback chain
	    // More information on how it behaves can be found in the smoosh Readme https://github.com/fat/smoosh
	    smoosh
	        .config(config) // hand over configurations made above
	        // .clean() // removes all files out of the nodegame folder
	        .run() // runs jshint on full build
	        .build() // builds both uncompressed and compressed files
	        .analyze(); // analyzes everything
	
	    console.log('nddb.js created');
	}
	
	run_it();
}