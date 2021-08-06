(function() {

    'use strict';

    const NDDB = require('NDDB');

    /**
    * ### NDDB.journal
    *
    * Streams updates to database in a journal format
    *
    * Format:
    *
    * ```js
    * {
    *    op:     'i',         // Operation. Available: 'i', 'u', 'r'.
    *    nddbid: '12345...',  // NDDB id of the item.
    *    item:   { ... }      // Item, or update, or null if removed.
    * }
    * ```
    *
    * @param {object} opts Optional. Options for streaming
    *
    * @returns {Stream} The streaming object.
    *
    * @see NDDB.stream
    */
    NDDB.prototype.journal = function(opts = {}) {
        opts.journal = true;
        return this.stream(opts);
    };

   /**
    * ### NDDB.importJournal
    *
    * Imports journalled items into database
    *
    * NDDB id is re-established, operations are replayed sequentially.
    *
    * @param {array} items Array of journalled items
    *
    * @see NDDB.stream
    */
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

})();
