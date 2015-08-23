/**
 * # NDDB: browser.js
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed.
 *
 * NDDB browser routines to save and load items
 *
 * Cyclic objects are decycled, and do not cause errors.
 * Upon loading, the cycles are restored.
 *
 * Loads a JSON object into the database from a persistent medium
 *
 * Looks for a global `store` method to load from the browser database.
 * The `store` method is supplied by shelf.js.
 * If no `store` object is found, an error is issued and the database
 * is not loaded.
 *
 * @see NDDB.stringify
 * @see JSUS.parse
 * @see https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 *
 * ---
 */

/**
 * ### NDDB.storageAvailable
 *
 * Returns true if db can be saved to a persistent medium
 *
 * It checks for the existence of a global `store` object,
 * usually provided  by libraries like `shelf.js`.
 *
 * return {boolean} TRUE, if storage is available
 */
NDDB.prototype.storageAvailable = function() {
    return ('function' === typeof store);
};

/**
 * ### NDDB.addDefaultFormats
 *
 * Overrides default `addDefaultFormats` with the store methods for the browser
 */
NDDB.prototype.addDefaultFormats = function() {

    this.__formats['store'] = {
        // Sync.
        loadSync: function(that, file, cb, options) {
            var items, i;

            items = store(file);

            if ('undefined' === typeof items) {
                // Nothing to load.
                return;
            }
            if ('string' === typeof items) {
                items = JSUS.parse(items);
            }
            if (!JSUS.isArray(items)) {
                that.throwErr('Error', 'load', 'expects to load an array');
            }
            for (i = 0; i < items.length; i++) {
                // Retrocycle, if necessary and possible.
                items[i] = NDDB.retrocycle(items[i]);
            }
            that.importDB(items);
            if (cb) cb();
        },

        saveSync: function(that, file, cb, options) {
            store(file, that.stringify(!!options.compress));
            if (cb) cb();
        }

    };

    // Set default format.
    this.setDefaultFormat('store');
};
