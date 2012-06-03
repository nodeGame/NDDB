(function (exports, JSUS) {
    
    /**
     * 
     * NDDB provides a simple, lightweight, NO-SQL object database 
     * for node.js and the browser. It depends on JSUS.
     * 
     * Allows to define any number of comparator and indexing functions, 
     * which are associated to any of the dimensions (i.e. properties) of 
     * the objects stored in the database. 
     * 
     * Whenever a comparison is needed, the corresponding comparator function 
     * is called, and the database is updated.
     * 
     * Whenever an object is inserted that matches one of the indexing functions
     * an hash is produced, and the element is added to one of the indexes.
     * 
     * 
     * Additional features are: methods chaining, tagging, and iteration 
     * through the entries.
     * 
     * NDDB is work in progress. Currently, the following methods are
     * implemented:
     * 
     *  1. Sorting and selecting:
     * 
     *      - select, sort, reverse, last, first, limit, shuffle*
     *  
     *  2. Custom callbacks
     *  
     *      - map, each, filter
     *  
     *  3. Deletion
     *  
     *      - delete, clear
     *  
     *  4. Advanced operations
     *  
     *      - split*, join, concat
     *  
     *  5. Fetching
     *  
     *      - fetch, fetchArray, fetchKeyArray
     *  
     *  6. Statistics operator
     *  
     *      - size, count, max, min, mean
     *  
     *  7. Diff
     *  
     *      - diff, intersect
     *  
     *  8. Iterator
     *  
     *      - previous, next, first, last
     *
     *  9. Tagging*
     *  
     *      - tag
     *         
     *  10. Updating
     *   
     *      - Update must be performed manually after a selection.
     *      
     * 
     * * = experimental
     * 
     * 
     * See README.md for help.
     * 
     * TODO: distinct
     * 
     */

    // Expose constructors
    exports.NDDB = NDDB;
    
    // Stdout redirect
    NDDB.log = console.log;
    
    /**
     * NDDB interface
     *
     * @api public
     */
    
    function NDDB (options, db, parent) {                
        options = options || {};
        
        // The default database
        this.db = [];
        // The tags list
        this.tags = {};					
        // Pointer for iterating along all the elements
        this.nddb_pointer = 0; 
        
        // Comparator functions
        this.__C = {};
        // Hashing functions
        this.__H = {};
        // Auto update options
        this.__update = {};
        // Always points to the last insert
        this.__update.pointer 	= false;
        // Rebuild indexes on insert and delete
        this.__update.indexes 	= false;
        // Always sort the elements in the database
        this.__update.sort 		= false;
        
        Object.defineProperty(this, 'length', {
        	set: function(){},
        	get: function(){
        		return this.db.length;
        	},
        	configurable: true
    	});
        
        // Parent NNDB database (if chaining)
        this.__parent = parent || undefined;

        this.init(options);
        this.import(db);   
    };
    
    /**
     * Sets global options based on local configuration
     */
    NDDB.prototype.init = function(options) {
    	this.__options = options;
    	
    	if (options.log) {
    		NDDB.log = options.log;
    	}
        
    	if (options.C) {
    		this.__C = options.C;
    	}
    	
    	if (options.H) {
    		this.__H = options.H;
    	}
    	
    	if (options.tags) {
    		this.tags = options.tags;
    	}
        
        if (options.nddb_pointer > 0) {
        	this.nddb_pointer = options.nddb_pointer;
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
        
    };
    
    
    ///////////
    // 0. Core
    //////////
    
    /**
     * Default function used for sorting
     * 
     * Elements are sorted according to their internal id 
     * (FIFO). 
     * 
     */
    NDDB.prototype.globalCompare = function(o1, o2) {
        if ('undefined' === typeof o1 && 'undefined' === typeof o2) return 0;
        if ('undefined' === typeof o2) return -1;  
        if ('undefined' === typeof o1) return 1;
        
        if (o1.nddbid < o2.nddbid) return -1;
        if (o1.nddbid > o2.nddbid) return 1;
        return 0;
    };
    
    /**
     * Adds a special id into the __proto__ object of 
     * the object
     * 
     * @api private
     */
    NDDB.prototype._masquerade = function (o, db) {
        if ('undefined' === typeof o) return false;
        
        // TODO: check this
        if ('undefined' !== typeof o.nddbid) return o;
        var db = db || this.db;
        
        Object.defineProperty(o, 'nddbid', {
        	value: db.length,
        	//set: function(){},
        	configurable: true,
        	writable: true,
    	});
        
        //o.__proto__ = JSUS.clone(o.__proto__);
        //o.__proto__.nddbid = db.length;
        return o;
    };

    /**
     * Masquerades a whole array and returns it
     * 
     * @see NDDB._masquerade
     * @api private
     * 
     */
    NDDB.prototype._masqueradeDB = function (db) {
        if (!db) return [];
        var out = [];
        for (var i = 0; i < db.length; i++) {
            out[i] = this._masquerade(db[i], out);
        }
        return out;
    };
    
    /**
     * Performs a series of automatic checkings 
     * and updates the db according to current 
     * configuration
     * 
     * @api private
     */
    NDDB.prototype._autoUpdate = function (options) {
    	var update = JSUS.merge(options || {}, this.__update);
    	
        if (update.pointer) {
            this.nddb_pointer = this.db.length-1;
        }
        if (update.sort) {
            this.sort();
        }
        
        if (update.indexes) {
            this.rebuildIndexes();
        }
        
        // Update also parent element
        if (this.__parent) {
        	this.__parent._autoUpdate(update);
        }
    }
    
    /**
     * Imports a whole array into the current database
     * 
     */
    NDDB.prototype.import = function (db) {
        if (!db) return [];
        if (!this.db) this.db = [];
        for (var i = 0; i < db.length; i++) {
            this.insert(db[i]);
        }
        //this.db = this.db.concat(this._masqueradeDB(db));
        //this._autoUpdate();
    };
    
    /**
     * Inserts an object into the current database
     * 
     */
    NDDB.prototype.insert = function (o) {
        if ('undefined' === typeof o) return;
        var o = this._masquerade(o);
        
        this.db.push(o);
        
        // We save time calling hashIt only
        // on the latest inserted element
        if (this.__update.indexes) {
        	this.hashIt(o);
        }
    	// See above
        this._autoUpdate({indexes: false});
    };
    
    /**
     * Creates a clone of the current NDDB object
     * with a reference to the parent database
     * 
     */
    NDDB.prototype.breed = function (db) {
        db = db || this.db;
        var options = this.cloneSettings();
        var parent = this.__parent || this;							
        
        //In case the class was inherited
        return new this.constructor(options, db, parent);
    };
        
    /**
     * Creates a configuration object to initialize
     * a new NDDB instance based on the current settings
     * and returns it
     * 
     */
    NDDB.prototype.cloneSettings = function () {
        var options = this.__options || {};
        
        options.H = 		this.__H;
        options.C = 		this.__C;
        options.tags = 		this.tags;
        options.update = 	this.__update;
        
        return JSUS.clone(options);
    };    
    
    /**
     * Returns a string representation of the state
     * of the database
     */
    NDDB.prototype.toString = function () {
        var out = '';
        for (var i=0; i< this.db.length; i++) {
            out += this.db[i] + '\n'
        }    
        return out;
    };    
        
    /**
     * Returns a string representation of the state
     * of the database
     */
    NDDB.prototype.toString = function () {
		var objToStr=function(o) {
			var s='{'
			for(x in o) {
				s+='"'+x+'": '
				switch(typeof(o[x])) {
					case 'object': s+=o[x].toString(); break;
					case 'string': s+='"'+o[x].toString()+'"'; break;
					default: s+=o[x].toString(); break;
				}
				s+=', '
			}
			s=s.replace(/, $/,'}')
			return s
		}
        var out = '['+objToStr(this.db[0])
        for (var i=1; i< this.db.length; i++) out += ', '+objToStr(this.db[i])
		out+=']'
        return out;
    };    
    
    
    /**
     * Adds a new comparator for dimension d 
     * 
     */
    NDDB.prototype.compare = NDDB.prototype.c = function (d, comparator) {
        if (!d || !comparator) {
            NDDB.log('Cannot set empty property or empty comparator', 'ERR');
            return false;
        }
        this.__C[d] = comparator;
        return true;
    };
    
//    /**
//     * Adds a new comparator for dimension d
//     * @depracated
//     */
//    NDDB.prototype.set = function (d, comparator) {
//        return this.d(d, comparator);
//    };

    /**
     * Returns the comparator function for dimension d. 
     * If no comparator was defined returns a generic
     * comparator function. 
     * 
     */
    NDDB.prototype.comparator = function (d) {
        if ('undefined' !== typeof this.__C[d]) {
        	return this.__C[d]; 
        }
        
        return function (o1, o2) {
//            NDDB.log('1' + o1);
//            NDDB.log('2' + o2);
            if ('undefined' === typeof o1 && 'undefined' === typeof o2) return 0;
            if ('undefined' === typeof o1) return 1;
            if ('undefined' === typeof o2) return -1;        
            var v1 = JSUS.getNestedValue(d,o1);
            var v2 = JSUS.getNestedValue(d,o2);
//            NDDB.log(v1);
//            NDDB.log(v2);
            if ('undefined' === typeof v1 && 'undefined' === typeof v2) return 0;
            if ('undefined' === typeof v1) return 1;
            if ('undefined' === typeof v2) return -1;
            if (v1 > v2) return 1;
            if (v2 > v1) return -1;
            return 0;
        };    
    };
    
    /**
     * Returns TRUE if this[key] exists
     */
    NDDB.prototype.isReservedWord = function (key) {
    	return (this[key]) ? true : false; 
    };
    
    /**
     * Adds an hashing function for the dimension d.
     * 
     * If no function is specified Object.toString is used.
     * 
     */
    NDDB.prototype.hash = NDDB.prototype.h = function (d, func) {
    	if ('undefined' === typeof d) {
    		NDDB.log('Cannot hash empty dimension', 'ERR');
    		return false;
    	}
    	
    	func = func || Object.toString;
    	
    	if (this.isReservedWord(d)) {
    		var str = 'A reserved word have been selected as an index. ';
    		str += 'Please select another one: ' + d;
    		NDDB.log(str, 'ERR');
    		return false;
    	}
    	
    	this.__H[d] = func;
    	
    	this[d] = {};
    	
    	return true;
    };
    
    /**
     * Resets and rebuilds the databases indexes defined
     * by the hashing functions
     */
    NDDB.prototype.rebuildIndexes = function() {
    	if (JSUS.isEmpty(this.__H)) {
    		return false;
    	} 	
    	// Reset current indexes
    	for (var key in this.__H) {
    		if (this.__H.hasOwnProperty(key)) {
    			this[key] = {};
    		}
    	}
    	
    	this.each(this.hashIt)
    };
    
    /**
     * Hashes an element and adds it to one of the indexes,
     * as defined by the hashing functions
     */
    NDDB.prototype.hashIt = function(o) {
      	if (!o) return false;
    	if (JSUS.isEmpty(this.__H)) {
    		return false;
    	}
    
    	var h = null;
    	var id = null;
    	var hash = null;
    	
    	for (var key in this.__H) {
    		if (this.__H.hasOwnProperty(key)) {
	    		if (o.hasOwnProperty(key)) {
    				
	    			h = this.__H[key];	    			
	    			hash = h(o);

    				if ('undefined' === typeof hash) {
    					continue;
    				}

    				if (!this[key]) {
    					this[key] = {};
    				}
    				
    				if (!this[key][hash]) {
    					this[key][hash] = new NDDB();
    				}
    				this[key][hash].db.push(o);
    			}
    		}
    	}
    };
    
    //////////////////////
    // 1. Sort and Select
    /////////////////////
    
    /**
     * Validates and prepares select queries before execution
     * 
     *  @api private
     */
    NDDB.prototype._analyzeQuery = function (d, op, value) {
        
        var raiseError = function (d,op,value) {
            var miss = '(?)';
            var err = 'Malformed query: ' + d || miss + ' ' + op || miss + ' ' + value || miss;
            NDDB.log(err, 'WARN');
            return false;
        };
        
    
        if ('undefined' === typeof d) raiseError(d,op,value);
        
        // Verify input 
        if ('undefined' !== typeof op) {
            if ('undefined' === typeof value) {
                raiseError(d,op,value);
            }
            
            if (!JSUS.in_array(op, ['>','>=','>==','<', '<=', '<==', '!=', '!==', '=', '==', '===', '><', '<>', 'in', '!in'])) {
                NDDB.log('Query error. Invalid operator detected: ' + op, 'WARN');
                return false;
            }
            
            if (op === '=') {
                op = '==';
            }
            
            // Range-queries need an array as third parameter
            if (JSUS.in_array(op,['><', '<>', 'in', '!in'])) {
                if (!(value instanceof Array)) {
                    NDDB.log('Range-queries need an array as third parameter', 'WARN');
                    raiseError(d,op,value);
                }
                if (op === '<>' || op === '><') {
                    
                    value[0] = JSUS.setNestedValue(d,value[0]);
                    value[1] = JSUS.setNestedValue(d,value[1]);
                }
            }
            else {
                // Encapsulating the value;
                value = JSUS.setNestedValue(d,value);
            }
        }
        else if ('undefined' !== typeof value) {
            raiseError(d,op,value);
        }
        else {
            op = '';
            value = '';
        }
        
        return {d:d,op:op,value:value};
    };
    
    /**
     * Select entries in the database according to the criteria 
     * specified as parameters.
     * 
     * Input parameters:
     * 
     *     - d: the string representation of the dimension used to filter. Mandatory.
     *     - op: operator for selection. Allowed: >, <, >=, <=, = (same as ==), ==, ===, 
     *             !=, !==, in (in array), !in, >< (not in interval), <> (in interval)
     *  - value: values of comparison. Operators: in, !in, ><, <> require an array.
     *  
     *  The selection is returned as a new NDDB object, on which further operations 
     *  can be chained. In order to get the actual entries of the db, it is necessary
     *  to fetch the values.
     *  
     *  @see NDDB.fetch()
     *  @see NDDB.fetchValues()
     */
    NDDB.prototype.select = function (d, op, value) {
    
        var valid = this._analyzeQuery(d, op, value);        
        if (!valid) return false;
        
        var d = valid.d;
        var op = valid.op;
        var value = valid.value;

        var comparator = this.comparator(d);
        
//        NDDB.log(comparator.toString());
//        NDDB.log(value);
        
        var exist = function (elem) {
            if ('undefined' !== typeof JSUS.getNestedValue(d,elem)) return elem;
        };
        
        var compare = function (elem) {
            try {    
//                console.log(elem);
//                console.log(value);
                if (JSUS.eval(comparator(elem, value) + op + 0, elem)) {
                    return elem;
                }
            }
            catch(e) {
                NDDB.log('Malformed select query: ' + d + op + value);
                return false;
            };
        };
        
        var between = function (elem) {
            if (comparator(elem, value[0]) > 0 && comparator(elem, value[1]) < 0) {
                return elem;
            }
        };
        
        var notbetween = function (elem) {
            if (comparator(elem, value[0]) < 0 && comparator(elem, value[1] > 0)) {
                return elem;
            }
        };
        
        var inarray = function (elem) {
            if (JSUS.in_array(JSUS.getNestedValue(d,elem), value)) {
                return elem;
            }
        };
        
        var notinarray = function (elem) {
            if (!JSUS.in_array(JSUS.getNestedValue(d,elem), value)) {
                return elem;
            }
        };
        
        switch (op) {
            case (''): var func = exist; break;
            case ('<>'): var func = notbetween; break;
            case ('><'): var func = between; break;
            case ('in'): var func = inarray; break;
            case ('!in'): var func = notinarray; break;
            default: var func = compare;
        }
        
        return this.filter(func);
    };

    /**
     * Creates a copy of the current database limited only to 
     * the first N entries, where N is the passed parameter.
     * 
     * Negative N selects starting from the end of the database.
     * 
     */
    NDDB.prototype.limit = function (limit) {
        if (limit === 0) return this.breed();
        var db = (limit > 0) ? this.db.slice(0, limit) :
                               this.db.slice(limit);
        
        return this.breed(db);
    };
        
    /**
     * Reverses the order of all the entries in the database
     * 
     */
    NDDB.prototype.reverse = function () {
        this.db.reverse();
        return this;
    };
        
    /**
     * Sort the db according to one of the following
     * criteria:
     *  
     *  - globalCompare function, if no parameter is passed 
     *  - one of the dimension, if a string is passed
     *  - a custom comparator function 
     * 
     * A reference to the current NDDB object is returned, so that
     * further operations can be chained. 
     * 
     */
      NDDB.prototype.sort = function (d) {
        // GLOBAL compare  
        if (!d) {
            var func = this.globalCompare;
        }
        
        // FUNCTION  
        else if ('function' === typeof d) {
          var func = d;
        }
        
        // ARRAY of dimensions
        else if (d instanceof Array) {
          var that = this;
          var func = function (a,b) {
            for (var i=0; i < d.length; i++) {
              var result = that.comparator(d[i]).call(that,a,b);
              if (result !== 0) return result;
            }
            return result;
          }
        }
        
        // SINGLE dimension
        else {
          var func = this.comparator(d);
        }
        
        this.db.sort(func);
        return this;
      };

    /**
     * Randomly shuffles all the entries of the database
     * 
     */
    NDDB.prototype.shuffle = function () {
        // TODO: check do we need to reassign __nddbid__ ?
        this.db = JSUS.shuffle(this.db);
        return true;
    };
        
    ////////////////////// 
    // 2. Custom callbacks
    //////////////////////
      
    /**
     * Filters the entries of the database according to the
     * specified callback function. A new NDDB instance is breeded.
     * 
     * @see NDDB.breed()
     * 
     */
    NDDB.prototype.filter= function (func) {
        return this.breed(this.db.filter(func));
    };
    
    
    /**
     * Applies a callback function to each element in the db.
     * 
     * It accepts a variable number of input arguments, but the first one 
     * must be a valid callback, and all the following are passed as parameters
     * to the callback
     * 
     */
    NDDB.prototype.each = NDDB.prototype.forEach = function () {
        if (arguments.length === 0) return;
        var func = arguments[0];    
        for (var i=0; i < this.db.length; i++) {
            arguments[0] = this.db[i];
            func.apply(this, arguments);
        }
    };
    
    /**
     * Applies a callback function to each element in the db, store
     * the results in an array and returns it.
     * 
     * @see NDDB.prototype.forEach
     * 
     */
    NDDB.prototype.map = function () {
        if (arguments.length === 0) return;
        var func = arguments[0];
        var out = [];
        var o = undefined;
        for (var i=0; i < this.db.length; i++) {
            arguments[0] = this.db[i];
            o = func.apply(this, arguments);
            if (o) out.push();
        }
        return out;
    };
    
    //////////////
    // 3. Deletion
    //////////////
    
    /**
     * Removes all entries from the database.  
     * If chained to a select query, elements in the parent 
     * object will be deleted too.
     * 
     */
    NDDB.prototype.delete = function () {
      if (!this.length) return this;
      
      if (this.__parent) {    	  
          for (var i=0; i < this.db.length; i++) {
        	  // Important: index changes as we deletes elements
              var idx = this.db[i].nddbid - i;
              this.__parent.db.splice(idx,1);
          };
          // TODO: we could make it with only one for loop
          // we loop on parent db and check whether the id is in the array
          // at the same time we decrement the nddbid depending on i
          for (var i=0; i < this.__parent.length; i++) {
              this.__parent.db[i].nddbid = i;
          };
      }
     
      this.db = [];
      
      this._autoUpdate();
      
      return this;
    };    
    
    /**
     * Removes all entries from the database. Requires an
     * additional parameter to confirm the deletion.
     * 
     * If chained to a select query, elements in parent 
     * object will be unaffected.
     * 
     */
    NDDB.prototype.clear = function (confirm) {
        if (confirm) {
            this.db = [];
            this._autoUpdate();
        }
        else {
            NDDB.log('Do you really want to clear the current dataset? Please use clear(true)', 'WARN');
        }
        
        return confirm;
    };    
    
    /////////////////////////
    // 4. Advanced operations
    /////////////////////////
    
    /**
     * Performs a *left* join across all the entries of the database
     * 
     * @see NDDB._join
     * 
     */
    NDDB.prototype.join = function (key1, key2, pos, select) {
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
        return this._join(key1, key2, JSUS.equals, pos, select);
    };
    
    /**
     * Copies all the entries (or selected properties of them) containing key2 
     * in all the entries containing key1.
     * 
     *  @see NDDB._join
     */
    NDDB.prototype.concat = function (key1, key2, pos, select) {        
        return this._join(key1, key2, function(){ return true;}, pos, select);
    };

    /**
     * Performs a *left* join across all the entries of the database
     * 
     * A new property is created in every matching entry contained the 
     * matched ones, or selected properties of them.  
     * 
     * Accepts two keys, a comparator function, the name of the containing 
     * property (default "joined") for matched entries, and an array with
     * the name of properties to select and copy in the matched entry.  
     * 
     * The values of two keys (also nested properties are accepted) are compared
     * according to the specified comparator callback, or using JSUS.equals.
     * 
     * A new NDDB object breeded, so that further operations can be chained.
     * 
     * TODO: check do we need to reassign __nddbid__ ?
     * 
     * @see NDDB.breed
     * 
     * @api private
     */
    NDDB.prototype._join = function (key1, key2, comparator, pos, select) {
        var comparator = comparator || JSUS.equals;
        var pos = ('undefined' !== typeof pos) ? pos : 'joined';
        if (select) {
            var select = (select instanceof Array) ? select : [select];
        }
        var out = [];
        var idxs = [];
        for (var i=0; i < this.db.length; i++) {
            try {
                var foreign_key = JSUS.eval('this.'+key1, this.db[i]);
                if ('undefined' !== typeof foreign_key) { 
                    for (var j=i+1; j < this.db.length; j++) {
                        try {
                            var key = JSUS.eval('this.'+key2, this.db[j]);
                            if ('undefined' !== typeof key) { 
                                if (comparator(foreign_key, key)) {
                                    // Inject the matched obj into the
                                    // reference one
                                    var o = JSUS.clone(this.db[i]);
                                    var o2 = (select) ? JSUS.subobj(this.db[j], select) : this.db[j];
                                    o[pos] = o2;
                                    out.push(o);
                                }
                            }
                        }
                        catch(e) {
                            NDDB.log('Key not found in entry: ' + key2, 'WARN');
                            //return false;
                        }
                    }
                }
            }
            catch(e) {
                NDDB.log('Key not found in entry: ' + key1, 'WARN');
                //return false;
            }
        }
        
        return this.breed(out);
    };
    
    /**
     * Splits an object along a specified dimension, and returns 
     * all the copies in an array.
     *  
     * It creates as many new objects as the number of properties 
     * contained in the specified dimension. The object are identical,
     * but for the given dimension, which was split. E.g.
     * 
     *  var o = { a: 1,
     *            b: {c: 2,
     *                d: 3
     *            },
     *            e: 4
     *  };
     *  
     *  becomes
     *  
     *  [{ a: 1,
     *     b: {c: 2},
     *     e: 4
     *  },
     *  { a: 1,
     *    b: {d: 3},
     *    e: 4
     *  }];
     * 
     */
    NDDB.prototype._split = function (o, key) {        
        
        if ('object' !== typeof o[key]) {
            return JSUS.clone(o);
        }
        
        var out = [];
        var model = JSUS.clone(o);
        model[key] = {};
        
        var splitValue = function (value) {
            for (var i in value) {
                var copy = JSUS.clone(model);
                if (value.hasOwnProperty(i)) {
                    if ('object' === typeof value[i]) {
                        out = out.concat(splitValue(value[i]));
                    }
                    else {
                        copy[key][i] = value[i]; 
                        out.push(copy);
                    }
                }
            }
            return out;
        };
        
        return splitValue(o[key]);
    };
    
    /**
     * Splits all the entries in the database containing
     * the passed dimension. 
     * 
     * New entries are created and a new NDDB object is
     * breeded to allows method chaining.
     * 
     * @see NDDB._split
     * 
     */
    NDDB.prototype.split = function (key) {    
        var out = [];
        for (var i=0; i < this.db.length;i++) {
            out = out.concat(this._split(this.db[i], key));
        }
        //console.log(out);
        return this.breed(out);
    };
    
    //////////////
    // 5. Fetching
    //////////////
    
    /**
     * Performs the fetching of the entries according to the
     * specified parameters. 
     * 
     * @api private
     * 
     * @see NDDB.fetch
     * @see NDDB.fetchArray
     * @see NDDB.fetchKeyArray
     * 
     */
    NDDB.prototype._fetch = function (key, array) {
        
        function getValues (o, key) {        
            return JSUS.getNestedValue(key, o);
        };
        
        function getValuesArray (o, key) {
            var el = JSUS.getNestedValue(key, o);
            if ('undefined' !== typeof el) {
                return JSUS.obj2KeyedArray(el);
            }
        };
        
        function getKeyValuesArray (o, key) {
            var el = JSUS.getNestedValue(key, o);
            if ('undefined' !== typeof el) {
                return key.split('.').concat(JSUS.obj2KeyedArray(el));
            }
        };
                
        switch (array) {
            case 'VALUES':
                var func = (key) ? getValuesArray : 
                                   JSUS.obj2Array;
                
                break;
            case 'KEY_VALUES':
                var func = (key) ? getKeyValuesArray :
                                   JSUS.obj2KeyedArray;
                break;
                
            default: // results are not 
                if (!key) return this.db;
                var func = getValues;        
        }
        
        var out = [];    
        for (var i=0; i < this.db.length; i++) {
            var el = func.call(this.db[i], this.db[i], key);
            if ('undefined' !== typeof el) out.push(el);
        }    
        
        return out;
    }
    
    /**
     * Fetches all the entries in the database and returns 
     * them in a array. 
     * 
     * If a second key parameter is passed, only the value of 
     * the property named after the key are returned, otherwise  
     * the whole entry is returned as it is. E.g.:
     * 
     * 
     * var nddb = new NDDB();
     * nddb.import([{a:1,
     *                  b:{c:2},
     *                  d:3
     *               }]);
     * 
     * nddb.fetch();    // [ {a: 1, b: {c: 2}, d: 3} ] 
     * nddb.fetch('b'); // [ {c: 2} ];
     * nddb.fetch('d'); // [ 3 ];
     * 
     * No further chaining is permitted after fetching.
     * 
     * @see NDDB._fetch
     * @see NDDB.fetchArray
     * @see NDDB.fetchKeyArray
     * 
     */
    NDDB.prototype.fetch = function (key) {
        return this._fetch(key, true);
    };
    
    /**
     * Fetches all the entries in the database, transforms them into 
     * one-dimensional array by exploding all nested values, and returns
     * them into an array.
     * 
     * If a second key parameter is passed, only the value of the property
     * named after the key is returned, otherwise the whole entry 
     * is exploded, and its values returned in a array.  E.g.:
     * 
     * var nddb = new NDDB();
     * nddb.import([{a:1,
     *                  b:{c:2},
     *                  d:3
     *               }]);
     * 
     * nddb.fetchArray();     // [ [ 1, 2, 3 ] ]
     * nddb.fetchArray('b'); // [ ['c', 2 ] ]
     * nddb.fetchArray('d'); // [ [ 3 ] ];
     * 
     * 
     */
    NDDB.prototype.fetchArray = function (key) {
        return this._fetch(key, 'VALUES');
    };
    
    /**
     * Exactly as NDDB.fetchArray, but also the keys are added to the
     * returned values. E.g.
     * 
     * var nddb = new NDDB();
     * nddb.import([{a:1,
     *                  b:{c:2},
     *                  d:3
     *               }]);
     * 
     * nddb.fetchArray();        // [ [ 'a', 1, 'c', 2, 'd', 3 ] ]
     * nddb.fetchKeyArray('b'); // [ [ 'b', 'c', 2 ] ] 
     * nddb.fetchArray('d');    // [ [ 'd', 3 ] ]
     * 
     * @see NDDB.fetchArray
     */
    NDDB.prototype.fetchKeyArray = function (key) {
        return this._fetch(key, 'KEY_VALUES');
    };
    
    /**
     * @deprecated
     * @see NDDB.fetchArray
     * 
     */
    NDDB.prototype.fetchValues = function (key) {
        return this._fetch(key, 'VALUES');
    };
    
    /**
     * @deprecated
     * @see NDDB.fetchKeyArray
     */
    NDDB.prototype.fetchKeyValues = function (key) {
        return this._fetch(key, 'KEY_VALUES');
    };
                
    /**
     * Splits the entries in the database in subgroups,
     * each of them formed up by element which have the
     * same value along the specified dimension. An array
     * of NDDB instances is returned, therefore no direct 
     * method chaining is allowed afterwards. 
     * 
     * Entries containing undefined values in the specified
     * dimension will be skipped 
     * 
     */
    NDDB.prototype.groupBy = function (key) {
        if (!key) return this.db;
        
        var groups = [];
        var outs = [];
        for (var i=0; i < this.db.length; i++) {
            var el = JSUS.getNestedValue(key, this.db[i]);
            if ('undefined' === typeof el) continue;
            
            // Creates a new group and add entries
            // into it
            if (!JSUS.in_array(el, groups)) {
                groups.push(el);
                
                var out = this.filter(function (elem) {
                    if (JSUS.equals(JSUS.getNestedValue(key, elem),el)) {
                        return this;
                    }
                });
                
                outs.push(out);
            }
            
        }
        
        //NDDB.log(groups);
        
        return outs;
    };    
    
    
    ////////////////
    // 6. Statistics
    ////////////////
    
    /**
     * Returns the total count of all the entries 
     * in the database containing the specified key. 
     * 
     * If key is undefined, the size of the databse is returned.
     * 
     * @see NDDB.size
     */
    NDDB.prototype.count = function (key) {
        if ('undefined' === typeof key) return this.db.length;
        var count = 0;
        for (var i=0; i < this.db.length; i++) {
            try {
                var tmp = JSUS.eval('this.' + key, this.db[i]);
                if ('undefined' !== typeof tmp) {
                    count++;
                }
            }
            catch (e) {};
        }    
        return count;
    };
    
    
    /**
     * Returns the total sum of the values of all the entries 
     * in the database containing the specified key. 
     * 
     * Non numeric values are ignored. 
     * 
     */
    NDDB.prototype.sum = function (key) {
        var sum = 0;
        for (var i=0; i < this.db.length; i++) {
            try {
                var tmp = JSUS.getNestedValue(key, this.db[i]);
                if (!isNaN(tmp)) {
                    sum += tmp;
                }
            }
            catch (e) {};
        }    
        return sum;
    };
    
    /**
     * Returns the average of the values of all the entries 
     * in the database containing the specified key. 
     * 
     * Entries with non numeric values are ignored, and excluded
     * from the computation of the mean.
     * 
     */
    NDDB.prototype.mean = function (key) {
        var sum = 0;
        var count = 0;
        for (var i=0; i < this.db.length; i++) {
            try {
                var tmp = JSUS.eval('this.' + key, this.db[i]);
                if (!isNaN(tmp)) { 
                    //NDDB.log(tmp);
                    sum += tmp;
                    count++;
                }
            }
            catch (e) {};
        }    
        return (count === 0) ? 0 : sum / count;
    };
    
    /**
     * Returns the min of the values of all the entries 
     * in the database containing the specified key. 
     * 
     * Entries with non numeric values are ignored. 
     * 
     */
    NDDB.prototype.min = function (key) {
        var min = false;
        for (var i=0; i < this.db.length; i++) {
            try {
                var tmp = JSUS.eval('this.' + key, this.db[i]);
                if (!isNaN(tmp) && (tmp < min || min === false)) {
                    min = tmp;
                }
            }
            catch (e) {};
        }    
        return min;
    };

    /**
     * Returns the max of the values of all the entries 
     * in the database containing the specified key. 
     * 
     * Entries with non numeric values are ignored. 
     * 
     */
    NDDB.prototype.max = function (key) {
        var max = false;
        for (var i=0; i < this.db.length; i++) {
            try {
                var tmp = JSUS.eval('this.' + key, this.db[i]);
                if (!isNaN(tmp) && (tmp > max || max === false)) {
                    max = tmp;
                }
            }
            catch (e) {};
        }    
        return max;
    };
        
    //////////
    // 7. Diff
    /////////
    
    /**
     * Performs a diff of the entries in the database and the database
     * object passed as parameter (can be instance of Array or NDDB).
     * 
     * Returns all the entries which are present in the current
     * instance of NDDB and *not* in the database obj passed 
     * as parameter.
     * 
     */
    NDDB.prototype.diff = function (nddb) {
        if (!nddb) return this;
        if ('object' === typeof nddb) {
            if (nddb instanceof NDDB || nddb instanceof this.constructor) {
                var nddb = nddb.db;
            }
        }
        if (nddb.length === 0) return this;
        var that = this;
        return this.filter(function(el) {
            for (var i=0; i < nddb.length; i++) {
                if (that.globalCompare(el,nddb[i]) === 0) {
                    return false;
                }
            }
            return el;
        });
    };
    
    /**
     * Performs a diff of the entries in the database and the database 
     * object passed as parameter (can be instance of Array or NDDB).
     * 
     * Returns all the entries which are present both in the current
     * instance of NDDB and in the database obj passed as parameter.
     * 
     */
    NDDB.prototype.intersect = function (nddb) {
        if (!nddb) return this;
        if ('object' === typeof nddb) {
            if (nddb instanceof NDDB || nddb instanceof this.constructor) {
                var nddb = nddb.db;
            }
        }
        var that = this;
        return this.filter(function(el) {
            for (var i=0; i < nddb.length; i++) {
                if (that.globalCompare(el,nddb[i]) === 0) {
                    return el;
                }
            }
        });
    };
    
    /////////////
    // 8 Iterator
    ////////////
    
    /**
     * Returns the entry in the database, at which 
     * the iterator is currently pointing. 
     * 
     * If a parameter is passed, then returns the entry
     * with the same internal id. The pointer is *not*
     * automatically updated. 
     * 
     * Returns false, if the pointer is at invalid position.
     * 
     */
    NDDB.prototype.get = function (pos) {
        var pos = pos || this.nddb_pointer;
        if (pos < 0 || pos > (this.db.length-1)) {
        	return false;
        }
        return this.db[pos];
    };
        
    /**
     * Moves the pointer to the next entry in the database 
     * and returns it.
     * 
     * Returns false if the pointer is at the last entry,
     * or if database is empty.
     * 
     */
    NDDB.prototype.next = function () {
        var el = NDDB.prototype.get.call(this, ++this.nddb_pointer);
        if (!el) this.nddb_pointer--;
        return el;
    };
    
    /**
     * Moves the pointer to the previous entry in the database 
     * and returns it.
     * 
     * Returns false if the pointer is at the first entry,
     * or if database is empty.
     * 
     */
    NDDB.prototype.previous = function () {
        var el = NDDB.prototype.get.call(this, --this.nddb_pointer);
        if (!el) this.nddb_pointer++;
        return el;
    };
    
    /**
     * Moves the pointer to the first entry in the database.
     * 
     * Returns the first entry of the database, or undefined 
     * if the database is empty.
     * 
     */
    NDDB.prototype.first = function (key) {
        var db = this.fetch(key);
        if (db.length > 0) {
            this.nddb_pointer = db[0].nddbid;
            return db[0];
        }
        return undefined;
    };
    
    /**
     * Moves the pointer to the first last in the database.
     * 
     * Returns the last entry of the database, or undefined 
     * if the database is empty.
     * 
     */
    NDDB.prototype.last = function (key) {
        var db = this.fetch(key);
        if (db.length > 0) {
            this.nddb_pointer = db[db.length-1].nddbid;
            return db[db.length-1];
        }
        return undefined;
    };
    
    /////////////
    // 9. Tagging
    /////////////
    
    /**
     * Registers a tag associated to an internal id.
     * 
     * @TODO: tag should be updated with shuffling and sorting
     * operations.
     * 
     * @status: experimental
     * 
     * @see NDDB.resolveTag
     */
    NDDB.prototype.tag = function (tag, idx) {
        if ('undefined' === typeof tag) {
            NDDB.log('Cannot register empty tag.', 'ERR');
            return;
        }
        var idx = idx || this.nddb_pointer;
        this.tags[tag] = idx;
    };
    
    /**
     * Returns the element associated to the given tag.
     * 
     * @status: experimental
     */
    NDDB.prototype.resolveTag = function (tag) {
        if ('undefined' === typeof tag) return false;
        return this.tags[tag];
    };
    
    
 // if node
	if ('object' === typeof module && 'function' === typeof require) {
	    var fs = require('fs');
	    
	    NDDB.prototype.save = function (file, callback) {
			file = file || this.file; // TODO check
			fs.writeFile(file, this.toString(), 'utf-8', function(e) {
				if (e) throw e
				if (callback) callback();
			});
		};
		
		NDDB.prototype.load = function (file, sync, callback) {
			file = file || this.file;
			sync = ('undefined' !== typeof sync) ? sync : true; 
				
			if (sync) { 
				var s = fs.readFileSync(file, 'utf-8');
				this.import(JSON.parse(s.toString()));
			}
			else {
				fs.readFile(file, 'utf-8', function(e, s) {
					if (e) throw e
					this.import(JSON.parse(s.toString()));
					if (callback) callback();
				});
			}
		};
		
	}
	// end node
    
    
})(
    'undefined' !== typeof module && 'undefined' !== typeof module.exports ? module.exports: window
  , 'undefined' != typeof JSUS ? JSUS : module.parent.exports.JSUS
);