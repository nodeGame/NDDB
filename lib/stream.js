(function() {

    'use strict';

    const J = require('JSUS').JSUS;
    const NDDB = require('NDDB');

    const { addWD, getExtension } = require('./util.js');

    class Stream {

        constructor(opts = {}) {

            this.buffer = [];

            this.journal = opts.journal || false;

            this.timeout = null;

            this.nddb = opts.nddb;

            this.filename = opts.filename;

            this.conf = opts.conf || {};

            this.format = opts.format || getExtension(this.filename);

            this.bufferLimit = opts.bufferLimit || 100;

            if (this.format === 'csv') {
                this.conf.keepUpdated = false;
            }
            else {
                this.conf.append = true;
                this.conf.enclose = false;
                this.conf.comma = false;
            }

            this.listeners = {
                insert: true,
                update: this.journal,
                remove: this.journal
            };

            this.addListeners(this.listeners);
        }

        static wrapJournalItem(op, nddbid, item) {
            return {
                op: op,
                nddbid: nddbid,
                item: item
            };
        }

        addListeners(opts) {
            let that = this;
            let nddb = this.nddb;
            let l = this.listeners;

            if (opts.insert) {
                l.insert = nddb.on('insert', function(item) {
                    that.add(item, item._nddbid, item, 'i');
                });
            }

            if (opts.update) {
                l.update = nddb.on('update', function(item, update) {
                    that.add(update, item._nddbid, 'u');
                });
            }

            if (opts.remove) {
                l.remove = nddb.on('remove', function(item) {
                    that.add(null, item._nddbid, 'r');
                });;
            }

        }

        removeListeners(opts) {
            let l = this.listeners;
            if (l.insert) {
                this.nddb.off(l.insert);
                l.insert = null;
            }
            if (l.update) {
                this.nddb.off(l.update);
                l.update = null;
            }
            if (l.remove) {
                this.nddb.off(l.remove);
                l.remove = null;
            }
        }

        add(item, nddbid, op) {
            if (this.journal) item = Stream.wrapJournalItem(item, nddb, op);
            this.buffer.push(item);
            if (this.buffer.length > this.bufferLimit) this.writeBuffer();
            else if (!this.timeout) this.startTimeout();
        }

        startTimeout() {
            if (this.timeout) return;
            this.timeout = setTimeout(() => this.writeBuffer());
        }

        writeBuffer() {
            clearTimeout(this.timeout);
            this.timeout = null;

            NDDB.save(this.buffer, this.filename, this.conf);

            // Clear array.
            this.journal = [];
        }

        stop() {
            this.removeListeners();
        }
    }

    NDDB.prototype.journal = function(opts = {}) {
        opts.journal = true;
        return this.stream(opts);
    };

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


    NDDB.prototype.sync = NDDB.prototype.stream = function(opts = {}) {

        // First parameter can be filename.
        if ('string' === typeof opts) opts = { filename: opts };

        // Get format.
        let format;
        if (opts.format) format = opts.format;
        else if (opts.filename) format = getExtension(opts.filename);
        if (!this.getFormat(format)) format = this.getDefaultFormat();

        let conf = {
            format: format,
            updateDelay: 2000
        };

        conf = J.mixout(conf, opts);

        let filename = conf.filename || `${this.name}.${conf.format}`;
        filename = addWD(this, filename);
        let cache = this.getFilesCache(filename, true);

        // Already streaming this file.
        if (cache.stream) {
            console.log(`Already streaming file: ${filename}`);
            return;
        }
        cache.stream = true;


        let stream = new Stream({
            filename: filename,
            conf: conf,
            nddb: this,
            journal: !!opts.journal,
            conf: conf
        });
        this.streams[filename] = stream;
        return stream;
    };


        NDDB.prototype.journalOld = (function() {

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

    NDDB.prototype.streamOld = function(opts = {}) {

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

        // Already streaming this file.
        if (cache.stream) {
            console.log(`Already streaming file: ${filename}`);
            return;
        }
        cache.stream = true;

        let stream = new Stream({
            filename: filename,
            conf: conf,
            nddb: this,
        })

        if (conf.format === 'csv') {
            conf.keepUpdated = true;
            this.save(filename, conf);
        }
        else {

            conf.append = true;
            conf.enclose = false;

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

})();
