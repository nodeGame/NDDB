/**
 * # NDDB: fs.js
 * Copyright(c) 2019 Stefano Balietti
 * MIT Licensed.
 *
 * NDDB file systems routines to save and load items
 *
 * Overrides save and load methods available in browser, with methods .that
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
 *
 * ---
 */
(function() {

    'use strict';

    require('../external/cycle.js');

    var fs = require('fs');
    var path = require('path');
    var J = require('JSUS').JSUS;
    var os = require('os');

    var NDDB = module.parent.exports;

    /**
     * ### NDDB.setWD
     *
     * Set default working directory path for saving and loading files
     *
     * The path must be a non-empty string and an existing directory,
     * unless force parameter is set
     *
     * @param {string} wd The current directory
     * @param {boolean} force Optional. If TRUE no checks are performed
     *
     * @see NDDB.getWd
     */
    NDDB.prototype.setWD = function(wd, force) {
        var stat, view, hash, hashDb;
        force = !!force;
        if (!force) {
            if ('string' !== typeof wd || wd.trim() === '') {
                this.throwErr('TypeError', 'setWD', 'wd must be ' +
                              'a non-empty string. Found: ' + wd);
            }
            if (!fs.existsSync(wd)) {
                this.throwErr('TypeError', 'setWD', 'working directory ' +
                              'does not exist: ' + wd);
            }
            stat = fs.lstatSync(wd);
            if (!stat.isDirectory()) {
                this.throwErr('Error', 'setWD', 'working directory not ' +
                              'valid: ' + wd);
            }
        }
        this.__wd = wd;

        // Update the working directory in views and hashes.
        // Views.
        for (view in this.__V) {
            if (this.__V.hasOwnProperty(view)) {
                this[view].setWD(wd, true);
            }
        }
        // Hashes.
        for (hash in this.__H) {
            if (this.__H.hasOwnProperty(hash)) {
                for (hashDb in this[hash]) {
                    if (this[hash].hasOwnProperty(hashDb)) {
                        this[hash][hashDb].setWD(wd, true);
                    }
                }
            }
        }

        // Notify of the change.
        this.emit('setwd', wd);
    };

    /**
     * ### NDDB.getWD
     *
     * Set default working directory for saving and loading files
     *
     * @return {string} wd Current working directory
     *
     * @see NDDB.setWD
     * @see process.cwd
     */
    NDDB.prototype.getWD = function() {
        return this.__wd || process.cwd();
    };

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
     * ### NDDB.getFilesCache
     *
     * Returns the reference to the file cache
     *
     * There is a central cache in the parent db for all views, hashes, etc.
     *
     * @param {string} filename Optional. A specific file
     * @param {boolean} create Optional. Creates the entry for a filename,
     *    if not found. Default: FALSE.
     *
     * @return {object|null} The files cache for either all files
     *    or a specific file, or NULL if not found.
     */
    NDDB.prototype.getFilesCache = function(filename, create) {
        var cache;
        cache = this.__parentDb ? this.__parentDb.__cache : this.__cache;
        if (!filename) return cache;
        if (!cache[filename] && create) {
            cache[filename] = { firstSave: true, lastSize: 0 };
        }
        return cache[filename] || null;
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
                fs.readFile(addWD(that, file), options, function(err, data) {
                    if (err) that.throwErr('Error', 'load', err);
                    loadCb(that, data);
                    if (cb) cb();
                });
            },
            save: function(that, file, cb, options) {
                // Fixing stupid deprecation error in Node 7.
                cb = cb || function() {};
                fs.writeFile(addWD(that, file),
                             that.stringify(!!options.compress), options, cb);
            },
            // Sync.
            loadSync: function(that, file, cb, options) {
                loadCb(that, fs.readFileSync(addWD(that, file), options));
                if (cb) cb();
            },
            saveSync: function(that, file, cb, options) {
                fs.writeFileSync(addWD(that, file),
                                 that.stringify(!!options.compress),
                                 options);

                if (cb) cb();
            }
        };

        this.__formats.csv = {
            // Async.
            load: function(that, file, cb, options) {
                loadCsv(that,
                        addWD(that, file), streamingRead, cb, options,'load',
                        function(err) {
                            if (err) that.throwErr('Error', 'load', err);
                        });
            },
            save: function(that, file, cb, options) {
                saveCsv(that,
                        addWD(that, file), streamingWrite, cb, options, 'save',
                        function(err) {
                            if (err) that.throwErr('Error', 'save', err);
                        }
                );
            },
            // Sync.
            loadSync: function(that, file, cb, options) {
                loadCsv(that, addWD(that, file),
                        streamingReadSync, cb, options, 'loadSync');
            },
            saveSync: function(that, file, cb, options) {
                saveCsv(that, addWD(that, file),
                        streamingWriteSync, cb, options, 'saveSync');
            }

        };

        // Set default format.
        this.setDefaultFormat('json');
    };

    // ## Helper Methods.

    /**
     * ### loadCsv
     *
     * Reads csv file and inserts entries into db
     *
     * Forwards reading to file to `readCb`.
     *
     * @param {NDDB} that. An NDDB instance
     * @param {string} filename. Name of the file in which to write
     * @param {function} readCb. Callback with the same signature and effect as
     *   `streamingRead`.
     * @param {function} doneCb. Callback to invoke upon completion
     * @param {object} options. Options to be forwarded to
     *   `setDefaultCsvOptions` and `readCb`
     * @param {string} method. The name of the invoking method
     * @param {function} errorCb. Callback to be passed an error.
     *
     * @see `setDefaultCsvOptions`
     * @see `streamingWrite`
     */
    function loadCsv(that, filename, readCb, doneCb, options, method,
        errorCb) {

        var headers, separator, quote, escapeCharacter;
        var obj, tokens, i, j, token, adapter;
        var processedTokens = [];
        var result = '';

        // Options.
        setDefaultCsvOptions(options, method);
        separator = options.separator;
        quote = options.quote;
        escapeCharacter = options.escapeCharacter;
        headers = options.headers;
        adapter = options.adapter || {};

        readCb(filename, function(headers) {
            // Self calling function for closure private variables.
            var firstCall;
            firstCall = true;
            return function(row) {
                var str, headersFlag, insertTokens;
                var tkj, foundJ;

                if (firstCall) {
                    if (!headers) {
                        // Autogenerate all headers.
                        headers = [];
                        headersFlag = 0;
                    }
                    else if (headers === true) {
                        // Read first row as headers.
                        headers = [];
                        headersFlag = 1;
                    }
                }

                if (!row || !row.length) return;
                result = "";
                processedTokens = {};
                insertTokens = true;
                tokens = row.split(separator);

                // Processing tokens.
                for (j = 0, i = 0; j < tokens.length; ++j) {
                    token = tokens[j];
                    if (token.charAt(token.length-1) !== escapeCharacter) {
                        str = false;
                        result += token;

                        // Handle quotes.
                        if (quote && result.charAt(0) === quote) {

                            if (result.charAt(result.length-1) !== quote) {

                                // Check next tokens, if they close the quote.
                               tkj = separator;
                               for ( ; ++j < tokens.length ; ) {
                                   tkj += tokens[j];
                                   // Last char next token is closing quote.
                                   if (tkj.charAt(tkj.length-1) === quote) {
                                       result += tkj;
                                       foundJ = true;
                                       break;
                                   }
                                   else {
                                       tkj += separator;
                                   }
                               }
                                if (!foundJ) {
                                    that.throwErr('Error', method,
                                                  'missing closing quote ' +
                                                  '(quote=' + quote + ' sep=' +
                                                  separator + ' escape=' +
                                                  escapeCharacter + '). ' +
                                                  'Row: ' + token );
                                }
                            }
                            result = result.substring(1, result.length -1);
                        }
                        else {
                            // Returns false if parsing to number fails.
                            str = J.isNumber(result);
                        }

                        // If str === false, then it was not parsed as
                        // a number before.
                        if (false === str) {
                            str = result.split(escapeCharacter + quote)
                                .join(quote)
                                .split(escapeCharacter + escapeCharacter)
                                .join(escapeCharacter)
                                .split(escapeCharacter + '\t').join('\t')
                                .split(escapeCharacter + '\n').join('\n');
                        }

                        if (firstCall) {
                            // Decide headersFlag for this entry.
                            if (headersFlag === 0 || headersFlag === 1) {
                                // Every entry treated the same way.
                            }
                            else {
                                if (headers[i] === true) {
                                    // Select this entry to be read as header.
                                    headersFlag = 2;
                                }
                                else if (headers[i]) {
                                    // This header is pre-defined.
                                    headersFlag = 3;
                                }
                                else {
                                    // This header should be autogenerated.
                                    headersFlag = 4;
                                }
                            }

                            // Act according to headersFlag.
                            if (headersFlag === 0 || headersFlag === 4) {
                                // Autogenerate header and insert token.
                                headers[i] = 'X' + (i + 1);
                            }

                            if (headersFlag === 1 || headersFlag === 2) {
                                // Read token as header.
                                headers[i] = str;
                                insertTokens = false;
                            }
                        }

                        if (insertTokens) {
                            processedTokens[headers[i]] = str;
                        }

                        result = "";
                        i++;
                    }
                    // Handle if token ends with escapeCharacter.
                    else {
                        result += token.slice(0, -1) + separator;
                    }
                }

                if (insertTokens) {
                    obj = {};
                    headers.forEach(function(h) {
                        if ('function' === typeof adapter[h]) {
                            obj[h] = adapter[h](processedTokens);
                        }
                        else if ('string' === typeof adapter[h]) {
                            obj[h] = processedTokens[adapter[h]];
                        }
                        else {
                            obj[h] = processedTokens[h];
                        }
                    });
                    that.insert(obj);
                }

                firstCall = false;
            };
        }(headers), doneCb, options, errorCb);
    }

    /**
     * ### saveCsv
     *
     * Fetches data from db and writes it to csv file
     *
     * Forwards writing to file to `writeCb`.
     *
     * @param {NDDB} that An NDDB instance
     * @param {string} filename Name of the file in which to write
     * @param {function} writeCb Callback with the same signature and effect as
     *   `streamingWrite`.
     * @param {function} doneCb Callback to invoke upon completion of save
     * @param {object} opts Options to be forwarded to
     *   `setDefaultCsvOptions` and `writeCb`
     * @param {string} method The name of the invoking method
     * @param {function} errorCb Callback to be passed an error.
     *
     * @see `setDefaultCsvOptions`
     * @see `streamingWrite`
     */
    function saveCsv(that, filename, writeCb, doneCb, opts, method, errorCb) {
        var writeIt;
        var headers, adapter;
        var separator, quote, escapeCharacter, na, bool2num;
        var data;
        var i, len;
        var flat;
        var firstSave, lastSize, cache;
        var recurrent, recurrentInterval, incremental;

        // Options.
        setDefaultCsvOptions(opts, method);
        na = opts.na;
        separator = opts.separator;
        quote = opts.quote;
        escapeCharacter = opts.escapeCharacter;
        bool2num = opts.bool2num;
        adapter = opts.adapter || {};
        flat = opts.flatten;
        recurrent = opts.recurrent;
        recurrentInterval = opts.recurrentInterval || 10000;
        incremental = !!opts.incremental;

        data = that.fetch();

        if (recurrent || incremental) {
            // If headers is true and there is no item in database, we cannot
            // extract it. We try again later.
            if (opts.headers === true && !data.length) {
                setTimeout(function() {
                    saveCsv(that, filename, writeCb, doneCb,
                            opts, method, errorCb);
                }, recurrentInterval);
                return;
            }
        }

        // Get the cache for the specific file; if not found create one.
        cache = that.getFilesCache(filename, true);
        firstSave = cache.firstSave;
        if (!firstSave) {
            if (incremental) {

                // No update since last incremental save.
                if (data.length === cache.lastSize) return;
                data = data.slice(cache.lastSize);

                // Unless otherwise specified, append all subsequent saves.
                if ('undefined' === typeof opts.flag) opts.flag = 'a';
            }
        }

        // Set and store lastSize in cache (must be done before flattening).
        cache.lastSize = data.length;

        // // If flat, we flatten all the data and get the header at once.
        if (flat) {
            // Here data is updated to an array of size one.
            headers = getCsvHeaderAndFlatten(data, opts);
        }
        else {
            // If headers is already specified, it simply returns it.
            headers = getCsvHeaders(opts.headers, opts.scanObjects, data);
        }
        // Note: headers can still be falsy here.

        // Store headers in cache.
        cache.headers = headers;

        // Create callback for the writeCb function.
        writeIt = (function(firstCall, currentItem) {
            // Self calling function for closure private variables.

            firstCall = 'undefined' === typeof firstCall ? true : firstCall;
            currentItem = currentItem || 0;

            // Update cache.
            cache.firstSave = false;

            return function() {
                var len, line, i;

                // Write headers, if any.
                if (firstCall && headers) {
                    line = '';
                    len = headers.length;
                    for (i = 0 ; i < len ; ++i) {
                        line += createCsvToken(headers[i], separator, quote,
                                               escapeCharacter, na, bool2num);

                        if (i !== (len-1)) line += separator;
                    }
                    firstCall = false;
                    return line;
                }

                // Evaluate the next item (if we still have one to process).
                if (currentItem < data.length) {
                    return getCsvRow(that, method, data[currentItem++], headers,
                                     adapter, separator, quote, escapeCharacter,
                                     na, bool2num);
                }
                // Return FALSE to stop the streaming out.
                return false;
            };
        })(firstSave, 0);


        // The writeCb method calls the function to receive a new line to
        // write, until it receives falls. The callback increments internally
        // the index of the item being converted into a row.
        writeCb(filename, writeIt, doneCb, opts, errorCb);

        // Make it recurrent, if requested.
        if (recurrent) {

            // Unless otherwise specified, append all subsequent saves.
            if ('undefined' === typeof opts.flag) opts.flag = 'a';

            let saveTimeout = null;

            that.on('insert', function(item) {
                console.log(item)

                if (saveTimeout) return;
                saveTimeout = setTimeout(function() {
                    saveTimeout = null;

                    // Important, reuse variable.
                    data = that.fetch();
                    // Stop here if no changes in database.
                    // if (cache.lastSize === data.length) return;
                    // Store new size.
                    // Note: currentItem in writeIt keeps track
                    // of where we left.
                    cache.lastSize = data.length;
                    // Flatten it.
                    if (flat) getCsvHeaderAndFlatten(data, opts);
                    // Save it.
                    writeCb(filename, writeIt, doneCb, opts, errorCb);
                }, recurrentInterval);
            });



        }

    }

    /**
     * ### setDefaultCsvOptions
     *
     * Set default options depending on the CSV method
     *
     * See README.md for details.
     *
     * @param {object} options Initial options (will be modified)
     * @param {string} method The name of the invoking method
     *
     * @see README.md
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

        if ('undefined' === typeof options.headers) {
            options.headers = true;
        }

        options.na = options.na || 'NA';
        options.separator = options.separator || ',';
        options.quote = options.quote || '"';
        options.escapeCharacter = options.escapeCharacter || '\\';

        options.scanObjects = {
            level: 1,
            concat: true,
            separator: '.',
            type: 'leaf'
        };
        if ('undefined' !== typeof options.objectLevel) {
            options.scanObjects.level = options.objectLevel;
        }


    }

    /**
     * ### getCsvHeaders
     *
     * Returns an array of CSV headers depending on the options
     *
     * @param {string|array|function} headersOpt Optional. Parameter
     *   controlling the headers
     * @param {object} objectOptions Options controlling how to handle
     *   objects
     * @param {array} data Optional. Array containing the items to save
     *
     * @return {array|null} h The headers, or NULL if not found
     *
     * @see JSUS.keys
     */
    function getCsvHeaders(headersOpt, objectOptions, data) {
        var h;
        h = null;
        if (headersOpt) {
            if (headersOpt === 'all' || 'function' === typeof headersOpt) {
                h = collectAllHeaders(data, headersOpt, objectOptions);
            }
            else if (J.isArray(headersOpt)) {
                h = headersOpt;
            }
            else if (headersOpt === true && data && J.isArray(data)) {
                h = J.keys(data[0], objectOptions);
                if (h && !h.length) h = null;
            }
        }
        return h;
    }

    /**
     * ### getCsvRow
     *
     * Evaluates an item and returns a csv string with only the required values
     *
     * @param {object} item An item from database
     * @param {array} headers Optional. An array of fields to take from the item
     * @param {object} adapter Optional. An object containing callbacks to
     *   be used to pre-process the values of the corresponding key before
     *   returning it
     * @param {string} separator Optional. A character to separate tokens
     * @param {string} quote Optional. A character to surround the value
     * @param {string} escapeCharacter Optional. A character to escape
     * @param {string} na Optional. The value for undefined and nulls
     * @param {boolean} bool2num Optional. If TRUE, converts booleans to 0/1
     *
     * @return {string} A Csv row of values ready to be written to file
     */
    function getCsvRow(that, method, item, headers, adapter, separator,
                       quote, escapeCharacter, na, bool2num) {

        var out, key, tmp, len;

        // The string containing the fully formatted CSV row.
        out = '';

        // No headers, do every key in the object.
        // console.log(item);
        if (!headers) {
            for (key in item) {
                if (item.hasOwnProperty(key)) {
                    tmp = preprocessKey(item, key, adapter, na);
                    // console.log('NH', key, tmp)
                    out += createCsvToken(tmp, separator,
                                          quote, escapeCharacter,
                                          na, bool2num) + separator;
                }
            }
        }
        else {
            key = -1;
            len = headers.length;
            for ( ; ++key < len ; ) {
                tmp = preprocessKey(item, headers[key], adapter, na);
                // console.log('H', key, tmp)
                out += createCsvToken(tmp, separator, quote, escapeCharacter,
                                      na, bool2num) + separator;
            }

        }
        // Remove last comma.
        return out.substring(0, out.length-1);
    }

    /**
     * ### preprocessKey
     *
     * Evaluates the value of a property in an item and modifies if necessary
     *
     * In this order:
     *
     *  - It checks if there is an adapter property named after `key`. If so:
     *    - if it is a function, it executes it
     *    - if it is a string, it retrieves the property with the same name
     *  - If the value obtained is an object, it calls toString().
     *  - If the value obtained is undefined, it replaces it with `na`.
     *
     * @param {object} item An item from database
     * @param {string} key The name of the property to process in the item
     * @param {object} adapter Optional. An object containing callbacks to
     *   be used to pre-process the values of the corresponding key before
     *   returning it
     * @param {string} na Optional. The value for undefined and nulls
     *
     * @return {string} str The preprocessed property to be added to the row
     */
    function preprocessKey(item, key, adapter, na) {
        var str;

        if ('function' === typeof adapter[key]) {
            str = adapter[key](item);
        }
        else {
            if ('string' === typeof adapter[key]) key = adapter[key];
            // We always check if a property named like `key`
            // exists, then look at nested properties.
            str = item[key];
            if ('undefined' === typeof str) {
                str = J.getNestedValue(key, item);
            }
        }
        if (str && 'object' === typeof str &&
            'function' === typeof str.toString) {

            str = str.toString();
        }
        if ('undefined' === typeof str) str = na;
        return str;
    }

    /**
     * ### createCsvToken
     *
     * Converts and escapes a token into the value of a csv field
     *
     * @param {mixed} token The string to parse. Other types will be converted,
     *   undefined and null are transformed into NA.
     * @param {string} quote Optional. A character to surround the value
     * @param {string} escapeCharacter Optional. A character to escape
     * @param {string} na Optional. The value for undefined and nulls
     * @param {boolean} bool2num Optional. If TRUE, converts booleans to 0/1
     *
     * @return {string} The parsed token
     */
    function createCsvToken(token, separator, quote, escapeCharacter,
                            na, bool2num) {

        var i, len, out, c;
        // Numbers are returned as they are.
        if (bool2num && 'boolean' === typeof token) return token ? 1 : 0;
        if ('number' === typeof token) return token;
        // We are not interested in outputting "null" or "undefined"
        else if ('undefined' === typeof token || token === null) token = na;
        else if ('string' !== typeof token) token = String(token);


        // Escape quote, separator, escapeCharacter, linebreak and tab.
        if (quote) {
            out = quote;
            if (escapeCharacter) {
                len = token.length;
                for (i = -1 ; ++i < len ; ) {
                    c = token.charAt(i);
                    if (c === quote || c === escapeCharacter ||
                        c === separator || c === '\n' || c === '\t') {
                        out += escapeCharacter;
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
     * @param {NDDB} nddb. An NDDB instance
     * @param {string} s. The string to retrocycle and import
     */
    function loadCb(nddb, s) {
        var items, i;
        items = J.parse(s);
        // TODO: copy settings, disable updates,
        // insert one by one, update indexes.

        // TODO: avoid double for.
        for (i = 0; i < items.length; i++) {
            // Retrocycle if possible.
            items[i] = NDDB.retrocycle(items[i]);
        }
        nddb.importDB(items);
    }

    /**
     * ### streamingRead
     *
     * Streams file in and applies callback to each line asynchronousely
     *
     * @param {string} filename. Name of file to load into database
     * @param {function} lineProcessorCb. Callback to forward to
     *   `processFileStreamInSync`
     * @param {object} options. May contain property `flag` forwarded to
     *   `fs.open` (default: 'r'). All options are forwarded to
     *   `processFileStreamOutSync`.
     * @param {function} errorCb. Callback to be passed an error.
     *
     * @see `fs.open`
     * @see `processFileStreamInSync`
     */

    function streamingRead(filename, lineProcessorCb, doneCb, options,
                           errorCb) {

        // Open file.
        fs.open(filename, options.flag || 'r', function(err, fd) {
            var res;
            if (err) {
                errorCb(err);
            }
            else {
                try {
                    if (!processFileStreamInSync(fd, lineProcessorCb, options)){
                        throw new Error('malformed csv file or wrong ' +
                                        'line break separator. File: ' +
                                        filename);
                    }
                    if (doneCb) doneCb();
                }
                catch (e) {
                    errorCb(e);
                }
            }
        });
    }

    /**
     * ### streamingReadSync
     *
     * Streams file in and applies callback to each line
     *
     * @param {string} filename. Name of file to load into database
     * @param {function} lineProcessorCb. Callback to forward to
     *   `processFileStreamInSync`
     * @param {object} options. May contain property `flag` forwarded to
     *   `fs.open` (default: 'r'). All options are forwarded to
     *   `processFileStreamOutSync`.
     * @param {function} errorCb. Callback to be passed an error.
     *
     * @see `fs.open`
     * @see `processFileStreamInSync`
     */
    function streamingReadSync(filename, lineProcessorCb, doneCb, options) {
        var fd;
        // Open file.
        fd = fs.openSync(filename, options.flag || 'r');
        if (!processFileStreamInSync(fd, lineProcessorCb, options)) {
            throw new Error('malformed csv file or wrong ' +
                            'line break separator. File: ' +
                            filename);
        }
        if (doneCb) doneCb();
    }

    /**
     * ### streamingWrite
     *
     * Gets lines from callback and streams them to file asynchronously
     *
     * @param {string} filename. Name of the file to which to write
     * @param {function} lineCreatorCb. Callback to forward to
     *   `processFileStreamOutSync`
     * @param {function} doneCb. Callback to be executed upon completion
     * @param {object} options. May contain property `flag` forwarded to
     *   `fs.open` (default: 'w'). All options are forwarded to
     *   `processFileStreamOutSync`.
     * @param {function} errorCb. Callback to be passed an error.
     *
     * @see `fs.open`
     * @see `processFileStreamOutSync`
     */

    function streamingWrite(filename, lineCreatorCb, doneCb, options,
                            errorCb) {

        // Open file for read.
        fs.open(filename, options.flag || 'w', function(err, fd) {
            if (err) {
                errorCb(err);
            }
            else {
                try {
                    processFileStreamOutSync(fd, lineCreatorCb,  options);
                    if (doneCb) doneCb();
                }
                catch(e) {
                    errorCb(e);
                }
            }
        });
    }
    /**
     * ### streamingWriteSync
     *
     * Gets lines from callback and streams them to file
     *
     * @param {string} filename. Name of the file to which to write
     * @param {function} lineCreatorCb. Callback to forward to
     *   `processFileStreamOutSync`
     * @param {function} doneCb. Callback to be executed upon completion
     * @param {object} options. May contain property `flag` forwarded to
     *   `fs.open` (default: 'w'). All options are forwarded to
     *   `processFileStreamOutSync`.
     *
     * @see `fs.open`
     * @see `processFileStreamOutSync`
     */

     function streamingWriteSync(filename, lineCreatorCb, doneCb, options) {
        var fd;
        // Open file.
        fd = fs.openSync(filename, options.flag || 'w');
        processFileStreamOutSync(fd, lineCreatorCb, options);
        if (doneCb) doneCb();
    }

    /**
     * ### processFileStreamInSync
     *
     * Reads from file and applies callback for each line.
     *
     * Reads file part by part into buffer, applies callback to each line in
     *   file ignoring escaped line breaks. Streaming the contents of the file
     *   in via fixed size buffer and applying processing directly should be
     *   advantageous for large files since it avoids building large strings
     *   in memory for processing. To avoid overhead from multiple calls to
     *   `fs.readSync` consider increasing `options.bufferSize`.
     *
     * @param {integer} fd. File descriptor of file to read
     * @param {function} lineProcessorCb. Callback applied for each line in
     *   file. Accepts string as input argument.
     * @param {object} options. Options object. If typeof options is string,
     *   it is treated as options = {encoding: options}
     *   Available options and defaults:
     *
     * ```
     * {
     *
     *  encoding: undefined,        // Forwarded as `encoding` to
     *                              //`Buffer.write` and `Buffer.toString`
     *
     *  bufferSize: 64 * 1024,      // Number of bytes to write out at once
     *
     *  escapeCharacter: "\\"       // Symbol to indicate that subsequent
     *                              // character is escaped
     *
     *  lineBreak: "\n"             // Sequence of characters to denote end of
     *                              // line. Default: os.EOL
     *
     * }
     * ```
     *
     * @return {boolean} TRUE on success, else FALSE (e.g., bad line break)
     *
     * @see `Buffer`
     * Kudos: http://stackoverflow.com/a/21219407
     */
    function processFileStreamInSync(fd, lineProcessorCb, options) {
        var read, line, lineBegin, searchBegin, lineEnd;
        var buffer, bufferSize, escapeChar, workload;
        var encoding;
        var lineBreak;

        if (typeof options === 'string') {
            encoding = options;
            options = {};
        }
        else {
            options = options || {};
            encoding = options.encoding;
        }

        bufferSize = options.bufferSize || 64 * 1024;
        escapeChar = options.escapeCharacter || "\\";
        lineBreak = options.lineBreak || os.EOL;
        buffer = new Buffer(bufferSize);

        workload = '';
        read = fs.readSync(fd, buffer, 0, bufferSize,
                           'number' === typeof options.startFrom ?
                           options.startFrom : null);
        // While file not empty, read into buffer.
        while (read !== 0) {

            // Add content of buffer to workload.
            workload += buffer.toString(encoding, 0, read);
            lineBegin = 0;
            searchBegin = 0;

            // While not on last line of buffer, process lines.
            while ((lineEnd = workload.indexOf(lineBreak, searchBegin)) !==
                -1) {

                // Do not break on escaped endline characters.
                if (workload.charAt(lineEnd - 1) === escapeChar) {
                    searchBegin = lineEnd + 1;
                    continue;
                }

                line = workload.substring(lineBegin, lineEnd);

                // Process line.
                lineProcessorCb(line);

                // Advance to next line.
                lineBegin = lineEnd + lineBreak.length;
                searchBegin = lineBegin;
            }

            // Begin workload with leftover characters for next line.
            workload = workload.substring(lineBegin);

            // Read more.
            read = fs.readSync(fd, buffer, 0, bufferSize, null);
        }

        // Work done, exit here.
        if (line) return true;

        // We did not find a single instance of lineBreak.

        // We can't do anything if lineBreak was specified as an option.
        // Malformed or wrong separator.
        if (options.lineBreak) return false;

        // If no line break was specified in the options, let's look for
        // alternative ones. For example, it could be that the file was
        // created under one OS and then imported into another one.
        if (os.EOL === '\n') {
            if (workload.indexOf('\r\n') !== -1) lineBreak = '\r\n';
            else if (workload.indexOf('\r')!== -1) lineBreak = '\r';
        }
        else if (os.EOL === '\r\n') {
            if (workload.indexOf('\n') !== -1) lineBreak = '\n';
            else if (workload.indexOf('\r')!== -1) lineBreak = '\r';
        }
        else {
            if (workload.indexOf('\r\n') !== -1) lineBreak = '\r\n';
            else if (workload.indexOf('\n')!== -1) lineBreak = '\n';
        }
        // Ok we found the right line break, repeat reading.
        if (lineBreak !== os.EOL){
            // Manual clone of options.
            processFileStreamInSync(fd, lineProcessorCb, {
                lineBreak: lineBreak,
                startFrom: 0,
                encoding: encoding,
                bufferSize: bufferSize,
                escapeChar: escapeChar
            });
        }
        // Work done, exit here.
        return true;
    }

    /**
     * ### processFileStreamOutSync
     *
     * Gets lines from callback and streams them to open file
     *
     * Writes buffer by buffer to file filling the buffer with values returned
     *   from a callback.  This might be advantageous for large files since it
     *   avoids building large strings in memory for write out and might even be
     *   used to generate the data on the fly in the callback. To avoid overhead
     *   from multiple calls to `fs.writeŜync` consider increasing
     *   `options.bufferSize`.
     *
     * @param {integer} fd. File descriptor of file to read
     * @param {function} lineCreatorCb. Callback which returns a string
     *  containing the next line to be written or false if no more lines
     *  are to follow.
     * @param {object} options. Options object. If typeof options is string,
     *   it is treated as options = {encoding: options}
     *
     * Available options and defaults:
     *
     * ```
     * {
     *
     *  encoding: undefined,        // Forwarded as `encoding` to
     *                              //`Buffer.write` and `Buffer.toString`
     *
     *  bufferSize: 64 * 1024       // Number of bytes to write out at once
     *
     *  lineBreak: "\n"             // Sequence of characters to denote end of
     *                              // line. Default: os.EOL
     *
     * }
     * ```
     *
     * @see `Buffer`
     */
    function processFileStreamOutSync(fd, lineCreatorCb, options) {
        var workload, line;
        var buffer, bufferSize, encoding, usedBytes;
        var lineBreak;

        if (typeof options === 'string') {
            encoding = options;
            options = {};
        }
        else {
            options = options || {};
            encoding = options.encoding;
        }
        lineBreak = options.lineBreak || os.EOL;

        bufferSize = options.bufferSize || 64 * 1024;
        buffer = new Buffer(bufferSize);
        workload = '';
        do {
            // Fill workload (assumes short-circuit evaluation).
            while (Buffer.byteLength(workload) < bufferSize &&
                (line = lineCreatorCb())) {
                workload += line + lineBreak;
            }

            // Fill buffer completely.
            usedBytes = buffer.write(workload, 0, encoding);

            // Write buffer to file.
            fs.writeSync(fd, buffer, 0, usedBytes);

            // Compute leftover and put it into workload.
            workload = workload.substring(
                buffer.toString(encoding, 0, usedBytes).length
            );

        } while (workload.length > 0 || line !== false);
    }

    /**
     * ### collectAllHeaders
     *
     * Collects and processes all the unique keys in the database
     *
     * @params {array} db The database of items
     * @params {function} cb Optional. If set, it will process each item,
     *   and based on its return value the final array of headers will change
     * @param {object} objectOptions Options controlling how to handle
     *   objects
     *
     * @return {array} out The array of headers
     *
     * @see JSUS.keys
     */
    function collectAllHeaders(db, headersOpt, objectOptions) {
        var i, len;
        i = -1, len = db.length;
        processJSUSKeysOptions(objectOptions, headersOpt);
        for ( ; ++i < len ; ) {
            J.keys(db[i], objectOptions);
        }
        return objectOptions.array;
    }

    /**
     * ### getCsvHeaderAndFlatten
     *
     * Flatten all items into one and returns the headers according to option
     *
     * The two operations (flatting and headers extraction) are joined in the
     * the same loop to improve performance.
     *
     * @params {array} data The database of items to flatten.
     *   This object is modified
     * @param {object} opts The user options to save the database
     *
     * @return {array} out The array of headers
     *
     * @see JSUS.keys
     */
    function getCsvHeaderAndFlatten(data, opts) {
        var flattened, tmp, i, len, h;
        var group, groupsMap, doGroups, counter, flattenByGroup;
        var headersOpt, objectOptions;

        headersOpt = opts.headers;
        objectOptions = opts.scanObjects;

        if (headersOpt) {
            if (headersOpt === 'all' || 'function' === typeof headersOpt) {
                h = true;
                processJSUSKeysOptions(objectOptions, headersOpt);
            }
            else if (J.isArray(headersOpt)) {
                h = headersOpt;
            }
            else if (headersOpt === true && data && J.isArray(data)) {
                h = J.keys(data[0], objectOptions);
                if (h && !h.length) h = null;
            }
        }
        // Flatten all items and collect headers if needed.
        doGroups = !!opts.flattenByGroup;
        if (doGroups) {
            // To dynamically modify the data array with the groups, we need
            // to keep track of the group position in the data array.
            groupsMap = {};
            // Option flattenByGroup can be a function or a string (already
            // validated). If string, change it into a function getting the
            // property value (nested values accepted).
            if ('string' === typeof opts.flattenByGroup) {
                flattenByGroup = function(item) {
                    return J.getNestedValue(opts.flattenByGroup, item);
                };
            }
            else {
                flattenByGroup = opts.flattenByGroup;
            }
        }

        counter = 0;
        len = data.length;
        flattened = {};
        for (i = 0; i < len; i++) {
            tmp = Object.assign({}, data[i]);
            if (opts.preprocess) opts.preprocess(tmp, flattened);
            if (h === true) J.keys(tmp, objectOptions);

            if (doGroups) {
                group = flattenByGroup(tmp);
                if (!flattened[group]) {
                    // If a new group, create the flattened object,
                    // store the id in the data array, and update counter.
                    flattened[group] = {};
                    groupsMap[group] = counter++;
                }
                flattened[group] = { ...flattened[group], ...tmp };
                // Optimization: overwrite data while looping through it.
                // We must always update the reference.
                data[groupsMap[group]] = flattened[group];
            }
            else {
                flattened = { ...flattened, ...tmp};
            }

        }

        if (h === true) h = objectOptions.array;

        // Update data without losing the reference.
        data.length = counter;
        // Groups are already copied in data.
        if (!doGroups) data[0] = flattened;

        // Return the headers
        return h;
    }

    /**
     * ### processJSUSKeysOptions
     *
     * Decorates the options for JSUS.keys handling nested objects
     *
     * @param {object} objectOptions The options to pass to JSUS.keys,
     *   this object is modified
     * @param {object} headersOpt The options of the headers
     *
     * @api private
     */
    function processJSUSKeysOptions(objectOptions, headersOpt) {
        var key, tmp, headers, out, cb, subKeys, objectLevel;
        objectLevel = objectOptions.level;
        headers = {};
        if ('function' === typeof headersOpt) cb = headersOpt;
        objectOptions.cb = function(key) {
            if (cb) key = cb(key);
            if (headers[key]) return null;
            else headers[key] = true;
            return key;
        };
        objectOptions.skip = headers;
        objectOptions.array = [];
        objectOptions.distinct = true;
    }

    /**
     * ### addWD
     *
     * Adds the working directory to relative paths
     *
     * Note: this function should stay in nddb.js, but there we do
     * not have have the path module (when in browser).
     *
     * @param {NDDB} The current instance of NDDB
     * @param {string} file The file to check
     *
     * @return {string} file The adjusted file path
     *
     * @api private
     */
    function addWD(that, file) {
        // Add working directory (if previously set, and if not absolute path).
        if (that.__wd && !path.isAbsolute(file)) {
            file = path.join(that.__wd, file);
        }
        return file;
    }

})();
