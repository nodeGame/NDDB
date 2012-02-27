(function (exports, JSUS) {
	
	/**
	 * Status of the documentation: incomplete. 
	 * 
	 * NDDB provides a simple, lightweight, NO-SQL object database 
	 * for node.js and the browser. It depends on JSUS.
	 * 
	 * Allows to define any number of comparator functions, which are 
	 * associated to any of the dimensions (i.e. properties) of the 
	 * objects stored in the database. Whenever a comparison is needed,
	 * the corresponding comparator function is called, and the database
	 * is updated.
	 * 
	 * NDDB is work in progress. Currently, the following methods are
	 * implemented"
	 * 
	 * 	1. Sorting and selecting:
	 * 
	 *  	- select, sort, reverse, last, first, limit, shuffle
	 *  
	 *  2. Advanced operations
	 *  
	 *  	- split, join, concat
	 *  
	 *  3. Custom callbacks
	 *  
	 *  	- map, forEach, filter
	 *  
	 *  4. Statistics operator
	 *  
	 *  	- size, count, max, min, mean
	 *  
	 *  5. Iterator
	 *  
	 *  	- previous, next, first, last
	 *  
	 *  6. Diff
	 *  
	 *  	- diff, intersect
	 *  
	 *  7. Tagging
	 *  
	 *  	- tag
	 *  
	 *  8. Fetching
	 *  
	 *  	- fetch
	 *  
	 *  
	 *   Allows methods chaining for selection queries. 
	 *   Internal pointer to last inserted entry.
	 *   
	 *  - Update must be performed manually after a selection.
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
	
	function NDDB (options, db) {				
		var options = options || {};
		
		this.D = {};			// The n-dimensional container for comparator functions
		this.nddb_pointer = 0;	// Pointer for iterating along all the elements
		
		this.options = options;
		NDDB.log = options.log || NDDB.log;
		this.D = options.D || this.D;
		if ('undefined' !== typeof options.parentDB) {
			this.parentDB = options.parentDB;
		}	
		this.nddb_pointer = options.nddb_pointer;
		this.auto_update_pointer = ('undefined' !== typeof options.auto_update_pointer) ?
										options.auto_update_pointer
									:	false;
		
		this.auto_sort =  ('undefined' !== typeof options.auto_sort) ? options.auto_sort
																	 : false;
		
		this.tags = options.tags || {};	
		this.db = this.import(db);	// The actual database
		console.log(this);
	};
	
	///////////
	// 0. Core
	//////////
	
	/**
	 * Default function used for sorting
	 * 
	 */
	NDDB.prototype.globalCompare = function(o1, o2) {
		if (!o1 && !o2) return 0;
		if (!o1) return -1;
		if (!o2) return 1;	
		if (o1.nddbid < o2.nddbid) return 1;
		if (o1.nddbid > o2.nddbid) return -1;
		return 0;
	};

	/**
	 * Returns the size of the database
	 * 
	 */
	NDDB.prototype.size = function() {
		return this.db.length 
	};
	
	/**
	 * Adds a special id into the __proto__ object of 
	 * the object
	 * 
	 * @api private
	 */
	NDDB.prototype._masquerade = function (o, db) {
		if (!o) return false;
		// TODO: check this
		if (o.__proto__.nddbid) return o;
		var db = db || this.db;
		o.__proto__ = JSUS.clone(o.__proto__);
		o.__proto__.nddbid = db.length;
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
	NDDB.prototype._autoUpdate = function () {
		if (this.auto_update_pointer) {
			this.nddb_pointer = this.db.length-1;
		}
		if (this.auto_sort) {
			this.sort();
		}
	}
	
	/**
	 * Imports a whole array into the current database
	 * 
	 */
	NDDB.prototype.import = function (db) {
		if (!db) return [];
		this.db = this.db.concat(this._masqueradeDB(db));
		this._autoUpdate();
	};
	
	/**
	 * Inserts an object into the current database
	 * 
	 */
	NDDB.prototype.insert = function (o) {
		if (!o) return;
		this.db.push(this._masquerade(o));
		this._autoUpdate();
	};
	
	/**
	 * Creates a clone of the current NDDB object
	 * with a reference to the parent database
	 * 
	 */
	NDDB.prototype.breed = function (db) {
		var db = db || this.db;
		var options = this.cloneSettings();
		options.parentDB = this.db;
		//In case the class was inherited
		return new this.constructor(options, db);
	};
		
	/**
	 * Creates a configuration object to initialize
	 * a new NDDB instance based on the current settings
	 * and returns it
	 * 
	 */
	NDDB.prototype.cloneSettings = function () {
		if (!this.options) return {};
		var o = JSUS.clone(this.options);
		o.D = JSUS.clone(this.D);
		// TODO: shall we include parentDB as well here?
		return o;
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
	 * Adds a new comparator for dimension d 
	 * 
	 */
	NDDB.prototype.d = function (d, comparator) {
		if (!d || !comparator) {
			NDDB.log('Cannot set empty property or empty comparator', 'ERR');
			return false;
		}
		this.D[d] = comparator;
		return true;
	};
	
	/**
	 * Adds a new comparator for dimension d
	 * @depracated
	 */
	NDDB.prototype.set = function (d, comparator) {
		return this.d(d, comparator);
	};

	/**
	 * Returns the comparator function for dimension d. 
	 * If no comparator was defined returns a generic
	 * comparator function. 
	 * 
	 */
	NDDB.prototype.comparator = function (d) {
		return ('undefined' !== typeof this.D[d]) ? this.D[d] : function (o1, o2) {
//			NDDB.log('1' + o1);
//			NDDB.log('2' + o2);
			if (!o1 && !o2) return 0;
			if (!o1) return -1;
			if (!o2) return 1;		
			var v1 = JSUS.getNestedValue(d,o1);
			var v2 = JSUS.getNestedValue(d,o2);
//			NDDB.log(v1);
//			NDDB.log(v2);
			if (!v1 && !v2) return 0;
			if (!v1) return -1;
			if (!v2) return 1;
			if (v1 > v2) return 1;
			if (v2 > v1) return -1;
			return 0;
		};	
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
	 * 	- d: the string representation of the dimension used to filter. Mandatory.
	 * 	- op: operator for selection. Allowed: >, <, >=, <=, = (same as ==), ==, ===, 
	 * 			!=, !==, in (in array), !in, >< (not in interval), <> (in interval)
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
		
//		NDDB.log(comparator.toString());
//		NDDB.log(value);
		
		var exist = function (elem) {
			if ('undefined' !== typeof JSUS.getNestedValue(d,elem)) return elem;
		};
		
		var compare = function (elem) {
			try {	
//				console.log(elem);
//				console.log(value);
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
	 *  - one of the dimension, if a string of
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
	NDDB.prototype.filter = function (func) {
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
	NDDB.prototype.forEach = function () {
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
		for (var i=0; i < this.db.length; i++) {
			arguments[0] = this.db[i];
			out.push(func.apply(this, arguments));
		}
		return out;
	};
	
	///////////
	// Deletion
	///////////
	
	/**
	 * Removes all entries from the database.  
	 * If chained to a select query, elements in the parent 
	 * object will be deleted too.
	 * 
	 */
	NDDB.prototype.delete = function () {
	  if (this.db.length === 0) return this;
	  if (this.parentDB) {
		  for (var i=0; i < this.db.length; i++) {
			  var idx = this.db[i].__proto__.nddbid - i;
			  this.parentDB.splice(idx,1);
		  };
		  // TODO: we could make it with only one for loop
		  // we loop on parent db and check whether the id is in the array
		  // at the same time we decrement the nddbid depending on i
		  for (var i=0; i < this.parentDB.length; i++) {
			  this.parentDB[i].__proto__.nddbid = i;
		  };
	  }
	  this.db = [];
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
		}
		else {
			NDDB.log('Do you really want to clear the current dataset? Please use clear(true)', 'WARN');
		}
		
		return confirm;
	};	
	
	/////////////////////////
	// Advanced operations
	////////////////////////
	
	/**
	 * Performs a *left* join across all the entries of the database
	 * 
	 * @see NDDB._join
	 * 
	 */
	NDDB.prototype.join = function (key1, key2, pos, select) {
		// Construct a better comparator function
		// than the generic JSUS.equals
//		if (key1 === key2 && 'undefined' !== typeof this.D[key1]) {
//			var comparator = function(o1,o2) {
//				if (this.D[key1](o1,o2) === 0) return true;
//				return false;
//			}
//		}
//		else {
//			var comparator = JSUS.equals;
//		}
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
	
	NDDB.prototype._split = function (o, key) {		
		
		if ('object' !== typeof o[key]) {
			return JSUS.clone(o);;
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
	
	NDDB.prototype.split = function (key) {	
		var out = [];
		for (var i=0; i<this.db.length;i++) {
			out = out.concat(this._split(this.db[i], key));
		}
		return this.breed(out);
	};
	
	///////////
	// Fetching
	///////////
	
	NDDB._getValues = function (o, key) {		
		return JSUS.eval('this.' + key, o);
	};
	
	NDDB._getValuesArray = function (o, key) {		
		return JSUS.obj2KeyedArray(JSUS.eval('this.' + key, o));
	};
	
	NDDB._getKeyValuesArray = function (o, key) {
		return [key].concat(JSUS.obj2KeyedArray(JSUS.eval('this.' + key, o)));
	};
	
	NDDB.prototype.fetch = function (key, array) {
		
//		NDDB.log(key);
//		NDDB.log(array);
		
		switch (array) {
			case 'VALUES':
				var func = (key) ? NDDB._getValuesArray : 
								   JSUS.obj2Array;
				
				break;
			case 'KEY_VALUES':
				var func = (key) ? NDDB._getKeyValuesArray :
								   JSUS.obj2KeyedArray;
				break;
				
			default: // results are not 
				if (!key)  return this.db;
				var func = NDDB._getValues;  	  
		}
		
		var out = [];	
		for (var i=0; i < this.db.length; i++) {
			out.push(func.call(this.db[i], this.db[i], key));
		}	
		
		//NDDB.log(out);
		return out;
	};
	
	NDDB.prototype.fetchValues = function (key) {
		return this.fetch(key, 'VALUES');
	};
	
	NDDB.prototype.fetchKeyValues = function (key) {
		return this.fetch(key, 'KEY_VALUES');
	};
			
	NDDB.prototype.limit = function (limit) {
		if (limit === 0) return this.breed();
		var db = (limit > 0) ? this.db.slice(0, limit) :
							   this.db.slice(limit);
		
		return this.breed(db);
	};
	
	NDDB.prototype.groupBy = function (key) {
		if (!key) return this.db;
		
		var groups = [];
		var outs = [];
		for (var i=0; i < this.db.length; i++) {
			try {
				var el = JSUS.eval('this.' + key, this.db[i]);
			}
			catch(e) {
				NDDB.log('groupBy malformed key: ' + key, 'ERR');
				return false;
			};
						
			if (!JSUS.in_array(el,groups)) {
				groups.push(el);
				
				var out = this.filter(function (elem) {
					if (JSUS.equals(JSUS.eval('this.' + key, elem),el)) {
						return this;
					}
				});
				
				outs.push(out);
			}
			
		}
		
		//NDDB.log(groups);
		
		return outs;
	};	
	
	
	/////////////
	// Statistics
	/////////////
	
	/**
	 * Returns the total count of all the entries 
	 * in the database containing the specified key. 
	 * 
	 * @TODO: use JSUS.getNestedValue instead 
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
	 * @TODO: use JSUS.getNestedValue instead
	 * 
	 * Non numeric values are ignored. 
	 * 
	 */
	NDDB.prototype.sum = function (key) {
		var sum = 0;
		for (var i=0; i < this.db.length; i++) {
			try {
				var tmp = JSUS.eval('this.' + key, this.db[i]);
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
	 * @TODO: use JSUS.getNestedValue instead
	 * 
	 * Entries with non numeric values are ignored. 
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
	 * @TODO: use JSUS.getNestedValue instead
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
	 * @TODO: use JSUS.getNestedValue instead
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
		
	///////
	// Diff
	///////
	
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
		return this.filter(function(el){
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
	
	///////////
	// Iterator
	///////////
	
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
		if (pos < 0 || pos > (this.db.length-1)) return false;
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
	
	//////////
	// Tagging
	//////////
	
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
		if (!tag) return false;
		return this.tags[tag];
	};
	
})(
	'undefined' !== typeof module && 'undefined' !== typeof module.exports ? module.exports: window
  , 'undefined' != typeof JSUS ? JSUS : module.parent.exports.JSUS
);
