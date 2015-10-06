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
                processCsvForLoad(that, file, streamingRead, cb, options,'load',
                function(err) {
                    if (err) that.throwErr('Error', 'load', err);
                });
            },
            save: function(that, file, streamingWrite, cb, options) {
                processCsvForWrite(that, file, streamingWrite, cb, options,
                    'save', function(err) {
                        if (err) that.throwErr('Error', 'save', err);
                    }
                );
            },
            // Sync.
            loadSync: function(that, file, cb, options) {
                processCsvForLoad(that, file, streamingReadSync, cb, options,
                    'loadSync'
                );
            },
            saveSync: function(that, file, cb, options) {
                processCsvForWrite(that, file, streamingWriteSync, cb, options,
                    'saveSync'
                );
            }

        };

        // Set default format.
        this.setDefaultFormat('json');
    };

    // ## Helper Methods

    /**
     * ### processCsvForLoad
     *
     * Parses and tokenizes each line in 'data' and inserts tokens into database
     *
     * @param {function} cb. Callback to be executed upon completion
     * @param {object} options. Initial options
     * @param {string} method. The name of the invoking method
     */
    function processCsvForLoad(that, filename, readCb, doneCb, options, method,
        errorCb) {

        var headers, separator, quote, escapeCharacter;
        var obj, tokens, i, j, token;
        var processedTokens = [];
        var result = '';

        // Options.
        if (!options) {throw new Error("RIght again :)");}
        setDefaultCsvOptions(options, method);
        separator = options.separator;
        quote = options.quote;
        escapeCharacter = options.escapeCharacter;
        headers = options.headers;

        readCb(filename,function(row) {
                if (!row || !row.length) return;
                result = "";
                processedTokens = [];
                tokens = row.split(separator);

                // Processing tokens.
                for (j = 0; j < tokens.length; ++j) {
                    token = tokens[j];
                    if (token.charAt(token.length-1) !== escapeCharacter) {
                        result += token;
                        processedTokens.push(parseCsvToken(
                            that, method, result, quote, escapeCharacter
                        ));
                        result = "";
                    }
                    // Handle if token ends with escapeCharacter
                    else {
                        result += token.slice(0, -1) + separator;
                    }
                }
                if (result !== "") {
                    throw new Error("Row ending with escape character: " +
                        options.escapeCharacter);
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
            }, doneCb, options, errorCb);
    }

    /**
     * ### processCsvForWrite
     *
     * Escapes and concatenates tokens in database into one string
     *
     * @param {string} method. The name of the invoking method
     * @param {object} options. Initial options
     *
     * @return {string} out. Content of a CSV file ready to be written to drive
     */

    function processCsvForWrite(that, filename, writeCb, doneCb,options, method,
        errorCb) {
        var headers, adapter;
        var separator, quote, escapeCharacter, na;
        var data, currentItem;
        var i, len;

        // Options.
        if (!options) {throw new Error("I was wrong :(");}
        setDefaultCsvOptions(options, method);
        na = options.na;
        separator = options.separator;
        quote = options.quote;
        escapeCharacter = options.escapeCharacter;


        data = that.fetch();
        headers = getCsvHeaders(options.headers, data);
        currentItem = 0;
        adapter = options.adapter || {};

        writeCb(filename, function() {
            var line;
            line = '';
            if (currentItem++ === 0 && headers) {
                len = headers.length;
                for (i = 0 ; i < len ; ++i) {
                    line += createCsvToken(headers[i], separator, quote,
                                          escapeCharacter);

                    if (i !== (len-1)) line += separator;
                }
                return line;
            }
            if (currentItem < data.length) {
                return  getCsvRow(that, method, data[currentItem++], headers,
                    adapter, separator, quote, escapeCharacter, na);
            }
            return false;
        }, doneCb, options, errorCb);
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

        options.na = options.na || 'NA';
        options.separator = options.separator || ',';
        options.quote = options.quote || '"';
        options.escapeCharacter = options.escapeCharacter || '\\';
        // options.escapeCharacter = options.escapeCharacter  || options.quote;

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
    function parseCsvToken(that, method, token, quote, escapeCharacter) {
        if (!quote || token.charAt(0) !== quote) return token;

        if (token.charAt(token.length-1) !== quote) {
            that.throwErr('Error', method, 'missing closing quote char: ' +
                          token);
        }

        return token.substring(1, token.length-1)
        // Replace all occurences without invoking RegExp constructor
            .split(escapeCharacter + quote).join(quote)
            .split(escapeCharacter + escapeCharacter).join(escapeCharacter)
            .replace(escapeCharacter + 'n', '\n');

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


        // Escape quotes, separator and escapeCharacter.
        if (quote) {
            out = quote;
            if (escapeCharacter) {
                len = token.length;
                for (i = -1 ; ++i < len ; ) {
                    c = token.charAt(i);
                    if (c === quote || c === escapeCharacter ||
                        c === separator) {
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

    /**
     * ### streamingReadSync
     *
     * Invokes the functions fs.openSync and processFileStreamInSync
     *
     * @param {string} filename. Name of file to load into database
     * @param {function} lineProcessorCb. A character to surround the value
     * @param {function} doneCb. Callback to be executed upon completion
     * @param {object} options. Initial options
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
     * ### streamingRead
     *
     * Invokes the functions fs.open and processFileStreamInSync
     *
     * @param {string} filename. Name of file to load into database
     * @param {function} cb. Callback to be executed upon completion
     * @param {object} options. Initial options
     */

    function streamingRead(filename,lineProcessorCb, doneCb, options, errorCb) {
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
     * ### processFileStreamInSync
     *
     * Streams file in and applies callback to each line
     *
     * Reads file part by part into buffer, applies callback to each line in
     *   file ignoring escaped line breaks.
     *
     * @param {integer} fd. File descriptor of file to read
     * @param {function} lineProcessorCb. Callback applied to each line of file
     * @param {object} options. Initial options
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

        bufferSize = options.bufferSize || 1024;
        escapeChar = options.escapeCharacter || "\\";
        buffer = new Buffer(bufferSize);
        workload = '';

        // While file not empty, read into buffer.
        while ((read = fs.readSync(fd, buffer, 0, bufferSize, null)) !== 0) {

        // Add content of buffer to workload.
        workload += buffer.toString(encoding, 0, read);
        lineBegin = 0;
        searchBegin = 0;

            // While not on last line of buffer, process lines
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

    function streamingWrite(filename, lineCreatorCb, doneCb, options,
        errorCb) {
        var flag;
        // Open file.
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

     function streamingWriteSync(filename, lineCreatorCb, doneCb, options) {
        var fd, flag;
        // Open file.
        flag = options.flag || 'w';
        fd = fs.openSync(filename, flag);
        processFileStreamOutSync(fd, lineCreatorCb, options);
        if (doneCb) doneCb();
    }

    function processFileStreamOutSync(fd, lineCreatorCb, options) {
        var workload, line;
        var buffer, bufferSize, encoding;

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
            // Fill workload (assumes short-circuit evaluation)
            while (Buffer.byteLength(workload) < bufferSize &&
                (line = lineCreatorCb())) {
                workload += line + "\n";
            }

            // Fill buffer completely.
            buffer.write(workload,0,encoding);

            // Write buffer to file.
            fs.writeSync(fd,buffer);

            // Compute leftover and put it into workload.
            workload = workload.substring(buffer.toString().length + 1);

        } while (workload.length > 0 || line !== false);
    }
})();
