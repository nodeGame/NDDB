// cycle.js
// 2011-08-24

/*jslint evil: true, regexp: true */

/*members $ref, apply, call, decycle, hasOwnProperty, length, prototype, push,
    retrocycle, stringify, test, toString
*/

if (typeof JSON.decycle !== 'function') {
    JSON.decycle = function decycle(object) {
        'use strict';

// Make a deep copy of an object or array, assuring that there is at most
// one instance of each object or array in the resulting structure. The
// duplicate references (which might be forming cycles) are replaced with
// an object of the form
//      {$ref: PATH}
// where the PATH is a JSONPath string that locates the first occurance.
// So,
//      var a = [];
//      a[0] = a;
//      return JSON.stringify(JSON.decycle(a));
// produces the string '[{"$ref":"$"}]'.

// JSONPath is used to locate the unique object. $ indicates the top level of
// the object or array. [NUMBER] or [STRING] indicates a child member or
// property.

        var objects = [],   // Keep a reference to each unique object or array
            paths = [];     // Keep the path to each unique object or array

        return (function derez(value, path) {

// The derez recurses through the object, producing the deep copy.

            var i,          // The loop counter
                name,       // Property name
                nu;         // The new object or array

            switch (typeof value) {
            case 'object':

// typeof null === 'object', so get out if this value is not really an object.

                if (!value) {
                    return null;
                }

// If the value is an object or array, look to see if we have already
// encountered it. If so, return a $ref/path object. This is a hard way,
// linear search that will get slower as the number of unique objects grows.

                for (i = 0; i < objects.length; i += 1) {
                    if (objects[i] === value) {
                        return {$ref: paths[i]};
                    }
                }

// Otherwise, accumulate the unique value and its path.

                objects.push(value);
                paths.push(path);

// If it is an array, replicate the array.

                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    nu = [];
                    for (i = 0; i < value.length; i += 1) {
                        nu[i] = derez(value[i], path + '[' + i + ']');
                    }
                } else {

// If it is an object, replicate the object.

                    nu = {};
                    for (name in value) {
                        if (Object.prototype.hasOwnProperty.call(value, name)) {
                            nu[name] = derez(value[name],
                                path + '[' + JSON.stringify(name) + ']');
                        }
                    }
                }
                return nu;
            case 'number':
            case 'string':
            case 'boolean':
                return value;
            }
        }(object, '$'));
    };
}


if (typeof JSON.retrocycle !== 'function') {
    JSON.retrocycle = function retrocycle($) {
        'use strict';

// Restore an object that was reduced by decycle. Members whose values are
// objects of the form
//      {$ref: PATH}
// are replaced with references to the value found by the PATH. This will
// restore cycles. The object will be mutated.

// The eval function is used to locate the values described by a PATH. The
// root object is kept in a $ variable. A regular expression is used to
// assure that the PATH is extremely well formed. The regexp contains nested
// * quantifiers. That has been known to have extremely bad performance
// problems on some browsers for very long strings. A PATH is expected to be
// reasonably short. A PATH is allowed to belong to a very restricted subset of
// Goessner's JSONPath.

// So,
//      var s = '[{"$ref":"$"}]';
//      return JSON.retrocycle(JSON.parse(s));
// produces an array containing a single element which is the array itself.

        var px =
            /^\$(?:\[(?:\d+|\"(?:[^\\\"\u0000-\u001f]|\\([\\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*\")\])*$/;

        (function rez(value) {

// The rez function walks recursively through the object looking for $ref
// properties. When it finds one that has a value that is a path, then it
// replaces the $ref object with a reference to the value that is found by
// the path.

            var i, item, name, path;

            if (value && typeof value === 'object') {
                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    for (i = 0; i < value.length; i += 1) {
                        item = value[i];
                        if (item && typeof item === 'object') {
                            path = item.$ref;
                            if (typeof path === 'string' && px.test(path)) {
                                value[i] = eval(path);
                            } else {
                                rez(item);
                            }
                        }
                    }
                } else {
                    for (name in value) {
                        if (typeof value[name] === 'object') {
                            item = value[name];
                            if (item) {
                                path = item.$ref;
                                if (typeof path === 'string' && px.test(path)) {
                                    value[name] = eval(path);
                                } else {
                                    rez(item);
                                }
                            }
                        }
                    }
                }
            }
        }($));
        return $;
    };
}
/**
 * # Shelf.JS 
 * 
 * Persistent Client-Side Storage @VERSION
 * 
 * Copyright 2012 Stefano Balietti
 * GPL licenses.
 * 
 * ---
 * 
 */
(function(exports){
	
var version = '0.3';

var store = exports.store = function (key, value, options, type) {
	options = options || {};
	type = (options.type && options.type in store.types) ? options.type : store.type;
	if (!type || !store.types[type]) {
		store.log("Cannot save/load value. Invalid storage type selected: " + type, 'ERR');
		return;
	}
	store.log('Accessing ' + type + ' storage');
	
	return store.types[type](key, value, options);
};

// Adding functions and properties to store
///////////////////////////////////////////
store.name = "__shelf__";

store.verbosity = 0;
store.types = {};

var mainStorageType = null;

Object.defineProperty(store, 'type', {
	set: function(type){
		if ('undefined' === typeof store.types[type]) {
			store.log('Cannot set store.type to an invalid type: ' + type);
			return false;
		}
		mainStorageType = type;
		return type;
	},
	get: function(){
		return mainStorageType;
	},
	configurable: false,
	enumerable: true,
});

store.addType = function (type, storage) {
	store.types[type] = storage;
	store[type] = function (key, value, options) {
		options = options || {};
		options.type = type;
		return store(key, value, options);
	};
	
	if (!store.type || store.type === "volatile") {
		store.type = type;
	}
};

store.error = function() {
	return "shelf quota exceeded"; 
};

store.log = function(text) {
	if (store.verbosity > 0) {
		console.log('Shelf v.' + version + ': ' + text);
	}
	
};

Object.defineProperty(store, 'persistent', {
	set: function(){},
	get: function(){
		if (!store.types.length) return false;
		if (store.types.length === 1 && store.type === "volatile") return false;
		return true;
	},
	configurable: false,
});

store.decycle = function(o) {
	if (JSON && JSON.decycle && 'function' === typeof JSON.decycle) {
		o = JSON.decycle(o);
	}
	return o;
};
    
store.retrocycle = function(o) {
	if (JSON && JSON.retrocycle && 'function' === typeof JSON.retrocycle) {
		o = JSON.retrocycle(o);
	}
	return o;
};

store.stringify = function(o) {
	if (!JSON || !JSON.stringify || 'function' !== typeof JSON.stringify) {
		throw new Error('JSON.stringify not found. Received non-string value and could not serialize.');
	}
	
	o = store.decycle(o);
	return JSON.stringify(o);
};

store.parse = function(o) {
	if ('undefined' === typeof o) return undefined;
	if (JSON && JSON.parse && 'function' === typeof JSON.parse) {
		try {
			o = JSON.parse(o);
		}
		catch (e) {
			store.log('Error while parsing a value: ' + e, 'ERR');
			store.log(o);
		}
	}
	
	o = store.retrocycle(o);
	return o;
};

// ## In-memory storage
// ### fallback for all browsers to enable the API even if we can't persist data
(function() {
	
	var memory = {},
		timeout = {};
	
	function copy(obj) {
		return store.parse(store.stringify(obj));
	}

	store.addType("volatile", function(key, value, options) {
		
		if (!key) {
			return copy(memory);
		}

		if (value === undefined) {
			return copy(memory[key]);
		}

		if (timeout[key]) {
			clearTimeout(timeout[key]);
			delete timeout[key];
		}

		if (value === null) {
			delete memory[key];
			return null;
		}

		memory[key] = value;
		if (options.expires) {
			timeout[key] = setTimeout(function() {
				delete memory[key];
				delete timeout[key];
			}, options.expires);
		}

		return value;
	});
}());

}('undefined' !== typeof module && 'undefined' !== typeof module.exports ? module.exports: this));

/**
 * ## File System storage for Shelf.js
 * 
 * ### Available only in Node.JS
 */

(function(exports) {
	
var store = exports.store;

if (!store) {
	console.log('fs.shelf.js: shelf.js core not found. File system storage not available.');
	return;
}

store.filename = './shelf.out';

var fs = require('fs'),
	path = require('path'),
	util = require('util');

// https://github.com/jprichardson/node-fs-extra/blob/master/lib/copy.js
var copyFile = function(srcFile, destFile, cb) {
    var fdr, fdw;
    fdr = fs.createReadStream(srcFile);
    fdw = fs.createWriteStream(destFile);
    fdr.on('end', function() {
      return cb(null);
    });
    return fdr.pipe(fdw);
  };


var timeout = {};

var overwrite = function (fileName, items) {
	var file = fileName || store.filename;
	if (!file) {
		store.log('You must specify a valid file.', 'ERR');
		return false;
	}
	
	var tmp_copy = path.dirname(file) + '.' + path.basename(file);
	
//	console.log('files')
//	console.log(file);
//	console.log(fileName);
//	console.log(tmp_copy)
	
	copyFile(file, tmp_copy, function(){
		var s = store.stringify(items);
		// removing leading { and trailing }
		s = s.substr(1, s = s.substr(0, s.legth-1));
//		console.log('SAVING')
//		console.log(s)
		fs.writeFile(file, s, 'utf-8', function(e) {
			if (e) throw e;
			fs.unlink(tmp_copy, function (err) {
				if (err) throw err;  
			});
			return true;
		});

	});
	
};

if ('undefined' !== typeof fs.appendFileSync) {
	// node 0.8
	var save = function (fileName, key, value) {
		var file = fileName || store.filename;
		if (!file) {
			store.log('You must specify a valid file.', 'ERR');
			return false;
		}
		if (!key) return;
		
		var item = store.stringify(key) + ": " + store.stringify(value) + ",\n";
		
		return fs.appendFileSync(file, item, 'utf-8');
	};	
}
else {
	// node < 0.8
	var save = function (fileName, key, value) {
		var file = fileName || store.filename;
		if (!file) {
			store.log('You must specify a valid file.', 'ERR');
			return false;
		}
		if (!key) return;
		
		var item = store.stringify(key) + ": " + store.stringify(value) + ",\n";
		


		fs.open(file, 'a', 666, function( e, id ) {
			fs.write( id, item, null, 'utf8', function(){
				fs.close(id, function(){});
			});
		});
		
		return true;
	};
}

var load = function (fileName, key) {
	var file = fileName || store.filename;
	if (!file) {
		store.log('You must specify a valid file.', 'ERR');
		return false;
	}

	var s = fs.readFileSync(file, 'utf-8');
	
//	console.log('BEFORE removing end')
//	console.log(s)
	
	
	s = s.substr(0, s.length-2); // removing last ',' and /n
	
//	console.log('BEFORE PARSING')
//	console.log(s)
	
	var items = store.parse('{' + s + '}');
	
//	console.log('PARSED')
//	console.log(items)
	
	return (key) ? items[key] : items; 

};

var deleteVariable = function (fileName, key) {
	var file = fileName || store.filename;
	var items = load(file);
//	console.log('dele')
//	console.log(items)
//	console.log(key)
	delete items[key];
	overwrite(file, items);
	return null;
};

store.addType("fs", function(key, value, options) {
	
	var filename = options.file || store.filename;
	
	if (!key) { 
		return load(filename);
	}

	if (value === undefined) {
		return load(filename, key);
	}

	if (timeout[key]) {
		clearTimeout(timeout[key]);
		deleteVariable(filename, key);
	}

	if (value === null) {
		deleteVariable(filename, key);
		return null;
	}
	
	// save item
	save(filename, key, value);
	
	if (options.expires) {
		timeout[key] = setTimeout(function() {
			deleteVariable(filename, key);
		}, options.expires);
	}

	return value;
});

}(('undefined' !== typeof module && 'function' === typeof require) ? module.exports || module.parent.exports : {}));