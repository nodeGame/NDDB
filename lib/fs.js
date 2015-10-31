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
                    if (err) that.throwErr('Error', 'load', err);
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
                loadCsv(that, file, streamingRead, cb, options,'load',
                function(err) {
                    if (err) that.throwErr('Error', 'load', err);
                });
            },
            save: function(that, file, cb, options) {
                saveCsv(that, file, streamingWrite, cb, options,
                    'save', function(err) {
                        if (err) that.throwErr('Error', 'save', err);
                    }
                );
            },
            // Sync.
            loadSync: function(that, file, cb, options) {
                loadCsv(that, file, streamingReadSync, cb, options,
                    'loadSync'
                );
            },
            saveSync: function(that, file, cb, options) {
                saveCsv(that, file, streamingWriteSync, cb, options,
                    'saveSync'
                );
            }

        };

        // Set default format.
        this.setDefaultFormat('json');
    };

    // ## Helper Methods

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
     * @param {function} doneCb. Callback to invoke upon completion of save
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

        readCb(filename, function(row) {
            var str, headersFlag;

            headersFlag = 0;

            if (!headers) {
                headers = [];
            }
            else if (headers === true) {
                headers = [];
                headersFlag = 2;
            }

            if (!row || !row.length) return;
            result = "";
            processedTokens = {};
            tokens = row.split(separator);

            // Processing tokens.
            for (j = 0, i = 0; j < tokens.length; ++j) {
                token = tokens[j];
                if (token.charAt(token.length-1) !== escapeCharacter) {
                    result += token;

                    str = parseCsvToken(
                        that, method, result, quote, escapeCharacter
                    );

                    if (headersFlag === 2 || headers[i] === true) {
                        headers[i] = str;
                        headersFlag = headersFlag || 1;
                    }
                    else {
                        if (!headers[i]) {
                            headers[i] = 'X' + (i + 1);
                        }
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

            if (headersFlag < 1) {
                obj = {};
                headers.forEach(function(h) {
                    if (adapter[h]) {
                        obj[h] = adapter[h](processedTokens);
                    }
                    else {
                        obj[h] = processedTokens[h];
                    }
                });
                that.insert(obj);
            }

        }, doneCb, options, errorCb);
    }

    /**
     * ### saveCsv
     *
     * Fetches data from db and writes it to csv file
     *
     * Forwards writing to file to `writeCb`.
     *
     * @param {NDDB} that. An NDDB instance
     * @param {string} filename. Name of the file in which to write
     * @param {function} writeCb. Callback with the same signature and effect as
     *   `streamingWrite`.
     * @param {function} doneCb. Callback to invoke upon completion of save
     * @param {object} options. Options to be forwarded to
     *   `setDefaultCsvOptions` and `writeCb`
     * @param {string} method. The name of the invoking method
     * @param {function} errorCb. Callback to be passed an error.
     *
     * @see `setDefaultCsvOptions`
     * @see `streamingWrite`
     */
    function saveCsv(that, filename, writeCb, doneCb, options,
        method, errorCb) {
        var headers, adapter;
        var separator, quote, escapeCharacter, na;
        var data;
        var i, len;

        // Options.
        setDefaultCsvOptions(options, method);
        na = options.na;
        separator = options.separator;
        quote = options.quote;
        escapeCharacter = options.escapeCharacter;

        data = that.fetch();
        headers = getCsvHeaders(options.headers, data);
        adapter = options.adapter || {};

        writeCb(filename, function() {
            // Self calling function for closure private variables.
            var firstCall, currentItem;
            firstCall = true;
            currentItem = 0;
            return function() {
                var line;
                line = '';
                if (firstCall && headers) {
                    len = headers.length;
                    for (i = 0 ; i < len ; ++i) {
                        line += createCsvToken(headers[i], separator, quote,
                                              escapeCharacter);

                        if (i !== (len-1)) line += separator;
                    }
                    firstCall = false;
                    return line;
                }
                if (currentItem < data.length) {
                    return getCsvRow(that, method, data[currentItem++], headers,
                        adapter, separator, quote, escapeCharacter, na);
                }
                return false;
            };
        }(), doneCb, options, errorCb);
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
     *   headers: true,                     // if options.headers === true: use
     *                                      //   first line of file as headers;
     *                                      // if !options.headers: use
     *                                      //   ['X1'...'XN'] as headers;
     *                                      // if options.headers is an array of
     *                                      //   strings use it as headers;
     *                                      // if options.headers is an array
     *                                      //   containing true/false use entry
     *                                      //   from file/'Xi' respectively;
     *
     *
     *   adapter: { A: function(row) {      // An obj containing callbacks for
     *                  return row['A']-1;  // each header. The callbacks take
     *                 }                    // an object of strings and
     *            },                        // return a string. Each entry in
     *                                      // the file is the result of
     *                                      // applying the callback of its
     *                                      // column to its row.
     *
     *
     *   separator: ',',                    // The character used as separator
     *                                      // between values. Default ','.
     *
     *   quote: '"',                        // The character used as quote.
     *                                      // Default: '"'.
     *
     *   escapeCharacter: '\',              // The char that should be skipped.
     *                                      // Default: '\'.
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

        if ("undefined" === typeof options.headers) {
            options.headers = true;
        }

        options.na = options.na || 'NA';
        options.separator = options.separator || ',';
        options.quote = options.quote || '"';
        options.escapeCharacter = options.escapeCharacter || '\\';
        // options.escapeCharacter = options.escapeCharacter  || options.quote;

    }

    /**
     * ### getCsvHeaders
     *
     * Returns the CSV headers from data or headers
     *
     * @param {array} headers Optional. An array of headers returned as it is
     * @param {array} data Optional. Array containing the items to save
     *
     * @return {array|null} h The headers, or NULL if not found
     */
    function getCsvHeaders(headers, data) {
        var h;
        if (!headers) return;
        if (J.isArray(headers)) return headers;
        if (data && J.isArray(data)) {
            h = J.keys(data[0], 1);
            if (!h || !h.length) h = null;
            return h;
        }
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
     *
     * @return {string} A Csv row of values ready to be written to file
     */
    function getCsvRow(that, method, item, headers, adapter, separator,
                       quote, escapeCharacter, na) {

        var out, key;
        out = '';
        if (!headers) {
            for (key in item) {
                if (item.hasOwnProperty(key)) {
                    out += createCsvToken(item[key], separator, quote,
                                        escapeCharacter, na) + separator;
                }
            }
        }
        else {
            headers.forEach(function(h) {
                var str;
                if (adapter[h]) str = adapter[h](item);
                else if (item.hasOwnProperty(h)) str = item[h];
                else str = na;
                out += createCsvToken(str, separator, quote, escapeCharacter,
                    na) + separator;
            });
        }
        // Remove last comma.
        return out.substring(0, out.length-1);
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
    function parseCsvToken(that, method, token, quote, escapeCharacter) {
        if (quote && token.charAt(0) === quote) {

            if (token.charAt(token.length-1) !== quote) {
                that.throwErr('Error', method, 'missing closing quote char: ' +
                              token);
            }
            token = token.substring(1, token.length -1);
        }

        // Unescape quote, ecapeCharacter, linebreak and tab.
        return token.split(escapeCharacter + quote).join(quote)
                    .split(escapeCharacter + escapeCharacter)
                    .join(escapeCharacter)
                    .split(escapeCharacter + '\t').join('\t')
                    .split(escapeCharacter + '\n').join('\n');

    }

    /**
     * ### createCsvToken
     *
     * Converts and escapes a token into the value of a csv field
     *
     * @param {mixed} token The string to parse. Other types will be converted,
     *   undefined and null are transformed into NA.
     * @param {string} quote Optional. A character to surround the value
     * @param {string} quote Optional. A character to escape
     *
     * @return {string} The parsed token
     */
    function createCsvToken(token, separator, quote, escapeCharacter, na) {
        var i, len, out, c;
        // We are not interested in outputting "null" or "undefined"
        if ('undefined' === typeof token || token === null) token = na;
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
        var flag;
        // Open file.
        flag = options.flag || 'r';
        fs.open(filename, flag, function(err, fd) {
            if (err) {
                errorCb(err);
            }
            else {
                try {
                    processFileStreamInSync(fd, lineProcessorCb,  options);
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
        var fd, flag;
        // Open file.
        flag = options.flag || 'r';
        fd = fs.openSync(filename, flag);
        processFileStreamInSync(fd, lineProcessorCb, options);
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
        var flag;
        // Open file for read.
        flag = options.flag || 'w';
        fs.open(filename, flag, function(err, fd) {
            if (err) {
                errorCb(err);
            }
            else {
                try {
                    processFileStreamOutSync(fd, lineCreatorCb,  options);
                    if (doneCb) doneCb();
                }
                catch (e) {
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
        var fd, flag;
        // Open file.
        flag = options.flag || 'w';
        fd = fs.openSync(filename, flag);
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
     *
     * Available options and defaults:
     *
     * ```
     * {
     *
     *  encoding: undefined,        // Forwarded as `encoding` to
     *                              //`Buffer.write` and `Buffer.toString`
     *
     *  bufferSize: 4 * 1024,       // Number of bytes to write out at once
     *
     *  escapeCharacter: "\\"       // Symbol to indicate that subsequent
     *                              // character is escaped
     *
     * }
     * ```
     *
     * @see `Buffer`
     */

    // adapted from http://stackoverflow.com/a/21219407
    function processFileStreamInSync(fd, lineProcessorCb, options) {
        var read, line, lineBegin, searchBegin, lineEnd;
        var buffer, bufferSize, escapeChar, workload;
        var encoding;
        if (typeof options === 'string') {
            encoding = options;
            options = {};
        }
        else {
            options = options || {};
            encoding = options.encoding;
        }

        bufferSize = options.bufferSize || 4 * 1024;
        escapeChar = options.escapeCharacter || "\\";
        buffer = new Buffer(bufferSize);
        workload = '';

        // While file not empty, read into buffer.
        while ((read = fs.readSync(fd, buffer, 0, bufferSize, null)) !== 0) {

        // Add content of buffer to workload.
        workload += buffer.toString(encoding, 0, read);
        lineBegin = 0;
        searchBegin = 0;

            // While not on last line of buffer, process lines.
            while ((lineEnd = workload.indexOf("\n", searchBegin)) !== -1) {

                // Do not break on escaped endline characters.
                if (workload.charAt(lineEnd - 1) === escapeChar) {
                    searchBegin = lineEnd + 1;
                    continue;
                }

                line = workload.substring(lineBegin, lineEnd);

                // Process line.
                lineProcessorCb(line);

                // Advance to next line.
                lineBegin = lineEnd + 1;
                searchBegin = lineBegin;
            }

            // Begin workload with leftover characters for next line.
            workload = workload.substring(lineBegin);
        }
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
     *  encoding: undefined,          // Forwarded as `encoding` to
     *                                //`Buffer.write` and `Buffer.toString`
     *
     *  bufferSize: 4 * 1024          // Number of bytes to write out at once
     *
     * }
     * ```
     *
     * @see `Buffer`
     */

    function processFileStreamOutSync(fd, lineCreatorCb, options) {
        var workload, line;
        var buffer, bufferSize, encoding, usedBytes;

        if (typeof options === 'string') {
            encoding = options;
            options = {};
        }
        else {
            options = options || {};
            encoding = options.encoding;
        }

        bufferSize = options.bufferSize || 4*1024;
        buffer = new Buffer(bufferSize);
        workload = '';
        do {
            // Fill workload (assumes short-circuit evaluation).
            while (Buffer.byteLength(workload) < bufferSize &&
                (line = lineCreatorCb())) {
                workload += line + "\n";
            }

            // Fill buffer completely.
            usedBytes = buffer.write(workload, 0, encoding);

            // Write buffer to file.
            fs.writeSync(fd, buffer, 0, usedBytes);

            // Compute leftover and put it into workload.
            workload = workload.substring(
                buffer.toString(encoding, 0, usedBytes).length + 1
            );

        } while (workload.length > 0 || line !== false);
    }
})();
