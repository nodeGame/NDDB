(function() {

    'use strict';

    const NDDB = module.parent.exports;

    const { addWD, getExtension } = require('./util.js');

    /**
    * ### NDDB.loadDirSync
    *
    * Load in the specified format and loads them into db synchronously
    *
    * @see NDDB.loadSync
    */
    NDDB.prototype.loadDirSync = function(dir, opts, cb) {

        decorateLoadDirOpts(opts);

        getFilesSync(dir, opts)
        .forEach(file => {
            let ext = getExtension(file);
            // TODO: try default formats.
            if (ext === 'csv') {
                CSV.load(that, addWD(that, file),
                streamingReadSync, cb, opts, 'loadSync')
            }
            else {
                let data = fs.readFileSync(addWD(that, file), opts);
                loadJSON(that, data, opts);
            }
        });

        return this;
    };

    /**
    * ### NDDB.loadDir
    *
    * Load in the specified format and loads them into db synchronously
    *
    * @see NDDB.loadSync
    */
    NDDB.prototype.loadDir = function(dir, opts, cb) {

        decorateLoadDirOpts(opts);

        // TODO: make it fully async.
        let files = getFilesSync(dir, opts);
        let filesLeft = files.length;

        files.forEach(file => {
            let ext = getExtension(file);
            // TODO: try default formats.
            if (ext === 'csv') {
                CSV.load(that,
                    addWD(that, file), streamingRead, null, opts, 'loadDir',
                    function(err) {
                        if (err) that.throwErr('Error', 'load', err);
                        if (--filesLeft <= 0 && cb) cb(that);
                    });
                }
                else {
                    fs.readFile(addWD(that, file), opts, function(err, data) {
                        if (err) that.throwErr('Error', 'loadDir', err);
                        loadJSON(that, data, opts);
                        if (--filesLeft <= 0 && cb) cb(that);
                    })
                }
            });

            return this;
        };
    };


    /**
    * ### decorateLoadDirOpts
    *
    * Adds file and format when possible
    *
    * @param {object} obj The options to decorate
    */
    function decorateLoadDirOpts(opts) {
        var file;
        opts = opts || {};
        if (!opts.format) {
            file = opts.file;
            if (!file && 'string' === typeof opts.filter) file = opts.filter;
            if (file) opts.format = getExtension(file);
        }
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



});
