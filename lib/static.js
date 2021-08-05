(function() {

    'use strict';

    const J = require('JSUS').JSUS;
    const NDDB = require('NDDB');

    // TODO check it.
    NDDB.convert = function(fileIn, fileOut, opts = {}, cb) {
        new NDDB().load(fileIn, opts.fileIn, () => {
            nddb.save(fileOut, opts.fileOut, cb);
        });
    };

    NDDB.convertSync = function(fileIn, fileOut, opts = {}) {
        new NDDB()
        .loadSync(fileIn, opts.fileIn)
        .saveSync(fileOut, opts.fileOut);
    };

    NDDB.save = function(db, filename, opts) {
        if (!J.isArray(db)) {
            throw new TypeError('NDDB.save: db must be array. Found: ' + db);
        }
        let nddb = new NDDB();
        // Skip evaluation.
        nddb.db = db;
        nddb.save(filename, opts);
    };

    NDDB.load = function(filename, opts, cb) {
        new NDDB().load(filename, opts, cb);
    };

    NDDB.saveSync = function(db, filename, opts) {
        if (!J.isArray(db)) {
            throw new TypeError('NDDB.saveSync: db must be array. Found: ' +
                                db);
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

})();
