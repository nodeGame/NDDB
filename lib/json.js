module.exports = {

    load: loadJSON,

    // save: saveCsv
};


const J = require('JSUS').JSUS;
const { findLineBreak } = require('./util.js');

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
