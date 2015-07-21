/**
 * # NDDB: fs.js
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed.
 *
 * NDDB file systems routines
 *
 * Overrids save and load methods available in browser, with methods that
 * use the Node.JS fs api.
 * ---
 */

require('../external/cycle.js');

var fs = require('fs'),
csv = require('ya-csv');

var J = require('JSUS').JSUS;

var NDDB = module.parent.exports.NDDB;

/**
 * ### NDDB.storageAvailable
 *
 * Dummy function that returns always true
 *
 * Overrides default storageAvailable method for the browser.
 *
 * @return {boolean} true
 */
NDDB.prototype.storageAvailable = function() {
    return true;
};

/**
 * ### NDDB.save
 *
 * Saves the database to a persistent medium in JSON format
 *
 * Saves to the file system using the standard `fs.writeFile` method.
 *
 * Cyclic objects are decycled, and do not cause errors.
 * Upon loading, the cycles are restored.
 *
 * @param {string} file The file system path, or the identifier
 *   for the browser database
 * @param {function} cb Optional. A callback to execute after
 *   the database is saved
 * @param {compress} boolean Optional. If TRUE, output will be compressed.
 *   Defaults, FALSE
 *
 * @see NDDB.load
 * @see NDDB.stringify
 * @see https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 */
NDDB.prototype.save = function(file, cb, compress) {
    if ('string' !== typeof file) {
        this.throwErr('TypeError', 'save', 'file must be string');
    }
    if (cb && 'function' !== typeof cb) {
        this.throwErr('TypeError', 'save', 'cb must be function or undefined');
    }
    compress = compress || false;
    // Save in Node.js.
    fs.writeFileSync(file, this.stringify(compress), 'utf-8');
    if (cb) cb();
};

/**
 * ### NDDB.saveAsync
 *
 * Saves the database to a persistent medium in JSON format asynchronously
 *
 * Saves to the file system using the standard `fs.writeFileAsync` method.
 *
 * Refer to NDDB.save for documentation
 */
NDDB.prototype.saveAsync = function(file, cb, compress) {
    if ('string' !== typeof file) {
        this.throwErr('TypeError', 'saveAsync', 'file must be string');
    }
    if (cb && 'function' !== typeof cb) {
        this.throwErr('TypeError', 'saveAsync', 'cb must be function ' +
                      'or undefined');
    }
    compress = compress || false;
    // Save in Node.js.
    fs.writeFile(file, this.stringify(compress), 'utf-8', cb);
};

/**
 * ### NDDB.load
 *
 * Loads a JSON object into the database from a persistent medium
 *
 * Loads from the file system using `fs.readFileSync` or `fs.readFile` methods.
 *
 * Cyclic objects previously decycled will be retrocycled.
 *
 * @param {string} file The file system path, or the identifier
 *   for the browser database
 * @param {function} cb Optional. A callback to execute after
 *   the database is loaded
 *
 * @see NDDB.loadCSV
 * @see NDDB.save
 * @see NDDB.stringify
 * @see JSUS.parse
 * @see https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 */
NDDB.prototype.load = function(file, cb, options) {
    var loadedString;
    if ('string' !== typeof file) {
        this.throwErr('TypeError', 'load', 'file must be string');
    }
    if (cb && 'function' !== typeof cb) {
        this.throwErr('TypeError', 'load', 'cb must be function or undefined');
    }
    loadedString = fs.readFileSync(file, 'utf-8');
    loadCb(this, loadedString);
};

/**
 * ### NDDB.loadAsync
 *
 * Loads a JSON object into the database from a persistent medium
 *
 * Loads from the file system using `fs.readFile` methods.
 *
 * Refer to NDDB.load for documentation.
 */
NDDB.prototype.loadAsync = function(file, cb, options) {
    var loadedString;
    if ('string' !== typeof file) {
        this.throwErr('TypeError', 'load', 'file must be string');
    }
    if (cb && 'function' !== typeof cb) {
        this.throwErr('TypeError', 'load', 'cb must be function or undefined');
    }
    loadedString = fs.readFile(file, 'utf-8', function() {
        loadCb(this, loadedString);
    });

};

/**
 * ### NDDB.loadCSV
 *
 * Loads the content of a csv file into the database
 *
 * Uses `ya-csv` to load the csv file.
 *
 * @param {string} file The path to the file to load,
 * @param {function} cb Optional. A callback to execute after
 *   the database is loaded
 * @param {object} options Optional. A configuration object to pass to
 *  `ya-csv.createCsvFileReader`
 *
 * @see NDDB.load
 * @see https://github.com/koles/ya-csv
 */
NDDB.prototype.loadCSV = function(file, cb, options) {
    var reader, that;
    if ('string' !== typeof file) {
        this.throwErr('TypeError', 'loadCSV', 'file must be string');
    }
    if (cb && 'function' !== typeof cb) {
        this.throwErr('TypeError', 'loadCSV', 'cb must be function or ' +
                      'undefined');
    }

    that = this;

    // Mix options.
    options = options || {};

    if ('undefined' === typeof options.columnsFromHeader) {
        options.columnsFromHeader = true;
    }

    reader = csv.createCsvFileReader(file, options);

    if (options.columnNames) {
        reader.setColumnNames(options.columnNames);
    }

    reader.addListener('data', function(data) {
        that.insert(data);
    });

    reader.addListener('end', function(data) {
        if (cb) cb();
    });
};

// ## Helper Methods

/**
 * ## loadCb
 *
 * Retrocycles a string into an array of objects and imports it into a db
 *
 * @param {NDDB} nddb An NDDB instance
 * @param {string} s The string to retrocycle and  import
 */
function loadCb(nddb, s) {
    var items, i;
    items = J.parse(s);
    for (i = 0; i < items.length; i++) {
        // Retrocycle if possible.
        items[i] = NDDB.retrocycle(items[i]);
    }
    nddb.importDB(items);
}
