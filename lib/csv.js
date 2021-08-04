module.exports = {

    load: loadCsv,

    save: saveCsv
};


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

    var header, separator, quote, escapeCharacter;
    var obj, tokens, i, j, token, adapter;
    var processedTokens = [];
    var result = '';

    // Options.
    setDefaultCsvOptions(that, options, method);
    separator = options.separator;
    quote = options.quote;
    escapeCharacter = options.escapeCharacter;
    adapter = options.adapter || {};
    header = options.header;

    readCb(filename, function(header) {
        // Self calling function for closure private variables.
        var firstCall;
        firstCall = true;
        return function(row) {
            var str, headerFlag, insertTokens;
            var tkj, foundJ;

            if (firstCall) {
                if (!header) {
                    // Autogenerate all header.
                    header = [];
                    headerFlag = 0;
                }
                else if (header === true) {
                    // Read first row as header.
                    header = [];
                    headerFlag = 1;
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
                        // Decide headerFlag for this entry.
                        if (headerFlag === 0 || headerFlag === 1) {
                            // Every entry treated the same way.
                        }
                        else {
                            if (header[i] === true) {
                                // Select this entry to be read as header.
                                headerFlag = 2;
                            }
                            else if (header[i]) {
                                // This header is pre-defined.
                                headerFlag = 3;
                            }
                            else {
                                // This header should be autogenerated.
                                headerFlag = 4;
                            }
                        }

                        // Act according to headerFlag.
                        if (headerFlag === 0 || headerFlag === 4) {
                            // Autogenerate header and insert token.
                            header[i] = 'X' + (i + 1);
                        }

                        if (headerFlag === 1 || headerFlag === 2) {
                            // Read token as header.
                            header[i] = str;
                            insertTokens = false;
                        }
                    }

                    if (insertTokens) {
                        processedTokens[header[i]] = str;
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
                // TODO: shall we account for MISS?
                header.forEach(function(h) {
                    if ('function' === typeof adapter) {
                        obj[h] = adapter(processedTokens, h);
                    }
                    else if ('function' === typeof adapter[h]) {
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
    }(header), doneCb, options, errorCb);
}

/**
 * ### saveCsv
 *
 * Fetches data from db and writes it to csv file
 *
 * Forwards writing to file to `writeCb`.
 *
 * @param {NDDB} that The NDDB instance
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
    var header, adapter;
    var separator, quote, escapeCharacter, na, bool2num;
    var data;
    var i, len;
    var flat;
    var firstSave, lastSize, cache;
    var updatesOnly, keepUpdated, updateDelay;

    // Options.
    setDefaultCsvOptions(that, opts, method);
    na = opts.na;
    separator = opts.separator;
    quote = opts.quote;
    escapeCharacter = opts.escapeCharacter;
    bool2num = opts.bool2num;
    adapter = opts.adapter || {};

    flat = opts.flatten;

    updatesOnly = opts.updatesOnly;
    keepUpdated = opts.keepUpdated;
    updateDelay = opts.updateDelay || 10000;

    header = opts.header;

    data = that.fetch();

    if (keepUpdated || updatesOnly) {
        // If header is true and there is no item in database, we cannot
        // extract it. We try again later.
        if (header === true && !data.length) {
            setTimeout(function() {
                saveCsv(that, filename, writeCb, doneCb,
                        opts, method, errorCb);
            }, updateDelay);
            return;
        }
    }

    // Get the cache for the specific file; if not found create one.
    cache = that.getFilesCache(filename, true);
    firstSave = cache.firstSave;
    if (!firstSave) {
        if (updatesOnly) {

            // No update since last updatesOnly save.
            if (data.length === cache.lastSize) return;
            data = data.slice(cache.lastSize);

            // Unless otherwise specified, append all subsequent saves.
            if ('undefined' === typeof opts.flags) opts.flags = 'a';
        }
    }

    // Set and store lastSize in cache (must be done before flattening).
    cache.lastSize = data.length;

    // If flat, we flatten all the data and get the header at once.
    if (flat) {
        // Here data is updated to an array of size one, or if
        // `flattenByGroup` option is set, one entry per group.
        header = getCsvHeaderAndFlatten(data, opts);
    }
    else {
        // If header is already specified, it simply returns it.
        header = getCsvHeader(data, opts);
    }
    // Note: header can still be falsy here.

    // Store header in cache.
    cache.header = header;

    // Create callback for the writeCb function.
    writeIt = (function(firstCall, currentItem) {
        // Self calling function for closure private variables.

        firstCall = 'undefined' === typeof firstCall ? true : firstCall;
        currentItem = currentItem || 0;

        // Update cache.
        cache.firstSave = false;

        return function() {
            var len, line, i;

            // Write header, if any.
            if (firstCall && header) {
                line = '';
                len = header.length;
                for (i = 0 ; i < len ; ++i) {
                    line += createCsvToken(header[i], separator, quote,
                                           escapeCharacter, na, bool2num);

                    if (i !== (len-1)) line += separator;
                }
                firstCall = false;
                return line;
            }

            // Evaluate the next item (if we still have one to process).
            if (currentItem < data.length) {
                return getCsvRow(that, method, data[currentItem++], header,
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

    // Save updates, if requested.
    if (keepUpdated) {

        // Unless otherwise specified, append all subsequent saves.
        if ('undefined' === typeof opts.flags) opts.flags = 'a';

        let saveTimeout = null;

        that.on('insert', function(item) {
            if (saveTimeout) return;
            saveTimeout = setTimeout(function() {
                saveTimeout = null;
                // Important, reuse variable.
                data = that.fetch();

                console.log('saving...', that.name, data.length);
                console.log('---------------------------------------')

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
            }, updateDelay);
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
 * @param {NDDB} that The NDDB instance
 * @param {object} options Initial options (will be modified)
 * @param {string} method The name of the invoking method
 *
 * @see README.md
 * @see http://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
 */
function setDefaultCsvOptions(that, options, method) {
    if (options.columnNames) options.columnNames = undefined;

    // Backward-compatible header.
    setOptHeader(options);

    // Set default header.
    if ('undefined' === typeof options.header && that.defaultCSVHeader) {
        options.header = that.defaultCSVHeader;
    }

    checkHeaderAdd(that, options, method);

    if (options.flag) {
        console.log('***NDDB.' + method + ': option flag is deprecated ' +
                    'use flags***');
        if (!options.flags) options.flags = options.flag;
    }

    if (method === 'load' || method === 'loadSync') {
        if (!options.header &&
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

    if ('undefined' === typeof options.header) {
        options.header = true;
    }

    options.na = options.na ?? 'NA';
    options.separator = options.separator ?? ',';
    options.quote = options.quote ?? '"';
    options.escapeCharacter = options.escapeCharacter ?? '\\';

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
* ### setOptHeader
*
* Returns the header option, looks for both header and headers
*
* Console logs a deprecation warning for header.
*
* @param {object} options The options object
*
* @return {mixed} The value of header|header
*
* @api private
*/
function setOptHeader(options, logWarn) {
    let header = options.header;
    if ('undefined' === typeof header) {
        header = options.headers;
        // Add header to options.
        options.header = header;
        if (header && logWarn !== false) {
            console.log('***warn: option "headers" is deprecated, ' +
            'use "header"***')
        }
    }
    return header;
}

/**
* ### checkHeaderAdd
*
* Checks if the headerAdd option is valid
*
* @param {NDDB} that The NDDB instance
* @param {object} options Initial options (will be modified)
* @param {string} method The name of the invoking method
*
* @api private
*/
function checkHeaderAdd(that, options, method) {
    let h = options.headerAdd;
    if (!h) return;

    if ('string' === typeof h || 'number' === typeof h) {
        options.headerAdd = [ h ];
    }
    if (!Array.isArray(options.headerAdd)) {
        that.throwErr('Type', method, 'headerAdd must be string, number, ' +
                      'array, or undefined. Found: ' + h);
    }
}

/**
 * ### getCsvHeader
 *
 * Returns an array of CSV header depending on the options
 *
 * @param {array} data Optional. Array containing the items to save
 * @param {object} opts Configuration options for the header.
 *
 * @return {array|null} h The header, or NULL if not found
 *
 * @see JSUS.keys
 */
function getCsvHeader(data, opts) {
    var h, headerOpt, objectOptions, headerAdd, adapter;
    h = null;

    headerOpt = opts.header;
    objectOptions = opts.scanObjects;
    headerAdd = opts.headerAdd;
    adapter = opts.adapter;

    if (headerOpt) {
        if (headerOpt === 'all' || 'function' === typeof headerOpt) {
            h = getAllKeysForHeader(data, headerOpt, objectOptions,
                                    headerAdd, adapter);
        }
        else {
            if (J.isArray(headerOpt)) {
                h = headerOpt;
            }
            else if (headerOpt === true && data && J.isArray(data)) {
                h = J.keys(data[0], objectOptions);
                if (h && !h.length) h = null;
            }

            // headerAdd.
            if (h && headerAdd) addIfNotThere(h, headerAdd);
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
 * @param {array} header Optional. An array of fields to take from the item
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
function getCsvRow(that, method, item, header, adapter, separator,
                   quote, escapeCharacter, na, bool2num) {

    var out, key, tmp, len;

    // The string containing the fully formatted CSV row.
    out = '';

    // No header, do every key in the object.
    // console.log(item);
    if (!header) {
        for (key in item) {
            if (item.hasOwnProperty(key)) {
                tmp = preprocessKey(item, key, adapter, na);
                if (tmp !== false) {
                    // console.log('NH', key, tmp)
                    out += createCsvToken(tmp, separator,
                                          quote, escapeCharacter,
                                          na, bool2num) + separator;
                }
            }
        }
    }
    else {
        key = -1;
        len = header.length;
        for ( ; ++key < len ; ) {
            tmp = preprocessKey(item, header[key], adapter, na);
            // NOTE: tmp === false might be a valid value.
            // if (tmp !== false) {
                // console.log('H', key, tmp)
                out += createCsvToken(tmp, separator, quote,
                                      escapeCharacter, na, bool2num) +
                                      separator;
            // }
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

    if ('function' === typeof adapter) {
        str = adapter(item, key);
    }
    else if ('function' === typeof adapter[key]) {
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

    out = "";
    // Escape quote, separator, escapeCharacter, linebreak and tab.
    if (escapeCharacter) {
        len = token.length;
        for (i = -1 ; ++i < len ; ) {
            c = token.charAt(i);
            if ((quote && c === quote) || c === escapeCharacter ||
                c === separator || c === '\n' || c === '\t') {
                out += escapeCharacter;
            }
            out += c;
        }
    }
    else {
        out += token;
    }
    if (quote) out = quote + out + quote;
    return out;
}
