#!/usr/bin/env node

/**
 * Export build
 */

module.exports.build = build;

var smoosh = require('smoosh'),
    path = require('path'),
    pkg = require('../package.json'),
    version = pkg.version;


function build(options) {
	
	if (!options.standalone && !options.JSUS && !options.shelf && !options.all && !options.cycle) {
		options.standard = true;
	}
	
	var out = options.output || "nddb";
	
	if (path.extname(out) === '.js') {
		out = path.basename(out, '.js');
	}
	
	console.log('Building NDDB v.' + version + ' with:');
	
	// Defining variables
	
	var re = new RegExp('node_modules.+');
	
	var rootDir = __dirname + '/../';
	var distDir =  rootDir + 'build/';
	
	// jsus
	var nddb_jsus = [
	  rootDir + "node_modules/JSUS/jsus.js",
	  rootDir + "node_modules/JSUS/lib/array.js",
	  rootDir + "node_modules/JSUS/lib/obj.js",
	];
	
	//shelf.js
	var nddb_shelf = [
	  rootDir + "node_modules/shelf.js/build/shelf.js",
	];
	
	// nddb
	var nddb = [
	  rootDir + "nddb.js",           
	];
	
	// cyclic objects
	var nddb_cycle = [
	  rootDir + "external/cycle.js",
	];	
	
	var nddb_es5 = [
	  rootDir + "node_modules/es5-shim/es5-shim.js",       
	];
	
	// CREATING build array
	var files = [];
	
	// 0. ES5-shim
	if (options.es5 || options.all) {
		console.log('  - es5');
		files = files.concat(nddb_es5);
	}
	
	// 1. Shelf.js
	if (options.shelf || options.all || options.standard) {
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
	if (!(options.shelf || options.all || options.standard) && options.cycle) {
		console.log('  - cycle');
		files = files.concat(nddb_cycle);
	}
	
	// 3. JSUS
	if (options.JSUS || options.all || options.standard) {
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
	    }
	};
	
	config.JAVASCRIPT[out] = files;
	
	var run_it = function(){
	    // Smooshing callback chain
	    // More information on how it behaves can be found in the smoosh Readme https://github.com/fat/smoosh
	    smoosh
	        .config(config) // hand over configurations made above
	        // .clean() // removes all files out of the nodegame folder
	        .run() // runs jshint on full build
	        .build() // builds both uncompressed and compressed files
	        .analyze(); // analyzes everything
	
	    console.log('NDDB build created');
	}
	
	run_it();
}