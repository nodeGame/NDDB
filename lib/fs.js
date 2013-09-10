/**
 * # fs.js
 * Copyright(c) 2013 Stefano Balietti
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
 * Dummy function that returns always true.
 *
 * Overrides default storageAvailable method for the browser.
 *
 * @return {boolean} true
 */
NDDB.prototype.storageAvailable = function () {
    return true;
}

/**
 * ### NDDB.save
 *
 * Saves the database to a persistent medium in JSON format
 *
 * Saves to the file system using the standard `fs.writeFile` method.
 *
 * Cyclic objects are decycled, and do not cause errors. Upon loading, the cycles
 * are restored.
 *
 * @param {string} file The file system path, or the identifier for the browser database
 * @param {function} callback Optional. A callback to execute after the database was saved
 * @param {compress} boolean Optional. If TRUE, output will be compressed. Defaults, FALSE
 * @return {boolean} TRUE, if operation is successful
 *
 * @see NDDB.load
 * @see NDDB.stringify
 * @see https://github.com/douglascrockford/JSON-js/blob/master/cycle.js

 *
 */
NDDB.prototype.save = function (file, callback, compress) {
    if ('string' !== typeof file) {
        throw new TypeError(this._getConstrName() +
                            '.save: you must specify a valid file name.');
    }
    compress = compress || false;
    // Save in Node.js
    fs.writeFileSync(file, this.stringify(compress), 'utf-8');
    if (callback) callback();
    return true;

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
 * @param {string} file The file system path, or the identifier for the browser database
 * @param {function} cb Optional. A callback to execute after the database was saved
 * @return {boolean} TRUE, if operation is successful
 *
 * @see NDDB.loadCSV
 * @see NDDB.save
 * @see NDDB.stringify
 * @see JSUS.parse
 * @see https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 *
 */
NDDB.prototype.load = function (file, cb, options) {
    var loadCb, loadedString;
    if ('string' !== typeof file) {
        throw new TypeError(this._getConstrName() + 
                            '.load: you must specify a valid file name.');
    }

    loadCb = function(s) {
        var items, i;
        items = J.parse(s);
        for (i = 0; i < items.length; i++) {
            // retrocycle if possible
            items[i] = NDDB.retrocycle(items[i]);
        }
        this.importDB(items);
    }

    loadedString = fs.readFileSync(file, 'utf-8');
    loadCb.call(this, loadedString);
    return true;
};


/**
 * ### NDDB.loadCSV
 *
 * Loads the content of a csv file into the database
 *
 * Uses `ya-csv` to load the csv file
 *
 * @param {string} file The path to the file to load,
 * @param {function} cb Optional. A callback to execute after the database was saved
 * @param {object} options Optional. A configuration object to pass to
 *  `ya-csv.createCsvFileReader`
 * @return {boolean} TRUE, if operation is successful
 *
 * @see NDDB.load
 * @see https://github.com/koles/ya-csv
 */
NDDB.prototype.loadCSV = function (file, cb, options) {
    var reader, that;
    that = this;

    // Mix options
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

    return true;
};
