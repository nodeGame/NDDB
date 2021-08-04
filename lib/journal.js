(function() {

    'use strict';

    const NDDB = module.parent.exports;

    const { addWD } = require('./util.js');

    NDDB.prototype.journal = (function() {

        let cache = null;
        let filename = null;
        let saveTimeout = null;
        let conf = {
            updateDelay: 2000,
            format: 'ndjson'
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

});
