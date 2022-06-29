(function() {

    'use strict';

    const J = require('JSUS').JSUS;
    const NDDB = require('NDDB');


    const parseOpts = (file, method, type) => {
        let opts = {};
        if ('object' === typeof file) {
            opts = file;
            file = file.filename;
        }
        if ('string' !== typeof file || file.trim() === '') {
            throw new Error(`NDDB.${method}: file${type} must be a non-empty ` +
                            `string. Found: ${file}`);
        }
        return [ file, opts ];
    };

    // CONVERT.

    // TODO check it.
    NDDB.convert = function(fileIn, fileOut, cb) {
        // Underscore because let needs a new name.
        let [ _fileIn, optsIn ] = parseOpts(fileIn, 'convert', 'In');
        let [ _fileOut, optsOut ] = parseOpts(fileOut, 'convert', 'Out');
        new NDDB().load(_fileIn, optsIn, (nddb) => {
            nddb.save(_fileOut, optsOut, cb);
        });
    };

    NDDB.convertSync = function(fileIn, fileOut) {
        // Underscore because let needs a new name.
        let [ _fileIn, optsIn ] = parseOpts(fileIn, 'convertSync', 'In');
        let [ _fileOut, optsOut ] = parseOpts(fileOut, 'convertSync', 'Out');
        return new NDDB()
            .loadSync(_fileIn, optsIn)
            .saveSync(_fileOut, optsOut);

    };

    // LOAD.

    NDDB.load = function(filename, opts, cb) {
        new NDDB().load(filename, opts, cb);
    };

    NDDB.loadSync = function(filename, opts) {
        let nddb = new NDDB();
        nddb.loadSync(filename, opts);
        return nddb.db;
    };

    // SAVE.

    let nddbSave = new NDDB();

    NDDB.save = function(db, filename, opts) {
        if (!J.isArray(db)) {
            throw new TypeError('NDDB.save: db must be array. Found: ' + db);
        }
        // Skip evaluation.
        // let nddbSave = new NDDB();
        nddbSave.db = db;
        nddbSave.save(filename, opts);
    };

    NDDB.saveSync = function(db, filename, opts) {
        if (!J.isArray(db)) {
            throw new TypeError('NDDB.saveSync: db must be array. Found: ' +
                                db);
        }
        // Skip evaluation.
        // let nddbSave = new NDDB();
        nddbSave.db = db;
        nddbSave.saveSync(filename, opts);
    };

    // DIR.

    NDDB.loadDir = function(filename, opts, cb) {
        return new NDDB().loadDir(filename, opts, cb);
    };

    NDDB.loadDirSync = function(filename, opts) {
        return new NDDB().loadDirSync(filename, opts);
    };


})();
