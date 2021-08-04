/**
 * # NDDB: fs.js
 * Copyright(c) 2021 Stefano Balietti
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
 * @see JSUS.parse
 * @see NDDB.stringify
 * @see https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 *
 * ---
 */
(function() {

    'use strict';

    require('../external/cycle.js');

    const fs = require('fs');
    const path = require('path');
    const J = require('JSUS').JSUS;
    const os = require('os');

    const NDDB = module.parent.exports;

    // TODO check it.
    NDDB.convertSync = function(filenameIn, filenameOut, opts, optsOut, cb) {
        let nddb = new NDDB().load(filenameIn, opts, () => {
            if (!optsOut) optsOut = opts;
            nddb.save(filenameOut, optsOut, cb);
        });
    };

    NDDB.save = function(db, filename, opts) {
        if (!J.isArray(db)) {
            throw new TypeError('NDDB.save', 'db must be array. Found: ' + db);
        }
        let nddb = new NDDB();
        // Skip evaluation.
        nddb.db = db;
        nddb.save(filename, opts);
    };

    NDDB.load = function(filename, opts, cb) {
        new NDDB().load(filename, opts, () => );
    };

    NDDB.saveSync = function(db, filename, opts) {
        if (!J.isArray(db)) {
            throw new TypeError('NDDB.save', 'db must be array. Found: ' + db);
        }
        let nddb = new NDDB();
        // Skip evaluation.
        nddb.db = db;
        nddb.saveSync(filename, opts);
    };

    NDDB.loadSync = function(filename, opts) {
        let nddb = new NDDB();
        nddb.load(filename, opts);
        return nddb.db;
    };

    NDDB.loadDirSync = function(filename, opts) {
        let nddb = new NDDB();
        nddb.loadDirSync(filename, opts);
        return nddb.db;
    };

    // TODO: sync version of static methods.

    const _init = NDDB.prototype.init;
    NDDB.prototype.init = function(opts) {
        _init.call(this, opts);

        if (opts.defaultCSVHeader) {
            if (!Array.isArray(opts.defaultCSVHeader)) {
                this.throwErr('Type', 'init', 'defaultCSVHeader must be ' +
                              'array or undefined. Found ' +
                              opts.defaultCSVHeader);
            }

            this.defaultCSVHeader = opts.defaultCSVHeader.slice();
        }
    };

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
            cache[filename] = {
                firstSave: !fs.existsSync(filename),
                lastSize: 0
            };
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
            load: function(that, file, cb, opts) {
                fs.readFile(addWD(that, file), opts, function(err, data) {
                    if (err) that.throwErr('Error', 'load', err);
                    loadJSON(that, data, opts);
                    if (cb) cb(that);
                });
            },
            save: function(that, file, cb, opts) {
                // Fixing stupid deprecation error in Node 7.
                cb = cb || function() {};

                // Change append into flags = 'a'.
                if (opts.append) opts.flag = 'a';

                // Add a first comma if we are streaming.
                let str = opts.stream ? ', ' : '';
                str += that.stringify({
                    // TODO: opts pretty and compress
                    pretty: !!opts.compress || false,
                    comma: true,
                    enclose: true
                });

                fs.writeFile(addWD(that, file), str, opts, cb);
            },
            // Sync.
            loadSync: function(that, file, cb, opts) {
                let data = fs.readFileSync(addWD(that, file), opts);
                loadJSON(that, data, opts);
                if (cb) {
                    console.log('***warning: NDDB.loadSync cb parameter will ' +
                                'be skipped in future releases.')
                    cb();
                }
            },
            saveSync: function(that, file, cb, opts) {

                // Change append into flags = 'a'.
                if (opts.append) opts.flag = 'a';

                // Add a first comma if we are streaming.
                let str = opts.stream ? ', ' : '';
                str += that.stringify({
                    // TODO: opts pretty and compress
                    pretty: !!opts.compress || false,
                    comma: true,
                    enclose: true
                });

                fs.writeFileSync(addWD(that, file), str, opts);

                if (cb) {
                    console.log('***warning: NDDB.saveSync cb parameter will ' +
                                'be skipped in future releases.')
                    cb();
                }
            },
            loadDir: function(that, dir, cb, opts) {
                // TODO: make it fully async.
                let files = getFilesSync(dir, opts);
                let filesLeft = files.length;
                files.forEach(file =>
                    fs.readFile(addWD(that, file), opts, function(err, data) {
                        if (err) that.throwErr('Error', 'loadDir', err);
                        loadJSON(that, data, opts);
                        if (--filesLeft <= 0 && cb) cb(that);
                    })
                );
            },
            loadDirSync: function(that, dir, cb, opts) {
                getFilesSync(dir, opts)
                .forEach(file => {
                    let data = fs.readFileSync(addWD(that, file), opts);
                    loadJSON(that, data, opts)
                });
            }
        };


        this.__formats.ndjson = {
            // Async.
            load: function(that, file, cb, opts) {
                // Todo make it a stream.
                fs.readFile(addWD(that, file), opts, function(err, data) {
                    if (err) that.throwErr('Error', 'load', err);
                    loadJSON(that, data, opts);
                    if (cb) cb(that);
                });
            },
            save: function(that, file, cb, opts) {
                // Fixing stupid deprecation error in Node 7.
                cb = cb || function() {};

                // Change append into flags = 'a'.
                if (opts.append) opts.flag = 'a';

                let str = opts.stream ? ',' : '';
                str += that.stringify(opts);

                fs.writeFile(addWD(that, file), str, opts, cb);
            },
            // Sync.
            loadSync: function(that, file, cb, opts) {
                let data = fs.readFileSync(addWD(that, file), opts);
                loadJSON(that, data, opts);
                if (cb) {
                    console.log('***warning: NDDB.loadSync cb parameter will ' +
                                'be skipped in future releases.')
                    cb(that);
                }
            },
            saveSync: function(that, file, cb, opts) {

                // Change append into flags = 'a'.
                if (opts.append) opts.flag = 'a';


                fs.writeFileSync(addWD(that, file),
                                 that.stringify(opts.compress, opts.enclose),
                                 opts);

                if (cb) {
                    console.log('***warning: NDDB.saveSync cb parameter will ' +
                                 'be skipped in future releases.')
                    cb(that);
                }
            },
            loadDir: function(that, dir, cb, opts) {
                // TODO: make it fully async.
                let files = getFilesSync(dir, opts);
                let filesLeft = files.length;
                files.forEach(file =>
                    fs.readFile(addWD(that, file), opts, function(err, data) {
                        if (err) that.throwErr('Error', 'loadDir', err);
                        loadJSON(that, data, opts);
                        if (--filesLeft <= 0 && cb) cb();
                    })
                );
            },
            loadDirSync: function(that, dir, cb, opts) {
                getFilesSync(dir, opts)
                .forEach(file =>
                    loadJSON(that,
                        fs.readFileSync(addWD(that, file), opts), opts)
                );
            }
        };

        this.__formats.csv = {
            // Async.
            load: function(that, file, cb, opts) {
                loadCsv(that,
                        addWD(that, file), streamingRead, cb, opts,'load',
                        function(err) {
                            if (err) that.throwErr('Error', 'load', err);
                        });
            },
            save: function(that, file, cb, opts) {
                saveCsv(that,
                        addWD(that, file), streamingWrite, cb, opts, 'save',
                        function(err) {
                            if (err) that.throwErr('Error', 'save', err);
                        }
                );
            },
            // Sync.
            loadSync: function(that, file, cb, opts) {
                loadCsv(that, addWD(that, file),
                        streamingReadSync, cb, opts, 'loadSync');
            },
            loadDir: function(that, dir, cb, opts) {
                // TODO: make it fully async.
                let files = getFilesSync(dir, opts);
                let filesLeft = files.length;
                files.forEach(file => {
                    loadCsv(that,
                            addWD(that, file), streamingRead, null, opts,'load',
                            function(err) {
                                if (err) that.throwErr('Error', 'load', err);
                                if (--filesLeft <= 0 && cb) cb();
                            });
                });
            },
            loadDirSync: function(that, dir, cb, opts) {

                getFilesSync(dir, opts)
                .forEach(file => {
                    loadCsv(that, addWD(that, file),
                            streamingReadSync, cb, opts, 'loadSync')
                });
            },
            saveSync: function(that, file, cb, opts) {
                saveCsv(that, addWD(that, file),
                        streamingWriteSync, cb, opts, 'saveSync');
            }

        };

        // Set default format.
        this.setDefaultFormat('json');
    };


    NDDB.prototype.journal = (function() {

        let cache = null;
        let filename = null;
        let saveTimeout = null;
        let conf = {
            updateDelay: 2000,
            format: 'json'
        };
        let journal = [];

        let journalCb = (op, nddbid, item)  => {

            // Add item to journal.
            journal.push({
                op: op,
                nddbid: nddbid,
                item: item
            });

            if (saveTimeout) return;

            saveTimeout = setTimeout(() => {
                saveTimeout = null;

                conf.stream = !cache.firstSave;

                // Save it.
                NDDB.save(journal, filename, conf);

                // Clear array.
                journal = new Array();

            }, conf.updateDelay);
        };

        return function(opts) {

            conf = J.mixout(conf, opts);

            // conf.filename might be true if coming from constructor.
            if (conf.filename && 'string' === typeof conf.filename) {
                filename = conf.filename;
            }
            else {
                filename = `.${this.name}.journal`;
            }

            filename = addWD(this, filename);

            cache = this.getFilesCache(filename, true);

            // Already journaling this file.
            if (cache.journal) {
                console.log(`Already journaling file: ${filename}`);
                return;
            }

            cache.journal = true;

            conf.append = true;
            conf.enclose = false;
            conf.compress = true;

            this.on('remove', function(item) {
                journalCb.call(this, 'r', item._nddbid, null);
            });

            this.on('insert', function(item) {
                journalCb.call(this, 'i', item._nddbid, item);
            });

            this.on('update', function(item, update) {
                journalCb.call(this, 'u', item._nddbid, update);
            });
        };

    })();


    NDDB.prototype.sync = function(opts = {}) {
        let saveTimeout;
        let that = this;

        let conf =  {
            format: this.getDefaultFormat(),
            updateDelay: 2000
        };

        conf = J.mixout(conf, opts);

        let filename = conf.filename || `${this.name}.${conf.format}`;
        filename = addWD(this, filename);
        let cache = that.getFilesCache(filename, true);

        // Already syncing this file.
        if (cache.sync) {
            console.log(`Already syncing file: ${filename}`);
            return;
        }
        cache.sync = true;

        if (conf.format === 'csv') {
            conf.keepUpdated = true;
            this.save(filename, conf);
        }
        else {

            conf.append = true;
            conf.enclose = false;
            conf.compress = true;

            this.on('insert', function(item) {
                if (saveTimeout) return;
                saveTimeout = setTimeout(function() {
                    saveTimeout = null;

                    let cache = that.getFilesCache(filename, true);

                    // Stop here if no changes in database.
                    let newSize = that.size();
                    if (newSize === cache.lastSize) return;

                    // Fetch new data and update last size.
                    let db = that.fetch();
                    db = db.slice(cache.lastSize)

                    let firstSave = cache.firstSave;
                    if (firstSave) {
                        cache.firstSave = false;
                        conf.stream = false;
                    }
                    else {
                        conf.stream = true;
                    }
                    cache.lastSize = newSize;

                    // Save it.
                    NDDB.save(db, filename, conf);

                }, conf.updateDelay);
            });
        }

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

    /**
     * ### loadJSON
     *
     * Retrocycles a string into an array of objects and imports it into a db
     *
     * @param {NDDB} nddb. An NDDB instance
     * @param {string} s. The string to retrocycle and import
     * @param {object} opts. Optional. Configuration options
     */
    function loadJSON(nddb, s, opts) {
        opts = opts || {};

        // Makes it a string from buffer.
        s = '' + s;
        s = s.trim();

        if (opts.journal) {
            opts.addCommas = true;
            opts.enclose = true;
        }

        // Add commas to every new line.
        let lineBreak = findLineBreak(s);
        // Auto-determine if need to addCommas by default.
        let addCommas = opts.addCommas;
        if ('undefined' === typeof addCommas) {
            // Check character after first break, must be a comma.
            let idx = s.indexOf(lineBreak);
            addCommas = (idx !== 0 && idx !== -1 && s.charAt(idx+1) !== ',');
        }
        if (addCommas) {
            let re = new RegExp(`${lineBreak}`, 'g');
            s = s.replace(re, `,${lineBreak}`);
            // Remove last comma and newline.
            let lastCommaIdx = s.length -1 - lineBreak.length;
            if (s.charAt(lastCommaIdx) === ',') s = s.substr(0, lastCommaIdx);
        }
        // Auto-determine if need to be enclosed by default.
        let enclose = opts.enclose ?? (s.charAt(0) !== '[');
        if (enclose) s = '[' + s + ']';

        // Items are retrocycled by default. Integrate custom cb if provided.
        let cb;
        // Retrocycle off by default.
        if (opts.retrocycle) cb = NDDB.retrocycle;
        if (opts.cb) {
            let customCb = opts.cb;
            if (cb) {
                cb = function() {
                    NDDB.retrocycle(item);
                    customCb(item);
                };
            }
            else {
                cb = customCb;
            }
        }
        let items = J.parse(s, cb);

        // TODO: copy settings, disable updates,
        // insert one by one, update indexes.

        if (opts.journal) nddb.importJournal(items);
        else nddb.importDB(items);
    }

    NDDB.prototype.importJournal = function(items) {
        for (let i = 0; i < items.length; i++) {
            let o = items[i];
            let item = o.item;
            if (o.op === 'i') {
                // Add _nddbid.
                Object.defineProperty(item, '_nddbid', { value: o.nddbid });
                this.insert(item);
            }
            else if (o.op === 'r') {
                this.nddbid.remove(o.nddbid);
            }
            else if (o.op === 'u') {
                this.nddbid.update(o.nddbid, item);
            }
            else {
                this.throwErr('Error', 'importJournal',
                              'unknown operation. Found: ' + o.op);
            }
        }
    };

    /**
     * ### streamingRead
     *
     * Streams file in and applies callback to each line asynchronousely
     *
     * @param {string} filename. Name of file to load into database
     * @param {function} lineProcessorCb. Callback to forward to
     *   `processFileStreamInSync`
     * @param {object} options. May contain property `flags` forwarded to
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
        fs.open(filename, options.flags || 'r', function(err, fd) {
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
     * @param {object} options. May contain property `flags` forwarded to
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
        fd = fs.openSync(filename, options.flags || 'r');
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
     * @param {object} options. May contain property `flags` forwarded to
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
        fs.open(filename, options.flags || 'w', function(err, fd) {
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
     * @param {object} options. May contain property `flags` forwarded to
     *   `fs.open` (default: 'w'). All options are forwarded to
     *   `processFileStreamOutSync`.
     *
     * @see `fs.open`
     * @see `processFileStreamOutSync`
     */

     function streamingWriteSync(filename, lineCreatorCb, doneCb, options) {
        var fd;
        // Open file.
        fd = fs.openSync(filename, options.flags || 'w');
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
        lineBreak = findLineBreak(workload);
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
     * ### getAllKeysForHeader
     *
     * Collects and processes all the unique keys in the database
     *
     * @params {array} db The database of items
     * @params {function} cb Optional. If set, it will process each item,
     *   and based on its return value the final array of header will change
     * @param {object} objectOptions Options controlling how to handle
     *   objects
     * @param {array} headerAdd Optional. Additional names for the header.
     * @param {mixed} adapter Optional. An object to skip some properties.
     *
     * @return {array} out The array of header
     *
     * @see JSUS.keys
     */
    function getAllKeysForHeader(db, headerOpt, objectOptions,
                                 headerAdd, adapter) {
        var i, len;
        i = -1, len = db.length;
        processJSUSKeysOptions(objectOptions, headerOpt, headerAdd, adapter);
        for ( ; ++i < len ; ) {
            J.keys(db[i], objectOptions);
        }
        return objectOptions.array;
    }

    /**
     * ### getCsvHeaderAndFlatten
     *
     * Flatten all items into one and returns the header according to option
     *
     * The two operations (flatting and header extraction) are joined in the
     * the same loop to improve performance.
     *
     * @params {array} data The database of items to flatten.
     *   This object is modified
     * @param {object} opts The user options to save the database
     *
     * @return {array} out The array of header
     *
     * @see JSUS.keys
     */
    function getCsvHeaderAndFlatten(data, opts) {
        var flattened, tmp, i, len, h;
        var group, groupsMap, doGroups, counter, flattenByGroup;
        var headerOpt, objectOptions, headerAdd, adapter;

        headerOpt = opts.header;
        objectOptions = opts.scanObjects;
        headerAdd = opts.headerAdd
        adapter = opts.adapter;

        if (headerOpt) {

            // We also need to pass headerAdd correctly. For speed
            // we do it differently in different branches. TODO: Check if
            // it is still worth it.

            if (headerOpt === 'all' || 'function' === typeof headerOpt) {
                h = true;
                // Sets the options (including headerAdd) for JSUS.keys.
                processJSUSKeysOptions(objectOptions, headerOpt,
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
        // Flatten all items and collect header if needed.
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

        // Return the header
        return h;
    }

    /**
     * ### processJSUSKeysOptions
     *
     * Decorates the options for JSUS.keys handling nested objects
     *
     * @param {object} objectOptions The options to pass to JSUS.keys,
     *   this object is modified
     * @param {object} headerOpt The options of the header
     * @param {array} headerAdd Optional. Additional names for the header.
     * @param {mixed} adapter Optional. An object to skip some properties.
     *
     * @api private
     */
    function processJSUSKeysOptions(objectOptions, headerOpt,
                                    headerAdd, adapter) {

        var key, tmp, header, out, cb, subKeys, objectLevel;
        objectLevel = objectOptions.level;
        header = {};
        if ('function' === typeof headerOpt) cb = headerOpt;
        objectOptions.cb = function(key) {
            if (cb) key = cb(key);
            if (adapter && adapter[key] === false) return null;
            if (header[key]) return null;
            else header[key] = true;
            return key;
        };
        objectOptions.skip = header;
        objectOptions.array = headerAdd || [];
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

    /**
     * ### Adds elements from an array into another array if not already there
     *
     * Works only with primitive types (e.g., names in header).
     *
     * @param {array} ar1 will contain missing elements from ar2
     * @param {array} ar2 will add elements to ar1
     *
     * @api private
     */
    function addIfNotThere(ar1, ar2) {
        let len = ar2.length;
        if (len < 4) {
            if (len > 0 && !ar1.find(i => i === ar2[0])) ar1.push(ar2[0]);
            if (len > 1 && !ar1.find(i => i === ar2[1])) ar1.push(ar2[1]);
            if (len > 2 && !ar1.find(i => i === ar2[2])) ar1.push(ar2[2]);
        }
        else {
            ar2.forEach((item) => {
                if (!ar1.find(i => i === item)) ar1.push(item);
            });
        }
    }

    /**
     * ### findLineBreak
     *
     * Try to find the lineBreak characters in a text
     *
     * @param {string} text The text to search for
     *
     * @return {string} lineBreak The lineBreak characters
     *
     * @api private
     */
    function findLineBreak(text) {
        let lineBreak = os.EOL;
        if (os.EOL === '\n') {
            if (text.indexOf('\r\n') !== -1) lineBreak = '\r\n';
            else if (text.indexOf('\r')!== -1) lineBreak = '\r';
        }
        else if (os.EOL === '\r\n') {
            if (text.indexOf('\n') !== -1) lineBreak = '\n';
            else if (text.indexOf('\r')!== -1) lineBreak = '\r';
        }
        else {
            if (text.indexOf('\r\n') !== -1) lineBreak = '\r\n';
            else if (text.indexOf('\n')!== -1) lineBreak = '\n';
        }
        return lineBreak;
    }

    /**
     * ### doRecSearch
     *
     * Recursively scans a directory and returns the list of matching files
     *
     * @param {string} dir The directory to search recursively
     * @param {number} level The current recursion level
     * @param {number} maxLevel The max recursion level
     * @param {string|function} filter Optional. A filter function or a regex
     *   expression to apply to every file name.
     *
     * @return {array} out The list of matching files.
     *
     * @api private
     */
    const _doRecSearch = (dir, level, maxLevel, filter, dirFilter) => {
        let out = [];
        fs.readdirSync(dir, { withFileTypes: true })
        .forEach(file => {
            let filePath = path.join(dir, file.name);
            if (file.isDirectory()) {

                // Check directory filter (if any).
                if (!_testFilter(file.name, dirFilter)) return;

                if (level < maxLevel) {
                    let res = _doRecSearch(filePath, (level+1),
                                          maxLevel, filter);
                    if (res.length) out = [ ...out, ...res ];
                }
            }
            else {
                // Check directory filter (if any).
                if (!_testFilter(file.name, filter)) return;
                // console.log(res, level, maxLevel, filePath);
                out.push(filePath);
            }
        });
        return out;
    };

    const _testFilter = (file, filter) => {
        let res = true;
        if (filter) {
            res = 'string' === typeof filter ?
            new RegExp(filter).test(file) : filter(file);
        }
        return res;
    };

    /**
     * ### getFilesSync
     *
     * Recursively scans a directory and returns the list of matching files
     *
     * @param {string} dir The directory to search recursively
     * @param {object} opts Configuration options.
     *
     * @return {array} out The list of matching files.
     *
     * @see _doRecSearch
     * @api private
     */
    const getFilesSync = (dir, opts = {}) => {
        let maxRecLevel = opts.recursive ? opts.maxRecLevel || 10 : 0;
        return _doRecSearch(dir, 0, maxRecLevel, opts.filter, opts.dirFilter);
    };

    /**
     * ### getExtension
     *
     * Extracts the extension from a file name
     *
     * NOTE: duplicaetd from nddb.js
     *
     * @param {string} file The filename
     *
     * @return {string} The extension or NULL if not found
     */
    const getExtension = file => {
        let format = file.lastIndexOf('.');
        return format < 0 ? null : file.substr(format+1);
    };

})();
