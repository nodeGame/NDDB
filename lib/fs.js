/**
 * # NDDB: fs.js
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed.
 *
 * NDDB file systems routines to save and load items
 *
 * Overrides save and load methods available in browser, with methods that
 * use the Node.JS fs api.
 *
 * Cyclic objects are decycled, and do not cause errors.
 * Upon loading, the cycles are restored.
 *
 * @see fs.writeFile
 * @see fs.writeFileSync
 * @see fs.readFile
 * @see fs.readFileSync
 *
 * @see JSUS.parse
 * @see NDDB.stringify
 * @see https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 * @see https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 * @see https://github.com/koles/ya-csv
 *
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
 * ### NDDB.addDefaultFormats
 *
 * Dummy function that returns always true
 *
 * Overrides default storageAvailable method for the browser.
 */
NDDB.prototype.addDefaultFormats = function() {

    this.__formats['json'] = {
        // Async.
        load: function(that, file, cb, options) {
            fs.readFile(file, options, function(err, data) {
                if (err) that.throwError('Error', 'load', err);
                loadCb(that, data);
            });
        },
        save: function(that, file, cb, options) {
            fs.writeFile(file, that.stringify(!!options.compress), options, cb);
        },
        // Sync.
        loadSync: function(that, file, cb, options) {
            loadCb(that, fs.readFileSync(file, options));
            if (cb) cb();
        },
        saveSync: function(that, file, cb, options) {
            fs.writeFileSync(file, that.stringify(!!options.compress), options);
            if (cb) cb();
        }
    };

    this.__formats['csv'] = {
        // Async.
        load: function(that, file, cb, options) {
            var reader;

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

            if (cb) reader.addListener('end', cb);
        },
        save: function(that, file, cb, options) {
            saveCsv(file, that.fetch(), options, cb);
        },
        // Sync.
        loadSync: function(that, file, cb, options) {

        },
        saveSync: function(that, file, cb, options) {

        }
    };

    // Set default format.
    this.setDefaultFormat('json');
};

// ## Helper Methods


/**
 * ### saveCsv
 *
 * Serializes an object as a csv file
 *
 * It accepts a configuration object as third paramter. Available options:
 *
 * ```
 * { headers: ['A', 'B', 'C'],      // specify the headers directly
 *   adapter: { A:                  //
 *                function(i) {
 *                    return i-1;
 *             }  },
 *   writeHeaders: false,           // default true,
 *   flags: 'w',                    // default, 'a'
 *   encoding: 'utf-8',             // default null
 *   mode: 0777,                    // default 0666
 * }
 * ```
 *
 * @param {string} path The path to the csv file
 * @param {array} data The data to serialze
 * @param {options} options Optional. Configuration options format specific
 *
 * @see http://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
 *
 * obj.separator
 * obj.quotechar
 * obj.escapechar
 * obj.commentchar
 * obj.columnNames
 * obj.columnsFromHeader
 * obj.nestedQuotes
 */
function saveCsv(path, data, options, cb) {
    var writer, headers, i, na, row;
    var adapter;

    options.flags = options.flags || 'a';

    // Do not pass headers options.
    if (options.columnNames) options.columnNames = undefined;
    if (options.columnsFromHeader) options.columnsFromHeader = undefined;

    // Options contains both fs options and csv options.
    writer = csv.createCsvFileWriter(path, options);

    adapter = options.adapter || {};

    if (options.headers) {
        if (J.isArray(options.headers)) {
            headers = options.headers;
        }
        else {
            headers = J.keys(data[0], 1);
        }

        if (headers && headers.length) {
            writer.writeRecord(headers);
            na = options.na || 'NA';
        }
        else {
            headers = null;
            this.node.warn('node.fs.saveCsv: no headers found.');
        }
    }

    // Register callback.
    if (cb) writer.on('close', cb);

    for (i = 0; i < data.length; i++) {
        if (headers) {
            row = headers.map(function(h) {
                if (adapter[h]) return adapter[h](data[i]);
                else if (data[i].hasOwnProperty(h)) return data[i][h];
                else return na;
            });
            writer.writeRecord(row);
        }
        else {
            writer.writeRecord(J.obj2Array(data[i]));
        }
    }
};


/**
 * ### loadCb
 *
 * Retrocycles a string into an array of objects and imports it into a db
 *
 * @param {NDDB} nddb An NDDB instance
 * @param {string} s The string to retrocycle and  import
 */
function loadCb(nddb, s) {
    var items, i;
    items = J.parse(s);
    // TODO: copy settings, disable updates, insert one by one, update indexes.
    for (i = 0; i < items.length; i++) {
        // Retrocycle if possible.
        items[i] = NDDB.retrocycle(items[i]);
    }
    nddb.importDB(items);
}
