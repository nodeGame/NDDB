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

(function() {

    'use strict';

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
                fs.writeFile(file, that.stringify(!!options.compress),
                             options, cb);
            },
            // Sync.
            loadSync: function(that, file, cb, options) {
                loadCb(that, fs.readFileSync(file, options));
                if (cb) cb();
            },
            saveSync: function(that, file, cb, options) {
                fs.writeFileSync(file, that.stringify(!!options.compress),
                                 options);

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
                var headers, separator, quoteChar, escapeChar;
                var obj, tokens, i, len;

                headers = options.headers;
                separator = options.separator || ',';
                quoteChar = options.quoteChar || '"';
                escapeChar = options.escapeChar;

                fs.readFileSync(file).toString().split('\n')
                    .forEach(function(l) {

                        if (!l || !l.length) return;
                        tokens = l.split(separator);
                        if (!headers) {
                            headers = tokens;
                            len = headers.length;
                            for (i = -1 ; ++i < len ; ) {
                                headers[i] = parseCsvToken(that, 'loadSync',
                                                           headers[i],
                                                           quoteChar);
                            }
                        }
                        else {
                            obj = {};
                            for (i = -1 ; ++i < len ; ) {
                                obj[headers[i]] = parseCsvToken(that,
                                                                'loadSync',
                                                                tokens[i],
                                                                quoteChar);
                            }
                            that.insert(obj);
                        }
                    });
                if (cb) cb();
            },
            saveSync: function(that, file, cb, options) {
                var headers, adapter, out;
                var separator, quoteChar, escapeChar, na;
                var i, len;
                out = '';
                na = options.na || 'NA';
                escapeChar = options.escapeChar;
                separator = options.separator || ',';
                quoteChar = options.quoteChar || '"';
                headers = getCsvHeaders(options.headers, that.db);
                if (headers) {
                    i = -1, len = headers.length;
                    for ( ; ++i < len ; ) {
                        out += createCsvToken(headers[i], quoteChar,
                                              escapeChar);

                        if (i !== (len-1)) out += separator;
                    }
                    out += '\n';
                }
                adapter = options.adapter || {};
                that.each(function(item) {
                    out += getCsvRow(that, 'saveSync', item, headers, adapter,
                                     separator, quoteChar, escapeChar, na) +
                        '\n';
                });


                fs.writeFileSync(file, out, options);
                if (cb) cb();
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
     * {
     *
     *   headers: ['A', 'B', 'C'],          // Specifies the header names, or
     *                                      // equal to TRUE to use the keys of
     *                                      // the first object as headers.
     *
     *   adapter: { A: function(row) {      // An obj containing callbacks for
     *                  return row['A']-1;  // returning value of the column
     *                 }                    // specified in the headers.
     *            },
     *
     *   separator: ',',                    // The character used as separator
     *                                      // between values. Default ','.
     *
     *   quotechar: '"',                    // The character used as quote.
     *                                      // Default: '"',
     *
     *   escapechar: '"',                   // The char that should be skipped.
     *                                      // Default '"'.
     *
     *   commentchar: '',                   // The character used for comments.
     *                                      // Default: ''.
     *
     *   nestedQuotes: false,               // TRUE, if nested quotes allowed.
     *                                      // Default FALSE.
     *
     *   flags: 'w',                        // The Node.js flag to write to fs.
     *                                      // Default: 'a' (append).
     *
     *   encoding: 'utf-8',                 // The encoding of the file.
     *
     *   mode: 0777,                        // The permission given to the file.
     *                                      // Default: 0666
     *
     * }
     * ```
     *
     * @param {string} path The path to the csv file
     * @param {array} data The data to serialze
     * @param {options} options Optional. Configuration options format specific
     *
     * @see http://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
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
            na = options.na || 'NA';
            headers = getCsvHeaders(options.headers, data);
            if (headers) writer.writeRecord(headers);
            else this.node.warn('node.fs.saveCsv: no headers found.');
        }

        // Register callback.
        if (cb) writer.on('close', cb);

        for (i = 0; i < data.length; i++) {
            row = getCsvFields(data[i], headers, adapter, na);
            writer.writeRecord(row);
        }
    }

    /**
     * ### getCsvHeaders
     *
     * Returns the CSV headers from parameter or from data
     *
     * @param {array} headers Optional. An array of headers returned as it is
     * @param {array} data Optional. Array containing the items to save
     *
     * @return {array|null} h The headers, or NULL if not found
     */
    function getCsvHeaders(headers, data) {
        var h;
        if (headers && J.isArray(headers)) h = headers;
        else if (data && J.isArray(data)) {
            h = J.keys(data[0], 1);
            if (!h || !h.length) h = null;
        }
        return h;
    }

    /**
     * ### getCsvRow
     *
     * Evaluates an item and returns a csv string with only the required values
     *
     *
     * @param {object} item An item from database
     * @param {array} headers Optional. An array of fields to take from the item
     * @param {object} adapter Optional. An object containing callbacks to
     *   be used to pre-process the values of the corresponding key before
     *   returning it
     *
     * @return {string} A Csv row of values ready to be written to file
     */
    function getCsvRow(that, method, item, headers, adapter, separator,
                       quoteChar, escapeChar, na) {

        var out, key;
        out = '';
        if (!headers) {
            for (key in item) {
                if (item.hasOwnProperty(key)) {
                    out += createCsvToken(item[key], quoteChar, escapeChar,
                                          na) + separator;
                }
            }
        }
        else {
            headers.forEach(function(h) {
                var str;
                if (adapter[h]) str = adapter[h](item);
                else if (item.hasOwnProperty(h)) str = item[h];
                else str = na;
                out += createCsvToken(str, quoteChar, escapeChar, na) +
                    separator;
            });
        }
        // Remove last comma.
        return out.substring(0, out.length-1);
    }

    /**
     * ### getCsvFields
     *
     * Evaluates an item and returns an array with only the required values
     *
     *
     * @param {object} item An item from database
     * @param {array} headers Optional. An array of fields to take from the item
     * @param {object} adapter Optional. An object containing callbacks to
     *   be used to pre-process the values of the corresponding key before
     *   returning it
     *
     * @return {array} An array of values ready to be written to file
     */
    function getCsvFields(item, headers, adapter, na) {
        if (!headers) return J.obj2Array(item);
        return headers.map(function(h) {
            if (adapter[h]) return adapter[h](item);
            else if (item.hasOwnProperty(h)) return item[h];
            else return na;
        });
    }

    /**
     * ### parseCsvToken
     *
     * Parses a string representing an entry from a CSV row
     *
     * @param {NDDB} that An NDDB instance
     * @param {string} method The name of the invoking metho
     * @param {object} token The string to parse
     * @param {string} quoteChar Optional. A character to escape
     *
     * @return {string} The parsed token
     */
    function parseCsvToken(that, method, token, quoteChar) {
        if (!quoteChar || token.charAt(0) !== quoteChar) return token;

        if (token.charAt(token.length-1) !== quoteChar) {
            that.throwErr('Error', method, 'missing closing quote char: ' +
                          token);
        }

        return token.substring(1, token.length-1);
    }

    /**
     * ### createCsvToken
     *
     * Converts and escapes a token into the value of a csv field
     *
     * @param {object} token The string to parse
     * @param {string} quoteChar Optional. A character to surround the value
     * @param {string} quoteChar Optional. A character to escape
     *
     * @return {string} The parsed token
     */
    function createCsvToken(token, quoteChar, escapeChar, na) {
        var i, len, out, c;
        // We are not interested in outputting "null" or "undefined"
        if ('undefined' === typeof token || token === null) token = na;
        else if ('string' !== typeof token) token = String(token);

        // Escape quotes and escape char.
        if (quoteChar) {
            out = quoteChar;
            if (escapeChar) {
                i = -1, len = token.length;
                for ( ; ++i < len ; ) {
                    c = token.charAt(i);
                    if (c === quoteChar || c === escapeChar) {
                        out += escapeChar;
                    }
                    out += c;
                }
            }
            else {
                out += token;
            }
            out += quoteChar;
        }
        return out;
    }


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
        // TODO: copy settings, disable updates,
        // insert one by one, update indexes.
        for (i = 0; i < items.length; i++) {
            // Retrocycle if possible.
            items[i] = NDDB.retrocycle(items[i]);
        }
        nddb.importDB(items);
    }
})();
