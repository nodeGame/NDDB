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

    var fs = require('fs');

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

        this.__formats.json = {
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

        this.__formats.csv = {
            // Async.
            load: function(that, file, cb, options) {
                fs.readFile(file, options, function(err, data) {
                    if (err) that.throwError('Error', 'load', err);

                    processCsvForLoad(that, data, cb, options, "load");
                });
            },
            save: function(that, file, cb, options) {
                var out = processCsvForWrite(that, file, options);

                // Options.
                setDefaultCsvOptions(options, 'save');

                fs.writeFile(file, out, options, cb);

            },
            // Sync.
            loadSync: function(that, file, cb, options) {
                var headers, separator, quote, escape;
                var obj, tokens, i, len;

                processCsvForLoad(  that,
                                    fs.readFileSync(file),
                                    cb, options, "loadSync"
                );
            },
            saveSync: function(that, file, cb, options) {
                var out = processCsvForWrite(that, file, options);

                // Options.
                setDefaultCsvOptions(options, 'saveSync');

                fs.writeFileSync(file, out, options);
                if (cb) cb();
            }

        };

        // Set default format.
        this.setDefaultFormat('json');
    };

    // ## Helper Methods


    function processCsvForLoad(that, data, cb, options, method) {
        var headers, separator, quote, escape;
        var obj, tokens, i, j, len, token;
        var processedTokens = [];
        var result = '';

        setDefaultCsvOptions(options, method);

        separator = options.separator;
        quote = options.quote;
        escape = options.escape;
        headers = options.headers;

        data.toString().split('\n')
            .forEach(function(row) {
                if (!row || !row.length) return;
                result = "";
                processedTokens = [];
                tokens = row.split(separator);

                // Processing tokens
                for (j = 0; j < tokens.length; ++j) {
                    token = tokens[j];
                    if (token.charAt(token.length-1) !== escape) {
                        result += token;
                        processedTokens.push(parseCsvToken(
                            that, method, result, quote
                        ));
                        result = "";
                    }
                    // Handle if token ends with escape character.
                    else {
                        result += token.slice(0, -1) + separator;
                    }
                }
                if (result !== "") {
                    throw new Error("Row ending with escape character: " +
                        options.escape);
                }

                if (!headers) {
                    headers = processedTokens;
                }
                else {
                    obj = {};
                    for (i = 0; i < headers.length; ++i) {
                        obj[headers[i]] = processedTokens[i];
                    }
                    that.insert(obj);
                }
            });


        if (cb) cb();
    }

    function processCsvForWrite(that, file, options) {
        var headers, adapter, out;
        var separator, quote, escape, na;
        var data, token, key;
        var i, len;

        // Options.
        na = options.na;
        separator = options.separator;
        quote = options.quote;
        escape = options.escape;

        out = '';
        data = that.fetch();

        headers = getCsvHeaders(options.headers, data);
        if (headers) {
            len = headers.length;
            for (i = 0 ; i < len ; ++i) {
                out += createCsvToken(headers[i], quote,
                                      escape);

                if (i !== (len-1)) out += separator;
            }
            out += '\n';
        }
        adapter = options.adapter || {};
        data.forEach(function(item) {

        // Escape all separators in the item
            for (key in item) {
                if (item.hasOwnProperty(key)) {
                    token = item[key];
                    token.replace(separator, escape + separator);
                    item[key] = token;
                }
            }
            out += getCsvRow(that, 'saveSync', item, headers, adapter,
                             separator, quote, escape, na) + '\n';
        });
        return out;
    }


    /**
     * ### setDefaultCsvOptions
     *
     * Set default options depending on the CSV method
     *
     * Available options and defaults:
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
     *   quote: '"',                        // The character used as quote.
     *                                      // Default: '"'.
     *
     *   escape: '"',                       // The char that should be skipped.
     *                                      // Default: quote.
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
     * @param {object} options Initial options (will be modified)
     * @param {string} method The name of the invoking method
     *
     * @see http://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
     */

    function setDefaultCsvOptions(options, method) {

        if (options.columnNames) options.columnNames = undefined;

        if (method === 'load' || method === 'loadSync') {
            if (!options.headers &&
                'undefined' === typeof options.columnsFromHeader) {

                options.columnsFromHeader = true;
            }
        }
        else {
            if (options.columnsFromHeader) {
                options.columnsFromHeader = undefined;
            }
            options.flags = options.flags || 'a';
        }

        options.na = options.na || 'NA';
        options.separator = options.separator || ',';
        options.quote = options.quote || '"';
        options.escape = options.escape || '\\'
        // options.escape = options.escape  || options.quote;

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
                       quote, escape, na) {

        var out, key, token;
        out = '';
        if (!headers) {
            for (key in item) {
                if (item.hasOwnProperty(key)) {
                    out += createCsvToken(item[key], quote, escape,
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
                out += createCsvToken(str, quote, escape, na) +
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
     * @param {string} quote Optional. A character to escape
     *
     * @return {string} The parsed token
     */
    function parseCsvToken(that, method, token, quote) {
        if (!quote || token.charAt(0) !== quote) return token;

        if (token.charAt(token.length-1) !== quote) {
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
     * @param {string} quote Optional. A character to surround the value
     * @param {string} quote Optional. A character to escape
     *
     * @return {string} The parsed token
     */
    function createCsvToken(token, quote, escape, na) {
        var i, len, out, c;
        // We are not interested in outputting "null" or "undefined"
        if ('undefined' === typeof token || token === null) token = na;
        else if ('string' !== typeof token) token = String(token);

        // Escape quotes and escape char.
        if (quote) {
            out = quote;
            if (escape) {
                len = token.length;
                for (i = -1 ; ++i < len ; ) {
                    c = token.charAt(i);
                    if (c === quote || c === escape) {
                        out += escape;
                    }
                    out += c;
                }
            }
            else {
                out += token;
            }
            out += quote;
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
