/**
 * # NDDB: N-Dimensional Database
 * Copyright(c) 2013 Stefano Balietti
 * MIT Licensed
 *
 * NDDB is a powerful and versatile object database for node.js and the browser.
 *
 * See README.md for help.
 * ---
 */
(function (exports, J, store) {

    NDDB.compatibility = J.compatibility();

    // Expose constructors
    exports.NDDB = NDDB;

    /**
     * ### NDDB.decycle
     *
     * Removes cyclic references from an object
     *
     * @param {object} e The object to decycle
     * @return {object} e The decycled object
     *
     * @see https://github.com/douglascrockford/JSON-js/
     */
    NDDB.decycle = function(e) {
        if (JSON && JSON.decycle && 'function' === typeof JSON.decycle) {
            e = JSON.decycle(e);
        }
        return e;
    };

    /**
     * ### NDDB.retrocycle
     *
     * Restores cyclic references in an object previously decycled
     *
     * @param {object} e The object to retrocycle
     * @return {object} e The retrocycled object
     *
     * @see https://github.com/douglascrockford/JSON-js/
     */
    NDDB.retrocycle = function(e) {
        if (JSON && JSON.retrocycle && 'function' === typeof JSON.retrocycle) {
            e = JSON.retrocycle(e);
        }
        return e;
    };

    /**
     * ## NDDB constructor
     *
     * Creates a new instance of NDDB
     *
     * @param {object} options Optional. Configuration options
     * @param {db} db Optional. An initial set of items to import
     *
     */
    function NDDB(options, db) {
        var that;
        that = this;
        options = options || {};

        if (!J) throw new Error('JSUS not found.');

        // ## Public properties.

        // ### db
        // The default database.
        this.db = [];

        // ###tags
        // The tags list.
        this.tags = {};

        // ### hooks
        // The list of hooks and associated callbacks.
        this.hooks = {
            insert: [],
            remove: [],
            update: []
        };

        // ### nddb_pointer
        // Pointer for iterating along all the elements.
        this.nddb_pointer = 0;

        // ### length
        // The number of items in the database.
        if (NDDB.compatibility.getter) {
            this.__defineGetter__('length',
                                  function() { return this.db.length; });
        }
        else {
            this.length = null;
        }

        // ### query
        // QueryBuilder obj.
        this.query = new QueryBuilder();

        // ### filters
        // Available db filters
        this.addDefaultFilters();

        // ### __C
        // List of comparator functions.
        this.__C = {};

        // ### __H
        // List of hash functions.
        this.__H = {};

        // ### __I
        // List of index functions.
        this.__I = {};

        // ### __I
        // List of view functions.
        this.__V = {};

        // ### __update
        // Auto update options container.
        this.__update = {};

        // ### __update.pointer
        // If TRUE, nddb_pointer always points to the last insert.
        this.__update.pointer = false;

        // ### __update.indexes
        // If TRUE, rebuild indexes on every insert and remove.
        this.__update.indexes = false;

        // ### __update.sort
        // If TRUE, sort db on every insert and remove.
        this.__update.sort = false;

        // ### __shared
        // Objects inserted here will be shared (and not cloned)
        // among all breeded NDDB instances.
        this.__shared = {};

        // ### log
        // Std out. Can be overriden in options by another function.
        // The function will be executed with this instance of PlayerList
        // as context, so if it is a method of another class it might not
        // work. In case you will need to inherit or add properties
        // and methods from the other class into this PlayerList instance.
        this.log = console.log;

        // ### globalCompare
        // Dummy compare function used to sort elements in the database.
        // Override with a compare function returning:
        //
        //  - 0 if the objects are the same
        //  - a positive number if o2 precedes o1
        //  - a negative number if o1 precedes o2
        //
        this.globalCompare = function(o1, o2) {
            return -1;
        };

        // TODO see where placing
        var that;
        that = this;
        // TODO: maybe give users the option to overwrite it.
        // Adding the compareInAllFields function
       this.comparator('*', function(o1, o2, trigger1, trigger2) {
           var d, c, res;
           for (d in o1) {
               c = that.getComparator(d);
               o2[d] = o2['*'];
               res = c(o1, o2);
               if (res === trigger1) return res;
               if ('undefined' !== trigger2 && res === trigger2) return res;
               // No need to delete o2[d] afer comparison.
           }

           // We are not interested in sorting.
           // Figuring out the right return value
           if (trigger1 === 0) {
               return trigger2 === 1 ? -1 : 1;
           }
           if (trigger1 === 1) {
               return trigger2 === 0 ? -1 : 0;
           }

           return trigger2 === 0 ? 1 : 0;

       });

        // Mixing in user options and defaults.
        this.init(options);

        // Importing items, if any.
        if (db) {
            this.importDB(db);
        }
    };


      /**
     * ### NDDB.addFilter
     *
     * Registers a _select_ function under an alphanumeric id
     *
     * When calling `NDDB.select('d','OP','value')` the second parameter (_OP_)
     * will be matched with the callback function specified here.
     *
     * Callback function must accept three input parameters:
     *
     *  - d: dimension of comparison
     *  - value: second-term of comparison
     *  - comparator: the comparator function as defined by `NDDB.c`
     *
     * and return a function that execute the desired operation.
     *
     * Registering a new operator under an already existing id will
     * overwrite the old operator.
     *
     * @param {string} op An alphanumeric id
     * @param {function} cb The callback function
     *
     * @see QueryBuilder.registerDefaultOperators
     */
    NDDB.prototype.addFilter = function(op, cb) {
        this.filters[op] = cb;
    };

    /**
     * ### QueryBuilder.registerDefaultOperators
     *
     * Register default operators for NDDB
     *
     */
    NDDB.prototype.addDefaultFilters = function() {
        if (!this.filters) this.filters = {};
        var that;
        that = this;

        // Exists
        this.filters['E'] = function(d, value, comparator) {
            if ('object' === typeof d) {
                return function(elem) {
                    var d, c;
                    for (d in elem) {
                        c = that.getComparator(d);
                        value[d] = value[0]['*']
                        if (c(elem, value, 1) > 0) {
                            value[d] = value[1]['*']
                            if (c(elem, value, -1) < 0) {
                                return elem;
                            }
                        }
                    }
                    if ('undefined' !== typeof elem[d]) {
                        return elem;
                    }
                    else if ('undefined' !== typeof J.getNestedValue(d,elem)) {
                        return elem;
                    }
                }
            }
            else {
                return function(elem) {
                    if ('undefined' !== typeof elem[d]) {
                        return elem;
                    }
                    else if ('undefined' !== typeof J.getNestedValue(d,elem)) {
                        return elem;
                    }
                }
            }
        };

        // (strict) Equals
        this.filters['=='] = function(d, value, comparator) {
            return function(elem) {

                if (comparator(elem, value, 0) === 0) return elem;
            };
        };


        // Smaller than
        this.filters['>'] = function(d, value, comparator) {
            if ('object' === typeof d || d === '*') {
                return function(elem) {
                    if (comparator(elem, value, 1) === 1) return elem;
                };
            }
            else {
                return function(elem) {
                    if ('undefined' === typeof elem[d]) return;
                    if (comparator(elem, value, 1) === 1) return elem;
                };
            }
        };

        // Greater than
        this.filters['>='] = function(d, value, comparator) {
            if ('object' === typeof d || d === '*') {
                return function(elem) {
                    var compared = comparator(elem, value, 0, 1);
                    if (compared === 1 || compared === 0) return elem;
                };
            }
            else {
                return function(elem) {
                    if ('undefined' === typeof elem[d]) return;
                    var compared = comparator(elem, value, 0, 1);
                    if (compared === 1 || compared === 0) return elem;
                };
            }
        };

        // Smaller than
        this.filters['<'] = function(d, value, comparator) {
            if ('object' === typeof d || d === '*') {
                return function(elem) {
                    if (comparator(elem, value, -1) === -1) return elem;
                };
            }
            else {
                return function(elem) {
                    if ('undefined' === typeof elem[d]) return;
                    if (comparator(elem, value, -1) === -1) return elem;
                };
            }
        };

        //  Smaller or equal than
        this.filters['<='] = function(d, value, comparator) {
            if ('object' === typeof d || d === '*') {
                return function(elem) {
                    var compared = comparator(elem, value, 0, -1);
                    if (compared === -1 || compared === 0) return elem;
                };
            }
            else {
                return function(elem) {
                    if ('undefined' === typeof elem[d]) return;
                    var compared = comparator(elem, value, 0, -1);
                    if (compared === -1 || compared === 0) return elem;
                };
            }
        };

        // Between
        this.filters['><'] = function(d, value, comparator) {
            if ('object' === typeof d) {
                return function(elem) {
                    var i, len;
                    len = d.length;
                    for (i = 0; i < len ; i++) {
                        if (comparator(elem, value[0], 1) > 0 &&
                            comparator(elem, value[1], -1) < 0) {
                            return elem;
                        }
                    }
                };
            }
            else if (d === '*') {
                return function(elem) {
                    var d, c;
                    for (d in elem) {
                        c = that.getComparator(d);
                        value[d] = value[0]['*']
                        if (c(elem, value, 1) > 0) {
                            value[d] = value[1]['*']
                            if (c(elem, value, -1) < 0) {
                                return elem;
                            }
                        }
                    }
                };
            }
            else {
                return function(elem) {
                    if (comparator(elem, value[0], 1) > 0 &&
                        comparator(elem, value[1], -1) < 0) {
                        return elem;
                    }
                };
            }
        };

        // Not Between
        this.filters['<>'] = function(d, value, comparator) {
            if ('object' === typeof d || d === '*') {
                return function(elem) {
                    if (comparator(elem, value[0], -1) < 0 ||
                        comparator(elem, value[1], 1) > 0) {
                        return elem;
                    }
                };
            }
            else {
                return function(elem) {
                    if ('undefined' === typeof elem[d]) return;
                    if (comparator(elem, value[0], -1) < 0 ||
                        comparator(elem, value[1], 1) > 0) {
                        return elem;
                    }
                };
            }
        };

        // In Array
        this.filters['in'] = function(d, value, comparator) {
            if ('object' === typeof d) {
                return function(elem) {
                    var i, len;
                    len = value.length;
                    for (i = 0; i < len; i++) {
                        if (comparator(elem, value[i], 0) === 0) {
                            return elem;
                        }
                    }
                };
            }
            else {
                return function(elem) {
                    var i, obj, len;
                    obj = {}, len = value.length;
                    for (i = 0; i < len; i++) {
                        obj[d] = value[i];
                        if (comparator(elem, obj, 0) === 0) {
                            return elem;
                        }
                    }
                };
            }
        };

        // Not In Array
        this.filters['!in'] = function(d, value, comparator) {
            if ('object' === typeof d) {
                return function(elem) {
                    var i, len;
                    len = value.length;
                    for (i = 0; i < len; i++) {
                        if (comparator(elem, value[i], 0) === 0) {
                            return;
                        }
                    }
                    return elem;
                };
            }
            else {
                return function(elem) {
                    var i, obj, len;
                    obj = {}, len = value.length;
                    for (i = 0; i < len; i++) {
                        obj[d] = value[i];
                        if (comparator(elem, obj, 0) === 0) {
                            return
                        }
                    }
                    return elem;
                }
            }
        };
    };


    // ## METHODS

    /**
     * ### NDDB.init
     *
     * Sets global options based on local configuration
     *
     * @param {object} options Optional. Configuration options
     *
     * TODO: type checking on input params
     */
    NDDB.prototype.init = function(options) {
        var filter, sh, i;
        options = options || {};

        this.__options = options;

        if (options.tags) {
            this.tags = options.tags;
        }

        if (options.nddb_pointer > 0) {
            this.nddb_pointer = options.nddb_pointer;
        }

        if (options.hooks) {
            this.hooks = options.hooks;
        }

        if (options.globalCompare) {
            this.globalCompare = options.globalCompare;
        }

        if (options.update) {
            if ('undefined' !== typeof options.update.pointer) {
                this.__update.pointer = options.update.pointer;
            }

            if ('undefined' !== typeof options.update.indexes) {
                this.__update.indexes = options.update.indexes;
            }

            if ('undefined' !== typeof options.update.sort) {
                this.__update.sort = options.update.sort;
            }
        }

        if ('object' === typeof options.filters) {
            for (filter in options.filters) {
                this.addFilter(filter, options.filters[filter]);
            }
        }

        if ('object' === typeof options.shared) {
            for (sh in options.shared) {
                if (options.shared.hasOwnProperty(sh)) {
                    this.__shared[sh] = options.shared[sh];
                }
            }
        }

        if (options.log) {
            this.initLog(options.log, options.logCtx);
        }

        if (options.C) {
            this.__C = options.C;
        }

        if (options.H) {
            for (i in options.H) {
                if (options.H.hasOwnProperty(i)) {
                    this.hash(i, options.H[i]);
                }
            }
        }

        if (options.I) {
            this.__I = options.I;
            for (i in options.I) {
                if (options.I.hasOwnProperty(i)) {
                    this.index(i, options.I[i]);
                }
            }
        }
        // Views must be created at the end because they are cloning
        // all the previous settings (the method would also pollute
        // this.__options if called before all options in init are set).
        if (options.V) {
            this.__V = options.V;
            for (i in options.V) {
                if (options.V.hasOwnProperty(i)) {
                    this.view(i, options.V[i]);
                }
            }
        }
    };

    /**
     * ### NDDB.initLog
     *
     * Setups and external log function to be executed in the proper context
     *
     * @param {function} cb The logging function
     * @param {object} ctx Optional. The context of the log function
     *
     */
    NDDB.prototype.initLog = function(cb, ctx) {
        ctx = ctx || this;
        this.log = function(){
            return cb.apply(ctx, arguments);
        };
    }

    /**
     * ## NDDB._getCons
     *
     * Returns 'NDDB' or the name of the inheriting class.
     *
     */
    NDDB.prototype._getConstrName = function() {
        return this.constructor && this.constructor.name ?
            this.constructor.name : 'NDDB';
    };

    // ## CORE

    /**
     * ### NDDB._autoUpdate
     *
     * Performs a series of automatic checkings
     * and updates the db according to current
     * configuration
     *
     * @api private
     * @param {object} options Optional. Configuration object
     */
    NDDB.prototype._autoUpdate = function(options) {
        var update = options ? J.merge(this.__update, options) : this.__update;

        if (update.pointer) {
            this.nddb_pointer = this.db.length-1;
        }
        if (update.sort) {
            this.sort();
        }

        if (update.indexes) {
            this.rebuildIndexes();
        }
    };


    function nddb_insert(o, update) {
        if (o === null) return;
        var type = typeof(o);
        if (type === 'undefined') return;
        if (type === 'string') return;
        if (type === 'number') return;
        this.db.push(o);
        this.emit('insert', o);
        if (update) {
            this._indexIt(o, (this.db.length-1));
            this._hashIt(o);
            this._viewIt(o);
        }
    }

    // TODO: To test
    //    function nddb_insert(o, update) {
    //        if (o === null) {
    //            throw new TypeError(this._getConstrName() +
    //                     '.insert: null received.');
    //        }
    //        if (('object' !== typeof o) && ('function' !== typeof o)) {
    //            throw new TypeError(this._getConstrName() +
    //                                '.insert: expects object or function, ' +
    //                                typeof o + ' received.');
    //        }
    //        this.db.push(o);
    //        if (update) {
    //            this._indexIt(o, (this.db.length-1));
    //            this._hashIt(o);
    //            this._viewIt(o);
    //        }
    //        this.emit('insert', o);
    //    }

    /**
     * ### NDDB.importDB
     *
     * Imports an array of items at once
     *
     * @param {array} db Array of items to import
     */
    NDDB.prototype.importDB = function(db) {
        var i;
        if (!J.isArray(db)) {
            throw new TypeError(this._getConstrName() +
                                '.importDB expects an array.');
        }
        for (i = 0; i < db.length; i++) {
            nddb_insert.call(this, db[i], this.__update.indexes);
        }
        this._autoUpdate({indexes: false});
    };

    /**
     * ### NDDB.insert
     *
     * Insert an item into the database
     *
     * Item must be of type object or function.
     *
     * The following entries will be ignored:
     *
     *  - strings
     *  - numbers
     *  - undefined
     *  - null
     *
     * @param {object} o The item or array of items to insert
     * @see NDDB._insert
     */
    NDDB.prototype.insert = function(o) {
        nddb_insert.call(this, o, this.__update.indexes);
        this._autoUpdate({indexes: false});
    };

    /**
     * ### NDDB.size
     *
     * Returns the number of elements in the database
     *
     * @see NDDB.length
     */
    NDDB.prototype.size = function() {
        return this.db.length;
    };


    /**
     * ### NDDB.breed
     *
     * Creates a clone of the current NDDB object
     *
     * Takes care of calling the actual constructor
     * of the class, so that inheriting objects will
     * preserve their prototype.
     *
     * @param {array} db Array of items to import in the new database
     * @return {NDDB} The new database
     */
    NDDB.prototype.breed = function(db) {
        //In case the class was inherited
        return new this.constructor(this.cloneSettings(), db || this.db);
    };

    /**
     * ### NDDB.cloneSettings
     *
     * Creates a clone of the configuration of this instance
     *
     * Clones:
     *  - the hashing, indexing, comparator, and view functions
     *  - the current tags
     *  - the update settings
     *  - the callback hooks
     *  - the globalCompare callback
     *
     * Copies by reference:
     *  - the shared objects
     *
     * It is possible to specifies the name of the properties to leave out
     * out of the cloned object as a parameter. By default, all options
     * are cloned.
     *
     * @param {object} leaveOut Optional. An object containing the name of
     *   the properties to leave out of the clone as keys.
     * @return {object} options A copy of the current settings
     *   plus the shared objects
     */
    NDDB.prototype.cloneSettings = function(leaveOut) {
        var options, keepShared;
        options = this.__options || {};
        keepShared = true;

        options.H = this.__H;
        options.I = this.__I;
        options.C = this.__C;
        options.V = this.__V;
        options.tags = this.tags;
        options.update = this.__update;
        options.hooks = this.hooks;
        options.globalCompare = this.globalCompare;

        options = J.clone(options);

        for (i in leaveOut) {
            if (leaveOut.hasOwnProperty(i)) {
                if (i === 'shared') {
                    // 'shared' is not in `options`, we just have
                    // to remember not to add it later.
                    keepShared = false;
                    continue;
                }
                delete options[i];
            }
        }

        if (keepShared) options.shared = this.__shared;
        return options;
    };

    /**
     * ### NDDB.toString
     *
     * Returns a human-readable representation of the database
     *
     * @return {string} out A human-readable representation of the database
     */
    NDDB.prototype.toString = function() {
        var out, i;
        out = '';
        for (i = 0; i < this.db.length; i++) {
            out += this.db[i] + "\n";
        }
        return out;
    };

    /**
     * ### NDDB.stringify
     *
     * Returns a machine-readable representation of the database
     *
     * Cyclic objects are decycled.
     *
     * @param {boolean} TRUE, if compressed
     * @return {string} out A machine-readable representation of the database
     *
     * @see JSUS.stringify
     */
    NDDB.prototype.stringify = function(compressed) {
        if (!this.length) return '[]';
        compressed = ('undefined' === typeof compressed) ? true : compressed;

        var spaces = compressed ? 0 : 4;

        var out = '[';
        this.each(function(e) {
            // decycle, if possible
            e = NDDB.decycle(e);
            out += J.stringify(e) + ', ';
        });
        out = out.replace(/, $/,']');

        return out;
    };


    /**
     * ### NDDB.comparator
     *
     * Registers a comparator function for dimension d
     *
     * Each time a comparison between two objects containing
     * property named as the specified dimension, the registered
     * comparator function will be used.
     *
     * @param {string} d The name of the dimension
     * @param {function} comparator The comparator function
     * @return {boolean} TRUE, if registration was successful
     *
     */
    NDDB.prototype.comparator = function(d, comparator) {
        if ('undefined' === typeof d) {
            throw new TypeError(this._getConstrName() +
                                '.comparator: undefined dimension.');
        }
        if ('function' !== typeof comparator) {
            throw new TypeError(this._getConstrName() +
                                '.comparator: comparator must be function.');
        }
        this.__C[d] = comparator;
        return true;
    };

    // ### NDDB.c
    // @deprecated
    NDDB.prototype.c = NDDB.prototype.comparator;

    /**
     * ### NDDB.getComparator
     *
     * Retrieves the comparator function for dimension d.
     *
     * If no comparator function is found, returns a general comparator
     * function. Supports nested attributes search, but if a property
     * containing dots with the same name is found, this will
     * returned first.
     *
     * The dimension can be the wildcard '*' or an array of dimesions.
     * In the latter case a custom comparator function is built on the fly.
     *
     * @param {string|array} d The name/s of the dimension/s
     * @return {function} The comparator function
     *
     * @see NDDB.compare
     */
    NDDB.prototype.getComparator = function(d) {
        var len, comparator, comparators;

        // Given field or '*'.
        if ('string' === typeof d) {
            if ('undefined' !== typeof this.__C[d]) {
                comparator = this.__C[d];
            }
            else {
                comparator = function generalComparator(o1, o2) {
                    var v1, v2;
                    if ('undefined' === typeof o1 &&
                        'undefined' === typeof o2) return 0;
                    if ('undefined' === typeof o1) return 1;
                    if ('undefined' === typeof o2) return -1;

                    if ('undefined' !== typeof o1[d]) {
                        v1 = o1[d];
                    }
                    else if (d.lastIndexOf('.') !== -1) {
                        v1 = J.getNestedValue(d, o1);
                    }

                    if ('undefined' !== typeof o2[d]) {
                        v2 = o2[d];
                    }
                    else if (d.lastIndexOf('.') !== -1) {
                        v2 = J.getNestedValue(d, o2);
                    }

                    if ('undefined' === typeof v1 &&
                        'undefined' === typeof v2) return 0;
                    if ('undefined' === typeof v1) return 1;
                    if ('undefined' === typeof v2) return -1;
                    if (v1 > v2) return 1;
                    if (v2 > v1) return -1;


                    return 0;
                };
            }
        }
        // Pre-defined array o fields to check.
        else {
            // Creates the array of comparators functions.
            comparators = {};
            len = d.length;
            for (i = 0; i < len; i++) {
                // Every comparator has its own d in scope.
                // TODO: here there should be no wildcard '*' (check earlier)
                comparators[d[i]] = this.getComparator(d[i]);
            }

            comparator = function(o1, o2, trigger1, trigger2) {
                var i, res, obj;
                for (i in comparators) {
                    if (comparators.hasOwnProperty(i)) {
                        if ('undefined' === typeof o1[i]) continue;
                        obj = {};
                        obj[i] = o2;
                        res = comparators[i](o1, obj);
                        if (res === trigger1) return res;
                        if ('undefined' !== trigger2 && res === trigger2) return res;
                    }
                }
                // We are not interested in sorting.
                // Figuring out the right return value
                if (trigger1 === 0) {
                    return trigger2 === 1 ? -1 : 1;
                }
                if (trigger1 === 1) {
                    return trigger2 === 0 ? -1 : 0;
                }

                return trigger2 === 0 ? 1 : 0;

            }
        }

        //  console.log(comparator);

        return comparator;
    };

    /**
     * ### NDDB.isReservedWord
     *
     * Returns TRUE if a property or a method with the same name
     * already exists in the current instance od NDDB
     *
     * @param {string} key The name of the property
     * @return {boolean} TRUE, if the property exists
     */
    NDDB.prototype.isReservedWord = function(key) {
        return (this[key]) ? true : false;
    };

    /**
     * ### NDDB.index
     *
     * Registers a new indexing function
     *
     * Indexing functions give fast direct access to the
     * entries of the dataset.
     *
     * A new object `NDDB[idx]` is created, whose properties
     * are the elements indexed by the function.
     *
     * An indexing function must return a _string_ with a unique name of
     * the property under which the entry will registered, or _undefined_ if
     * the entry does not need to be indexed.
     *
     * @param {string} idx The name of index
     * @param {function} func The hashing function
     * @return {boolean} TRUE, if registration was successful
     *
     * @see NDDB.isReservedWord
     * @see NDDB.rebuildIndexes
     *
     */
    NDDB.prototype.index = function(idx, func) {
        if (('string' !== typeof idx) && ('number' !== typeof idx)) {
            throw new TypeError(this._getConstrName() + '.index: ' +
                                'idx must be string or number.');
        }
        if (this.isReservedWord(idx)) {
            throw new Error(this._getConstrName() + '.index: ' +
                            'idx is reserved word (' + idx + ')');
        }
        if ('function' !== typeof func) {
            throw new TypeError(this._getConstrName() + '.view: ' +
                                'func must be function.');
        }
        this.__I[idx] = func, this[idx] = new NDDBIndex(idx, this);
        return true;
    };


    // ### NDDB.i
    // @deprecated
    NDDB.prototype.i = NDDB.prototype.index;

    /**
     * ### NDDB.view
     *
     * Registers a new view function
     *
     * View functions create a _view_ on the database that
     * excludes automatically some of the entries.
     *
     * A nested NDDB dataset is created as `NDDB[idx]`, containing
     * all the items that the callback function returns. If the
     * callback returns _undefined_ the entry will be ignored.
     *
     * @param {string} idx The name of index
     * @param {function} func The hashing function
     * @return {boolean} TRUE, if registration was successful
     *
     * @see NDDB.hash
     * @see NDDB.isReservedWord
     * @see NDDB.rebuildIndexes
     */
    NDDB.prototype.view = function(idx, func) {
        var settings;
        if (('string' !== typeof idx) && ('number' !== typeof idx)) {
            throw new TypeError(this._getConstrName() + '.view: ' +
                                'idx must be string or number.');
        }
        if (this.isReservedWord(idx)) {
            throw new Error(this._getConstrName() + '.view: ' +
                            'idx is reserved word (' + idx + ')');
        }
        if ('function' !== typeof func) {
            throw new TypeError(this._getConstrName() + '.view: ' +
                                'func must be function.');
        }

        // Create a copy of the current settings, without the views
        // functions, else we create an infinite loop in the constructor.
        settings = this.cloneSettings({V: ''});
        this.__V[idx] = func, this[idx] = new NDDB(settings);
        return true;
    };

    /**
     * ### NDDB.hash
     *
     * Registers a new hashing function
     *
     * Hash functions create an index containing multiple sub-_views_.
     *
     * A new object `NDDB[idx]` is created, whose properties
     * are _views_ on the original dataset.
     *
     * An hashing function must return a _string_ representing the
     * view under which the entry will be added, or _undefined_ if
     * the entry does not belong to any view of the index.
     *
     * @param {string} idx The name of index
     * @param {function} func The hashing function
     * @return {boolean} TRUE, if registration was successful
     *
     * @see NDDB.view
     * @see NDDB.isReservedWord
     * @see NDDB.rebuildIndexes
     *
     */
    NDDB.prototype.hash = function(idx, func) {
        if (('string' !== typeof idx) && ('number' !== typeof idx)) {
            throw new TypeError(this._getConstrName() + '.hash: ' +
                                'idx must be string or number.');
        }
        if (this.isReservedWord(idx)) {
            throw new Error(this._getConstrName() + '.hash: ' +
                            'idx is reserved word (' + idx + ')');
        }
        if ('function' !== typeof func) {
            throw new TypeError(this._getConstrName() + '.hash: ' +
                                'func must be function.');
        }
        this.__H[idx] = func, this[idx] = {};
        return true;
    };

    //### NDDB.h
    //@deprecated
    NDDB.prototype.h = NDDB.prototype.hash;


    /**
     * ### NDDB.resetIndexes
     *
     * Resets all the database indexes, hashs, and views
     *
     * @see NDDB.rebuildIndexes
     * @see NDDB.index
     * @see NDDB.view
     * @see NDDB.hash
     * @see NDDB._indexIt
     * @see NDDB._viewIt
     * @see NDDB._hashIt
     */
    NDDB.prototype.resetIndexes = function(options) {
        var key, reset;
        reset = options || J.merge({
            h: true,
            v: true,
            i: true
        }, options);

        if (reset.h) {
            for (key in this.__H) {
                if (this.__H.hasOwnProperty(key)) {
                    this[key] = {};
                }
            }
        }
        if (reset.v) {
            for (key in this.__V) {
                if (this.__V.hasOwnProperty(key)) {
                    this[key] = new this.constructor();
                }
            }
        }
        if (reset.i) {
            for (key in this.__I) {
                if (this.__I.hasOwnProperty(key)) {
                    this[key] = new NDDBIndex(key, this);
                }
            }
        }

    };

    /**
     * ### NDDB.rebuildIndexes
     *
     * Rebuilds all the database indexes, hashs, and views
     *
     * @see NDDB.resetIndexes
     * @see NDDB.index
     * @see NDDB.view
     * @see NDDB.hash
     * @see NDDB._indexIt
     * @see NDDB._viewIt
     * @see NDDB._hashIt
     */
    NDDB.prototype.rebuildIndexes = function() {
        var h = !(J.isEmpty(this.__H)),
        i = !(J.isEmpty(this.__I)),
        v = !(J.isEmpty(this.__V));

        var cb, idx;
        if (!h && !i && !v) return;

        // Reset current indexes
        this.resetIndexes({h: h, v: v, i: i});

        if (h && !i && !v) {
            cb = this._hashIt;
        }
        else if (!h && i && !v) {
            cb = this._indexIt;
        }
        else if (!h && !i && v) {
            cb = this._viewIt;
        }
        else if (h && i && !v) {
            cb = function(o, idx) {
                this._hashIt(o);
                this._indexIt(o, idx);
            };
        }
        else if (!h && i && v) {
            cb = function(o, idx) {
                this._indexIt(o, idx);
                this._viewIt(o);
            };
        }
        else if (h && !i && v) {
            cb = function(o, idx) {
                this._hashIt(o);
                this._viewIt(o);
            };
        }
        else {
            cb = function(o, idx) {
                this._indexIt(o, idx);
                this._hashIt(o);
                this._viewIt(o);
            };
        }

        for (idx = 0 ; idx < this.db.length ; idx++) {
            // _hashIt and viewIt do not need idx, it is no harm anyway
            cb.call(this, this.db[idx], idx);
        }
    };

    /**
     * ### NDDB._indexIt
     *
     * Indexes an element
     *
     * @param {object} o The element to index
     * @param {object} o The position of the element in the database array
     */
    NDDB.prototype._indexIt = function(o, dbidx) {
        var func, id, index, key;
        if (!o || J.isEmpty(this.__I)) return;

        for (key in this.__I) {
            if (this.__I.hasOwnProperty(key)) {
                func = this.__I[key];
                index = func(o);

                if ('undefined' === typeof index) continue;

                if (!this[key]) this[key] = new NDDBIndex(key, this);
                this[key]._add(index, dbidx);
            }
        }
    };

    /**
     * ### NDDB._viewIt
     *
     * Adds an element to a view
     *
     * @param {object} o The element to index
     */
    NDDB.prototype._viewIt = function(o) {
        var func, id, index, key, settings;
        if (!o || J.isEmpty(this.__V)) return false;

        for (key in this.__V) {
            if (this.__V.hasOwnProperty(key)) {
                func = this.__V[key];
                index = func(o);
                if ('undefined' === typeof index) continue;
                //this.__V[idx] = func, this[idx] = new this.constructor();
                if (!this[key]) {
                    // Create a copy of the current settings,
                    // without the views functions, otherwise
                    // we establish an infinite loop in the
                    // constructor.
                    settings = this.cloneSettings({V: ''});
                    this[key] = new NDDB(settings);
                }
                this[key].insert(o);
            }
        }
    };

    /**
     * ### NDDB._hashIt
     *
     * Hashes an element
     *
     * @param {object} o The element to hash
     * @return {boolean} TRUE, if insertion to an index was successful
     */
    NDDB.prototype._hashIt = function(o) {
        var h, id, hash, key, settings;
        if (!o || J.isEmpty(this.__H)) return false;

        for (key in this.__H) {
            if (this.__H.hasOwnProperty(key)) {
                h = this.__H[key];
                hash = h(o);

                if ('undefined' === typeof hash) continue;
                if (!this[key]) this[key] = {};

                if (!this[key][hash]) {
                    // Create a copy of the current settings,
                    // without the hashing functions, otherwise
                    // we crate an infinite loop at first insert.
                    settings = this.cloneSettings({H: ''});
                    this[key][hash] = new NDDB(settings);
                }
                this[key][hash].insert(o);
            }
        }
    };

    // ## Event emitter / listener

    /**
     * ### NDDB.on
     *
     * Registers an event listeners
     *
     * Available events:
     *
     *  `insert`: each time an item is inserted
     *  `remove`: each time a collection of items is removed
     *
     * Examples.
     *
     * ```javascript
     * var db = new NDDB();
     *
     * var trashBin = new NDDB();
     *
     * db.on('insert', function(item){
     *          item.id = getMyNextId();
     * });
     *
     * db.on('remove', function(array) {
     *          trashBin.importDB(array);
     * });
     * ```
     *
     */
    NDDB.prototype.on = function(event, func) {
        if (!event || !func || !this.hooks[event]) return;
        this.hooks[event].push(func);
        return true;
    };

    /**
     * ### NDDB.off
     *
     * Deregister an event, or an event listener
     *
     * @param {string} event The event name
     * @param {function} func Optional. The specific function to deregister
     *
     * @return Boolean TRUE, if the removal is successful
     */
    NDDB.prototype.off = function(event, func) {
        var i;
        if (!event || !this.hooks[event] || !this.hooks[event].length) return;

        if (!func) {
            this.hooks[event] = [];
            return true;
        }
        for (i = 0; i < this.hooks[event].length; i++) {
            if (this.hooks[event][i] == func) {
                this.hooks[event].splice(i, 1);
                return true;
            }
        }
        return false;
    }

    /**
     * ### NDDB.emit
     *
     * Fires all the listeners associated with an event
     *
     * @param event {string} The event name
     * @param {object} o Optional. A parameter to be passed to the listener
     */
    NDDB.prototype.emit = function(event, o) {
        var i;
        if (!event || !this.hooks[event] || !this.hooks[event].length) {
            return;
        }

        for (i = 0; i < this.hooks[event].length; i++) {
            this.hooks[event][i].call(this, o);
        }
    };

    // ## Sort and Select

    function queryError(d, op, value) {
        var miss, err;
        miss = '(?)';
        err = 'Malformed query: ' + d || miss + ' ' + op || miss +
            ' ' + value || miss;
        this.log(err, 'WARN');
        return false;
    }

    /**
     * ### NDDB._analyzeQuery
     *
     * Validates and prepares select queries before execution
     *
     * @api private
     * @param {string} d The dimension of comparison
     * @param {string} op The operation to perform
     * @param {string} value The right-hand element of comparison
     * @return {boolean|object} The object-query or FALSE,
     *   if an error was detected
     */
    NDDB.prototype._analyzeQuery = function(d, op, value) {
        var that, i, len, newValue;
        that = this;

        if ('undefined' === typeof d) {
            return queryError.call(this, d, op,value);
        }

        // Verify input
        if ('undefined' !== typeof op) {

            if (op === '=') {
                op = '==';
            }

//            if (!(op in this.query.operators)) {
            if (!(op in this.filters)) {
                this.log('Query error. Invalid operator detected: ' + op,
                         'WARN');
                return false;
            }

            // Range-queries need an array as third parameter instance of Array
            if (J.in_array(op,['><', '<>', 'in', '!in'])) {

                if (!(value instanceof Array)) {
                    this.log('Range-queries need an array as third parameter',
                             'WARN');
                    queryError.call(this, d,op,value);
                }
                if (op === '<>' || op === '><') {

                    // It will be nested by the comparator function.
                    if (!J.isArray(d)){
                        // TODO: when to nest and when keep the '.' in the name?
                        value[0] = J.setNestedValue(d, value[0]);
                        value[1] = J.setNestedValue(d, value[1]);
                    }
                }
            }

            else if (J.in_array(op, ['>', '==', '>=', '<', '<='])){
                // Comparison queries need a third parameter
                if ('undefined' === typeof value) {
                    queryError.call(this, d, op, value);
                }
                // TODO: when to nest and when keep the '.' in the name?
                // Comparison queries need to have the same
                // data structure in the compared object
                if (J.isArray(d)) {
                    len = d.length;
                    for (i = 0; i < len; i++) {
                        J.setNestedValue(d[i],value);
                    }

                }
                else {
                    value = J.setNestedValue(d,value);
                }
            }

            // other (e.g. user-defined) operators do not have constraints,
            // e.g. no need to transform the value

        }
        else if ('undefined' !== typeof value) {
            queryError.call(this, d, op, value);
        }
        else {
            op = 'E'; // exists
            value = '';
        }

        return {d:d,op:op,value:value};
    };

    /**
     * ### NDDB.distinct
     *
     * Eliminates duplicated entries
     *
     * A new database is returned and the original stays unchanged
     *
     * @return {NDDB} A copy of the current selection without duplicated entries
     *
     * @see NDDB.select()
     *  @see NDDB.fetch()
     *  @see NDDB.fetchValues()
     */
    NDDB.prototype.distinct = function() {
        return this.breed(J.distinct(this.db));
    };

    /**
     * ### NDDB.select
     *
     * Initiates a new query selection procedure
     *
     * Input parameters:
     *
     * - d: string representation of the dimension used to filter. Mandatory.
     * - op: operator for selection. Allowed: >, <, >=, <=, = (same as ==),
     *   ==, ===, !=, !==, in (in array), !in, >< (not in interval),
     *   <> (in interval)
     * - value: values of comparison. The following operators require
     *   an array: in, !in, ><, <>.
     *
     * Important!! No actual selection is performed until
     * the `execute` method is called, so that further selections
     * can be chained with the `or`, and `and` methods.
     *
     * To retrieve the items use one of the fetching methods.
     *
     * @param {string} d The dimension of comparison
     * @param {string} op Optional. The operation to perform
     * @param {mixed} value Optional. The right-hand element of comparison
     * @return {NDDB} A new NDDB instance with the currently
     *   selected items in memory
     *
     * @see NDDB.and
     * @see NDDB.or
     * @see NDDB.execute()
     * @see NDDB.fetch()
     *
     */
    NDDB.prototype.select = function(d, op, value) {
        this.query.reset();
        return arguments.length ? this.and(d, op, value) : this;
    };

    /**
     * ### NDDB.and
     *
     * Chains an AND query to the current selection
     *
     * @param {string} d The dimension of comparison
     * @param {string} op Optional. The operation to perform
     * @param {mixed} value Optional. The right-hand element of comparison
     * @return {NDDB} A new NDDB instance with the currently
     *   selected items in memory
     *
     * @see NDDB.select
     * @see NDDB.or
     * @see NDDB.execute()
     */
    NDDB.prototype.and = function(d, op, value) {
        // TODO: Support for nested query
        //      if (!arguments.length) {
        //              addBreakInQuery();
        //      }
        //      else {
        var q, cb;
        q = this._analyzeQuery(d, op, value);
        if (!q) return false;
        cb = this.filters[q.op](q.d, q.value, this.getComparator(q.d));
        this.query.addCondition('AND', cb);
        //      }
        return this;
    };

    /**
     * ### NDDB.or
     *
     * Chains an OR query to the current selection
     *
     * @param {string} d The dimension of comparison
     * @param {string} op Optional. The operation to perform
     * @param {mixed} value Optional. The right-hand element of comparison
     * @return {NDDB} A new NDDB instance with the currently
     *   selected items in memory
     *
     * @see NDDB.select
     * @see NDDB.and
     * @see NDDB.execute()
     */
    NDDB.prototype.or = function(d, op, value) {
        // TODO: Support for nested query
        //      if (!arguments.length) {
        //              addBreakInQuery();
        //      }
        //      else {
        var q, cb;
        q = this._analyzeQuery(d, op, value);
        if (!q) return false;
        cb = this.filters[q.op](q.d, q.value, this.getComparator(q.d));
        this.query.addCondition('OR', cb);
        //this.query.addCondition('OR', condition, this.getComparator(d));
        //      }
        return this;
    };


    /**
     * ### NDDB.selexec
     *
     * Shorthand for select and execute methods
     *
     * Adds a single select condition and executes it.
     *
     * @param {string} d The dimension of comparison
     * @param {string} op Optional. The operation to perform
     * @param {mixed} value Optional. The right-hand element of comparison
     * @return {NDDB} A new NDDB instance with the currently
     *   selected items in memory
     *
     * @see NDDB.select
     * @see NDDB.and
     * @see NDDB.or
     * @see NDDB.execute
     * @see NDDB.fetch
     *
     */
    NDDB.prototype.selexec = function(d, op, value) {
        return this.select(d, op, value).execute();
    };

    /**
     * ### NDDB.execute
     *
     * Executes a search with the criteria specified by `select` statements
     *
     * Does not reset the query object, and it is possible to reuse the current
     * selection multiple times
     *
     * @param {string} d The dimension of comparison
     * @param {string} op Optional. The operation to perform
     * @param {mixed} value Optional. The right-hand element of comparison
     * @return {NDDB} A new NDDB instance with selected items in the db
     *
     * @see NDDB.select
     * @see NDDB.selexec
     * @see NDDB.and
     * @see NDDB.or
     */
    NDDB.prototype.execute = function() {
        return this.filter(this.query.get.call(this.query));
    };

    /**
     * ### NDDB.exists
     *
     * Returns TRUE if a copy of the object exists in
     * the database
     *
     * @param {object} o The object to look for
     * @return {boolean} TRUE, if a copy is found
     *
     * @see JSUS.equals
     */
    NDDB.prototype.exists = function(o) {
        if (!o) return false;

        for (var i = 0 ; i < this.db.length ; i++) {
            if (J.equals(this.db[i], o)) {
                return true;
            }
        }

        return false;
    };

    /**
     * ### NDDB.limit
     *
     * Creates a copy of the current database containing only
     * the first N entries
     *
     * If limit is a negative number, selection is made starting
     * from the end of the database.
     *
     * @param {number} limit The number of entries to include
     * @return {NDDB} A "limited" copy of the current instance of NDDB
     *
     * @see NDDB.first
     * @see NDDB.last
     */
    NDDB.prototype.limit = function(limit) {
        limit = limit || 0;
        if (limit === 0) return this.breed();
        var db = (limit > 0) ? this.db.slice(0, limit) :
            this.db.slice(limit);

        return this.breed(db);
    };

    /**
     * ### NDDB.reverse
     *
     * Reverses the order of all the entries in the database
     *
     * @see NDDB.sort
     */
    NDDB.prototype.reverse = function() {
        this.db.reverse();
        return this;
    };

    /**
     * ### NDDB.sort
     *
     * Sort the db according to one of the following
     * criteria:
     *
     *  - globalCompare function, if no parameter is passed
     *  - one of the dimension, if a string is passed
     *  - a custom comparator function
     *
     * A reference to the current NDDB object is returned, so that
     * further methods can be chained.
     *
     * Notice: the order of entries is changed.
     *
     * @param {string|array|function} d Optional. The criterium of sorting
     * @return {NDDB} A sorted copy of the current instance of NDDB
     */
    NDDB.prototype.sort = function(d) {
        var func, that;
        // GLOBAL compare
        if (!d) {
            func = this.globalCompare;
        }

        // FUNCTION
        else if ('function' === typeof d) {
            func = d;
        }

        // ARRAY of dimensions
        else if (d instanceof Array) {
            that = this;
            func = function(a,b) {
                var i, result;
                for (i = 0; i < d.length; i++) {
                    result = that.getComparator(d[i]).call(that,a,b);
                    if (result !== 0) return result;
                }
                return result;
            }
        }

        // SINGLE dimension
        else {
            func = this.getComparator(d);
        }

        this.db.sort(func);
        return this;
    };

    /**
     * ### NDDB.shuffle
     *
     * Randomly shuffles all the entries of the database
     *
     * Changes the order of elements in the current database
     *
     * @return {NDDB} A a reference to the current instance with shuffled entries
     */
    NDDB.prototype.shuffle = function() {
        this.db = J.shuffle(this.db);
        return this;
    };

    // ## Custom callbacks

    /**
     * ### NDDB.filter
     *
     * Filters the entries of the database according to the
     * specified callback function.
     *
     * A new NDDB instance is breeded.
     *
     * @param {function} func The filtering function
     * @return {NDDB} A new instance of NDDB containing the filtered entries
     *
     * @see NDDB.breed
     *
     */
    NDDB.prototype.filter = function(func) {
        return this.breed(this.db.filter(func));
    };


    /**
     * ### NDDB.each || NDDB.forEach
     *
     * Applies a callback function to each element in the db.
     *
     * It accepts a variable number of input arguments, but the first one
     * must be a valid callback, and all the following are passed as parameters
     * to the callback
     *
     * @see NDDB.map
     */
    NDDB.prototype.each = NDDB.prototype.forEach = function() {
        if (arguments.length === 0) return;
        var func = arguments[0], i;
        for (i = 0 ; i < this.db.length ; i++) {
            arguments[0] = this.db[i];
            func.apply(this, arguments);
        }
    };

    /**
     * ### NDDB.map
     *
     * Applies a callback function to each element in the db, store
     * the results in an array and returns it.
     *
     * It accepts a variable number of input arguments, but the first one
     * must be a valid callback, and all the following are passed as parameters
     * to the callback
     *
     * @return {array} out The result of the mapping
     * @see NDDB.each
     *
     */
    NDDB.prototype.map = function() {
        if (arguments.length === 0) return;
        var func = arguments[0],
        out = [], o, i;
        for (i = 0 ; i < this.db.length ; i++) {
            arguments[0] = this.db[i];
            o = func.apply(this, arguments);
            if ('undefined' !== typeof o) out.push(o);
        }
        return out;
    };

    // # Update

    /**
     * ### NDDB.update
     *
     * Updates all selected entries
     *
     * Mix ins the properties of the _update_ object in each
     * selected item.
     *
     * Properties from the _update_ object that are not found in
     * the selected items will be created.
     *
     * @param {object} update An object containing the properties
     *  that will be updated.
     * @return {NDDB} A new instance of NDDB with updated entries
     *
     * @see JSUS.mixin
     */
    NDDB.prototype.update = function(update) {
        if (!this.db.length || !update) return this;

        for (var i = 0; i < this.db.length; i++) {
            J.mixin(this.db[i], update);
            this.emit('update', this.db[i]);
        }

        this._autoUpdate();
        return this;
    };

    //## Deletion

    /**
     * ### NDDB.removeAllEntries
     *
     * Removes all entries from the database
     *
     * @return {NDDB} A new instance of NDDB with no entries
     */
    NDDB.prototype.removeAllEntries = function() {
        if (!this.db.length) return this;
        this.emit('remove', this.db);
        this.db = [];
        this._autoUpdate();
        return this;
    };

    /**
     * ### NDDB.clear
     *
     * Removes all volatile data
     *
     * Removes all entries, indexes, hashes, views, and tags,
     * and resets the current query selection
     *
     * Hooks, indexing, comparator, views, and hash functions are not deleted.
     *
     * Requires an additional parameter to confirm the deletion.
     *
     * @return {boolean} TRUE, if the database was cleared
     */
    NDDB.prototype.clear = function(confirm) {
        if (confirm) {
            this.db = [];
            this.tags = {};
            this.query.reset();
            this.nddb_pointer = 0;

            var i;
            for (i in this.__H) {
                if (this[i]) delete this[i]
            }
            for (i in this.__C) {
                if (this[i]) delete this[i]
            }
            for (var i in this.__I) {
                if (this[i]) delete this[i]
            }
        }
        else {
            this.log('Do you really want to clear the current dataset? ' +
                     'Please use clear(true)', 'WARN');
        }

        return confirm;
    };


    // ## Advanced operations

    /**
     * ### NDDB.join
     *
     * Performs a *left* join across all the entries of the database
     *
     * @param {string} key1 First property to compare
     * @param {string} key2 Second property to compare
     * @param {string} pos Optional. The property under which the join
     *   is performed. Defaults 'joined'
     * @param {string|array} select Optional. The properties to copy
     *   in the join. Defaults undefined
     * @return {NDDB} A new database containing the joined entries
     *
     * @see NDDB._join
     * @see NDDB.breed
     */
    NDDB.prototype.join = function(key1, key2, pos, select) {
        // <!--
        // Construct a better comparator function
        // than the generic JSUS.equals
        //        if (key1 === key2 && 'undefined' !== typeof this.__C[key1]) {
        //            var comparator = function(o1,o2) {
        //                if (this.__C[key1](o1,o2) === 0) return true;
        //                return false;
        //            }
        //        }
        //        else {
        //            var comparator = JSUS.equals;
        //        }
        // -->
        return this._join(key1, key2, J.equals, pos, select);
    };

    /**
     * ### NDDB.concat
     *
     * Copies all the entries (or selected properties of them) containing key2
     * in all the entries containing key1.
     *
     * Nested properties can be accessed with '.'.
     *
     * @param {string} key1 First property to compare
     * @param {string} key2 Second property to compare
     * @param {string} pos Optional. The property under which the join is
     *   performed. Defaults 'joined'
     * @param {string|array} select Optional. The properties to copy in
     *   the join. Defaults undefined
     * @return {NDDB} A new database containing the concatenated entries
     *
     *  @see NDDB._join
     *  @see JSUS.join
     */
    NDDB.prototype.concat = function(key1, key2, pos, select) {
        return this._join(key1, key2, function(){ return true;}, pos, select);
    };

    /**
     * ### NDDB._join
     *
     * Performs a *left* join across all the entries of the database
     *
     * The values of two keys (also nested properties are accepted) are compared
     * according to the specified comparator callback, or using `JSUS.equals`.
     *
     * If the comparator function returns TRUE, matched entries are appended
     * as a new property of the matching one.
     *
     * By default, the full object is copied in the join, but it is possible to
     * specify the name of the properties to copy as an input parameter.
     *
     * A new NDDB object breeded, so that further methods can be chained.
     *
     * @api private
     * @param {string} key1 First property to compare
     * @param {string} key2 Second property to compare
     * @param {function} comparator Optional. A comparator function.
     *   Defaults, `JSUS.equals`
     * @param {string} pos Optional. The property under which the join
     *   is performed. Defaults 'joined'
     * @param {string|array} select Optional. The properties to copy
     *   in the join. Defaults undefined
     * @return {NDDB} A new database containing the joined entries
     * @see NDDB.breed
     */
    NDDB.prototype._join = function(key1, key2, comparator, pos, select) {
        var out, idxs, foreign_key, key;
        var i, j, o, o2;
        if (!key1 || !key2) return this.breed([]);

        comparator = comparator || J.equals;
        pos = ('undefined' !== typeof pos) ? pos : 'joined';
        if (select) {
            select = (select instanceof Array) ? select : [select];
        }

        out = [], idxs = [];
        for (i = 0; i < this.db.length; i++) {

            foreign_key = J.getNestedValue(key1, this.db[i]);
            if ('undefined' !== typeof foreign_key) {
                for (j = i+1; j < this.db.length; j++) {

                    key = J.getNestedValue(key2, this.db[j]);

                    if ('undefined' !== typeof key) {
                        if (comparator(foreign_key, key)) {
                            // Inject the matched obj into the
                            // reference one
                            o = J.clone(this.db[i]);
                            o2 = (select) ?
                                J.subobj(this.db[j], select)
                                : this.db[j];
                            o[pos] = o2;
                            out.push(o);
                        }

                    }
                }
            }
        }

        return this.breed(out);
    };

    /**
     * ### NDDB.split
     *
     * Splits all the entries in the database containing
     * the passed dimension.
     *
     * New entries are created and a new NDDB object is
     * breeded to allows method chaining.
     *
     * @param {string} key The dimension along which items will be split
     * @return {NDDB} A new database containing the split entries
     *
     * @see JSUS.split
     */
    NDDB.prototype.split = function(key) {
        var out = [], i;
        for (i = 0; i < this.db.length; i++) {
            out = out.concat(J.split(this.db[i], key));
        }
        return this.breed(out);
    };

    // ## Fetching

    /**
     * ### NDDB.fetch
     *
     * Fetches all the entries in the database and returns
     * them in one array
     *
     * Examples
     *
     * ```javascript
     * var db = new NDDB();
     * db.insert([ { a:1, b:{c:2}, d:3 } ]);
     *
     * db.fetch();    // [ {a: 1, b: {c: 2}, d: 3} ]
     * ```
     *
     * No further chaining is permitted after fetching.
     *
     * @return {array} out The fetched values
     *
     * @see NDDB.fetchValues
     * @see NDDB.fetchArray
     * @see NDDB.fetchKeyArray
     * @see NDDB.fetchSubObj
     *
     */
    NDDB.prototype.fetch = function() {
        return this.db;
    };

    /**
     * ### NDDB.fetchSubObj
     *
     * Fetches all the entries in the database and trims out unwanted properties
     *
     * Examples
     *
     * ```javascript
     * var db = new NDDB();
     * db.insert([ { a:1, b:{c:2}, d:3 } ]);
     * db.insert([ { a:4, b:{c:5}, d:6 } ]);
     *
     * db.fetchSubObj('a'); // [ { a: 1} , {a: 4}]
     * ```
     *
     * No further chaining is permitted after fetching.
     *
     * @param {string|array} key Optional. If set, returned objects will
     *   have only such properties
     * @return {array} out The fetched objects
     *
     * @see NDDB.fetch
     * @see NDDB.fetchValues
     * @see NDDB.fetchArray
     * @see NDDB.fetchKeyArray
     */
    NDDB.prototype.fetchSubObj= function(key) {
        if (!key) return [];
        var i, el, out = [];
        for (i=0; i < this.db.length; i++) {
            el = J.subobj(this.db[i], key);
            if (!J.isEmpty(el)) out.push(el);
        }
        return out;
    };


    /**
     * ### NDDB.fetchValues
     *
     * Fetches all the values of the entries in the database
     *
     * The type of the input parameter determines the return value:
     *  - `string`: returned value is a one-dimensional array.
     *  - `array`: returned value is an object whose properties
     *    are arrays containing all the values found for those keys.
     *
     * Nested properties can be specified too.
     *
     * Examples
     *
     * ```javascript
     * var db = new NDDB();
     * db.insert([ { a:1, b:{c:2}, d:3 } ]);
     *
     * db.fetchValues();    // [ [ 1, 2, 3 ] ]
     * db.fetchValues('b'); // { b: [ {c: 2} ] }
     * db.fetchValues('d'); // { d: [ 3 ] };
     *
     * db.insert([ { a:4, b:{c:5}, d:6 } ]);
     *
     * db.fetchValues([ 'a', 'd' ]); // { a: [ 1, 4] , d: [ 3, 6] };
     * ```
     *
     * No further chaining is permitted after fetching.
     *
     * @param {string|array} key Optional. If set, returns only
     *   the value from the specified property
     * @return {array} out The fetched values
     *
     * @see NDDB.fetch
     * @see NDDB.fetchArray
     * @see NDDB.fetchKeyArray
     * @see NDDB.fetchSubObj
     */
    NDDB.prototype.fetchValues = function(key) {
        var el, i, out, typeofkey;

        typeofkey = typeof key, out = {};

        if (typeofkey === 'undefined') {
            for (i=0; i < this.db.length; i++) {
                J.augment(out, this.db[i], J.keys(this.db[i]));
            }
        }

        else if (typeofkey === 'string') {
            out[key] = [];
            for (i=0; i < this.db.length; i++) {
                el = J.getNestedValue(key, this.db[i]);
                if ('undefined' !== typeof el) {
                    out[key].push(el);
                }
            }
        }

        else if (J.isArray(key)) {
            out = J.melt(key, J.rep([], key.length)); // object not array
            for ( i = 0 ; i < this.db.length ; i++) {
                el = J.subobj(this.db[i], key);
                if (!J.isEmpty(el)) {
                    J.augment(out, el);
                }
            }
        }

        return out;
    };

    function getValuesArray(o, key) {
        return J.obj2Array(o, 1);
    };

    function getKeyValuesArray(o, key) {
        return J.obj2KeyedArray(o, 1);
    };


    function getValuesArray_KeyString(o, key) {
        var el = J.getNestedValue(key, o);
        if ('undefined' !== typeof el) {
            return J.obj2Array(el,1);
        }
    };

    function getValuesArray_KeyArray(o, key) {
        var el = J.subobj(o, key);
        if (!J.isEmpty(el)) {
            return J.obj2Array(el,1);
        }
    };


    function getKeyValuesArray_KeyString(o, key) {
        var el = J.getNestedValue(key, o);
        if ('undefined' !== typeof el) {
            return key.split('.').concat(J.obj2KeyedArray(el));
        }
    };

    function getKeyValuesArray_KeyArray(o, key) {
        var el = J.subobj(o, key);
        if (!J.isEmpty(el)) {
            return J.obj2KeyedArray(el);
        }
    };

    /**
     * ### NDDB._fetchArray
     *
     * Low level primitive for fetching the entities as arrays
     *
     * Examples
     *
     * ```javascript
     * var db = new NDDB();
     * var items = [{a:1, b:2}, {a:3, b:4}, {a:5, c:6}];
     * db.importDB(items);
     *
     * db._fetch(null, 'VALUES');
     * // [ [ 1, 2 ], [ 3, 4 ], [ 5, 6] ]
     *
     * db._fetch(null, 'KEY_VALUES');
     * // [ [ 'a', 1, 'b', 2 ], [ 'a', 3, 'b', 4 ], [ 'a', 5, 'c', 6 ] ]
     *
     * db._fetch('a', 'VALUES');
     * //  [ [ 1 ], [ 3 ], [ 5 ] ]
     *
     * db._fetch('a', 'KEY_VALUES');
     * // [ [ 'a', 1 ], [ 'a', 3 ], [ 'a', 5 ] ]
     *
     * db._fetch(['a','b'], 'VALUES');
     * //  [ [ 1 , 2], [ 3, 4 ], [ 5 ] ]
     *
     * db._fetch([ 'a', 'c'] 'KEY_VALUES');
     * // [ [ 'a', 1 ], [ 'a', 3 ], [ 'a', 5, 'c', 6 ] ]
     * ```
     *
     * No further chaining is permitted after fetching.
     *
     * @api private
     * @param {string|array} key Optional. If set, returns key/values only
     *   from the specified property
     * @param {boolean} keyed. Optional. If set, also the keys are returned
     * @return {array} out The fetched values
     *
     */
    NDDB.prototype._fetchArray = function(key, keyed) {

        var cb, out, el, i;

        if (keyed) {

            if (!key) cb = getKeyValuesArray;

            else if ('string' === typeof key) {
                cb = getKeyValuesArray_KeyString;
            }
            else {
                cb = getKeyValuesArray_KeyArray;
            }
        }
        else {
            if (!key) cb = getValuesArray;

            else if ('string' === typeof key) {
                cb = getValuesArray_KeyString;
            }
            else {
                cb = getValuesArray_KeyArray;
            }
        }

        out = [];
        for (i=0; i < this.db.length; i++) {
            el = cb.call(this.db[i], this.db[i], key);
            if ('undefined' !== typeof el) out.push(el);
        }

        return out;
    }

    /**
     * ### NDDB.fetchArray
     *
     * Fetches the entities in the database as arrays instead of objects
     *
     * Examples
     *
     * ```javascript
     * var db = new NDDB();
     * db.insert([ { a:1, b:{c:2}, d:3 } ]);
     * db.insert([ { a:4, b:{c:5}, d:6 } ]);
     *
     * db.fetchArray();     // [ [ 1, 'c', 2, 3 ],  ]
     * db.fetchArray('b');  // [ [ 'c', 2 ] ]
     * db.fetchArray('d');  // [ [ 3 ] ]
     * ```
     *
     * No further chaining is permitted after fetching.
     *
     * @see NDDB._fetchArray
     * @see NDDB.fetchValues
     * @see NDDB.fetchKeyArray
     * @see NDDB.fetchSubObj
     */
    NDDB.prototype.fetchArray = function(key) {
        return this._fetchArray(key);
    };

    /**
     * ### NDDB.fetchKeyArray
     *
     * Exactly as NDDB.fetchArray, but also the keys are added to the
     * returned values.
     *
     * Examples
     *
     * ```javascript
     * var db = new NDDB();
     * db.insert([ { a:1, b:{c:2}, d:3 } ]);
     *
     * db.fetchKeyArray();       // [ [ 'a', 1, 'c', 2, 'd', 3 ] ]
     * db.fetchKeyArray('b'); // [ [ 'b', 'c', 2 ] ]
     * db.fetchKeyArray('d');    // [ [ 'd', 3 ] ]
     * ```
     *
     * No further chaining is permitted after fetching.
     *
     * @param {string} key Optional. If set, returns only the value
     *   from the specified property
     * @return {array} out The fetched values
     *
     * @see NDDB._fetchArray
     * @see NDDB.fetchArray
     * @see NDDB.fetchValues
     * @see NDDB.fetchSubObj
     */
    NDDB.prototype.fetchKeyArray = function(key) {
        return this._fetchArray(key, true);
    };

    /**
     * ### NDDB.groupBy
     *
     * Splits the entries in the database in subgroups
     *
     * Each subgroup is formed up by elements which have the
     * same value along the specified dimension.
     *
     * An array of NDDB instances is returned, therefore no direct
     * method chaining is allowed afterwards.
     *
     * Entries containing undefined values in the specified
     * dimension will be skipped
     *
     * Examples
     *
     * ```javascript
     * var db = new NDDB();
     * var items = [{a:1, b:2}, {a:3, b:4}, {a:5}, {a:6, b:2}];
     * db.importDB(items);
     *
     * var groups = db.groupBy('b');
     * groups.length; // 2
     *
     * groups[0].fetch(); // [ { a: 1, b: 2 }, { a: 6, b: 2 } ]
     *
     * groups[1].fetch(); // [ { a: 3, b: 4 } ]
     * ```
     *
     * @param {string} key If the dimension for grouping
     * @return {array} outs The array of groups
     *
     */
    NDDB.prototype.groupBy = function(key) {
        if (!key) return this.db;

        var groups = [], outs = [], i, el, out;
        for (i = 0 ; i < this.db.length ; i++) {
            el = J.getNestedValue(key, this.db[i]);
            if ('undefined' === typeof el) continue;
            // Creates a new group and add entries to it
            if (!J.in_array(el, groups)) {
                groups.push(el);
                out = this.filter(function(elem) {
                    if (J.equals(J.getNestedValue(key, elem), el)) {
                        return this;
                    }
                });
                // Reset nddb_pointer in subgroups
                out.nddb_pointer = 0;
                outs.push(out);
            }
        }
        return outs;
    };

    // ## Statistics

    /**
     * ### NDDB.count
     *
     * Counts the entries containing the specified key
     *
     * If key is undefined, the size of the databse is returned.
     *
     * @param {string} key The dimension to count
     * @return {number} count The number of items along the specified dimension
     *
     * @see NDDB.length
     */
    NDDB.prototype.count = function(key) {
        if ('undefined' === typeof key) return this.db.length;
        var count = 0;
        for (var i = 0; i < this.db.length; i++) {
            if (J.hasOwnNestedProperty(key, this.db[i])){
                count++;
            }
        }
        return count;
    };


    /**
     * ### NDDB.sum
     *
     * Returns the total sum of the values of all the entries
     * in the database containing the specified key.
     *
     * Non numeric values are ignored.
     *
     * @param {string} key The dimension to sum
     * @return {number|boolean} sum The sum of the values for the dimension,
     *   or FALSE if it does not exist
     *
     */
    NDDB.prototype.sum = function(key) {
        if ('undefined' === typeof key) return false;
        var sum = 0;
        for (var i=0; i < this.db.length; i++) {
            var tmp = J.getNestedValue(key, this.db[i]);
            if (!isNaN(tmp)) {
                sum += tmp;
            }
        }
        return sum;
    };

    /**
     * ### NDDB.mean
     *
     * Returns the average of the values of all the entries
     * in the database containing the specified key.
     *
     * Entries with non numeric values are ignored, and excluded
     * from the computation of the mean.
     *
     * @param {string} key The dimension to average
     * @return {number|boolean} The mean of the values for the dimension,
     *   or FALSE if it does not exist
     *
     */
    NDDB.prototype.mean = function(key) {
        if ('undefined' === typeof key) return false;
        var sum = 0;
        var count = 0;
        for (var i=0; i < this.db.length; i++) {
            var tmp = J.getNestedValue(key, this.db[i]);
            if (!isNaN(tmp)) {
                sum += tmp;
                count++;
            }
        }
        return (count === 0) ? 0 : sum / count;
    };

    /**
     * ### NDDB.stddev
     *
     * Returns the standard deviation of the values of all the entries
     * in the database containing the specified key.
     *
     * Entries with non numeric values are ignored, and excluded
     * from the computation of the standard deviation.
     *
     * @param {string} key The dimension to average
     * @return {number|boolean} The mean of the values for the dimension,
     *   or FALSE if it does not exist
     *
     * @see NDDB.mean
     *
     * TODO: using computation formula of stdev
     */
    NDDB.prototype.stddev = function(key) {
        var V, mean, count;
        if ('undefined' === typeof key) return false;
        mean = this.mean(key);
        if (isNaN(mean)) return false;

        V = 0, count = 0;
        this.each(function(e) {
            var tmp = J.getNestedValue(key, e);
            if (!isNaN(tmp)) {
                V += Math.pow(tmp - mean, 2)
                count++;
            }
        });

        return (V !== 0) ? Math.sqrt(V) / (count-1) : 0;
    };


    /**
     * ### NDDB.min
     *
     * Returns the min of the values of all the entries
     * in the database containing the specified key.
     *
     * Entries with non numeric values are ignored.
     *
     * @param {string} key The dimension of which to find the min
     * @return {number|boolean} The smallest value for the dimension,
     *   or FALSE if it does not exist
     *
     * @see NDDB.max
     */
    NDDB.prototype.min = function(key) {
        if ('undefined' === typeof key) return false;
        var min = false;
        for (var i=0; i < this.db.length; i++) {
            var tmp = J.getNestedValue(key, this.db[i]);
            if (!isNaN(tmp) && (tmp < min || min === false)) {
                min = tmp;
            }
        }
        return min;
    };

    /**
     * ### NDDB.max
     *
     * Returns the max of the values of all the entries
     * in the database containing the specified key.
     *
     * Entries with non numeric values are ignored.
     *
     * @param {string} key The dimension of which to find the max
     * @return {number|boolean} The biggest value for the dimension,
     *   or FALSE if it does not exist
     *
     * @see NDDB.min
     */
    NDDB.prototype.max = function(key) {
        if ('undefined' === typeof key) return false;
        var max = false;
        for (var i=0; i < this.db.length; i++) {
            var tmp = J.getNestedValue(key, this.db[i]);
            if (!isNaN(tmp) && (tmp > max || max === false)) {
                max = tmp;
            }
        }
        return max;
    };

    // ## Skim

    /**
     * ### NDDB.skim
     *
     * Removes the specified properties from all the items in the database
     *
     * Use '.' (dot) to point to a nested property.
     *
     * Items with no property are automatically removed.
     *
     * @param {string|array} skim The selection of properties to remove
     * @return {NDDB} A new database containing the result of the skim
     *
     * @see NDDB.keep
     * @see JSUS.skim
     */
    NDDB.prototype.skim = function(skim) {
        if (!skim) return this;
        return this.breed(this.map(function(e){
            var skimmed = J.skim(e, skim);
            if (!J.isEmpty(skimmed)) {
                return skimmed;
            }
        }));
    };

    /**
     * ### NDDB.keep
     *
     * Removes all the properties that are not specified as parameter
     * from all the items in the database
     *
     * Use '.' (dot) to point to a nested property.
     *
     * Items with no property are automatically removed.
     *
     * @param {string|array} skim The selection of properties to keep
     * @return {NDDB} A new database containing the result of the keep operation
     *
     * @see NDDB.skim
     * @see JSUS.keep
     */
    NDDB.prototype.keep = function(keep) {
        if (!keep) return this.breed([]);
        return this.breed(this.map(function(e){
            var subobj = J.subobj(e, keep);
            if (!J.isEmpty(subobj)) {
                return subobj;
            }
        }));
    };

    // ## Diff


    /**
     * ### NDDB.diff
     *
     * Performs a diff of the entries in the database and the database
     * object passed as parameter (Array or NDDB)
     *
     * Returns a new NDDB instance containing all the entries that
     * are present in the current instance, and *not* in the
     * database obj passed as parameter.
     *
     * @param {NDDB|array} nddb The external database to compare
     * @return {NDDB} A new database containing the result of the diff
     *
     * @see NDDB.intersect
     * @see JSUS.arrayDiff
     */
    NDDB.prototype.diff = function(nddb) {
        if (!nddb || !nddb.length) return this;
        if ('object' === typeof nddb) {
            if (nddb instanceof NDDB || nddb instanceof this.constructor) {
                nddb = nddb.db;
            }
        }
        return this.breed(J.arrayDiff(this.db, nddb));
    };

    /**
     * ### NDDB.intersect
     *
     * Finds the common the entries between the current database and
     * the database  object passed as parameter (Array or NDDB)
     *
     * Returns a new NDDB instance containing all the entries that
     * are present both in the current instance of NDDB and in the
     * database obj passed as parameter.
     *
     * @param {NDDB|array} nddb The external database to compare
     * @return {NDDB} A new database containing the result of the intersection
     *
     * @see NDDB.diff
     * @see JSUS.arrayIntersect
     */
    NDDB.prototype.intersect = function(nddb) {
        if (!nddb || !nddb.length) return this;
        if ('object' === typeof nddb) {
            if (nddb instanceof NDDB || nddb instanceof this.constructor) {
                var nddb = nddb.db;
            }
        }
        return this.breed(J.arrayIntersect(this.db, nddb));
    };


    // ## Iterator

    /**
     * ### NDDB.get
     *
     * Returns the entry at the given numerical position
     *
     * @param {number} pos The position of the entry
     * @return {object|boolean} The requested item, or FALSE if
     *  the index is invalid
     */
    NDDB.prototype.get = function(pos) {
        if ('undefined' === typeof pos || pos < 0 || pos > (this.db.length-1)) {
            return false;
        }
        return this.db[pos];
    };

    /**
     * ### NDDB.current
     *
     * Returns the entry in the database, at which
     * the iterator is currently pointing
     *
     * The pointer is *not* updated.
     *
     * Returns false, if the pointer is at an invalid position.
     *
     * @return {object|boolean} The current entry, or FALSE if none is found
     */
    NDDB.prototype.current = function() {
        if (this.nddb_pointer < 0 || this.nddb_pointer > (this.db.length-1)) {
            return false;
        }
        return this.db[this.nddb_pointer];
    };

    /**
     * ### NDDB.next
     *
     * Moves the pointer to the next entry in the database
     * and returns it
     *
     * Returns false if the pointer is at the last entry,
     * or if database is empty.
     *
     * @return {object|boolean} The next entry, or FALSE if none is found
     *
     */
    NDDB.prototype.next = function() {
        this.nddb_pointer++;
        var el = NDDB.prototype.current.call(this);
        if (!el) this.nddb_pointer--;
        return el;
    };

    /**
     * ### NDDB.previous
     *
     * Moves the pointer to the previous entry in the database
     * and returns it
     *
     * Returns false if the pointer is at the first entry,
     * or if database is empty.
     *
     * @return {object|boolean} The previous entry, or FALSE if none is found
     */
    NDDB.prototype.previous = function() {
        this.nddb_pointer--;
        var el = NDDB.prototype.current.call(this);
        if (!el) this.nddb_pointer++;
        return el;
    };

    /**
     * ### NDDB.first
     *
     * Moves the pointer to the first entry in the database,
     * and returns it
     *
     * Returns the first entry of the database, or undefined
     * if the database is empty.
     *
     * @param {string} key Optional. If set, moves to the pointer
     *   to the first entry along this dimension
     * @return {object} The first entry found
     *
     * @see NDDB.last
     */
    NDDB.prototype.first = function(key) {
        var db = this.fetch(key);
        if (db.length) {
            this.nddb_pointer = 0;
            return db[0];
        }
        return undefined;
    };

    /**
     * ### NDDB.last
     *
     * Moves the pointer to the first last in the database,
     * and returns it
     *
     * Returns the last entry of the database, or undefined
     * if the database is empty.
     *
     * @param {string} key Optional. If set, moves to the pointer
     *   to the last entry along this dimension
     * @return {object} The last entry found
     *
     * @see NDDB.first
     */
    NDDB.prototype.last = function(key) {
        var db = this.fetch(key);
        if (db.length) {
            this.nddb_pointer = db.length-1;
            return db[db.length-1];
        }
        return undefined;
    };

    // ## Tagging


    /**
     * ### NDDB.tag
     *
     * Registers a tag associated to an object
     *
     * The second parameter can be the index of an object
     * in the database, the object itself, or undefined. In
     * the latter case, the current valye of `nddb_pointer`
     * is used to create the reference.
     *
     * The tag is independent from sorting and deleting operations,
     * but changes on update of the elements of the database.
     *
     * @param {string|number} tag An alphanumeric id
     * @param {mixed} idx Optional. The reference to the object.
     *   Defaults, `nddb_pointer`
     * @return {object} ref A reference to the tagged object
     *
     * @see NDDB.resolveTag
     */
    NDDB.prototype.tag = function(tag, idx) {
        var ref, typeofIdx;
        if (('string' !== typeof tag) && ('number' !== typeof tag)) {
            throw new TypeError(this._getConstrName() +
                                '.tag: tag must be string or number.');
        }

        ref = null, typeofIdx = typeof idx;

        if (typeofIdx === 'undefined') {
            ref = this.db[this.nddb_pointer];
        }
        else if (typeofIdx === 'number') {

            if (idx > this.length || idx < 0) {
                throw new TypeError(this._getConstrName() +
                                    '.tag: invalid index provided');
            }
            ref = this.db[idx];
        }
        else {
            ref = idx;
        }

        this.tags[tag] = ref;
        return ref;
    };

    /**
     * ### NDDB.resolveTag
     *
     * Returns the element associated with the given tag.
     *
     * @param {string} tag An alphanumeric id
     * @return {object} The object associated with the tag
     *
     * @see NDDB.tag
     */
    NDDB.prototype.resolveTag = function(tag) {
        if ('string' !== typeof tag) {
            throw new TypeError(this._getConstrName() +
                                '.resolveTag: tag must be string.');
        }
        return this.tags[tag];
    };

    // ## Persistance

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
    }

    /**
     * ### NDDB.save
     *
     * Saves the database to a persistent medium in JSON format
     *
     * Looks for a global store` method to load from the browser database.
     * The `store` method is supploed by shelf.js.
     * If no `store` object is found, an error is issued and the database
     * is not saved.
     *
     * Cyclic objects are decycled, and do not cause errors.
     * Upon loading, the cycles are restored.
     *
     * @param {string} file The  identifier for the browser database
     * @param {function} cb Optional. A callback to execute after
     *    the database is saved
     * @param {compress} boolean Optional. If TRUE, output will be compressed.
     *    Defaults, FALSE
     * @return {boolean} TRUE, if operation is successful
     *
     * @see NDDB.load
     * @see NDDB.stringify
     * @see https://github.com/douglascrockford/JSON-js/blob/master/cycle.js

     *
     */
    NDDB.prototype.save = function(file, cb, compress) {
        if ('string' !== typeof file) {
            throw new TypeError(this._getConstrName() +
                                'load: you must specify a valid file name.');
        }
        compress = compress || false;
        // Try to save in the browser, e.g. with Shelf.js
        if (!this.storageAvailable()) {
            throw new Error(this._getConstrName() +
                            '.save: no support for persistent storage.');
            return false;
        }
        store(file, this.stringify(compress));
        if (cb) cb();
        return true;
    };

    /**
     * ### NDDB.load
     *
     * Loads a JSON object into the database from a persistent medium
     *
     * Looks for a global store` method to load from the browser database.
     * The `store` method is supploed by shelf.js.
     * If no `store` object is found, an error is issued and the database
     * is not loaded.
     *
     * Cyclic objects previously decycled will be retrocycled.
     *
     * @param {string} file The file system path, or the identifier for the browser database
     * @param {function} cb Optional. A callback to execute after the database was saved
     * @return {boolean} TRUE, if operation is successful
     *
     * @see NDDB.loadCSV
     * @see NDDB.save
     * @see NDDB.stringify
     * @see JSUS.parse
     * @see https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
     *
     */
    NDDB.prototype.load = function(file, cb, options) {
        var items, i;
        if ('string' !== typeof file) {
            throw new TypeError(this._getConstrName() +
                                '.load: you must specify a valid file name.');
        }
        if (!this.storageAvailable()) {
            throw new Error(this._getConstrName() +
                            '.load: no support for persistent storage found.');
        }

        items = store(file);

        if ('undefined' === typeof items) {
            this.log(this._getConstrName() +
                     '.load: nothing found to load', 'WARN');
            return false;
        }
        if ('string' === typeof items) {
            items = J.parse(items);
        }
        if (!J.isArray(items)) {
            throw new TypeError(this._getConstrName() +
                                '.load: expects to load an array.');
        }
        for (i = 0; i < items.length; i++) {
            // retrocycle if possible
            items[i] = NDDB.retrocycle(items[i]);
        }
        this.importDB(items);
        return true;
    };

    /**
     * # QueryBuilder
     *
     * MIT Licensed
     *
     * Helper class for NDDB query selector
     *
     * ---
     */

    /**
     * ## QueryBuilder Constructor
     *
     * Manages the _select_ queries of NDDB
     */
    function QueryBuilder() {
        // Creates the query array and internal pointer.
        this.reset();
    }

    /**
     * ### QueryBuilder.addCondition
     *
     * Adds a new _select_ condition
     *
     * @param {string} type. The type of the operation (e.g. 'OR', or 'AND')
     * @param {function} filter. The filter callback
     */
    QueryBuilder.prototype.addCondition = function(type, filter) {
        this.query[this.pointer].push({
            type: type,
            cb: filter
        });
    };


    /**
     * ### QueryBuilder.addBreak
     *
     * undocumented
     */
    QueryBuilder.prototype.addBreak = function() {
        this.pointer++;
        this.query[this.pointer] = [];
    };

    /**
     * ### QueryBuilder.reset
     *
     * Resets the current query selection
     *
     */
    QueryBuilder.prototype.reset = function() {
        this.query = [];
        this.pointer = 0;
        this.query[this.pointer] = [];
    };



    function findCallback(obj) {
        return obj.cb;
    };

    /**
     * ### QueryBuilder.get
     *
     * Builds up the select function
     *
     * Up to three conditions it builds up a custom function without
     * loop. For more than three conditions, a loop is created.
     *
     * Expressions are evaluated from right to left, so that the last one
     * always decides the overall logic value. E.g. :
     *
     *  true AND false OR true => false OR true => TRUE
     *  true AND true OR false => true OR false => TRUE
     *
     * @return {function} The select function containing all the specified
     *   conditions
     */
    QueryBuilder.prototype.get = function() {
        var line, lineLen, f1, f2, f3, type1, type2, i;
        var query = this.query, pointer = this.pointer;
        var operators = this.operators;

        // Ready to support nested queries, not yet implemented.
        if (pointer === 0) {
            line = query[pointer]
            lineLen = line.length;

            if (lineLen === 1) {
                return findCallback(line[0]);
            }

            else if (lineLen === 2) {
                f1 = findCallback(line[0]);
                f2 = findCallback(line[1]);
                type1 = line[1].type;

                switch (type1) {
                case 'OR':
                    return function(elem) {
                        if ('undefined' !== typeof f1(elem)) return elem;
                        if ('undefined' !== typeof f2(elem)) return elem;
                    }
                case 'AND':
                    return function(elem) {
                        if ('undefined' !== typeof f1(elem) &&
                            'undefined' !== typeof f2(elem)) return elem;
                    }

                case 'NOT':
                    return function(elem) {
                        if ('undefined' !== typeof f1(elem) &&
                            'undefined' === typeof f2(elem)) return elem;
                    }
                }
            }

            else if (lineLen === 3) {
                f1 = findCallback(line[0]);
                f2 = findCallback(line[1]);
                f3 = findCallback(line[2]);
                type1 = line[1].type;
                type2 = line[2].type;
                type1 = type1 + '_' + type2;
                switch (type1) {
                case 'OR_OR':
                    return function(elem) {
                        if ('undefined' !== typeof f1(elem)) return elem;
                        if ('undefined' !== typeof f2(elem)) return elem;
                        if ('undefined' !== typeof f3(elem)) return elem;
                    };

                case 'OR_AND':
                    return function(elem) {

                        if ('undefined' === typeof f3(elem)) return;
                        if ('undefined' !== typeof f2(elem)) return elem;
                        if ('undefined' !== typeof f1(elem)) return elem;
                    };

                case 'AND_OR':
                    return function(elem) {
                        if ('undefined' !== typeof f3(elem)) return elem;
                        if ('undefined' === typeof f2(elem)) return;
                        if ('undefined' !== typeof f1(elem)) return elem;
                    };

                case 'AND_AND':
                    return function(elem) {
                        if ('undefined' === typeof f3(elem)) return;
                        if ('undefined' === typeof f2(elem)) return;
                        if ('undefined' !== typeof f1(elem)) return elem;
                    };
                }
            }

            else {
                return function(elem) {
                    var i, f, type, resOK;
                    var prevType = 'OR', prevResOK = true;
                    for (i = lineLen-1 ; i > -1 ; i--) {
                        f = findCallback(line[i]);
                        type = line[i].type,
                        resOK = 'undefined' !== typeof f(elem);

                        if (type === 'OR') {
                            // Current condition is TRUE OR
                            if (resOK) return elem;
                        }

                        // Current condition is FALSE AND
                        else if (type === 'AND') {
                            if (!resOK) {
                                return;
                            }
                            // Previous check was an AND or a FALSE OR
                            else if (prevType === 'OR' && !prevResOK) {
                                return;
                            }
                        }
                        prevType = type;
                        // A previous OR is TRUE also if follows a TRUE AND
                        prevResOK = type === 'AND' ? resOK : resOK || prevResOK;

                    }
                    return elem;
                }

            }

        }
    };

    /**
     * # NDDBIndex
     *
     * MIT Licensed
     *
     * Helper class for NDDB indexing
     *
     * ---
     */

    /**
     * ## NDDBIndex Constructor
     *
     * Creates direct access index objects for NDDB
     *
     * @param {string} The name of the index
     * @param {array} The reference to the original database
     */
    function NDDBIndex(idx, nddb) {
        this.idx = idx;
        this.nddb = nddb;
        this.resolve = {};
    }

    /**
     * ### NDDBIndex._add
     *
     * Adds an item to the index
     *
     * @param {mixed} idx The id of the item
     * @param {number} dbidx The numerical id of the item in the original array
     */
    NDDBIndex.prototype._add = function(idx, dbidx) {
        this.resolve[idx] = dbidx;
    };

    /**
     * ### NDDBIndex._remove
     *
     * Adds an item to the index
     *
     * @param {mixed} idx The id to remove from the index
     */
    NDDBIndex.prototype._remove = function(idx) {
        delete this.resolve[idx];
    };

    /**
     * ### NDDBIndex.size
     *
     * Returns the size of the index
     *
     * @return {number} The number of elements in the index
     */
    NDDBIndex.prototype.size = function() {
        return J.size(this.resolve);
    };

    /**
     * ### NDDBIndex.get
     *
     * Gets the entry from database with the given id
     *
     * @param {mixed} idx The id of the item to get
     * @return {object|boolean} The indexed entry, or FALSE if index is invalid
     *
     * @see NDDB.index
     * @see NDDBIndex.remove
     * @see NDDBIndex.update
     */
    NDDBIndex.prototype.get = function(idx) {
        if ('undefined' === typeof this.resolve[idx]) return false;
        return this.nddb.db[this.resolve[idx]];
    };


    /**
     * ### NDDBIndex.remove
     *
     * Removes and entry from the database with the given id and returns it
     *
     * @param {mixed} idx The id of item to remove
     * @return {object|boolean} The removed item, or FALSE if index is invalid
     *
     * @see NDDB.index
     * @see NDDBIndex.get
     * @see NDDBIndex.update
     */
    NDDBIndex.prototype.remove = function(idx) {
        var o, dbidx;
        dbidx = this.resolve[idx];
        if ('undefined' === typeof dbidx) return false;
        o = this.nddb.db[dbidx];
        if ('undefined' === typeof o) return;
        this.nddb.db.splice(dbidx,1);
        delete this.resolve[idx];
        this.nddb.emit('remove', o);
        this.nddb._autoUpdate();
        return o;
    };

    // ### NDDBIndex.pop
    // @deprecated
    NDDBIndex.prototype.pop = NDDBIndex.prototype.remove;

    /**
     * ### NDDBIndex.update
     *
     * Removes and entry from the database with the given id and returns it
     *
     * @param {mixed} idx The id of item to update
     * @return {object|boolean} The updated item, or FALSE if index is invalid
     *
     * @see NDDB.index
     * @see NDDBIndex.get
     * @see NDDBIndex.remove
     */
    NDDBIndex.prototype.update = function(idx, update) {
        var o, dbidx;
        dbidx = this.resolve[idx];
        if ('undefined' === typeof dbidx) return false;
        o = this.nddb.db[dbidx];
        J.mixin(o, update);
        this.nddb.emit('update', o);
        this.nddb._autoUpdate();
        return o;
    };

    /**
     * ### NDDBIndex.getAllKeys
     *
     * Returns the list of all keys in the index
     *
     * @return {array} The array of alphanumeric keys in the index
     *
     * @see NDDBIndex.getAllKeyElements
     */
    NDDBIndex.prototype.getAllKeys = function() {
        return J.keys(this.resolve);
    };

    /**
     * ### NDDBIndex.getAllKeyElements
     *
     * Returns all the elements indexed by their key in one object
     *
     * @return {object} The object of key-elements
     *
     * @see NDDBIndex.getAllKeys
     */
    NDDBIndex.prototype.getAllKeyElements = function() {
        var out = {}, idx;
        for (idx in this.resolve) {
            if (this.resolve.hasOwnProperty(idx)) {
                out[idx] = this.nddb.db[this.resolve[idx]];
            }
        }
        return out;
    };

    // ## Closure
})(
    'undefined' !== typeof module && 'undefined' !== typeof module.exports ? module.exports: window
    , 'undefined' !== typeof JSUS ? JSUS : module.parent.exports.JSUS || require('JSUS').JSUS
    , ('object' === typeof module && 'function' === typeof require) ? module.parent.exports.store || require('shelf.js/build/shelf-fs.js').store : this.store
);
