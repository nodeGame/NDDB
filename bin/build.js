#!/usr/bin/env node

//# NDDB build script

/**
 * Export build
 */

module.exports.build = build;

var smoosh = require('smoosh'),
path = require('path'),
fs = require('fs'),
J = require('JSUS').JSUS;

var pkg = require('../package.json'),
version = pkg.version;

var rootDir = path.resolve(__dirname, '..') + '/';
var distDir =  rootDir + 'build/';
var libDir = rootDir + 'lib/';

function build(options) {

    if (!options.bare && !options.JSUS && !options.shelf && !options.all &&
        !options.cycle) {

        options.standard = true;
    }

    var out = options.output || "nddb";

    if (path.extname(out) === '.js') {
        out = path.basename(out, '.js');
    }

    console.log('Building NDDB v.' + version + ' with:');

    // Defining variables

    // jsus

    var JSUSdir = J.resolveModuleDir('JSUS', __dirname);

    var nddb_jsus = [
        JSUSdir + "jsus.js",
        JSUSdir + "lib/compatibility.js",
        JSUSdir + "lib/array.js",
        JSUSdir + "lib/obj.js",
        JSUSdir + "lib/parse.js",
    ];

    //shelf.js
    var shelfDir = J.resolveModuleDir('shelf.js', __dirname);
    var nddb_shelf = [
        shelfDir + "/build/shelf-amplify.js",
    ];

    // nddb
    var nddb = [
        rootDir + "nddb.js",
        libDir + 'browser.js'
    ];

    // cyclic objects
    var nddb_cycle = [
        rootDir + "external/cycle.js",
    ];

    // es5-shim
    var es5Dir = J.resolveModuleDir('es5-shim', __dirname);
    var nddb_es5 = [
        es5Dir + "es5-shim.js",
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
        var shelfjs = shelfDir + 'build/shelf.js';
        // Build custom shelf.js if not existing
        if (!fs.existsSync(shelfjs)) {
            var shelfjs_build = shelfDir + 'bin/build.js';
            console.log("\n  - building custom shelf.js")
            var buildShelf = require(shelfjs_build);
            buildShelf.build({cycle: true});

            // building shelf.js FS as well
            buildShelf.build({
                lib: ['fs'],
                output: "shelf-fs",
                cycle: true,
            });
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
        // https://github.com/fat/smoosh
        // hand over configurations made above
        var smooshed = smoosh.config(config);

        // removes all files from the build folder
        if (options.clean) {
            smooshed.clean();
        }

        // builds both uncompressed and compressed files
        smooshed.build();

        if (options.analyse) {
            smooshed.run(); // runs jshint on full build
            smooshed.analyze(); // analyzes everything
        }

        console.log('NDDB build created');
    }

    run_it();
}
