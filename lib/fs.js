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
 * ### NDDB.addFormat
 *
 * Registers a _format_ function
 *
 * The format object is of the type:
 *
 *     {
 *       load:     function() {},
 *       save:     function() {},
 *       loadSync: function() {},
 *       saveSync: function() {}
 *     }
 *
 * @param {string|array} format The format name/s
 * @param {object} The format object containing at least one pair of save/load
 *   functions (sync and async)
 */
NDDB.prototype.addFormat = function(format, obj) {
    var f, i, len;
    validateFormatParameters(this, format, obj);
    if (!J.isArray(format)) format = [format];
    i = -1, len = format.length;
    for ( ; ++i < len ; ) {
        f = format[i];
        if ('string' !== typeof f || f.trim() === '') {
            this.throwErr('TypeError', 'addFormat', 'format must be ' +
                          'a non-empty string');
        }
        this.__formats[f] = obj;
    }
};

/**
 * ### NDDB.getFormat
 *
 * Returns a _format_ function
 *
 * @param {string} format The format name
 * @param {boolean} save Optional TRUE for 'save'. Default: 'load'
 */
NDDB.prototype.getFormat = function(format, method) {
    var f, op;
    if ('string' !== typeof format) {
        this.throwErr('TypeError', 'getFormat', 'format must be string');
    }
    f = this.__formats[format];
    if (!f) return null;
    // op = save ? 'save' : 'load';
    // if (sync) op += 'Sync';
    return f[method] || null;
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

    // Aliases to JSON.
    this.__formats['nddb'] = this.__formats['json'];
    this.__formats['jsn'] = this.__formats['json'];
    this.__formats['out'] = this.__formats['json'];


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
};


/**
 * ### NDDB.load
 *
 * Reads items in the specified format and loads them into db asynchronously
 */
NDDB.prototype.load = function(file, cb, options) {
    executeSaveLoad(this, 'load', file, cb, options);
};

/**
 * ### NDDB.save
 *
 * Saves items in the specified format asynchronously
 */
NDDB.prototype.save = function(file, cb, options) {
    executeSaveLoad(this, 'save', file, cb, options);
};

/**
 * ### NDDB.loadSync
 *
 * Reads items in the specified format and loads them into db synchronously
 */
NDDB.prototype.loadSync = function(file, cb, options) {
    executeSaveLoad(this, 'loadSync', file, cb, options);
};

/**
 * ### NDDB.saveSync
 *
 * Saves items in the specified format synchronously
 */
NDDB.prototype.saveSync = function(file, cb, options) {
    executeSaveLoad(this, 'saveSync', file, cb, options);
};

// ## Helper Methods

function validateSaveLoadParameters(that, method, file, cb, options) {
    if ('string' !== typeof file || file.trim() === '') {
        that.throwErr('TypeError', method, 'file must be ' +
                      'a non-empty string');
    }
    if (cb && 'function' !== typeof cb) {
        that.throwErr('TypeError', method, 'cb must be function ' +
                      'or undefined');
    }
    if (options && 'object' !== typeof options) {
        that.throwErr('TypeError', method, 'options must be object ' +
                      'or undefined');
    }
}

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

function getFormat(file) {
    var format;
    format = file.lastIndexOf('.');
    if (format < 0) format = 'json';
    else format = file.substr(format+1);
    return format;
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
    // TODO: copy settings, disable updates, insert one by one, update indexes.
    for (i = 0; i < items.length; i++) {
        // Retrocycle if possible.
        items[i] = NDDB.retrocycle(items[i]);
    }
    nddb.importDB(items);
}

function executeSaveLoad(that, method, file, cb, options) {
    var ff, format, compress;
    validateSaveLoadParameters(that, method, file, cb, options);
    options = options || {};
    format = getFormat(file);
    ff = that.getFormat(format, method);
    if (!ff) {
        that.throwErr('Error', method, format + '.' + method + ' not found');
    }
    ff(that, file, cb, options);
}

function validateFormatParameters(that, format, obj) {
    if ('string' !== typeof format && !J.isArray(format) && !format.length) {
        that.throwError('TypeError', 'addFormat', 'format must be ' +
                        'a non-empty string or array');
    }
    if ('object' !== typeof obj) {
        that.throwError('TypeError', 'addFormat', 'obj must be ' +
                        'object');
    }
    if (!obj.save && !obj.saveSync) {
        that.throwError('Error', 'addFormat', 'format must ' +
                        'at least one save function: sync or async');
    }
    if (!obj.load && !obj.loadSync) {
        that.throwError('Error', 'addFormat', 'format must ' +
                        'at least one load function: sync or async');
    }
    if (obj.save || obj.load) {
        if ('function' !== typeof obj.save) {
            that.throwError('TypeError', 'addFormat',
                            'save function is not a function');
        }
        if ('function' !== typeof obj.load) {
            that.throwError('TypeError', 'addFormat',
                            'load function is not a function');
        }
    }
    if (obj.saveSync || obj.loadSync) {
        if ('function' !== typeof obj.saveSync) {
            that.throwError('TypeError', 'addFormat',
                            'saveSync function is not a function');
        }
        if ('function' !== typeof obj.loadSync) {
            that.throwError('TypeError', 'addFormat',
                            'loadSync function is not a function');
        }
    }
}
