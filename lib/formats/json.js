const fs = require('fs');
const path = require('path');
const J = require('JSUS').JSUS;
const { addWD, findLineBreak } = require('../util.js');

module.exports = function(opts = {}) {

    this.name = 'json';

    // May be overwritten by factory.
    this.type = 'json';

    this.load = (nddb, file, cb, opts) => {

        fs.readFile(addWD(nddb, file), opts, function(err, data) {
            if (err) nddb.throwErr('Error', 'load', err);
            loadJSON(nddb, data, opts);
            if (cb) cb(nddb);
        });
    };

    this.loadSync = (nddb, file, cb, opts) => {

        let data = fs.readFileSync(addWD(nddb, file), opts);
        loadJSON(nddb, data, opts);
        if (cb) {
            console.log('***warning: NDDB.loadSync cb parameter will ' +
                        'be skipped in future releases.')
            cb();
        }
    };

    this.save = (nddb, file, cb, opts) => {

        // TODO: maybe add a state for ndjson.
        let str = jsonStringify(nddb, opts, 'save', this.type);
        fs.writeFile(addWD(nddb, file), str, opts, cb || (() => {}));
    };

    this.saveSync = (nddb, file, cb, opts) => {

        // console.log(this.toString());

        // TODO: maybe add a state for ndjson.
        let str = jsonStringify(nddb, opts, 'saveSync', this.type);
        fs.writeFileSync(addWD(nddb, file), str, opts);
        if (cb) {
            console.log('***warning: NDDB.saveSync cb parameter will ' +
                        'be skipped in future releases.')
            cb();
        }
    };

};

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
        opts.comma = true;
        opts.enclose = true;
    }

    // Add commas to every new line.
    let lineBreak = opts.lineBreak || findLineBreak(s);
    // Auto-determine if need to comma by default.
    let comma = opts.comma;
    if ('undefined' === typeof comma) {
        // Check character after first break, must be a comma.
        let idx = s.indexOf(lineBreak);
        comma = idx !== 0 &&
                (idx !== -1 && s.charAt(idx+1) !== ',') &&
                (idx !== -1 && s.charAt(idx+1) !== ']') &&
                (idx !== -1 && s.charAt(idx-1) !== '[');
    }
    if (comma) {
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


const jsonStringify = (nddb, opts, method, type) => {
    let ndjson = type === 'ndjson';

    // Change append into flags = 'a'.
    if (opts.append) opts.flag = 'a';

    // Add a first comma if we are streaming.
    let str = opts.stream ? ', ' : '';

    let strOpts = {};

    // JSON options.
    if (!ndjson) {
        // Backward compatible pretty option.
        let pretty = false;
        if ('undefined' !== typeof opts.pretty) {
            pretty = !!opts.pretty;
        }
        if ('undefined' !== typeof opts.compress) {
            console.log('***warn: NDDB.' + method +
            ': compress is deprecated, use pretty.');
            pretty = !opts.compress;
        }

        strOpts.pretty  = pretty;
        strOpts.comma   = opts.comma ?? true;
        strOpts.enclose = opts.enclose ?? true;
    }

    str += nddb.stringify(strOpts);

    return str;
};
