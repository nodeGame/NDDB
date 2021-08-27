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

        static wrapJournalItem(item, nddbid, op) {
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
                    that.add(item, item._nddbid, 'i');
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
            if (this.journal) item = Stream.wrapJournalItem(item, nddbid, op);
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
            this.buffer = [];
        }

        stop() {
            this.removeListeners();
        }
    }

    /**
     * ### NDDB.stream
     *
     * Start streaming database updates to a file.
     *
     * @param {object} opts Optional. Configuration options
     *
     * @returns {Stream} a Stream object
     *
     * @see Stream
     */
    NDDB.prototype.stream = function(opts = {}) {

        // First parameter can be filename.
        if ('string' === typeof opts) opts = { filename: opts };

        // Get format.
        let format;
        if (opts.format) format = opts.format;
        else if (opts.filename) format = getExtension(opts.filename);
        if (!this.getFormat(format)) format = this.getDefaultFormat();

        let conf = {
            format: format,
            updateDelay: 10
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

        // Same emit format as 'save' in nddb.js
        this.emit('save', conf, {
            stream: true,
            file: filename,
            format: conf.format,
            journal: !!opts.journal
        });

        let stream = new Stream({
            filename: filename,
            nddb: this,
            journal: !!opts.journal,
            conf: conf
        });
        this.streams[filename] = stream;

        return stream;
    };

    /**
     * ### NDDB.sync
     *
     * Syncs database to a file (uses stream)
     *
     * @param {object} opts Optional. Configuration options
     *
     * @returns {Stream} a Stream object
     *
     * @see NDDB.stream
     *
     * @deprecated Use NDDB.stream
     */
    NDDB.prototype.sync = function(opts) {
        console.log('***warn: NDDB.sync is deprecated, use NDDB.stream.')
        this.stream(opts)
    };

})();
