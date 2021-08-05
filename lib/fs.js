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

    const fs = require('fs');
    const path = require('path');
    const J = require('JSUS').JSUS;
    const os = require('os');

    const getFormat = require('./formatsFactory.js');
    const csv = getFormat('csv');
    const json = getFormat('json');
    const ndjson = getFormat('json', { type: 'ndjson' });

    const { addWD } = require('./util.js');

    const NDDB = module.parent.exports;


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

        this.__formats.json = json;

        this.__formats.ndjson = ndjson;

        this.__formats.journal = ndjson;

        this.__formats.csv = csv

        // Set default format.
        this.setDefaultFormat('json');
    };





})();
