/*!
 * https://github.com/es-shims/es5-shim
 * @license es5-shim Copyright 2009-2015 by contributors, MIT License
 * see https://github.com/es-shims/es5-shim/blob/master/LICENSE
 */

// vim: ts=4 sts=4 sw=4 expandtab

// Add semicolon to prevent IIFE from being passed as argument to concatenated code.
;

// UMD (Universal Module Definition)
// see https://github.com/umdjs/umd/blob/master/returnExports.js
(function (root, factory) {
    'use strict';

    /* global define, exports, module */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
    }
}(this, function () {

/**
 * Brings an environment as close to ECMAScript 5 compliance
 * as is possible with the facilities of erstwhile engines.
 *
 * Annotated ES5: http://es5.github.com/ (specific links below)
 * ES5 Spec: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
 * Required reading: http://javascriptweblog.wordpress.com/2011/12/05/extending-javascript-natives/
 */

// Shortcut to an often accessed properties, in order to avoid multiple
// dereference that costs universally. This also holds a reference to known-good
// functions.
var $Array = Array;
var ArrayPrototype = $Array.prototype;
var $Object = Object;
var ObjectPrototype = $Object.prototype;
var FunctionPrototype = Function.prototype;
var $String = String;
var StringPrototype = $String.prototype;
var $Number = Number;
var NumberPrototype = $Number.prototype;
var array_slice = ArrayPrototype.slice;
var array_splice = ArrayPrototype.splice;
var array_push = ArrayPrototype.push;
var array_unshift = ArrayPrototype.unshift;
var array_concat = ArrayPrototype.concat;
var call = FunctionPrototype.call;
var max = Math.max;
var min = Math.min;

// Having a toString local variable name breaks in Opera so use to_string.
var to_string = ObjectPrototype.toString;

var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var isCallable; /* inlined from https://npmjs.com/is-callable */ var fnToStr = Function.prototype.toString, tryFunctionObject = function tryFunctionObject(value) { try { fnToStr.call(value); return true; } catch (e) { return false; } }, fnClass = '[object Function]', genClass = '[object GeneratorFunction]'; isCallable = function isCallable(value) { if (typeof value !== 'function') { return false; } if (hasToStringTag) { return tryFunctionObject(value); } var strClass = to_string.call(value); return strClass === fnClass || strClass === genClass; };
var isRegex; /* inlined from https://npmjs.com/is-regex */ var regexExec = RegExp.prototype.exec, tryRegexExec = function tryRegexExec(value) { try { regexExec.call(value); return true; } catch (e) { return false; } }, regexClass = '[object RegExp]'; isRegex = function isRegex(value) { if (typeof value !== 'object') { return false; } return hasToStringTag ? tryRegexExec(value) : to_string.call(value) === regexClass; };
var isString; /* inlined from https://npmjs.com/is-string */ var strValue = String.prototype.valueOf, tryStringObject = function tryStringObject(value) { try { strValue.call(value); return true; } catch (e) { return false; } }, stringClass = '[object String]'; isString = function isString(value) { if (typeof value === 'string') { return true; } if (typeof value !== 'object') { return false; } return hasToStringTag ? tryStringObject(value) : to_string.call(value) === stringClass; };

/* inlined from http://npmjs.com/define-properties */
var defineProperties = (function (has) {
  var supportsDescriptors = $Object.defineProperty && (function () {
      try {
          var obj = {};
          $Object.defineProperty(obj, 'x', { enumerable: false, value: obj });
          for (var _ in obj) { return false; }
          return obj.x === obj;
      } catch (e) { /* this is ES3 */
          return false;
      }
  }());

  // Define configurable, writable and non-enumerable props
  // if they don't exist.
  var defineProperty;
  if (supportsDescriptors) {
      defineProperty = function (object, name, method, forceAssign) {
          if (!forceAssign && (name in object)) { return; }
          $Object.defineProperty(object, name, {
              configurable: true,
              enumerable: false,
              writable: true,
              value: method
          });
      };
  } else {
      defineProperty = function (object, name, method, forceAssign) {
          if (!forceAssign && (name in object)) { return; }
          object[name] = method;
      };
  }
  return function defineProperties(object, map, forceAssign) {
      for (var name in map) {
          if (has.call(map, name)) {
            defineProperty(object, name, map[name], forceAssign);
          }
      }
  };
}(ObjectPrototype.hasOwnProperty));

//
// Util
// ======
//

/* replaceable with https://npmjs.com/package/es-abstract /helpers/isPrimitive */
var isPrimitive = function isPrimitive(input) {
    var type = typeof input;
    return input === null || (type !== 'object' && type !== 'function');
};

var ES = {
    // ES5 9.4
    // http://es5.github.com/#x9.4
    // http://jsperf.com/to-integer
    /* replaceable with https://npmjs.com/package/es-abstract ES5.ToInteger */
    ToInteger: function ToInteger(num) {
        var n = +num;
        if (n !== n) { // isNaN
            n = 0;
        } else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
            n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
        return n;
    },

    /* replaceable with https://npmjs.com/package/es-abstract ES5.ToPrimitive */
    ToPrimitive: function ToPrimitive(input) {
        var val, valueOf, toStr;
        if (isPrimitive(input)) {
            return input;
        }
        valueOf = input.valueOf;
        if (isCallable(valueOf)) {
            val = valueOf.call(input);
            if (isPrimitive(val)) {
                return val;
            }
        }
        toStr = input.toString;
        if (isCallable(toStr)) {
            val = toStr.call(input);
            if (isPrimitive(val)) {
                return val;
            }
        }
        throw new TypeError();
    },

    // ES5 9.9
    // http://es5.github.com/#x9.9
    /* replaceable with https://npmjs.com/package/es-abstract ES5.ToObject */
    ToObject: function (o) {
        /* jshint eqnull: true */
        if (o == null) { // this matches both null and undefined
            throw new TypeError("can't convert " + o + ' to object');
        }
        return $Object(o);
    },

    /* replaceable with https://npmjs.com/package/es-abstract ES5.ToUint32 */
    ToUint32: function ToUint32(x) {
        return x >>> 0;
    }
};

//
// Function
// ========
//

// ES-5 15.3.4.5
// http://es5.github.com/#x15.3.4.5

var Empty = function Empty() {};

defineProperties(FunctionPrototype, {
    bind: function bind(that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        if (!isCallable(target)) {
            throw new TypeError('Function.prototype.bind called on incompatible ' + target);
        }
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        // XXX slicedArgs will stand in for "A" if used
        var args = array_slice.call(arguments, 1); // for normal call
        // 4. Let F be a new native ECMAScript object.
        // 11. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 12. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 13. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 14. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        var bound;
        var binder = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs, the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Construct]] internal
                //   method of target providing args as the arguments.

                var result = target.apply(
                    this,
                    array_concat.call(args, array_slice.call(arguments))
                );
                if ($Object(result) === result) {
                    return result;
                }
                return this;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs, the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Call]] internal method
                //   of target providing boundThis as the this value and
                //   providing args as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return target.apply(
                    that,
                    array_concat.call(args, array_slice.call(arguments))
                );

            }

        };

        // 15. If the [[Class]] internal property of Target is "Function", then
        //     a. Let L be the length property of Target minus the length of A.
        //     b. Set the length own property of F to either 0 or L, whichever is
        //       larger.
        // 16. Else set the length own property of F to 0.

        var boundLength = max(0, target.length - args.length);

        // 17. Set the attributes of the length own property of F to the values
        //   specified in 15.3.5.1.
        var boundArgs = [];
        for (var i = 0; i < boundLength; i++) {
            array_push.call(boundArgs, '$' + i);
        }

        // XXX Build a dynamic function with desired amount of arguments is the only
        // way to set the length property of a function.
        // In environments where Content Security Policies enabled (Chrome extensions,
        // for ex.) all use of eval or Function costructor throws an exception.
        // However in all of these environments Function.prototype.bind exists
        // and so this code will never be executed.
        bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this, arguments); }')(binder);

        if (target.prototype) {
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            // Clean up dangling references.
            Empty.prototype = null;
        }

        // TODO
        // 18. Set the [[Extensible]] internal property of F to true.

        // TODO
        // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).
        // 20. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Get]]: thrower, [[Set]]:
        //   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and
        //   false.
        // 21. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Get]]: thrower,
        //   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},
        //   and false.

        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property or the [[Code]], [[FormalParameters]], and
        // [[Scope]] internal properties.
        // XXX can't delete prototype in pure-js.

        // 22. Return F.
        return bound;
    }
});

// _Please note: Shortcuts are defined after `Function.prototype.bind` as we
// us it in defining shortcuts.
var owns = call.bind(ObjectPrototype.hasOwnProperty);
var toStr = call.bind(ObjectPrototype.toString);
var strSlice = call.bind(StringPrototype.slice);
var strSplit = call.bind(StringPrototype.split);

//
// Array
// =====
//

var isArray = $Array.isArray || function isArray(obj) {
    return toStr(obj) === '[object Array]';
};

// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.13
// Return len+argCount.
// [bugfix, ielt8]
// IE < 8 bug: [].unshift(0) === undefined but should be "1"
var hasUnshiftReturnValueBug = [].unshift(0) !== 1;
defineProperties(ArrayPrototype, {
    unshift: function () {
        array_unshift.apply(this, arguments);
        return this.length;
    }
}, hasUnshiftReturnValueBug);

// ES5 15.4.3.2
// http://es5.github.com/#x15.4.3.2
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
defineProperties($Array, { isArray: isArray });

// The IsCallable() check in the Array functions
// has been replaced with a strict check on the
// internal class of the object to trap cases where
// the provided function was actually a regular
// expression literal, which in V8 and
// JavaScriptCore is a typeof "function".  Only in
// V8 are regular expression literals permitted as
// reduce parameters, so it is desirable in the
// general case for the shim to match the more
// strict and common behavior of rejecting regular
// expressions.

// ES5 15.4.4.18
// http://es5.github.com/#x15.4.4.18
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach

// Check failure of by-index access of string characters (IE < 9)
// and failure of `0 in boxedString` (Rhino)
var boxedString = $Object('a');
var splitString = boxedString[0] !== 'a' || !(0 in boxedString);

var properlyBoxesContext = function properlyBoxed(method) {
    // Check node 0.6.21 bug where third parameter is not boxed
    var properlyBoxesNonStrict = true;
    var properlyBoxesStrict = true;
    if (method) {
        method.call('foo', function (_, __, context) {
            if (typeof context !== 'object') { properlyBoxesNonStrict = false; }
        });

        method.call([1], function () {
            'use strict';

            properlyBoxesStrict = typeof this === 'string';
        }, 'x');
    }
    return !!method && properlyBoxesNonStrict && properlyBoxesStrict;
};

defineProperties(ArrayPrototype, {
    forEach: function forEach(callbackfn /*, thisArg*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var i = -1;
        var length = self.length >>> 0;
        var T;
        if (arguments.length > 1) {
          T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.forEach callback must be a function');
        }

        while (++i < length) {
            if (i in self) {
                // Invoke the callback function with call, passing arguments:
                // context, property value, property key, thisArg object
                if (typeof T !== 'undefined') {
                    callbackfn.call(T, self[i], i, object);
                } else {
                    callbackfn(self[i], i, object);
                }
            }
        }
    }
}, !properlyBoxesContext(ArrayPrototype.forEach));

// ES5 15.4.4.19
// http://es5.github.com/#x15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
defineProperties(ArrayPrototype, {
    map: function map(callbackfn/*, thisArg*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var length = self.length >>> 0;
        var result = $Array(length);
        var T;
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.map callback must be a function');
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                if (typeof T !== 'undefined') {
                    result[i] = callbackfn.call(T, self[i], i, object);
                } else {
                    result[i] = callbackfn(self[i], i, object);
                }
            }
        }
        return result;
    }
}, !properlyBoxesContext(ArrayPrototype.map));

// ES5 15.4.4.20
// http://es5.github.com/#x15.4.4.20
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
defineProperties(ArrayPrototype, {
    filter: function filter(callbackfn /*, thisArg*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var length = self.length >>> 0;
        var result = [];
        var value;
        var T;
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.filter callback must be a function');
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                value = self[i];
                if (typeof T === 'undefined' ? callbackfn(value, i, object) : callbackfn.call(T, value, i, object)) {
                    array_push.call(result, value);
                }
            }
        }
        return result;
    }
}, !properlyBoxesContext(ArrayPrototype.filter));

// ES5 15.4.4.16
// http://es5.github.com/#x15.4.4.16
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
defineProperties(ArrayPrototype, {
    every: function every(callbackfn /*, thisArg*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var length = self.length >>> 0;
        var T;
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.every callback must be a function');
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !(typeof T === 'undefined' ? callbackfn(self[i], i, object) : callbackfn.call(T, self[i], i, object))) {
                return false;
            }
        }
        return true;
    }
}, !properlyBoxesContext(ArrayPrototype.every));

// ES5 15.4.4.17
// http://es5.github.com/#x15.4.4.17
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
defineProperties(ArrayPrototype, {
    some: function some(callbackfn/*, thisArg */) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var length = self.length >>> 0;
        var T;
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.some callback must be a function');
        }

        for (var i = 0; i < length; i++) {
            if (i in self && (typeof T === 'undefined' ? callbackfn(self[i], i, object) : callbackfn.call(T, self[i], i, object))) {
                return true;
            }
        }
        return false;
    }
}, !properlyBoxesContext(ArrayPrototype.some));

// ES5 15.4.4.21
// http://es5.github.com/#x15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
var reduceCoercesToObject = false;
if (ArrayPrototype.reduce) {
    reduceCoercesToObject = typeof ArrayPrototype.reduce.call('es5', function (_, __, ___, list) { return list; }) === 'object';
}
defineProperties(ArrayPrototype, {
    reduce: function reduce(callbackfn /*, initialValue*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.reduce callback must be a function');
        }

        // no value to return if no initial value and an empty array
        if (length === 0 && arguments.length === 1) {
            throw new TypeError('reduce of empty array with no initial value');
        }

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= length) {
                    throw new TypeError('reduce of empty array with no initial value');
                }
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self) {
                result = callbackfn(result, self[i], i, object);
            }
        }

        return result;
    }
}, !reduceCoercesToObject);

// ES5 15.4.4.22
// http://es5.github.com/#x15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
var reduceRightCoercesToObject = false;
if (ArrayPrototype.reduceRight) {
    reduceRightCoercesToObject = typeof ArrayPrototype.reduceRight.call('es5', function (_, __, ___, list) { return list; }) === 'object';
}
defineProperties(ArrayPrototype, {
    reduceRight: function reduceRight(callbackfn/*, initial*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.reduceRight callback must be a function');
        }

        // no value to return if no initial value, empty array
        if (length === 0 && arguments.length === 1) {
            throw new TypeError('reduceRight of empty array with no initial value');
        }

        var result;
        var i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0) {
                    throw new TypeError('reduceRight of empty array with no initial value');
                }
            } while (true);
        }

        if (i < 0) {
            return result;
        }

        do {
            if (i in self) {
                result = callbackfn(result, self[i], i, object);
            }
        } while (i--);

        return result;
    }
}, !reduceRightCoercesToObject);

// ES5 15.4.4.14
// http://es5.github.com/#x15.4.4.14
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
var hasFirefox2IndexOfBug = ArrayPrototype.indexOf && [0, 1].indexOf(1, 2) !== -1;
defineProperties(ArrayPrototype, {
    indexOf: function indexOf(searchElement /*, fromIndex */) {
        var self = splitString && isString(this) ? strSplit(this, '') : ES.ToObject(this);
        var length = self.length >>> 0;

        if (length === 0) {
            return -1;
        }

        var i = 0;
        if (arguments.length > 1) {
            i = ES.ToInteger(arguments[1]);
        }

        // handle negative indices
        i = i >= 0 ? i : max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === searchElement) {
                return i;
            }
        }
        return -1;
    }
}, hasFirefox2IndexOfBug);

// ES5 15.4.4.15
// http://es5.github.com/#x15.4.4.15
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
var hasFirefox2LastIndexOfBug = ArrayPrototype.lastIndexOf && [0, 1].lastIndexOf(0, -3) !== -1;
defineProperties(ArrayPrototype, {
    lastIndexOf: function lastIndexOf(searchElement /*, fromIndex */) {
        var self = splitString && isString(this) ? strSplit(this, '') : ES.ToObject(this);
        var length = self.length >>> 0;

        if (length === 0) {
            return -1;
        }
        var i = length - 1;
        if (arguments.length > 1) {
            i = min(i, ES.ToInteger(arguments[1]));
        }
        // handle negative indices
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && searchElement === self[i]) {
                return i;
            }
        }
        return -1;
    }
}, hasFirefox2LastIndexOfBug);

// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.12
var spliceNoopReturnsEmptyArray = (function () {
    var a = [1, 2];
    var result = a.splice();
    return a.length === 2 && isArray(result) && result.length === 0;
}());
defineProperties(ArrayPrototype, {
    // Safari 5.0 bug where .splice() returns undefined
    splice: function splice(start, deleteCount) {
        if (arguments.length === 0) {
            return [];
        } else {
            return array_splice.apply(this, arguments);
        }
    }
}, !spliceNoopReturnsEmptyArray);

var spliceWorksWithEmptyObject = (function () {
    var obj = {};
    ArrayPrototype.splice.call(obj, 0, 0, 1);
    return obj.length === 1;
}());
defineProperties(ArrayPrototype, {
    splice: function splice(start, deleteCount) {
        if (arguments.length === 0) { return []; }
        var args = arguments;
        this.length = max(ES.ToInteger(this.length), 0);
        if (arguments.length > 0 && typeof deleteCount !== 'number') {
            args = array_slice.call(arguments);
            if (args.length < 2) {
                array_push.call(args, this.length - start);
            } else {
                args[1] = ES.ToInteger(deleteCount);
            }
        }
        return array_splice.apply(this, args);
    }
}, !spliceWorksWithEmptyObject);
var spliceWorksWithLargeSparseArrays = (function () {
    // Per https://github.com/es-shims/es5-shim/issues/295
    // Safari 7/8 breaks with sparse arrays of size 1e5 or greater
    var arr = new $Array(1e5);
    // note: the index MUST be 8 or larger or the test will false pass
    arr[8] = 'x';
    arr.splice(1, 1);
    // note: this test must be defined *after* the indexOf shim
    // per https://github.com/es-shims/es5-shim/issues/313
    return arr.indexOf('x') === 7;
}());
var spliceWorksWithSmallSparseArrays = (function () {
    // Per https://github.com/es-shims/es5-shim/issues/295
    // Opera 12.15 breaks on this, no idea why.
    var n = 256;
    var arr = [];
    arr[n] = 'a';
    arr.splice(n + 1, 0, 'b');
    return arr[n] === 'a';
}());
defineProperties(ArrayPrototype, {
    splice: function splice(start, deleteCount) {
        var O = ES.ToObject(this);
        var A = [];
        var len = ES.ToUint32(O.length);
        var relativeStart = ES.ToInteger(start);
        var actualStart = relativeStart < 0 ? max((len + relativeStart), 0) : min(relativeStart, len);
        var actualDeleteCount = min(max(ES.ToInteger(deleteCount), 0), len - actualStart);

        var k = 0;
        var from;
        while (k < actualDeleteCount) {
            from = $String(actualStart + k);
            if (owns(O, from)) {
                A[k] = O[from];
            }
            k += 1;
        }

        var items = array_slice.call(arguments, 2);
        var itemCount = items.length;
        var to;
        if (itemCount < actualDeleteCount) {
            k = actualStart;
            while (k < (len - actualDeleteCount)) {
                from = $String(k + actualDeleteCount);
                to = $String(k + itemCount);
                if (owns(O, from)) {
                    O[to] = O[from];
                } else {
                    delete O[to];
                }
                k += 1;
            }
            k = len;
            while (k > (len - actualDeleteCount + itemCount)) {
                delete O[k - 1];
                k -= 1;
            }
        } else if (itemCount > actualDeleteCount) {
            k = len - actualDeleteCount;
            while (k > actualStart) {
                from = $String(k + actualDeleteCount - 1);
                to = $String(k + itemCount - 1);
                if (owns(O, from)) {
                    O[to] = O[from];
                } else {
                    delete O[to];
                }
                k -= 1;
            }
        }
        k = actualStart;
        for (var i = 0; i < items.length; ++i) {
            O[k] = items[i];
            k += 1;
        }
        O.length = len - actualDeleteCount + itemCount;

        return A;
    }
}, !spliceWorksWithLargeSparseArrays || !spliceWorksWithSmallSparseArrays);

//
// Object
// ======
//

// ES5 15.2.3.14
// http://es5.github.com/#x15.2.3.14

// http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
var hasDontEnumBug = !({ 'toString': null }).propertyIsEnumerable('toString');
var hasProtoEnumBug = function () {}.propertyIsEnumerable('prototype');
var hasStringEnumBug = !owns('x', '0');
var equalsConstructorPrototype = function (o) {
    var ctor = o.constructor;
    return ctor && ctor.prototype === o;
};
var blacklistedKeys = {
    $window: true,
    $console: true,
    $parent: true,
    $self: true,
    $frames: true,
    $frameElement: true,
    $webkitIndexedDB: true,
    $webkitStorageInfo: true
};
var hasAutomationEqualityBug = (function () {
    /* globals window */
    if (typeof window === 'undefined') { return false; }
    for (var k in window) {
        if (!blacklistedKeys['$' + k] && owns(window, k) && window[k] !== null && typeof window[k] === 'object') {
            try {
                equalsConstructorPrototype(window[k]);
            } catch (e) {
                return true;
            }
        }
    }
    return false;
}());
var equalsConstructorPrototypeIfNotBuggy = function (object) {
    if (typeof window === 'undefined' || !hasAutomationEqualityBug) { return equalsConstructorPrototype(object); }
    try {
        return equalsConstructorPrototype(object);
    } catch (e) {
        return false;
    }
};
var dontEnums = [
    'toString',
    'toLocaleString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'constructor'
];
var dontEnumsLength = dontEnums.length;

var isArguments = function isArguments(value) {
    var str = toStr(value);
    var isArgs = str === '[object Arguments]';
    if (!isArgs) {
        isArgs = !isArray(value) &&
          value !== null &&
          typeof value === 'object' &&
          typeof value.length === 'number' &&
          value.length >= 0 &&
          isCallable(value.callee);
    }
    return isArgs;
};

defineProperties($Object, {
    keys: function keys(object) {
        var isFn = isCallable(object);
        var isArgs = isArguments(object);
        var isObject = object !== null && typeof object === 'object';
        var isStr = isObject && isString(object);

        if (!isObject && !isFn && !isArgs) {
            throw new TypeError('Object.keys called on a non-object');
        }

        var theKeys = [];
        var skipProto = hasProtoEnumBug && isFn;
        if ((isStr && hasStringEnumBug) || isArgs) {
            for (var i = 0; i < object.length; ++i) {
                array_push.call(theKeys, $String(i));
            }
        }

        if (!isArgs) {
            for (var name in object) {
                if (!(skipProto && name === 'prototype') && owns(object, name)) {
                    array_push.call(theKeys, $String(name));
                }
            }
        }

        if (hasDontEnumBug) {
            var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);
            for (var j = 0; j < dontEnumsLength; j++) {
                var dontEnum = dontEnums[j];
                if (!(skipConstructor && dontEnum === 'constructor') && owns(object, dontEnum)) {
                    array_push.call(theKeys, dontEnum);
                }
            }
        }
        return theKeys;
    }
});

var keysWorksWithArguments = $Object.keys && (function () {
    // Safari 5.0 bug
    return $Object.keys(arguments).length === 2;
}(1, 2));
var originalKeys = $Object.keys;
defineProperties($Object, {
    keys: function keys(object) {
        if (isArguments(object)) {
            return originalKeys(array_slice.call(object));
        } else {
            return originalKeys(object);
        }
    }
}, !keysWorksWithArguments);

//
// Date
// ====
//

// ES5 15.9.5.43
// http://es5.github.com/#x15.9.5.43
// This function returns a String value represent the instance in time
// represented by this Date object. The format of the String is the Date Time
// string format defined in 15.9.1.15. All fields are present in the String.
// The time zone is always UTC, denoted by the suffix Z. If the time value of
// this object is not a finite Number a RangeError exception is thrown.
var negativeDate = -62198755200000;
var negativeYearString = '-000001';
var hasNegativeDateBug = Date.prototype.toISOString && new Date(negativeDate).toISOString().indexOf(negativeYearString) === -1;
var hasSafari51DateBug = Date.prototype.toISOString && new Date(-1).toISOString() !== '1969-12-31T23:59:59.999Z';

defineProperties(Date.prototype, {
    toISOString: function toISOString() {
        var result, length, value, year, month;
        if (!isFinite(this)) {
            throw new RangeError('Date.prototype.toISOString called on non-finite value.');
        }

        year = this.getUTCFullYear();

        month = this.getUTCMonth();
        // see https://github.com/es-shims/es5-shim/issues/111
        year += Math.floor(month / 12);
        month = (month % 12 + 12) % 12;

        // the date time string format is specified in 15.9.1.15.
        result = [month + 1, this.getUTCDate(), this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];
        year = (
            (year < 0 ? '-' : (year > 9999 ? '+' : '')) +
            strSlice('00000' + Math.abs(year), (0 <= year && year <= 9999) ? -4 : -6)
        );

        length = result.length;
        while (length--) {
            value = result[length];
            // pad months, days, hours, minutes, and seconds to have two
            // digits.
            if (value < 10) {
                result[length] = '0' + value;
            }
        }
        // pad milliseconds to have three digits.
        return (
            year + '-' + array_slice.call(result, 0, 2).join('-') +
            'T' + array_slice.call(result, 2).join(':') + '.' +
            strSlice('000' + this.getUTCMilliseconds(), -3) + 'Z'
        );
    }
}, hasNegativeDateBug || hasSafari51DateBug);

// ES5 15.9.5.44
// http://es5.github.com/#x15.9.5.44
// This function provides a String representation of a Date object for use by
// JSON.stringify (15.12.3).
var dateToJSONIsSupported = (function () {
    try {
        return Date.prototype.toJSON &&
            new Date(NaN).toJSON() === null &&
            new Date(negativeDate).toJSON().indexOf(negativeYearString) !== -1 &&
            Date.prototype.toJSON.call({ // generic
                toISOString: function () { return true; }
            });
    } catch (e) {
        return false;
    }
}());
if (!dateToJSONIsSupported) {
    Date.prototype.toJSON = function toJSON(key) {
        // When the toJSON method is called with argument key, the following
        // steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be ES.ToPrimitive(O, hint Number).
        var O = $Object(this);
        var tv = ES.ToPrimitive(O);
        // 3. If tv is a Number and is not finite, return null.
        if (typeof tv === 'number' && !isFinite(tv)) {
            return null;
        }
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        var toISO = O.toISOString;
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (!isCallable(toISO)) {
            throw new TypeError('toISOString property is not callable');
        }
        // 6. Return the result of calling the [[Call]] internal method of
        //  toISO with O as the this value and an empty argument list.
        return toISO.call(O);

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}

// ES5 15.9.4.2
// http://es5.github.com/#x15.9.4.2
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
var supportsExtendedYears = Date.parse('+033658-09-27T01:46:40.000Z') === 1e15;
var acceptsInvalidDates = !isNaN(Date.parse('2012-04-04T24:00:00.500Z')) || !isNaN(Date.parse('2012-11-31T23:59:59.000Z')) || !isNaN(Date.parse('2012-12-31T23:59:60.000Z'));
var doesNotParseY2KNewYear = isNaN(Date.parse('2000-01-01T00:00:00.000Z'));
if (!Date.parse || doesNotParseY2KNewYear || acceptsInvalidDates || !supportsExtendedYears) {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    /* global Date: true */
    /* eslint-disable no-undef */
    Date = (function (NativeDate) {
    /* eslint-enable no-undef */
        // Date.length === 7
        var DateShim = function Date(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            var date;
            if (this instanceof NativeDate) {
                date = length === 1 && $String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(DateShim.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y) :
                                  new NativeDate();
            } else {
                date = NativeDate.apply(this, arguments);
            }
            // Prevent mixups with unfixed Date object
            defineProperties(date, { constructor: DateShim }, true);
            return date;
        };

        // 15.9.1.15 Date Time String Format.
        var isoDateExpression = new RegExp('^' +
            '(\\d{4}|[+-]\\d{6})' + // four-digit year capture or sign +
                                      // 6-digit extended year
            '(?:-(\\d{2})' + // optional month capture
            '(?:-(\\d{2})' + // optional day capture
            '(?:' + // capture hours:minutes:seconds.milliseconds
                'T(\\d{2})' + // hours capture
                ':(\\d{2})' + // minutes capture
                '(?:' + // optional :seconds.milliseconds
                    ':(\\d{2})' + // seconds capture
                    '(?:(\\.\\d{1,}))?' + // milliseconds capture
                ')?' +
            '(' + // capture UTC offset component
                'Z|' + // UTC capture
                '(?:' + // offset specifier +/-hours:minutes
                    '([-+])' + // sign capture
                    '(\\d{2})' + // hours offset capture
                    ':(\\d{2})' + // minutes offset capture
                ')' +
            ')?)?)?)?' +
        '$');

        var months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];

        var dayFromMonth = function dayFromMonth(year, month) {
            var t = month > 1 ? 1 : 0;
            return (
                months[month] +
                Math.floor((year - 1969 + t) / 4) -
                Math.floor((year - 1901 + t) / 100) +
                Math.floor((year - 1601 + t) / 400) +
                365 * (year - 1970)
            );
        };

        var toUTC = function toUTC(t) {
            return $Number(new NativeDate(1970, 0, 1, 0, 0, 0, t));
        };

        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate) {
            if (owns(NativeDate, key)) {
                DateShim[key] = NativeDate[key];
            }
        }

        // Copy "native" methods explicitly; they may be non-enumerable
        defineProperties(DateShim, {
            now: NativeDate.now,
            UTC: NativeDate.UTC
        }, true);
        DateShim.prototype = NativeDate.prototype;
        defineProperties(DateShim.prototype, {
            constructor: DateShim
        }, true);

        // Upgrade Date.parse to handle simplified ISO 8601 strings
        var parseShim = function parse(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                // parse months, days, hours, minutes, seconds, and milliseconds
                // provide default values if necessary
                // parse the UTC offset component
                var year = $Number(match[1]),
                    month = $Number(match[2] || 1) - 1,
                    day = $Number(match[3] || 1) - 1,
                    hour = $Number(match[4] || 0),
                    minute = $Number(match[5] || 0),
                    second = $Number(match[6] || 0),
                    millisecond = Math.floor($Number(match[7] || 0) * 1000),
                    // When time zone is missed, local offset should be used
                    // (ES 5.1 bug)
                    // see https://bugs.ecmascript.org/show_bug.cgi?id=112
                    isLocalTime = Boolean(match[4] && !match[8]),
                    signOffset = match[9] === '-' ? 1 : -1,
                    hourOffset = $Number(match[10] || 0),
                    minuteOffset = $Number(match[11] || 0),
                    result;
                if (
                    hour < (
                        minute > 0 || second > 0 || millisecond > 0 ?
                        24 : 25
                    ) &&
                    minute < 60 && second < 60 && millisecond < 1000 &&
                    month > -1 && month < 12 && hourOffset < 24 &&
                    minuteOffset < 60 && // detect invalid offsets
                    day > -1 &&
                    day < (
                        dayFromMonth(year, month + 1) -
                        dayFromMonth(year, month)
                    )
                ) {
                    result = (
                        (dayFromMonth(year, month) + day) * 24 +
                        hour +
                        hourOffset * signOffset
                    ) * 60;
                    result = (
                        (result + minute + minuteOffset * signOffset) * 60 +
                        second
                    ) * 1000 + millisecond;
                    if (isLocalTime) {
                        result = toUTC(result);
                    }
                    if (-8.64e15 <= result && result <= 8.64e15) {
                        return result;
                    }
                }
                return NaN;
            }
            return NativeDate.parse.apply(this, arguments);
        };
        defineProperties(DateShim, { parse: parseShim });

        return DateShim;
    }(Date));
    /* global Date: false */
}

// ES5 15.9.4.4
// http://es5.github.com/#x15.9.4.4
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}

//
// Number
// ======
//

// ES5.1 15.7.4.5
// http://es5.github.com/#x15.7.4.5
var hasToFixedBugs = NumberPrototype.toFixed && (
  (0.00008).toFixed(3) !== '0.000' ||
  (0.9).toFixed(0) !== '1' ||
  (1.255).toFixed(2) !== '1.25' ||
  (1000000000000000128).toFixed(0) !== '1000000000000000128'
);

var toFixedHelpers = {
  base: 1e7,
  size: 6,
  data: [0, 0, 0, 0, 0, 0],
  multiply: function multiply(n, c) {
      var i = -1;
      var c2 = c;
      while (++i < toFixedHelpers.size) {
          c2 += n * toFixedHelpers.data[i];
          toFixedHelpers.data[i] = c2 % toFixedHelpers.base;
          c2 = Math.floor(c2 / toFixedHelpers.base);
      }
  },
  divide: function divide(n) {
      var i = toFixedHelpers.size, c = 0;
      while (--i >= 0) {
          c += toFixedHelpers.data[i];
          toFixedHelpers.data[i] = Math.floor(c / n);
          c = (c % n) * toFixedHelpers.base;
      }
  },
  numToString: function numToString() {
      var i = toFixedHelpers.size;
      var s = '';
      while (--i >= 0) {
          if (s !== '' || i === 0 || toFixedHelpers.data[i] !== 0) {
              var t = $String(toFixedHelpers.data[i]);
              if (s === '') {
                  s = t;
              } else {
                  s += strSlice('0000000', 0, 7 - t.length) + t;
              }
          }
      }
      return s;
  },
  pow: function pow(x, n, acc) {
      return (n === 0 ? acc : (n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc)));
  },
  log: function log(x) {
      var n = 0;
      var x2 = x;
      while (x2 >= 4096) {
          n += 12;
          x2 /= 4096;
      }
      while (x2 >= 2) {
          n += 1;
          x2 /= 2;
      }
      return n;
  }
};

defineProperties(NumberPrototype, {
    toFixed: function toFixed(fractionDigits) {
        var f, x, s, m, e, z, j, k;

        // Test for NaN and round fractionDigits down
        f = $Number(fractionDigits);
        f = f !== f ? 0 : Math.floor(f);

        if (f < 0 || f > 20) {
            throw new RangeError('Number.toFixed called with invalid number of decimals');
        }

        x = $Number(this);

        // Test for NaN
        if (x !== x) {
            return 'NaN';
        }

        // If it is too big or small, return the string value of the number
        if (x <= -1e21 || x >= 1e21) {
            return $String(x);
        }

        s = '';

        if (x < 0) {
            s = '-';
            x = -x;
        }

        m = '0';

        if (x > 1e-21) {
            // 1e-21 < x < 1e21
            // -70 < log2(x) < 70
            e = toFixedHelpers.log(x * toFixedHelpers.pow(2, 69, 1)) - 69;
            z = (e < 0 ? x * toFixedHelpers.pow(2, -e, 1) : x / toFixedHelpers.pow(2, e, 1));
            z *= 0x10000000000000; // Math.pow(2, 52);
            e = 52 - e;

            // -18 < e < 122
            // x = z / 2 ^ e
            if (e > 0) {
                toFixedHelpers.multiply(0, z);
                j = f;

                while (j >= 7) {
                    toFixedHelpers.multiply(1e7, 0);
                    j -= 7;
                }

                toFixedHelpers.multiply(toFixedHelpers.pow(10, j, 1), 0);
                j = e - 1;

                while (j >= 23) {
                    toFixedHelpers.divide(1 << 23);
                    j -= 23;
                }

                toFixedHelpers.divide(1 << j);
                toFixedHelpers.multiply(1, 1);
                toFixedHelpers.divide(2);
                m = toFixedHelpers.numToString();
            } else {
                toFixedHelpers.multiply(0, z);
                toFixedHelpers.multiply(1 << (-e), 0);
                m = toFixedHelpers.numToString() + strSlice('0.00000000000000000000', 2, 2 + f);
            }
        }

        if (f > 0) {
            k = m.length;

            if (k <= f) {
                m = s + strSlice('0.0000000000000000000', 0, f - k + 2) + m;
            } else {
                m = s + strSlice(m, 0, k - f) + '.' + strSlice(m, k - f);
            }
        } else {
            m = s + m;
        }

        return m;
    }
}, hasToFixedBugs);

//
// String
// ======
//

// ES5 15.5.4.14
// http://es5.github.com/#x15.5.4.14

// [bugfix, IE lt 9, firefox 4, Konqueror, Opera, obscure browsers]
// Many browsers do not split properly with regular expressions or they
// do not perform the split correctly under obscure conditions.
// See http://blog.stevenlevithan.com/archives/cross-browser-split
// I've tested in many browsers and this seems to cover the deviant ones:
//    'ab'.split(/(?:ab)*/) should be ["", ""], not [""]
//    '.'.split(/(.?)(.?)/) should be ["", ".", "", ""], not ["", ""]
//    'tesst'.split(/(s)*/) should be ["t", undefined, "e", "s", "t"], not
//       [undefined, "t", undefined, "e", ...]
//    ''.split(/.?/) should be [], not [""]
//    '.'.split(/()()/) should be ["."], not ["", "", "."]

if (
    'ab'.split(/(?:ab)*/).length !== 2 ||
    '.'.split(/(.?)(.?)/).length !== 4 ||
    'tesst'.split(/(s)*/)[1] === 't' ||
    'test'.split(/(?:)/, -1).length !== 4 ||
    ''.split(/.?/).length ||
    '.'.split(/()()/).length > 1
) {
    (function () {
        var compliantExecNpcg = typeof (/()??/).exec('')[1] === 'undefined'; // NPCG: nonparticipating capturing group

        StringPrototype.split = function (separator, limit) {
            var string = this;
            if (typeof separator === 'undefined' && limit === 0) {
                return [];
            }

            // If `separator` is not a regex, use native split
            if (!isRegex(separator)) {
                return strSplit(this, separator, limit);
            }

            var output = [];
            var flags = (separator.ignoreCase ? 'i' : '') +
                        (separator.multiline ? 'm' : '') +
                        (separator.unicode ? 'u' : '') + // in ES6
                        (separator.sticky ? 'y' : ''), // Firefox 3+ and ES6
                lastLastIndex = 0,
                // Make `global` and avoid `lastIndex` issues by working with a copy
                separator2, match, lastIndex, lastLength;
            var separatorCopy = new RegExp(separator.source, flags + 'g');
            string += ''; // Type-convert
            if (!compliantExecNpcg) {
                // Doesn't need flags gy, but they don't hurt
                separator2 = new RegExp('^' + separatorCopy.source + '$(?!\\s)', flags);
            }
            /* Values for `limit`, per the spec:
             * If undefined: 4294967295 // Math.pow(2, 32) - 1
             * If 0, Infinity, or NaN: 0
             * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
             * If negative number: 4294967296 - Math.floor(Math.abs(limit))
             * If other: Type-convert, then use the above rules
             */
            var splitLimit = typeof limit === 'undefined' ?
                -1 >>> 0 : // Math.pow(2, 32) - 1
                ES.ToUint32(limit);
            match = separatorCopy.exec(string);
            while (match) {
                // `separatorCopy.lastIndex` is not reliable cross-browser
                lastIndex = match.index + match[0].length;
                if (lastIndex > lastLastIndex) {
                    array_push.call(output, strSlice(string, lastLastIndex, match.index));
                    // Fix browsers whose `exec` methods don't consistently return `undefined` for
                    // nonparticipating capturing groups
                    if (!compliantExecNpcg && match.length > 1) {
                        /* eslint-disable no-loop-func */
                        match[0].replace(separator2, function () {
                            for (var i = 1; i < arguments.length - 2; i++) {
                                if (typeof arguments[i] === 'undefined') {
                                    match[i] = void 0;
                                }
                            }
                        });
                        /* eslint-enable no-loop-func */
                    }
                    if (match.length > 1 && match.index < string.length) {
                        array_push.apply(output, array_slice.call(match, 1));
                    }
                    lastLength = match[0].length;
                    lastLastIndex = lastIndex;
                    if (output.length >= splitLimit) {
                        break;
                    }
                }
                if (separatorCopy.lastIndex === match.index) {
                    separatorCopy.lastIndex++; // Avoid an infinite loop
                }
                match = separatorCopy.exec(string);
            }
            if (lastLastIndex === string.length) {
                if (lastLength || !separatorCopy.test('')) {
                    array_push.call(output, '');
                }
            } else {
                array_push.call(output, strSlice(string, lastLastIndex));
            }
            return output.length > splitLimit ? strSlice(output, 0, splitLimit) : output;
        };
    }());

// [bugfix, chrome]
// If separator is undefined, then the result array contains just one String,
// which is the this value (converted to a String). If limit is not undefined,
// then the output array is truncated so that it contains no more than limit
// elements.
// "0".split(undefined, 0) -> []
} else if ('0'.split(void 0, 0).length) {
    StringPrototype.split = function split(separator, limit) {
        if (typeof separator === 'undefined' && limit === 0) { return []; }
        return strSplit(this, separator, limit);
    };
}

var str_replace = StringPrototype.replace;
var replaceReportsGroupsCorrectly = (function () {
    var groups = [];
    'x'.replace(/x(.)?/g, function (match, group) {
        array_push.call(groups, group);
    });
    return groups.length === 1 && typeof groups[0] === 'undefined';
}());

if (!replaceReportsGroupsCorrectly) {
    StringPrototype.replace = function replace(searchValue, replaceValue) {
        var isFn = isCallable(replaceValue);
        var hasCapturingGroups = isRegex(searchValue) && (/\)[*?]/).test(searchValue.source);
        if (!isFn || !hasCapturingGroups) {
            return str_replace.call(this, searchValue, replaceValue);
        } else {
            var wrappedReplaceValue = function (match) {
                var length = arguments.length;
                var originalLastIndex = searchValue.lastIndex;
                searchValue.lastIndex = 0;
                var args = searchValue.exec(match) || [];
                searchValue.lastIndex = originalLastIndex;
                array_push.call(args, arguments[length - 2], arguments[length - 1]);
                return replaceValue.apply(this, args);
            };
            return str_replace.call(this, searchValue, wrappedReplaceValue);
        }
    };
}

// ECMA-262, 3rd B.2.3
// Not an ECMAScript standard, although ECMAScript 3rd Edition has a
// non-normative section suggesting uniform semantics and it should be
// normalized across all browsers
// [bugfix, IE lt 9] IE < 9 substr() with negative value not working in IE
var string_substr = StringPrototype.substr;
var hasNegativeSubstrBug = ''.substr && '0b'.substr(-1) !== 'b';
defineProperties(StringPrototype, {
    substr: function substr(start, length) {
        var normalizedStart = start;
        if (start < 0) {
            normalizedStart = max(this.length + start, 0);
        }
        return string_substr.call(this, normalizedStart, length);
    }
}, hasNegativeSubstrBug);

// ES5 15.5.4.20
// whitespace from: http://es5.github.io/#x15.5.4.20
var ws = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
    '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028' +
    '\u2029\uFEFF';
var zeroWidth = '\u200b';
var wsRegexChars = '[' + ws + ']';
var trimBeginRegexp = new RegExp('^' + wsRegexChars + wsRegexChars + '*');
var trimEndRegexp = new RegExp(wsRegexChars + wsRegexChars + '*$');
var hasTrimWhitespaceBug = StringPrototype.trim && (ws.trim() || !zeroWidth.trim());
defineProperties(StringPrototype, {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    // http://perfectionkills.com/whitespace-deviations/
    trim: function trim() {
        if (typeof this === 'undefined' || this === null) {
            throw new TypeError("can't convert " + this + ' to object');
        }
        return $String(this).replace(trimBeginRegexp, '').replace(trimEndRegexp, '');
    }
}, hasTrimWhitespaceBug);

// ES-5 15.1.2.2
if (parseInt(ws + '08') !== 8 || parseInt(ws + '0x16') !== 22) {
    /* global parseInt: true */
    parseInt = (function (origParseInt) {
        var hexRegex = /^0[xX]/;
        return function parseInt(str, radix) {
            var string = $String(str).trim();
            var defaultedRadix = $Number(radix) || (hexRegex.test(string) ? 16 : 10);
            return origParseInt(string, defaultedRadix);
        };
    }(parseInt));
}

}));

/**
 * # Shelf.JS
 * Copyright 2014 Stefano Balietti
 * GPL licenses.
 *
 * Persistent Client-Side Storage
 * ---
 */
(function(exports) {

    var version = '5.1';
    var store, mainStorageType;

    mainStorageType = "volatile";

    store = exports.store = function(key, value, options, type) {
        options = options || {};
        type = (options.type && options.type in store.types) ?
            options.type : store.type;

        if (!type || !store.types[type]) {
            store.log('Cannot save/load value. Invalid storage type ' +
                      'selected: ' + type, 'ERR');
            return;
        }
        store.log('Accessing ' + type + ' storage');

        return store.types[type](key, value, options);
    };

    // Adding functions and properties to store
    ///////////////////////////////////////////
    store.prefix = "__shelf__";

    store.verbosity = 0;
    store.types = {};




    //if Object.defineProperty works...
    try {

        Object.defineProperty(store, 'type', {
            set: function(type) {
                if ('undefined' === typeof store.types[type]) {
                    store.log('Cannot set store.type to an invalid type: ' +
                              type);
                    return false;
                }
                mainStorageType = type;
                return type;
            },
            get: function(){
                return mainStorageType;
            },
            configurable: false,
            enumerable: true
        });
    }
    catch(e) {
        store.type = mainStorageType; // default: memory
    }

    store.addType = function(type, storage) {
        store.types[type] = storage;
        store[type] = function(key, value, options) {
            options = options || {};
            options.type = type;
            return store(key, value, options);
        };

        if (!store.type || store.type === "volatile") {
            store.type = type;
        }
    };

    // TODO: create unit test
    store.onquotaerror = undefined;
    store.error = function() {
        console.log("shelf quota exceeded");
        if ('function' === typeof store.onquotaerror) {
            store.onquotaerror(null);
        }
    };

    store.log = function(text) {
        if (store.verbosity > 0) {
            console.log('Shelf v.' + version + ': ' + text);
        }

    };

    store.isPersistent = function() {
        if (!store.types) return false;
        if (store.type === "volatile") return false;
        return true;
    };

    //if Object.defineProperty works...
    try {
        Object.defineProperty(store, 'persistent', {
            set: function(){},
            get: store.isPersistent,
            configurable: false
        });
    }
    catch(e) {
        // safe case
        store.persistent = false;
    }

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
            throw new Error('JSON.stringify not found. Received non-string' +
                            'value and could not serialize.');
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
    // ### fallback to enable the API even if we can't persist data
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

}(
    'undefined' !== typeof module && 'undefined' !== typeof module.exports ?
        module.exports : this
));

/**
 * ## Amplify storage for Shelf.js
 * Copyright 2014 Stefano Balietti
 *
 * v. 1.1.0 22.05.2013 a275f32ee7603fbae6607c4e4f37c4d6ada6c3d5
 *
 * Important! When updating to next Amplify.JS release, remember to change:
 *
 * - JSON.stringify -> store.stringify to keep support for cyclic objects
 * - JSON.parse -> store.parse (cyclic objects)
 * - store.name -> store.prefix (check)
 * - rprefix -> regex
 * - "__amplify__" -> store.prefix
 *
 * ---
 */
(function(exports) {

    var store = exports.store;

    if (!store) {
	throw new Error('amplify.shelf.js: shelf.js core not found.');
    }

    if ('undefined' === typeof window) {
	throw new Error('amplify.shelf.js:  window object not found.');
    }

    var regex = new RegExp("^" + store.prefix);
    function createFromStorageInterface( storageType, storage ) {
	store.addType( storageType, function( key, value, options ) {
	    var storedValue, parsed, i, remove,
	    ret = value,
	    now = (new Date()).getTime();

	    if ( !key ) {
		ret = {};
		remove = [];
		i = 0;
		try {
		    // accessing the length property works around a localStorage bug
		    // in Firefox 4.0 where the keys don't update cross-page
		    // we assign to key just to avoid Closure Compiler from removing
		    // the access as "useless code"
		    // https://bugzilla.mozilla.org/show_bug.cgi?id=662511
		    key = storage.length;

		    while ( key = storage.key( i++ ) ) {
			if ( regex.test( key ) ) {
			    parsed = store.parse( storage.getItem( key ) );
			    if ( parsed.expires && parsed.expires <= now ) {
				remove.push( key );
			    } else {
				ret[ key.replace( rprefix, "" ) ] = parsed.data;
			    }
			}
		    }
		    while ( key = remove.pop() ) {
			storage.removeItem( key );
		    }
		} catch ( error ) {}
		return ret;
	    }

	    // protect against name collisions with direct storage
	    key = store.prefix + key;

	    if ( value === undefined ) {
		storedValue = storage.getItem( key );
		parsed = storedValue ? store.parse( storedValue ) : { expires: -1 };
		if ( parsed.expires && parsed.expires <= now ) {
		    storage.removeItem( key );
		} else {
		    return parsed.data;
		}
	    } else {
		if ( value === null ) {
		    storage.removeItem( key );
		} else {
		    parsed = store.stringify({
			data: value,
			expires: options.expires ? now + options.expires : null
		    });
		    try {
			storage.setItem( key, parsed );
			// quota exceeded
		    } catch( error ) {
			// expire old data and try again
			store[ storageType ]();
			try {
			    storage.setItem( key, parsed );
			} catch( error ) {
			    throw store.error();
			}
		    }
		}
	    }

	    return ret;
	});
    }

    // localStorage + sessionStorage
    // IE 8+, Firefox 3.5+, Safari 4+, Chrome 4+, Opera 10.5+, iPhone 2+, Android 2+
    for ( var webStorageType in { localStorage: 1, sessionStorage: 1 } ) {
	// try/catch for file protocol in Firefox and Private Browsing in Safari 5
	try {
	    // Safari 5 in Private Browsing mode exposes localStorage
	    // but doesn't allow storing data, so we attempt to store and remove an item.
	    // This will unfortunately give us a false negative if we're at the limit.
	    window[ webStorageType ].setItem(store.prefix, "x" );
	    window[ webStorageType ].removeItem(store.prefix );
	    createFromStorageInterface( webStorageType, window[ webStorageType ] );
	} catch( e ) {}
    }

    // globalStorage
    // non-standard: Firefox 2+
    // https://developer.mozilla.org/en/dom/storage#globalStorage
    if ( !store.types.localStorage && window.globalStorage ) {
	// try/catch for file protocol in Firefox
	try {
	    createFromStorageInterface( "globalStorage",
			                window.globalStorage[ window.location.hostname ] );
	    // Firefox 2.0 and 3.0 have sessionStorage and globalStorage
	    // make sure we default to globalStorage
	    // but don't default to globalStorage in 3.5+ which also has localStorage
	    if ( store.type === "sessionStorage" ) {
		store.type = "globalStorage";
	    }
	} catch( e ) {}
    }

    // userData
    // non-standard: IE 5+
    // http://msdn.microsoft.com/en-us/library/ms531424(v=vs.85).aspx
    (function() {
	// IE 9 has quirks in userData that are a huge pain
	// rather than finding a way to detect these quirks
	// we just don't register userData if we have localStorage
	if ( store.types.localStorage ) {
	    return;
	}

	// append to html instead of body so we can do this from the head
	var div = document.createElement( "div" ),
	attrKey = store.prefix; // was "amplify" and not __amplify__
	div.style.display = "none";
	document.getElementsByTagName( "head" )[ 0 ].appendChild( div );

	// we can't feature detect userData support
	// so just try and see if it fails
	// surprisingly, even just adding the behavior isn't enough for a failure
	// so we need to load the data as well
	try {
	    div.addBehavior( "#default#userdata" );
	    div.load( attrKey );
	} catch( e ) {
	    div.parentNode.removeChild( div );
	    return;
	}

	store.addType( "userData", function( key, value, options ) {
	    div.load( attrKey );
	    var attr, parsed, prevValue, i, remove,
	    ret = value,
	    now = (new Date()).getTime();

	    if ( !key ) {
		ret = {};
		remove = [];
		i = 0;
		while ( attr = div.XMLDocument.documentElement.attributes[ i++ ] ) {
		    parsed = store.parse( attr.value );
		    if ( parsed.expires && parsed.expires <= now ) {
			remove.push( attr.name );
		    } else {
			ret[ attr.name ] = parsed.data;
		    }
		}
		while ( key = remove.pop() ) {
		    div.removeAttribute( key );
		}
		div.save( attrKey );
		return ret;
	    }

	    // convert invalid characters to dashes
	    // http://www.w3.org/TR/REC-xml/#NT-Name
	    // simplified to assume the starting character is valid
	    // also removed colon as it is invalid in HTML attribute names
	    key = key.replace( /[^\-._0-9A-Za-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c-\u200d\u203f\u2040\u2070-\u218f]/g, "-" );
	    // adjust invalid starting character to deal with our simplified sanitization
	    key = key.replace( /^-/, "_-" );

	    if ( value === undefined ) {
		attr = div.getAttribute( key );
		parsed = attr ? store.parse( attr ) : { expires: -1 };
		if ( parsed.expires && parsed.expires <= now ) {
		    div.removeAttribute( key );
		} else {
		    return parsed.data;
		}
	    } else {
		if ( value === null ) {
		    div.removeAttribute( key );
		} else {
		    // we need to get the previous value in case we need to rollback
		    prevValue = div.getAttribute( key );
		    parsed = store.stringify({
			data: value,
			expires: (options.expires ? (now + options.expires) : null)
		    });
		    div.setAttribute( key, parsed );
		}
	    }

	    try {
		div.save( attrKey );
		// quota exceeded
	    } catch ( error ) {
		// roll the value back to the previous value
		if ( prevValue === null ) {
		    div.removeAttribute( key );
		} else {
		    div.setAttribute( key, prevValue );
		}

		// expire old data and try again
		store.userData();
		try {
		    div.setAttribute( key, parsed );
		    div.save( attrKey );
		} catch ( error ) {
		    // roll the value back to the previous value
		    if ( prevValue === null ) {
			div.removeAttribute( key );
		    } else {
			div.setAttribute( key, prevValue );
		    }
		    throw store.error();
		}
	    }
	    return ret;
	});
    }());

}(this));

/**
 * # JSUS: JavaScript UtilS.
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * Collection of general purpose javascript functions. JSUS helps!
 *
 * See README.md for extra help.
 * ---
 */
(function(exports) {

    var JSUS = exports.JSUS = {};

    // ## JSUS._classes
    // Reference to all the extensions
    JSUS._classes = {};

    // Make sure that the console is available also in old browser, e.g. < IE8.
    if ('undefined' === typeof console) console = {};
    if ('undefined' === typeof console.log) console.log = function() {};

    /**
     * ## JSUS.log
     *
     * Reference to standard out, by default `console.log`
     *
     * Override to redirect the standard output of all JSUS functions.
     *
     * @param {string} txt Text to output
     */
    JSUS.log = function(txt) {
        console.log(txt);
    };

    /**
     * ## JSUS.extend
     *
     * Extends JSUS with additional methods and or properties
     *
     * The first parameter can be an object literal or a function.
     * A reference of the original extending object is stored in
     * JSUS._classes
     *
     * If a second parameter is passed, that will be the target of the
     * extension.
     *
     * @param {object} additional Text to output
     * @param {object|function} target The object to extend
     *
     * @return {object|function} target The extended object
     *
     * @see JSUS.get
     */
    JSUS.extend = function(additional, target) {
        var name, prop;
        if ('object' !== typeof additional &&
            'function' !== typeof additional) {
            return target;
        }

        // If we are extending JSUS, store a reference
        // of the additional object into the hidden
        // JSUS._classes object;
        if ('undefined' === typeof target) {
            target = target || this;
            if ('function' === typeof additional) {
                name = additional.toString();
                name = name.substr('function '.length);
                name = name.substr(0, name.indexOf('('));
            }
            // Must be object.
            else {
                name = additional.constructor ||
                    additional.__proto__.constructor;
            }
            if (name) {
                this._classes[name] = additional;
            }
        }

        for (prop in additional) {
            if (additional.hasOwnProperty(prop)) {
                if (typeof target[prop] !== 'object') {
                    target[prop] = additional[prop];
                } else {
                    JSUS.extend(additional[prop], target[prop]);
                }
            }
        }

        // Additional is a class (Function)
        // TODO: this is true also for {}
        if (additional.prototype) {
            JSUS.extend(additional.prototype, target.prototype || target);
        }

        return target;
    };

    /**
     * ## JSUS.require
     *
     * Returns a copy of one / all the objects extending JSUS
     *
     * The first parameter is a string representation of the name of
     * the requested extending object. If no parameter is passed a copy
     * of all the extending objects is returned.
     *
     * @param {string} className The name of the requested JSUS library
     *
     * @return {function|boolean} The copy of the JSUS library, or
     *   FALSE if the library does not exist
     */
    JSUS.require = JSUS.get = function(className) {
        if ('undefined' === typeof JSUS.clone) {
            JSUS.log('JSUS.clone not found. Cannot continue.');
            return false;
        }
        if ('undefined' === typeof className) return JSUS.clone(JSUS._classes);
        if ('undefined' === typeof JSUS._classes[className]) {
            JSUS.log('Could not find class ' + className);
            return false;
        }
        return JSUS.clone(JSUS._classes[className]);
    };

    /**
     * ## JSUS.isNodeJS
     *
     * Returns TRUE when executed inside Node.JS environment
     *
     * @return {boolean} TRUE when executed inside Node.JS environment
     */
    JSUS.isNodeJS = function() {
        return 'undefined' !== typeof module &&
            'undefined' !== typeof module.exports &&
            'function' === typeof require;
    };

    // ## Node.JS includes
    // if node
    if (JSUS.isNodeJS()) {
        require('./lib/compatibility');
        require('./lib/obj');
        require('./lib/array');
        require('./lib/time');
        require('./lib/eval');
        require('./lib/dom');
        require('./lib/random');
        require('./lib/parse');
        require('./lib/queue');
        require('./lib/fs');
    }
    // end node

})(
    'undefined' !== typeof module && 'undefined' !== typeof module.exports ?
        module.exports: window
);

/**
 * # COMPATIBILITY
 *
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * Tests browsers ECMAScript 5 compatibility
 *
 * For more information see http://kangax.github.com/es5-compat-table/
 */
(function(JSUS) {
    "use strict";

    function COMPATIBILITY() {}

    /**
     * ## COMPATIBILITY.compatibility
     *
     * Returns a report of the ECS5 features available
     *
     * Useful when an application routinely performs an operation
     * depending on a potentially unsupported ECS5 feature.
     *
     * Transforms multiple try-catch statements in a if-else
     *
     * @return {object} support The compatibility object
     */
    COMPATIBILITY.compatibility = function() {

        var support = {};

        try {
            Object.defineProperty({}, "a", {enumerable: false, value: 1});
            support.defineProperty = true;
        }
        catch(e) {
            support.defineProperty = false;
        }

        try {
            eval('({ get x(){ return 1 } }).x === 1');
            support.setter = true;
        }
        catch(err) {
            support.setter = false;
        }

        try {
            var value;
            eval('({ set x(v){ value = v; } }).x = 1');
            support.getter = true;
        }
        catch(err) {
            support.getter = false;
        }

        return support;
    };


    JSUS.extend(COMPATIBILITY);

})('undefined' !== typeof JSUS ? JSUS : module.parent.exports.JSUS);

/**
 * # ARRAY
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * Collection of static functions to manipulate arrays
 */
(function(JSUS) {

    "use strict";

    function ARRAY() {}

    /**
     * ## ARRAY.filter
     *
     * Add the filter method to ARRAY objects in case the method is not
     * supported natively.
     *
     * @see https://developer.mozilla.org/en/JavaScript/Reference/
     *              Global_Objects/ARRAY/filter
     */
    if (!Array.prototype.filter) {
        Array.prototype.filter = function(fun /*, thisp */) {
            if (this === void 0 || this === null) throw new TypeError();

            var t = new Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== "function") throw new TypeError();

            var res = [];
            var thisp = arguments[1];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i]; // in case fun mutates this
                    if (fun.call(thisp, val, i, t)) {
                        res.push(val);
                    }
                }
            }
            return res;
        };
    }

    /**
     * ## ARRAY.isArray
     *
     * Returns TRUE if a variable is an Array
     *
     * This method is exactly the same as `Array.isArray`,
     * but it works on a larger share of browsers.
     *
     * @param {object} o The variable to check.
     * @see Array.isArray
     */
    ARRAY.isArray = function(o) {
        if (!o) return false;
        return Object.prototype.toString.call(o) === '[object Array]';
    };

    /**
     * ## ARRAY.seq
     *
     * Returns an array of sequential numbers from start to end
     *
     * If start > end the series goes backward.
     *
     * The distance between two subsequent numbers can be controlled
     * by the increment parameter.
     *
     * When increment is not a divider of Abs(start - end), end will
     * be missing from the series.
     *
     * A callback function to apply to each element of the sequence
     * can be passed as fourth parameter.
     *
     * Returns FALSE, in case parameters are incorrectly specified
     *
     * @param {number} start The first element of the sequence
     * @param {number} end The last element of the sequence
     * @param {number} increment Optional. The increment between two
     *   subsequents element of the sequence
     * @param {Function} func Optional. A callback function that can modify
     *   each number of the sequence before returning it
     *
     * @return {array} The final sequence
     */
    ARRAY.seq = function(start, end, increment, func) {
        var i, out;
        if ('number' !== typeof start) return false;
        if (start === Infinity) return false;
        if ('number' !== typeof end) return false;
        if (end === Infinity) return false;
        if (start === end) return [start];

        if (increment === 0) return false;
        if (!JSUS.in_array(typeof increment, ['undefined', 'number'])) {
            return false;
        }

        increment = increment || 1;
        func = func || function(e) {return e;};

        i = start;
        out = [];

        if (start < end) {
            while (i <= end) {
                out.push(func(i));
                i = i + increment;
            }
        }
        else {
            while (i >= end) {
                out.push(func(i));
                i = i - increment;
            }
        }

        return out;
    };

    /**
     * ## ARRAY.each
     *
     * Executes a callback on each element of the array
     *
     * If an error occurs returns FALSE.
     *
     * @param {array} array The array to loop in
     * @param {Function} func The callback for each element in the array
     * @param {object} context Optional. The context of execution of the
     *   callback. Defaults ARRAY.each
     *
     * @return {boolean} TRUE, if execution was successful
     */
    ARRAY.each = function(array, func, context) {
        if ('object' !== typeof array) return false;
        if (!func) return false;

        context = context || this;
        var i, len = array.length;
        for (i = 0 ; i < len; i++) {
            func.call(context, array[i]);
        }
        return true;
    };

    /**
     * ## ARRAY.map
     *
     * Executes a callback to each element of the array and returns the result
     *
     * Any number of additional parameters can be passed after the
     * callback function.
     *
     * @return {array} The result of the mapping execution
     *
     * @see ARRAY.each
     */
    ARRAY.map = function() {
        var i, len, args, out, o;
        var array, func;

        array = arguments[0];
        func = arguments[1];

        if (!ARRAY.isArray(array)) {
            JSUS.log('ARRAY.map: first parameter must be array. Found: ' +
                     array);
            return;
        }
        if ('function' !== typeof func) {
            JSUS.log('ARRAY.map: second parameter must be function. Found: ' +
                     func);
            return;
        }

        len = arguments.length;
        if (len === 3) args = [null, arguments[2]];
        else if (len === 4) args = [null, arguments[2], arguments[3]];
        else {
            len = len - 1;
            args = new Array(len);
            for (i = 1; i < (len); i++) {
                args[i] = arguments[i+1];
            }
        }

        out = [], len = array.length;
        for (i = 0; i < len; i++) {
            args[0] = array[i];
            o = func.apply(this, args);
            if ('undefined' !== typeof o) out.push(o);
        }
        return out;
    };


    /**
     * ## ARRAY.removeElement
     *
     * Removes an element from the the array, and returns it
     *
     * For objects, deep equality comparison is performed
     * through JSUS.equals.
     *
     * If no element is removed returns FALSE.
     *
     * @param {mixed} needle The element to search in the array
     * @param {array} haystack The array to search in
     *
     * @return {mixed} The element that was removed, FALSE if none was removed
     *
     * @see JSUS.equals
     */
    ARRAY.removeElement = function(needle, haystack) {
        var func, i;
        if ('undefined' === typeof needle || !haystack) return false;

        if ('object' === typeof needle) {
            func = JSUS.equals;
        }
        else {
            func = function(a, b) {
                return (a === b);
            };
        }

        for (i = 0; i < haystack.length; i++) {
            if (func(needle, haystack[i])){
                return haystack.splice(i,1);
            }
        }
        return false;
    };

    /**
     * ## ARRAY.inArray
     *
     * Returns TRUE if the element is contained in the array,
     * FALSE otherwise
     *
     * For objects, deep equality comparison is performed
     * through JSUS.equals.
     *
     * Alias ARRAY.in_array (deprecated)
     *
     * @param {mixed} needle The element to search in the array
     * @param {array} haystack The array to search in
     *
     * @return {boolean} TRUE, if the element is contained in the array
     *
     *  @see JSUS.equals
     */
    ARRAY.inArray = ARRAY.in_array = function(needle, haystack) {
        var func, i, len;
        if (!haystack) return false;
        func = JSUS.equals;
        len = haystack.length;
        for (i = 0; i < len; i++) {
            if (func.call(this, needle, haystack[i])) {
                return true;
            }
        }
        return false;
    };

    /**
     * ## ARRAY.getNGroups
     *
     * Returns an array of N array containing the same number of elements
     * If the length of the array and the desired number of elements per group
     * are not multiple, the last group could have less elements
     *
     * The original array is not modified.
     *
     *  @see ARRAY.getGroupsSizeN
     *  @see ARRAY.generateCombinations
     *  @see ARRAY.matchN
     *
     * @param {array} array The array to split in subgroups
     * @param {number} N The number of subgroups
     *
     * @return {array} Array containing N groups
     */
    ARRAY.getNGroups = function(array, N) {
        return ARRAY.getGroupsSizeN(array, Math.floor(array.length / N));
    };

    /**
     * ## ARRAY.getGroupsSizeN
     *
     * Returns an array of arrays containing N elements each
     *
     * The last group could have less elements
     *
     * @param {array} array The array to split in subgroups
     * @param {number} N The number of elements in each subgroup
     *
     * @return {array} Array containing groups of size N
     *
     * @see ARRAY.getNGroups
     * @see ARRAY.generateCombinations
     * @see ARRAY.matchN
     */
    ARRAY.getGroupsSizeN = function(array, N) {

        var copy = array.slice(0);
        var len = copy.length;
        var originalLen = copy.length;
        var result = [];

        // Init values for the loop algorithm.
        var i, idx;
        var group = [], count = 0;
        for (i=0; i < originalLen; i++) {

            // Get a random idx between 0 and array length.
            idx = Math.floor(Math.random()*len);

            // Prepare the array container for the elements of a new group.
            if (count >= N) {
                result.push(group);
                count = 0;
                group = [];
            }

            // Insert element in the group.
            group.push(copy[idx]);

            // Update.
            copy.splice(idx,1);
            len = copy.length;
            count++;
        }

        // Add any remaining element.
        if (group.length > 0) {
            result.push(group);
        }

        return result;
    };

    /**
     * ## ARRAY._latinSquare
     *
     * Generate a random Latin Square of size S
     *
     * If N is defined, it returns "Latin Rectangle" (SxN)
     *
     * A parameter controls for self-match, i.e. whether the symbol "i"
     * is found or not in in column "i".
     *
     * @api private
     * @param {number} S The number of rows
     * @param {number} Optional. N The number of columns. Defaults N = S
     * @param {boolean} Optional. If TRUE self-match is allowed. Defaults TRUE
     *
     * @return {array} The resulting latin square (or rectangle)
     */
    ARRAY._latinSquare = function(S, N, self) {
        self = ('undefined' === typeof self) ? true : self;
        // Infinite loop.
        if (S === N && !self) return false;
        var seq = [];
        var latin = [];
        for (var i=0; i< S; i++) {
            seq[i] = i;
        }

        var idx = null;

        var start = 0;
        var limit = S;
        var extracted = [];
        if (!self) {
            limit = S-1;
        }

        for (i=0; i < N; i++) {
            do {
                idx = JSUS.randomInt(start,limit);
            }
            while (JSUS.in_array(idx, extracted));
            extracted.push(idx);

            if (idx == 1) {
                latin[i] = seq.slice(idx);
                latin[i].push(0);
            }
            else {
                latin[i] = seq.slice(idx).concat(seq.slice(0,(idx)));
            }

        }

        return latin;
    };

    /**
     * ## ARRAY.latinSquare
     *
     * Generate a random Latin Square of size S
     *
     * If N is defined, it returns "Latin Rectangle" (SxN)
     *
     * @param {number} S The number of rows
     * @param {number} Optional. N The number of columns. Defaults N = S
     *
     * @return {array} The resulting latin square (or rectangle)
     */
    ARRAY.latinSquare = function(S, N) {
        if (!N) N = S;
        if (!S || S < 0 || (N < 0)) return false;
        if (N > S) N = S;

        return ARRAY._latinSquare(S, N, true);
    };

    /**
     * ## ARRAY.latinSquareNoSelf
     *
     * Generate a random Latin Square of size Sx(S-1), where
     * in each column "i", the symbol "i" is not found
     *
     * If N < S, it returns a "Latin Rectangle" (SxN)
     *
     * @param {number} S The number of rows
     * @param {number} Optional. N The number of columns. Defaults N = S-1
     *
     * @return {array} The resulting latin square (or rectangle)
     */
    ARRAY.latinSquareNoSelf = function(S, N) {
        if (!N) N = S-1;
        if (!S || S < 0 || (N < 0)) return false;
        if (N > S) N = S-1;

        return ARRAY._latinSquare(S, N, false);
    };


    /**
     * ## ARRAY.generateCombinations
     *
     * Generates all distinct combinations of exactly r elements each
     *
     * @param {array} array The array from which the combinations are extracted
     * @param {number} r The number of elements in each combination
     *
     * @return {array} The total sets of combinations
     *
     * @see ARRAY.getGroupSizeN
     * @see ARRAY.getNGroups
     * @see ARRAY.matchN
     *
     * Kudos: http://rosettacode.org/wiki/Combinations#JavaScript
     */
    ARRAY.generateCombinations = function combinations(arr, k) {
        var i, subI, ret, sub, next;
        ret = [];
        for (i = 0; i < arr.length; i++) {
            if (k === 1) {
                ret.push( [ arr[i] ] );
            }
            else {
                sub = combinations(arr.slice(i+1, arr.length), k-1);
                for (subI = 0; subI < sub.length; subI++ ){
                    next = sub[subI];
                    next.unshift(arr[i]);
                    ret.push( next );
                }
            }
        }
        return ret;
    };

    /**
     * ## ARRAY.matchN
     *
     * Match each element of the array with N random others
     *
     * If strict is equal to true, elements cannot be matched multiple times.
     *
     * *Important*: this method has a bug / feature. If the strict parameter
     * is set, the last elements could remain without match, because all the
     * other have been already used. Another recombination would be able
     * to match all the elements instead.
     *
     * @param {array} array The array in which operate the matching
     * @param {number} N The number of matches per element
     * @param {boolean} strict Optional. If TRUE, matched elements cannot be
     *   repeated. Defaults, FALSE
     *
     * @return {array} The results of the matching
     *
     * @see ARRAY.getGroupSizeN
     * @see ARRAY.getNGroups
     * @see ARRAY.generateCombinations
     */
    ARRAY.matchN = function(array, N, strict) {
        var result, i, copy, group, len, found;
        if (!array) return;
        if (!N) return array;

        result = [];
        len = array.length;
        found = [];
        for (i = 0 ; i < len ; i++) {
            // Recreate the array.
            copy = array.slice(0);
            copy.splice(i,1);
            if (strict) {
                copy = ARRAY.arrayDiff(copy,found);
            }
            group = ARRAY.getNRandom(copy,N);
            // Add to the set of used elements.
            found = found.concat(group);
            // Re-add the current element.
            group.splice(0,0,array[i]);
            result.push(group);

            // Update.
            group = [];
        }
        return result;
    };

    /**
     * ## ARRAY.rep
     *
     * Appends an array to itself a number of times and return a new array
     *
     * The original array is not modified.
     *
     * @param {array} array the array to repeat
     * @param {number} times The number of times the array must be appended
     *   to itself
     *
     * @return {array} A copy of the original array appended to itself
     */
    ARRAY.rep = function(array, times) {
        var i, result;
        if (!array) return;
        if (!times) return array.slice(0);
        if (times < 1) {
            JSUS.log('times must be greater or equal 1', 'ERR');
            return;
        }

        i = 1;
        result = array.slice(0);
        for (; i < times; i++) {
            result = result.concat(array);
        }
        return result;
    };

    /**
     * ## ARRAY.stretch
     *
     * Repeats each element of the array N times
     *
     * N can be specified as an integer or as an array. In the former case all
     * the elements are repeat the same number of times. In the latter, each
     * element can be repeated a custom number of times. If the length of the
     * `times` array differs from that of the array to stretch a recycle rule
     * is applied.
     *
     * The original array is not modified.
     *
     * E.g.:
     *
     * ```js
     *  var foo = [1,2,3];
     *
     *  ARRAY.stretch(foo, 2); // [1, 1, 2, 2, 3, 3]
     *
     *  ARRAY.stretch(foo, [1,2,3]); // [1, 2, 2, 3, 3, 3];
     *
     *  ARRAY.stretch(foo, [2,1]); // [1, 1, 2, 3, 3];
     * ```
     *
     * @param {array} array the array to strech
     * @param {number|array} times The number of times each element
     *   must be repeated
     * @return {array} A stretched copy of the original array
     */
    ARRAY.stretch = function(array, times) {
        var result, i, repeat, j;
        if (!array) return;
        if (!times) return array.slice(0);
        if ('number' === typeof times) {
            if (times < 1) {
                JSUS.log('times must be greater or equal 1', 'ERR');
                return;
            }
            times = ARRAY.rep([times], array.length);
        }

        result = [];
        for (i = 0; i < array.length; i++) {
            repeat = times[(i % times.length)];
            for (j = 0; j < repeat ; j++) {
                result.push(array[i]);
            }
        }
        return result;
    };


    /**
     * ## ARRAY.arrayIntersect
     *
     * Computes the intersection between two arrays
     *
     * Arrays can contain both primitive types and objects.
     *
     * @param {array} a1 The first array
     * @param {array} a2 The second array
     * @return {array} All the values of the first array that are found
     *   also in the second one
     */
    ARRAY.arrayIntersect = function(a1, a2) {
        return a1.filter( function(i) {
            return JSUS.in_array(i, a2);
        });
    };

    /**
     * ## ARRAY.arrayDiff
     *
     * Performs a diff between two arrays
     *
     * Arrays can contain both primitive types and objects.
     *
     * @param {array} a1 The first array
     * @param {array} a2 The second array
     * @return {array} All the values of the first array that are not
     *   found in the second one
     */
    ARRAY.arrayDiff = function(a1, a2) {
        return a1.filter( function(i) {
            return !(JSUS.in_array(i, a2));
        });
    };

    /**
     * ## ARRAY.shuffle
     *
     * Shuffles the elements of the array using the Fischer algorithm
     *
     * The original array is not modified, and a copy is returned.
     *
     * @param {array} shuffle The array to shuffle
     *
     * @return {array} copy The shuffled array
     *
     * @see http://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
     */
    ARRAY.shuffle = function(array) {
        var copy, len, j, tmp, i;
        if (!array) return;
        copy = Array.prototype.slice.call(array);
        len = array.length-1; // ! -1
        for (i = len; i > 0; i--) {
            j = Math.floor(Math.random()*(i+1));
            tmp = copy[j];
            copy[j] = copy[i];
            copy[i] = tmp;
        }
        return copy;
    };

    /**
     * ## ARRAY.getNRandom
     *
     * Select N random elements from the array and returns them
     *
     * @param {array} array The array from which extracts random elements
     * @paran {number} N The number of random elements to extract
     *
     * @return {array} An new array with N elements randomly chosen
     */
    ARRAY.getNRandom = function(array, N) {
        return ARRAY.shuffle(array).slice(0,N);
    };

    /**
     * ## ARRAY.distinct
     *
     * Removes all duplicates entries from an array and returns a copy of it
     *
     * Does not modify original array.
     *
     * Comparison is done with `JSUS.equals`.
     *
     * @param {array} array The array from which eliminates duplicates
     *
     * @return {array} A copy of the array without duplicates
     *
     * @see JSUS.equals
     */
    ARRAY.distinct = function(array) {
        var out = [];
        if (!array) return out;

        ARRAY.each(array, function(e) {
            if (!ARRAY.in_array(e, out)) {
                out.push(e);
            }
        });
        return out;
    };

    /**
     * ## ARRAY.transpose
     *
     * Transposes a given 2D array.
     *
     * The original array is not modified, and a new copy is
     * returned.
     *
     * @param {array} array The array to transpose
     *
     * @return {array} The Transposed Array
     */
    ARRAY.transpose = function(array) {
        if (!array) return;

        // Calculate width and height
        var w, h, i, j, t = [];
        w = array.length || 0;
        h = (ARRAY.isArray(array[0])) ? array[0].length : 0;
        if (w === 0 || h === 0) return t;

        for ( i = 0; i < h; i++) {
            t[i] = [];
            for ( j = 0; j < w; j++) {
                t[i][j] = array[j][i];
            }
        }
        return t;
    };

    JSUS.extend(ARRAY);

})('undefined' !== typeof JSUS ? JSUS : module.parent.exports.JSUS);

/**
 * # OBJ
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Collection of static functions to manipulate JavaScript objects
 */
(function(JSUS) {

    "use strict";

    function OBJ() {}

    var compatibility = null;

    if ('undefined' !== typeof JSUS.compatibility) {
        compatibility = JSUS.compatibility();
    }

    /**
     * ## OBJ.createObj
     *
     * Polyfill for Object.create (when missing)
     */
    OBJ.createObj = (function() {
        // From MDN Object.create (Polyfill)
        if (typeof Object.create !== 'function') {
            // Production steps of ECMA-262, Edition 5, 15.2.3.5
            // Reference: http://es5.github.io/#x15.2.3.5
            return (function() {
                // To save on memory, use a shared constructor
                function Temp() {}

                // make a safe reference to Object.prototype.hasOwnProperty
                var hasOwn = Object.prototype.hasOwnProperty;

                return function(O) {
                    // 1. If Type(O) is not Object or Null
                    if (typeof O != 'object') {
                        throw new TypeError('Object prototype may only ' +
                                            'be an Object or null');
                    }

                    // 2. Let obj be the result of creating a new object as if
                    //    by the expression new Object() where Object is the
                    //    standard built-in constructor with that name
                    // 3. Set the [[Prototype]] internal property of obj to O.
                    Temp.prototype = O;
                    var obj = new Temp();
                    Temp.prototype = null;

                    // 4. If the argument Properties is present and not
                    //    undefined, add own properties to obj as if by calling
                    //    the standard built-in function Object.defineProperties
                    //    with arguments obj and Properties.
                    if (arguments.length > 1) {
                        // Object.defineProperties does ToObject on
                        // its first argument.
                        var Properties = new Object(arguments[1]);
                        for (var prop in Properties) {
                            if (hasOwn.call(Properties, prop)) {
                                obj[prop] = Properties[prop];
                            }
                        }
                    }

                    // 5. Return obj
                    return obj;
                };
            })();
        }
        return Object.create;
    })();

    /**
     * ## OBJ.equals
     *
     * Checks for deep equality between two objects, strings or primitive types
     *
     * All nested properties are checked, and if they differ in at least
     * one returns FALSE, otherwise TRUE.
     *
     * Takes care of comparing the following special cases:
     *
     * - undefined
     * - null
     * - NaN
     * - Infinity
     * - {}
     * - falsy values
     *
     * @param {object} o1 The first object
     * @param {object} o2 The second object
     *
     * @return {boolean} TRUE if the objects are deeply equal
     */
    OBJ.equals = function(o1, o2) {
        var type1, type2, primitives, p;
        type1 = typeof o1;
        type2 = typeof o2;

        if (type1 !== type2) return false;

        if ('undefined' === type1 || 'undefined' === type2) {
            return (o1 === o2);
        }
        if (o1 === null || o2 === null) {
            return (o1 === o2);
        }
        if (('number' === type1 && isNaN(o1)) &&
            ('number' === type2 && isNaN(o2))) {
            return (isNaN(o1) && isNaN(o2));
        }

        // Check whether arguments are not objects
        primitives = {number: '', string: '', boolean: ''};
        if (type1 in primitives) {
            return o1 === o2;
        }

        if ('function' === type1) {
            return o1.toString() === o2.toString();
        }

        for (p in o1) {
            if (o1.hasOwnProperty(p)) {

                if ('undefined' === typeof o2[p] &&
                    'undefined' !== typeof o1[p]) return false;

                if (!o2[p] && o1[p]) return false;

                if ('function' === typeof o1[p]) {
                    if (o1[p].toString() !== o2[p].toString()) return false;
                }
                else
                    if (!OBJ.equals(o1[p], o2[p])) return false;
            }
        }

        // Check whether o2 has extra properties
        // TODO: improve, some properties have already been checked!
        for (p in o2) {
            if (o2.hasOwnProperty(p)) {
                if ('undefined' === typeof o1[p] &&
                    'undefined' !== typeof o2[p]) return false;

                if (!o1[p] && o2[p]) return false;
            }
        }

        return true;
    };

    /**
     * ## OBJ.isEmpty
     *
     * Returns TRUE if an object has no own properties
     *
     * Does not check properties of the prototype chain.
     *
     * @param {object} o The object to check
     *
     * @return {boolean} TRUE, if the object has no properties
     */
    OBJ.isEmpty = function(o) {
        var key;
        if ('undefined' === typeof o) return true;
        for (key in o) {
            if (o.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    };

    /**
     * ## OBJ.size
     *
     * Counts the number of own properties of an object.
     *
     * Prototype chain properties are excluded.
     *
     * @param {object} obj The object to check
     *
     * @return {number} The number of properties in the object
     */
    OBJ.size = OBJ.getListSize = function(obj) {
        var n, key;
        if (!obj) return 0;
        if ('number' === typeof obj) return 0;
        if ('string' === typeof obj) return 0;

        n = 0;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                n++;
            }
        }
        return n;
    };

    /**
     * ## OBJ._obj2Array
     *
     * Explodes an object into an array of keys and values,
     * according to the specified parameters.
     *
     * A fixed level of recursion can be set.
     *
     * @api private
     * @param {object} obj The object to convert in array
     * @param {boolean} keyed TRUE, if also property names should be included.
     *   Defaults, FALSE
     * @param {number} level Optional. The level of recursion.
     *   Defaults, undefined
     *
     * @return {array} The converted object
     */
    OBJ._obj2Array = function(obj, keyed, level, cur_level) {
        var result, key;
        if ('object' !== typeof obj) return [obj];

        if (level) {
            cur_level = ('undefined' !== typeof cur_level) ? cur_level : 1;
            if (cur_level > level) return [obj];
            cur_level = cur_level + 1;
        }

        result = [];
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (keyed) result.push(key);
                if ('object' === typeof obj[key]) {
                    result = result.concat(OBJ._obj2Array(obj[key], keyed,
                                                          level, cur_level));
                }
                else {
                    result.push(obj[key]);
                }
            }
        }
        return result;
    };

    /**
     * ## OBJ.obj2Array
     *
     * Converts an object into an array, keys are lost
     *
     * Recursively put the values of the properties of an object into
     * an array and returns it.
     *
     * The level of recursion can be set with the parameter level.
     * By default recursion has no limit, i.e. that the whole object
     * gets totally unfolded into an array.
     *
     * @param {object} obj The object to convert in array
     * @param {number} level Optional. The level of recursion. Defaults,
     *   undefined
     *
     * @return {array} The converted object
     *
     * @see OBJ._obj2Array
     * @see OBJ.obj2KeyedArray
     */
    OBJ.obj2Array = function(obj, level) {
        return OBJ._obj2Array(obj, false, level);
    };

    /**
     * ## OBJ.obj2KeyedArray
     *
     * Converts an object into array, keys are preserved
     *
     * Creates an array containing all keys and values of an object and
     * returns it.
     *
     * @param {object} obj The object to convert in array
     * @param {number} level Optional. The level of recursion. Defaults,
     *   undefined
     *
     * @return {array} The converted object
     *
     * @see OBJ.obj2Array
     */
    OBJ.obj2KeyedArray = OBJ.obj2KeyArray = function(obj, level) {
        return OBJ._obj2Array(obj, true, level);
    };

    /**
     * ## OBJ.obj2QueryString
     *
     * Creates a querystring with the key-value pairs of the given object.
     *
     * @param {object} obj The object to convert
     *
     * @return {string} The created querystring
     *
     * Kudos:
     * @see http://stackoverflow.com/a/1714899/3347292
     */
    OBJ.obj2QueryString = function(obj) {
        var str;
        var key;

        if ('object' !== typeof obj) {
            throw new TypeError(
                    'JSUS.objectToQueryString: obj must be object.');
        }

        str = [];
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key) + '=' +
                         encodeURIComponent(obj[key]));
            }
        }

        return '?' + str.join('&');
    };

    /**
     * ## OBJ.keys
     *
     * Scans an object an returns all the keys of the properties,
     * into an array.
     *
     * The second paramter controls the level of nested objects
     * to be evaluated. Defaults 0 (nested properties are skipped).
     *
     * @param {object} obj The object from which extract the keys
     * @param {number} level Optional. The level of recursion. Defaults 0
     *
     * @return {array} The array containing the extracted keys
     *
     * @see Object.keys
     */
    OBJ.keys = OBJ.objGetAllKeys = function(obj, level, curLevel) {
        var result, key;
        if (!obj) return [];
        level = 'number' === typeof level && level >= 0 ? level : 0;
        curLevel = 'number' === typeof curLevel && curLevel >= 0 ? curLevel : 0;
        result = [];
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                result.push(key);
                if (curLevel < level) {
                    if ('object' === typeof obj[key]) {
                        result = result.concat(OBJ.objGetAllKeys(obj[key],
                                                                 (curLevel+1)));
                    }
                }
            }
        }
        return result;
    };

    /**
     * ## OBJ.implode
     *
     * Separates each property into a new object and returns them into an array
     *
     * E.g.
     *
     * ```javascript
     * var a = { b:2, c: {a:1}, e:5 };
     * OBJ.implode(a); // [{b:2}, {c:{a:1}}, {e:5}]
     * ```
     *
     * @param {object} obj The object to implode
     *
     * @return {array} The array containing all the imploded properties
     */
    OBJ.implode = OBJ.implodeObj = function(obj) {
        var result, key, o;
        if (!obj) return [];
        result = [];
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                o = {};
                o[key] = obj[key];
                result.push(o);
            }
        }
        return result;
    };

    /**
     * ## OBJ.clone
     *
     * Creates a perfect copy of the object passed as parameter
     *
     * Recursively scans all the properties of the object to clone.
     * Properties of the prototype chain are copied as well.
     *
     * Primitive types and special values are returned as they are.
     *
     * @param {object} obj The object to clone
     *
     * @return {object} The clone of the object
     */
    OBJ.clone = function(obj) {
        var clone, i, value;
        if (!obj) return obj;
        if ('number' === typeof obj) return obj;
        if ('string' === typeof obj) return obj;
        if ('boolean' === typeof obj) return obj;
        // NaN and +-Infinity are numbers, so no check is necessary.

        if ('function' === typeof obj) {
            clone = function() {
                var len, args;
                len = arguments.length;
                if (!len) return obj.call(clone);
                else if (len === 1) return obj.call(clone, arguments[0]);
                else if (len === 2) {
                    return obj.call(clone, arguments[0], arguments[1]);
                }
                else {
                    args = new Array(len);
                    for (i = 0; i < len; i++) {
                        args[i] = arguments[i];
                    }
                    return obj.apply(clone, args);
                }
            };
        }
        else {
            clone = Object.prototype.toString.call(obj) === '[object Array]' ?
                [] : {};
        }
        for (i in obj) {
            // It is not NULL and it is an object.
            // Even if it is an array we need to use CLONE,
            // because `slice()` does not clone arrays of objects.
            if (obj[i] && 'object' === typeof obj[i]) {
                value = OBJ.clone(obj[i]);
            }
            else {
                value = obj[i];
            }

            if (obj.hasOwnProperty(i)) {
                clone[i] = value;
            }
            else {
                // We know if object.defineProperty is available.
                if (compatibility && compatibility.defineProperty) {
                    Object.defineProperty(clone, i, {
                        value: value,
                        writable: true,
                        configurable: true
                    });
                }
                else {
                    setProp(clone, i, value);
                }
            }
        }
        return clone;
    };

    function setProp(clone, i, value) {
        try {
            Object.defineProperty(clone, i, {
                value: value,
                writable: true,
                configurable: true
            });
        }
        catch(e) {
            clone[i] = value;
        }
    }


    /**
     * ## OBJ.classClone
     *
     * Creates a copy (keeping class) of the object passed as parameter
     *
     * Recursively scans all the properties of the object to clone.
     * The clone is an instance of the type of obj.
     *
     * @param {object} obj The object to clone
     * @param {Number} depth how deep the copy should be
     *
     * @return {object} The clone of the object
     */
    OBJ.classClone = function(obj, depth) {
        var clone, i;
        if (depth === 0) {
            return obj;
        }

        if (obj && 'object' === typeof obj) {
            clone = Object.prototype.toString.call(obj) === '[object Array]' ?
                [] : JSUS.createObj(obj.constructor.prototype);

            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    if (obj[i] && 'object' === typeof obj[i]) {
                        clone[i] = JSUS.classClone(obj[i], depth - 1);
                    }
                    else {
                        clone[i] = obj[i];
                    }
                }
            }
            return clone;
        }
        else {
            return JSUS.clone(obj);
        }
    };

    /**
     * ## OBJ.join
     *
     * Performs a *left* join on the keys of two objects
     *
     * Creates a copy of obj1, and in case keys overlap
     * between obj1 and obj2, the values from obj2 are taken.
     *
     * Returns a new object, the original ones are not modified.
     *
     * E.g.
     *
     * ```javascript
     * var a = { b:2, c:3, e:5 };
     * var b = { a:10, b:2, c:100, d:4 };
     * OBJ.join(a, b); // { b:2, c:100, e:5 }
     * ```
     *
     * @param {object} obj1 The object where the merge will take place
     * @param {object} obj2 The merging object
     *
     * @return {object} The joined object
     *
     * @see OBJ.merge
     */
    OBJ.join = function(obj1, obj2) {
        var clone, i;
        clone = OBJ.clone(obj1);
        if (!obj2) return clone;
        for (i in clone) {
            if (clone.hasOwnProperty(i)) {
                if ('undefined' !== typeof obj2[i]) {
                    if ('object' === typeof obj2[i]) {
                        clone[i] = OBJ.join(clone[i], obj2[i]);
                    } else {
                        clone[i] = obj2[i];
                    }
                }
            }
        }
        return clone;
    };

    /**
     * ## OBJ.merge
     *
     * Merges two objects in one
     *
     * In case keys overlap the values from obj2 are taken.
     *
     * Only own properties are copied.
     *
     * Returns a new object, the original ones are not modified.
     *
     * E.g.
     *
     * ```javascript
     * var a = { a:1, b:2, c:3 };
     * var b = { a:10, b:2, c:100, d:4 };
     * OBJ.merge(a, b); // { a: 10, b: 2, c: 100, d: 4 }
     * ```
     *
     * @param {object} obj1 The object where the merge will take place
     * @param {object} obj2 The merging object
     *
     * @return {object} The merged object
     *
     * @see OBJ.join
     * @see OBJ.mergeOnKey
     */
    OBJ.merge = function(obj1, obj2) {
        var clone, i;
        // Checking before starting the algorithm
        if (!obj1 && !obj2) return false;
        if (!obj1) return OBJ.clone(obj2);
        if (!obj2) return OBJ.clone(obj1);

        clone = OBJ.clone(obj1);
        for (i in obj2) {

            if (obj2.hasOwnProperty(i)) {
                // it is an object and it is not NULL
                if (obj2[i] && 'object' === typeof obj2[i]) {
                    // If we are merging an object into
                    // a non-object, we need to cast the
                    // type of obj1
                    if ('object' !== typeof clone[i]) {
                        if (Object.prototype.toString.call(obj2[i]) ===
                            '[object Array]') {

                            clone[i] = [];
                        }
                        else {
                            clone[i] = {};
                        }
                    }
                    clone[i] = OBJ.merge(clone[i], obj2[i]);
                }
                else {
                    clone[i] = obj2[i];
                }
            }
        }
        return clone;
    };

    /**
     * ## OBJ.mixin
     *
     * Adds all the properties of obj2 into obj1
     *
     * Original object is modified.
     *
     * @param {object} obj1 The object to which the new properties will be added
     * @param {object} obj2 The mixin-in object
     */
    OBJ.mixin = function(obj1, obj2) {
        var i;
        if (!obj1 && !obj2) return;
        if (!obj1) return obj2;
        if (!obj2) return obj1;
        for (i in obj2) {
            obj1[i] = obj2[i];
        }
    };

    /**
     * ## OBJ.mixout
     *
     * Copies only non-overlapping properties from obj2 to obj1
     *
     * Check only if a property is defined, not its value.
     * Original object is modified.
     *
     * @param {object} obj1 The object to which the new properties will be added
     * @param {object} obj2 The mixin-in object
     */
    OBJ.mixout = function(obj1, obj2) {
        var i;
        if (!obj1 && !obj2) return;
        if (!obj1) return obj2;
        if (!obj2) return obj1;
        for (i in obj2) {
            if ('undefined' === typeof obj1[i]) obj1[i] = obj2[i];
        }
    };

    /**
     * ## OBJ.mixcommon
     *
     * Copies only overlapping properties from obj2 to obj1
     *
     * Check only if a property is defined, not its value.
     * Original object is modified.
     *
     * @param {object} obj1 The object to which the new properties will be added
     * @param {object} obj2 The mixin-in object
     */
    OBJ.mixcommon = function(obj1, obj2) {
        var i;
        if (!obj1 && !obj2) return;
        if (!obj1) return obj2;
        if (!obj2) return obj1;
        for (i in obj2) {
            if ('undefined' !== typeof obj1[i]) obj1[i] = obj2[i];
        }
    };

    /**
     * ## OBJ.mergeOnKey
     *
     * Merges the properties of obj2 into a new property named 'key' in obj1.
     *
     * Returns a new object, the original ones are not modified.
     *
     * This method is useful when we want to merge into a larger
     * configuration (e.g. with properties min, max, value) object, another one
     * that contains just a subset of properties (e.g. value).
     *
     * @param {object} obj1 The object where the merge will take place
     * @param {object} obj2 The merging object
     * @param {string} key The name of property under which the second object
     *   will be merged
     *
     * @return {object} The merged object
     *
     * @see OBJ.merge
     */
    OBJ.mergeOnKey = function(obj1, obj2, key) {
        var clone, i;
        clone = OBJ.clone(obj1);
        if (!obj2 || !key) return clone;
        for (i in obj2) {
            if (obj2.hasOwnProperty(i)) {
                if (!clone[i] || 'object' !== typeof clone[i]) {
                    clone[i] = {};
                }
                clone[i][key] = obj2[i];
            }
        }
        return clone;
    };

    /**
     * ## OBJ.subobj
     *
     * Creates a copy of an object containing only the properties
     * passed as second parameter
     *
     * The parameter select can be an array of strings, or the name
     * of a property.
     *
     * Use '.' (dot) to point to a nested property, however if a property
     * with a '.' in the name is found, it will be used first.
     *
     * @param {object} o The object to dissect
     * @param {string|array} select The selection of properties to extract
     *
     * @return {object} The subobject with the properties from the parent
     *
     * @see OBJ.getNestedValue
     */
    OBJ.subobj = function(o, select) {
        var out, i, key;
        if (!o) return false;
        out = {};
        if (!select) return out;
        if (!(select instanceof Array)) select = [select];
        for (i=0; i < select.length; i++) {
            key = select[i];
            if (o.hasOwnProperty(key)) {
                out[key] = o[key];
            }
            else if (OBJ.hasOwnNestedProperty(key, o)) {
                OBJ.setNestedValue(key, OBJ.getNestedValue(key, o), out);
            }
        }
        return out;
    };

    /**
     * ## OBJ.skim
     *
     * Creates a copy of an object with some of the properties removed
     *
     * The parameter `remove` can be an array of strings, or the name
     * of a property.
     *
     * Use '.' (dot) to point to a nested property, however if a property
     * with a '.' in the name is found, it will be deleted first.
     *
     * @param {object} o The object to dissect
     * @param {string|array} remove The selection of properties to remove
     *
     * @return {object} The subobject with the properties from the parent
     *
     * @see OBJ.getNestedValue
     */
    OBJ.skim = function(o, remove) {
        var out, i;
        if (!o) return false;
        out = OBJ.clone(o);
        if (!remove) return out;
        if (!(remove instanceof Array)) remove = [remove];
        for (i = 0; i < remove.length; i++) {
            if (out.hasOwnProperty(i)) {
                delete out[i];
            }
            else {
                OBJ.deleteNestedKey(remove[i], out);
            }
        }
        return out;
    };


    /**
     * ## OBJ.setNestedValue
     *
     * Sets the value of a nested property of an object and returns it.
     *
     * If the object is not passed a new one is created.
     * If the nested property is not existing, a new one is created.
     *
     * Use '.' (dot) to point to a nested property.
     *
     * The original object is modified.
     *
     * @param {string} str The path to the value
     * @param {mixed} value The value to set
     *
     * @return {object|boolean} The modified object, or FALSE if error
     *   occurrs
     *
     * @see OBJ.getNestedValue
     * @see OBJ.deleteNestedKey
     */
    OBJ.setNestedValue = function(str, value, obj) {
        var keys, k;
        if (!str) {
            JSUS.log('Cannot set value of undefined property', 'ERR');
            return false;
        }
        obj = ('object' === typeof obj) ? obj : {};
        keys = str.split('.');
        if (keys.length === 1) {
            obj[str] = value;
            return obj;
        }
        k = keys.shift();
        obj[k] = OBJ.setNestedValue(keys.join('.'), value, obj[k]);
        return obj;
    };

    /**
     * ## OBJ.getNestedValue
     *
     * Returns the value of a property of an object, as defined
     * by a path string.
     *
     * Use '.' (dot) to point to a nested property.
     *
     * Returns undefined if the nested property does not exist.
     *
     * E.g.
     *
     * ```javascript
     * var o = { a:1, b:{a:2} };
     * OBJ.getNestedValue('b.a', o); // 2
     * ```
     *
     * @param {string} str The path to the value
     * @param {object} obj The object from which extract the value
     *
     * @return {mixed} The extracted value
     *
     * @see OBJ.setNestedValue
     * @see OBJ.deleteNestedKey
     */
    OBJ.getNestedValue = function(str, obj) {
        var keys, k;
        if (!obj) return;
        keys = str.split('.');
        if (keys.length === 1) {
            return obj[str];
        }
        k = keys.shift();
        return OBJ.getNestedValue(keys.join('.'), obj[k]);
    };

    /**
     * ## OBJ.deleteNestedKey
     *
     * Deletes a property from an object, as defined by a path string
     *
     * Use '.' (dot) to point to a nested property.
     *
     * The original object is modified.
     *
     * E.g.
     *
     * ```javascript
     * var o = { a:1, b:{a:2} };
     * OBJ.deleteNestedKey('b.a', o); // { a:1, b: {} }
     * ```
     *
     * @param {string} str The path string
     * @param {object} obj The object from which deleting a property
     * @param {boolean} TRUE, if the property was existing, and then deleted
     *
     * @see OBJ.setNestedValue
     * @see OBJ.getNestedValue
     */
    OBJ.deleteNestedKey = function(str, obj) {
        var keys, k;
        if (!obj) return;
        keys = str.split('.');
        if (keys.length === 1) {
            delete obj[str];
            return true;
        }
        k = keys.shift();
        if ('undefined' === typeof obj[k]) {
            return false;
        }
        return OBJ.deleteNestedKey(keys.join('.'), obj[k]);
    };

    /**
     * ## OBJ.hasOwnNestedProperty
     *
     * Returns TRUE if a (nested) property exists
     *
     * Use '.' to specify a nested property.
     *
     * E.g.
     *
     * ```javascript
     * var o = { a:1, b:{a:2} };
     * OBJ.hasOwnNestedProperty('b.a', o); // TRUE
     * ```
     *
     * @param {string} str The path of the (nested) property
     * @param {object} obj The object to test
     *
     * @return {boolean} TRUE, if the (nested) property exists
     */
    OBJ.hasOwnNestedProperty = function(str, obj) {
        var keys, k;
        if (!obj) return false;
        keys = str.split('.');
        if (keys.length === 1) {
            return obj.hasOwnProperty(str);
        }
        k = keys.shift();
        return OBJ.hasOwnNestedProperty(keys.join('.'), obj[k]);
    };


    /**
     * ## OBJ.split
     *
     * Splits an object along a specified dimension, and returns
     * all the copies in an array.
     *
     * It creates as many new objects as the number of properties
     * contained in the specified dimension. The object are identical,
     * but for the given dimension, which was split. E.g.
     *
     * ```javascript
     *  var o = { a: 1,
     *            b: {c: 2,
     *                d: 3
     *            },
     *            e: 4
     *  };
     *
     *  o = OBJ.split(o, 'b');
     *
     *  // o becomes:
     *
     *  [{ a: 1,
     *     b: {c: 2},
     *     e: 4
     *  },
     *  { a: 1,
     *    b: {d: 3},
     *    e: 4
     *  }];
     * ```
     *
     * @param {object} o The object to split
     * @param {sting} key The name of the property to split
     *
     * @return {object} A copy of the object with split values
     */
    OBJ.split = function(o, key) {
        var out, model, splitValue;
        if (!o) return;
        if (!key || 'object' !== typeof o[key]) {
            return JSUS.clone(o);
        }

        out = [];
        model = JSUS.clone(o);
        model[key] = {};

        splitValue = function(value) {
            var i, copy;
            for (i in value) {
                copy = JSUS.clone(model);
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
     * ## OBJ.melt
     *
     * Creates a new object with the specified combination of
     * properties - values
     *
     * The values are assigned cyclically to the properties, so that
     * they do not need to have the same length. E.g.
     *
     * ```javascript
     *  J.createObj(['a','b','c'], [1,2]); // { a: 1, b: 2, c: 1 }
     * ```
     * @param {array} keys The names of the keys to add to the object
     * @param {array} values The values to associate to the keys
     *
     * @return {object} A new object with keys and values melted together
     */
    OBJ.melt = function(keys, values) {
        var o = {}, valen = values.length;
        for (var i = 0; i < keys.length; i++) {
            o[keys[i]] = values[i % valen];
        }
        return o;
    };

    /**
     * ## OBJ.uniqueKey
     *
     * Creates a random unique key name for a collection
     *
     * User can specify a tentative unique key name, and if already
     * existing an incremental index will be added as suffix to it.
     *
     * Notice: the method does not actually create the key
     * in the object, but it just returns the name.
     *
     * @param {object} obj The collection for which a unique key will be created
     * @param {string} prefixName Optional. A tentative key name. Defaults,
     *   a 15-digit random number
     * @param {number} stop Optional. The number of tries before giving up
     *   searching for a unique key name. Defaults, 1000000.
     *
     * @return {string|undefined} The unique key name, or undefined if it was
     *   not found
     */
    OBJ.uniqueKey = function(obj, prefixName, stop) {
        var name;
        var duplicateCounter = 1;
        if (!obj) {
            JSUS.log('Cannot find unique name in undefined object', 'ERR');
            return;
        }
        prefixName = '' + (prefixName ||
                           Math.floor(Math.random()*1000000000000000));
        stop = stop || 1000000;
        name = prefixName;
        while (obj[name]) {
            name = prefixName + duplicateCounter;
            duplicateCounter++;
            if (duplicateCounter > stop) {
                return;
            }
        }
        return name;
    };

    /**
     * ## OBJ.augment
     *
     * Pushes the values of the properties of an object into another one
     *
     * User can specifies the subset of keys from both objects
     * that will subject to augmentation. The values of the other keys
     * will not be changed
     *
     * Notice: the method modifies the first input paramteer
     *
     * E.g.
     *
     * ```javascript
     * var a = { a:1, b:2, c:3 };
     * var b = { a:10, b:2, c:100, d:4 };
     * OBJ.augment(a, b); // { a: [1, 10], b: [2, 2], c: [3, 100]}
     *
     * OBJ.augment(a, b, ['b', 'c', 'd']);
     * // { a: 1, b: [2, 2], c: [3, 100], d: [4]});
     *
     * ```
     *
     * @param {object} obj1 The object whose properties will be augmented
     * @param {object} obj2 The augmenting object
     * @param {array} key Optional. Array of key names common to both objects
     *   taken as the set of properties to augment
     */
    OBJ.augment = function(obj1, obj2, keys) {
        var i, k;
        keys = keys || OBJ.keys(obj1);

        for (i = 0 ; i < keys.length; i++) {
            k = keys[i];
            if ('undefined' !== typeof obj1[k] &&
                Object.prototype.toString.call(obj1[k]) !== '[object Array]') {
                obj1[k] = [obj1[k]];
            }
            if ('undefined' !== obj2[k]) {
                if (!obj1[k]) obj1[k] = [];
                obj1[k].push(obj2[k]);
            }
        }
    };


    /**
     * ## OBJ.pairwiseWalk
     *
     * Executes a callback on all pairs of  attributes with the same name
     *
     * The results of each callback are aggregated in a new object under the
     * same property name.
     *
     * Does not traverse nested objects, and properties of the prototype
     * are excluded.
     *
     * Returns a new object, the original ones are not modified.
     *
     * E.g.
     *
     * ```javascript
     * var a = { b:2, c:3, d:5 };
     * var b = { a:10, b:2, c:100, d:4 };
     * var sum = function(a,b) {
     *     if ('undefined' !== typeof a) {
     *         return 'undefined' !== typeof b ? a + b : a;
     *     }
     *     return b;
     * };
     * OBJ.pairwiseWalk(a, b, sum); // { a:10, b:4, c:103, d:9 }
     * ```
     *
     * @param {object} o1 The first object
     * @param {object} o2 The second object
     *
     * @return {object} The object aggregating the results
     */
    OBJ.pairwiseWalk = function(o1, o2, cb) {
        var i, out;
        if (!o1 && !o2) return;
        if (!o1) return o2;
        if (!o2) return o1;

        out = {};
        for (i in o1) {
            if (o1.hasOwnProperty(i)) {
                out[i] = o2.hasOwnProperty(i) ? cb(o1[i], o2[i]) : cb(o1[i]);
            }
        }

        for (i in o2) {
            if (o2.hasOwnProperty(i)) {
                if ('undefined' === typeof out[i]) {
                    out[i] = cb(undefined, o2[i]);
                }
            }
        }
        return out;
    };

    /**
     * ## OBJ.getKeyByValue
     *
     * Returns the key/s associated with a specific value
     *
     * Uses OBJ.equals so it can perform complicated comparisons of
     * the value of the keys.
     *
     * Properties of the prototype are not skipped.
     *
     * @param {object} obj The object to search
     * @param {mixed} value The value to match
     * @param {boolean} allKeys Optional. If TRUE, all keys with the
     *   specific value are returned. Default FALSE
     *
     * @return {object} The object aggregating the results
     *
     * @see OBJ.equals
     */
    OBJ.getKeyByValue = function(obj, value, allKeys) {
        var key, out;
        if ('object' !== typeof obj) {
            throw new TypeError('OBJ.getKeyByValue: obj must be object.');
        }
        if (allKeys) out = [];
        for (key in obj) {
            if (obj.hasOwnProperty(key) ) {
                if (OBJ.equals(value, obj[key])) {
                    if (!allKeys) return key;
                    else out.push(key);
                }
            }
        }
        return out;
    };

    JSUS.extend(OBJ);

})('undefined' !== typeof JSUS ? JSUS : module.parent.exports.JSUS);

/**
 * # PARSE
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * Collection of static functions related to parsing strings
 */
(function(JSUS) {

    "use strict";

    function PARSE() {}

    /**
     * ## PARSE.stringify_prefix
     *
     * Prefix used by PARSE.stringify and PARSE.parse
     * to decode strings with special meaning
     *
     * @see PARSE.stringify
     * @see PARSE.parse
     */
    PARSE.stringify_prefix = '!?_';

    PARSE.marker_func = PARSE.stringify_prefix + 'function';
    PARSE.marker_null = PARSE.stringify_prefix + 'null';
    PARSE.marker_und = PARSE.stringify_prefix + 'undefined';
    PARSE.marker_nan = PARSE.stringify_prefix + 'NaN';
    PARSE.marker_inf = PARSE.stringify_prefix + 'Infinity';
    PARSE.marker_minus_inf = PARSE.stringify_prefix + '-Infinity';

    /**
     * ## PARSE.getQueryString
     *
     * Parses current querystring and returns the requested variable.
     *
     * If no variable name is specified, returns the full query string.
     * If requested variable is not found returns false.
     *
     * @param {string} name Optional. If set, returns only the value
     *   associated with this variable
     * @param {string} referer Optional. If set, searches this string
     *
     * @return {string|boolean} The querystring, or a part of it, or FALSE
     *
     * Kudos:
     * @see http://stackoverflow.com/q/901115/3347292
     */
    PARSE.getQueryString = function(name, referer) {
        var regex, results;
        if (referer && 'string' !== typeof referer) {
            throw new TypeError('JSUS.getQueryString: referer must be string ' +
                                'or undefined.');
        }
        referer = referer || window.location.search;
        if ('undefined' === typeof name) return referer;
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
        results = regex.exec(referer);
        return results === null ? false :
            decodeURIComponent(results[1].replace(/\+/g, " "));
    };

    /**
     * ## PARSE.tokenize
     *
     * Splits a string in tokens that users can specified as input parameter.
     * Additional options can be specified with the modifiers parameter
     *
     * - limit: An integer that specifies the number of split items
     *     after the split limit will not be included in the array
     *
     * @param {string} str The string to split
     * @param {array} separators Array containing the separators words
     * @param {object} modifiers Optional. Configuration options
     *   for the tokenizing
     *
     * @return {array} Tokens in which the string was split
     */
    PARSE.tokenize = function(str, separators, modifiers) {
        var pattern, regex;
        if (!str) return;
        if (!separators || !separators.length) return [str];
        modifiers = modifiers || {};

        pattern = '[';

        JSUS.each(separators, function(s) {
            if (s === ' ') s = '\\s';

            pattern += s;
        });

        pattern += ']+';

        regex = new RegExp(pattern);
        return str.split(regex, modifiers.limit);
    };

    /**
     * ## PARSE.stringify
     *
     * Stringifies objects, functions, primitive, undefined or null values
     *
     * Makes uses `JSON.stringify` with a special reviver function, that
     * strinfifies also functions, undefined, and null values.
     *
     * A special prefix is prepended to avoid name collisions.
     *
     * @param {mixed} o The value to stringify
     * @param {number} spaces Optional the number of indentation spaces.
     *   Defaults, 0
     *
     * @return {string} The stringified result
     *
     * @see JSON.stringify
     * @see PARSE.stringify_prefix
     */
    PARSE.stringify = function(o, spaces) {
        return JSON.stringify(o, function(key, value) {
            var type = typeof value;
            if ('function' === type) {
                return PARSE.stringify_prefix + value.toString();
            }

            if ('undefined' === type) return PARSE.marker_und;
            if (value === null) return PARSE.marker_null;
            if ('number' === type && isNaN(value)) return PARSE.marker_nan;
            if (value === Number.POSITIVE_INFINITY) return PARSE.marker_inf;
            if (value === Number.NEGATIVE_INFINITY) {
                return PARSE.marker_minus_inf;
            }

            return value;

        }, spaces);
    };

    /**
     * ## PARSE.stringifyAll
     *
     * Copies all the properties of the prototype before stringifying
     *
     * Notice: The original object is modified!
     *
     * @param {mixed} o The value to stringify
     * @param {number} spaces Optional the number of indentation spaces.
     *   Defaults, 0
     *
     * @return {string} The stringified result
     *
     * @see PARSE.stringify
     */
    PARSE.stringifyAll = function(o, spaces) {
        for (var i in o) {
            if (!o.hasOwnProperty(i)) {
                if ('object' === typeof o[i]) {
                    o[i] = PARSE.stringifyAll(o[i]);
                }
                else {
                    o[i] = o[i];
                }
            }
        }
        return PARSE.stringify(o);
    };

    /**
     * ## PARSE.parse
     *
     * Decodes strings in objects and other values
     *
     * Uses `JSON.parse` and then looks  for special strings
     * encoded by `PARSE.stringify`
     *
     * @param {string} str The string to decode
     * @return {mixed} The decoded value
     *
     * @see JSON.parse
     * @see PARSE.stringify_prefix
     */
    PARSE.parse = function(str) {

        var len_prefix = PARSE.stringify_prefix.length,
            len_func = PARSE.marker_func.length,
            len_null = PARSE.marker_null.length,
            len_und = PARSE.marker_und.length,
            len_nan = PARSE.marker_nan.length,
            len_inf = PARSE.marker_inf.length,
            len_minus_inf = PARSE.marker_minus_inf.length;


        var o = JSON.parse(str);
        return walker(o);

        function walker(o) {
            if ('object' !== typeof o) return reviver(o);

            for (var i in o) {
                if (o.hasOwnProperty(i)) {
                    if ('object' === typeof o[i]) {
                        walker(o[i]);
                    }
                    else {
                        o[i] = reviver(o[i]);
                    }
                }
            }

            return o;
        }

        function reviver(value) {
            var type = typeof value;

            if (type === 'string') {
                if (value.substring(0, len_prefix) !== PARSE.stringify_prefix) {
                    return value;
                }
                else if (value.substring(0, len_func) === PARSE.marker_func) {
                    return JSUS.eval(value.substring(len_prefix));
                }
                else if (value.substring(0, len_null) === PARSE.marker_null) {
                    return null;
                }
                else if (value.substring(0, len_und) === PARSE.marker_und) {
                    return undefined;
                }

                else if (value.substring(0, len_nan) === PARSE.marker_nan) {
                    return NaN;
                }
                else if (value.substring(0, len_inf) === PARSE.marker_inf) {
                    return Infinity;
                }
                else if (value.substring(0, len_minus_inf) ===
                         PARSE.marker_minus_inf) {

                    return -Infinity;
                }

            }
            return value;
        }
    };

    /**
     * ## PARSE.range
     *
     * Decodes strings into an array of integers
     *
     * Let n, m  and l be integers, then the tokens of the string are
     * interpreted in the following way:
     * - `*`: Any integer.
     * - `n`: The integer `n`.
     * - `begin`: The smallest integer in `available`.
     * - `end`: The largest integer in `available`.
     * - `<n`, `<=n`, `>n`, `>=n`: Any integer (strictly) smaller/larger than n.
     * - `n..m`, `[n,m]`: Any integer between n and m (both inclusively).
     * - `n..l..m`: Any i
     * - `[n,m)`: Any integer between n (inclusively) and m (exclusively).
     * - `(n,m]`: Any integer between n (exclusively) and m (inclusively).
     * - `(n,m)`: Any integer between n and m (both exclusively).
     * - `%n`: Divisible by n.
     * - `%n = m`: Divisible with rest m.
     * - `!`: Not.
     * - `|`, `||`, `,`: Or.
     * - `&`, `&&`: And.
     * The elements of the resulting array are all elements of the `available`
     * array which satisfy the expression defined by `expr`.
     *
     * Example:
     * PARSE.range('2..5, >8 & !11', '[-2,12]');
     *      // [2,3,4,5,9,10,12]
     * PARSE.range('begin...end/2 | 3*end/4...3...end', '[0,40) & %2 = 1');
     *      // [1,3,5,7,9,11,13,15,17,19,29,35] (end == 39)
     * PARSE.range('<=19, 22, %5', '>6 & !>27');
     *      // [7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,25]
     * PARSE.range('*','(3,8) & !%4, 22, (10,12]');
     *      // [5,6,7,11,12,22]
     * PARSE.range('<4', {
     *      begin: 0,
     *      end: 21,
     *      prev: 0,
     *      cur: 1,
     *      next: function() {
     *          var temp = this.prev;
     *          this.prev = this.cur;
     *          this.cur += temp;
     *          return this.cur;
     *      },
     *      isFinished: function() {
     *          return this.cur + this.prev > this.end;
     *      }
     * });
     *      // [5, 8, 13, 21]
     *
     *
     * @param {string} expr The string specifying the selection expression
     * @param {mixed} available
     *  - string to be interpreted according to the same rules as
     *       `expr`
     *  - array containing the available elements
     *  - object providing functions next, isFinished and attributes begin, end
     *
     * @return {array} The array containing the specified values
     */
    // available can be an array, a string or a object.
    PARSE.range = function(expr, available) {
        var i, x;
        var solution = [];
        var begin, end, lowerBound, numbers;
        var invalidChars, invalidBeforeOpeningBracket, invalidDot;

        if ("undefined" === typeof expr) {
            return [];
        }

        // If no available numbers defined, assumes all possible are allowed.
        if ("undefined" === typeof available) {
            available = expr;
        }
        if (!JSUS.isArray(available)) {
            if ("string" !== typeof available) {
                if ("function" !== typeof available.next ||
                    "function" !== typeof available.isFinished ||
                    "number"   !== typeof available.begin ||
                    "number"   !== typeof available.end
                )
                throw new Error('PARSE.range: available wrong type');
            }
        }
        else if (available.length === 0) {
            return [];
        }

        // If the availble points are also only given implicitly, compute set
        // of available numbers by first guessing a bound.
        if ("string" === typeof available) {
            available = preprocessRange(available);

            numbers = available.match(/([-+]?\d+)/g);
            if (numbers === null) {
                throw new Error(
                    'PARSE.range: no numbers in available: ' + available);
            }
            lowerBound = Math.min.apply(null, numbers);

            available = PARSE.range(available, {
                begin: lowerBound,
                end: Math.max.apply(null, numbers),
                value: lowerBound,
                next: function() {
                    return this.value++;
                },
                isFinished: function() {
                    return this.value > this.end;
                }
            });
        }
        if (JSUS.isArray(available)) {
            begin = Math.min.apply(null, available);
            end = Math.max.apply(null, available);
        }
        else {
            begin = available.begin;
            end = available.end;
        }

        // end -> maximal available value.
        expr = expr.replace(/end/g, parseInt(end));

        // begin -> minimal available value.
        expr = expr.replace(/begin/g, parseInt(begin));

        // Do all computations.
        expr = preprocessRange(expr);

        // Round all floats
        expr = expr.replace(/([-+]?\d+\.\d+)/g, function(match, p1) {
            return parseInt(p1);
        });

        // Validate expression to only contain allowed symbols.
        invalidChars = /[^ \*\d<>=!\|&\.\[\],\(\)\-\+%]/g;
        if (expr.match(invalidChars)) {
            throw new Error('invalidChars:' + expr);
        }

        // & -> && and | -> ||.
        expr = expr.replace(/([^& ]) *& *([^& ])/g, "$1&&$2");
        expr = expr.replace(/([^| ]) *\| *([^| ])/g, "$1||$2");

        // n -> (x == n).
        expr = expr.replace(/([-+]?\d+)/g, "(x==$1)");

        // n has already been replaced by (x==n) so match for that from now on.

        // %n -> !(x%n)
        expr = expr.replace(/% *\(x==([-+]?\d+)\)/,"!(x%$1)");

        // %n has already been replaced by !(x%n) so match for that from now on.
        // %n = m, %n == m -> (x%n == m).
        expr = expr.replace(/!\(x%([-+]?\d+)\) *={1,} *\(x==([-+]?\d+)\)/g,
            "(x%$1==$2)");

        // <n, <=n, >n, >=n -> (x < n), (x <= n), (x > n), (x >= n)
        expr = expr.replace(/([<>]=?) *\(x==([-+]?\d+)\)/g, "(x$1$2)");

        // n..l..m -> (x >= n && x <= m && !((x-n)%l)) for positive l.
        expr = expr.replace(
            /\(x==([-+]?\d+)\)\.{2,}\(x==(\+?\d+)\)\.{2,}\(x==([-+]?\d+)\)/g,
            "(x>=$1&&x<=$3&&!((x- $1)%$2))");

        // n..l..m -> (x <= n && x >= m && !((x-n)%l)) for negative l.
        expr = expr.replace(
            /\(x==([-+]?\d+)\)\.{2,}\(x==(-\d+)\)\.{2,}\(x==([-+]?\d+)\)/g,
            "(x<=$1&&x>=$3&&!((x- $1)%$2))");

        // n..m -> (x >= n && x <= m).
        expr = expr.replace(/\(x==([-+]?\d+)\)\.{2,}\(x==([-+]?\d+)\)/g,
                "(x>=$1&&x<=$2)");

        // (n,m), ... ,[n,m] -> (x > n && x < m), ... , (x >= n && x <= m).
        expr = expr.replace(
            /([(\[]) *\(x==([-+]?\d+)\) *, *\(x==([-+]?\d+)\) *([\])])/g,
                function (match, p1, p2, p3, p4) {
                    return "(x>" + (p1 == '(' ? '': '=') + p2 + "&&x<" +
                        (p4 == ')' ? '' : '=') + p3 + ')';
            }
        );

        // * -> true.
        expr = expr.replace('*', 1);

        // a, b -> (a) || (b)
        expr = expr.replace(/\)[,] *(!*)\(/g, ")||$1(");


        // Validating the expression before eval"ing it.
        invalidChars = /[^ \d<>=!\|&,\(\)\-\+%x\.]/g;
        // Only & | ! may be before an opening bracket.
        invalidBeforeOpeningBracket = /[^ &!|\(] *\(/g;
        // Only dot in floats.
        invalidDot = /\.[^\d]|[^\d]\./;

        if (expr.match(invalidChars)) {
            throw new Error('PARSE.range: invalidChars:' + expr);
        }
        if (expr.match(invalidBeforeOpeningBracket)) {
            throw new Error('PARSE.range: invaludBeforeOpeningBracket:' + expr);
        }
        if (expr.match(invalidDot)) {
            throw new Error('PARSE.range: invalidDot:' + expr);
        }

        if (JSUS.isArray(available)) {
            for (i in available) {
                if (available.hasOwnProperty(i)) {
                    x = parseInt(available[i]);
                    if (JSUS.eval(expr.replace(/x/g, x))) {
                        solution.push(x);
                    }
                }
            }
        }
        else {
            while (!available.isFinished()) {
                x = parseInt(available.next());
                if (JSUS.eval(expr.replace(/x/g, x))) {
                    solution.push(x);
                }
            }
        }
        return solution;
    };

    function preprocessRange(expr) {
        var mult = function(match, p1, p2, p3) {
            var n1 = parseInt(p1);
            var n3 = parseInt(p3);
            return p2 == '*' ? n1*n3 : n1/n3;
        };
        var add = function(match, p1, p2, p3) {
            var n1 = parseInt(p1);
            var n3 = parseInt(p3);
            return p2 == '-' ? n1 - n3 : n1 + n3;
        };
        var mod = function(match, p1, p2, p3) {
            var n1 = parseInt(p1);
            var n3 = parseInt(p3);
            return n1 % n3;
        };

        while (expr.match(/([-+]?\d+) *([*\/]) *([-+]?\d+)/g)) {
            expr = expr.replace(/([-+]?\d+) *([*\/]) *([-+]?\d+)/, mult);
        }

        while (expr.match(/([-+]?\d+) *([-+]) *([-+]?\d+)/g)) {
            expr = expr.replace(/([-+]?\d+) *([-+]) *([-+]?\d+)/, add);
        }
        while (expr.match(/([-+]?\d+) *% *([-+]?\d+)/g)) {
            expr = expr.replace(/([-+]?\d+) *% *([-+]?\d+)/, mod);
        }
        return expr;
    }

    /**
     * ## PARSE.funcName
     *
     * Returns the name of the function
     *
     * Function.name is a non-standard JavaScript property,
     * although many browsers implement it. This is a cross-browser
     * implementation for it.
     *
     * In case of anonymous functions, an empty string is returned.
     *
     * @param {function} func The function to check
     *
     * @return {string} The name of the function
     *
     * Kudos to:
     * http://matt.scharley.me/2012/03/09/monkey-patch-name-ie.html
     */
    if ('undefined' !== typeof Function.prototype.name) {
        PARSE.funcName = function(func) {
            if ('function' !== typeof func) {
                throw new TypeError('PARSE.funcName: func must be function.');
            }
            return func.name;
        };
    }
    else {
        PARSE.funcName = function(func) {
            var funcNameRegex, res;
            if ('function' !== typeof func) {
                throw new TypeError('PARSE.funcName: func must be function.');
            }
            funcNameRegex = /function\s([^(]{1,})\(/;
            res = (funcNameRegex).exec(func.toString());
            return (res && res.length > 1) ? res[1].trim() : "";
        };
    }

    JSUS.extend(PARSE);

})('undefined' !== typeof JSUS ? JSUS : module.parent.exports.JSUS);

/**
 * # NDDB: N-Dimensional Database
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * NDDB is a powerful and versatile object database for node.js and the browser.
 * ---
 */
(function(exports, J, store) {

    "use strict";

    // Expose constructors
    exports.NDDB = NDDB;

    if (!J) throw new Error('NDDB: missing dependency: JSUS.');

    /**
     * ### df
     *
     * Flag indicating support for method Object.defineProperty
     *
     * If support is missing, the index `_nddbid` will be as a normal
     * property, and, therefore, it will be enumerable.
     *
     * @see nddb_insert
     * JSUS.compatibility
     */
    var df = J.compatibility().defineProperty;

    /**
     * ### NDDB.decycle
     *
     * Removes cyclic references from an object
     *
     * @param {object} e The object to decycle
     *
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
     *
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
     */
    function NDDB(options, db) {
        var that;
        that = this;
        options = options || {};

        // ## Public properties.

        // ### nddbid
        // A global index of all objects
        this.nddbid = new NDDBIndex('nddbid', this);

        // ### db
        // The default database.
        this.db = [];

        // ### lastSelection
        // The subset of items that were selected during the last operations
        // Notice: some of the items might not exist any more in the database.
        // @see NDDB.fetch
        this.lastSelection = [];

        // ### nddbid
        // A global index of all hashed objects
        // @see NDDBHashtray
        this.hashtray = new NDDBHashtray();

        // ###tags
        // The tags list.
        this.tags = {};

        // ### hooks
        // The list of hooks and associated callbacks
        this.hooks = {
            insert: [],
            remove: [],
            update: []
        };

        // ### nddb_pointer
        // Pointer for iterating along all the elements
        this.nddb_pointer = 0;

        // ### query
        // QueryBuilder obj
        // @see QueryBuilder
        this.query = new QueryBuilder();

        // ### filters
        // Available db filters
        this.addDefaultFilters();

        // ### __userDefinedFilters
        // Filters that are defined with addFilter
        // The field is needed by cloneSettings
        // @see NDDB.addFilter
        this.__userDefinedFilters = {};

        // ### __C
        // List of comparator functions
        this.__C = {};

        // ### __H
        // List of hash functions
        this.__H = {};

        // ### __I
        // List of index functions
        this.__I = {};

        // ### __I
        // List of view functions
        this.__V = {};

        // ### __update
        // Auto update options container
        this.__update = {};

        // ### __update.pointer
        // If TRUE, nddb_pointer always points to the last insert
        this.__update.pointer = false;

        // ### __update.indexes
        // If TRUE, rebuild indexes on every insert and remove
        this.__update.indexes = false;

        // ### __update.sort
        // If TRUE, sort db on every insert and remove
        this.__update.sort = false;

        // ### __shared
        // Objects shared (not cloned) among breeded NDDB instances
        this.__shared = {};

        // ### __formats
        // Currently supported formats for saving/loading items.
        this.__formats = {};

        // ### __defaultFormat
        // Default format for saving and loading items.
        this.__defaultFormat = null;

        // ### log
        // Std out for log messages
        //
        // It can be overriden in options by another function (`options.log`).
        // `options.logCtx` specif the context of execution.
        // @see NDDB.initLog
        this.log = console.log;

        // ### globalCompare
        // Dummy compare function used to sort elements in the database
        //
        // It can be overriden with a compare function returning:
        //
        //  - 0 if the objects are the same
        //  - a positive number if o2 precedes o1
        //  - a negative number if o1 precedes o2
        //
        this.globalCompare = function(o1, o2) {
            return -1;
        };

        // Adding the "compareInAllFields" function.
        //
        // @see NDDB.comparator
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
           // Figuring out the right return value.
           if (trigger1 === 0) {
               return trigger2 === 1 ? -1 : 1;
           }
           if (trigger1 === 1) {
               return trigger2 === 0 ? -1 : 0;
           }

           return trigger2 === 0 ? 1 : 0;
        });

        // Add default formats (e.g. CSV, JSON in Node.js).
        // See `/lib/fs.js`.
        if ('function' === typeof this.addDefaultFormats) {
            this.addDefaultFormats();
        }

        // Mixing in user options and defaults.
        this.init(options);

        // Importing items, if any.
        if (db) this.importDB(db);
    }

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
     *  - comparator: the comparator function as defined by `NDDB.comparator`
     *
     * and return a function that execute the desired operation.
     *
     * Registering a new filter with the same name of an already existing
     * one, will overwrite the old filter without warnings.
     *
     * A reference to newly added filters are registered under
     * `__userDefinedFilter`, so that they can be copied by `cloneSettings`.
     *
     * @param {string} op An alphanumeric id
     * @param {function} cb The callback function
     *
     * @see QueryBuilder.addDefaultOperators
     */
    NDDB.prototype.addFilter = function(op, cb) {
        this.filters[op] = cb;
        this.__userDefinedFilters[op] = this.filters[op];
    };

    /**
     * ### NDDB.addDefaultFilters
     *
     * Register default filters for NDDB
     *
     * Default filters include standard logical operators:
     *
     *   - '=', '==', '!=', ''>', >=', '<', '<=',
     *
     * and:
     *
     *   - 'E': field exists (can be omitted, it is the default one)
     *   - '><': between values
     *   - '<>': not between values
     *   - 'in': element is found in array
     *   - '!in': element is noi found in array
     *   - 'LIKE': string SQL LIKE (case sensitive)
     *   - 'iLIKE': string SQL LIKE (case insensitive)
     *
     * @see NDDB.filters
     */
    NDDB.prototype.addDefaultFilters = function() {
        if (!this.filters) this.filters = {};
        var that;
        that = this;

        // Exists.
        this.filters['E'] = function(d, value, comparator) {
            if ('object' === typeof d) {
                return function(elem) {
                    var d, c;
                    for (d in elem) {
                        c = that.getComparator(d);
                        value[d] = value[0]['*'];
                        if (c(elem, value, 1) > 0) {
                            value[d] = value[1]['*'];
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
                };
            }
            else {
                return function(elem) {
                    if ('undefined' !== typeof elem[d]) {
                        return elem;
                    }
                    else if ('undefined' !== typeof J.getNestedValue(d,elem)) {
                        return elem;
                    }
                };
            }
        };

        // (strict) Equals.
        this.filters['=='] = function(d, value, comparator) {
            return function(elem) {
                if (comparator(elem, value, 0) === 0) return elem;
            };
        };

        // (strict) Not Equals.
        this.filters['!='] = function(d, value, comparator) {
            return function(elem) {
                if (comparator(elem, value, 0) !== 0) return elem;
            };
        };

        // Smaller than.
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

        // Greater than.
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

        // Smaller than.
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

        //  Smaller or equal than.
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

        // Between.
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
                        value[d] = value[0]['*'];
                        if (c(elem, value, 1) > 0) {
                            value[d] = value[1]['*'];
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

        // Not Between.
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

        // In Array.
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

        // Not In Array.
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
                            return;
                        }
                    }
                    return elem;
                };
            }
        };

        // Supports `_` and `%` wildcards.
        function generalLike(d, value, comparator, sensitive) {
            var regex;

            RegExp.escape = function(str) {
                return str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
            };

            regex = RegExp.escape(value);
            regex = regex.replace(/%/g, '.*').replace(/_/g, '.');
            regex = new RegExp('^' + regex + '$', sensitive);

            if ('object' === typeof d) {
                return function(elem) {
                    var i, len;
                    len = d.length;
                    for (i = 0; i < len; i++) {
                        if ('undefined' !== typeof elem[d[i]]) {
                            if (regex.test(elem[d[i]])) {
                                return elem;
                            }
                        }
                    }
                };
            }
            else if (d === '*') {
                return function(elem) {
                    var d;
                    for (d in elem) {
                        if ('undefined' !== typeof elem[d]) {
                            if (regex.test(elem[d])) {
                                return elem;
                            }
                        }
                    }
                };
            }
            else {
                return function(elem) {
                    if ('undefined' !== typeof elem[d]) {
                        if (regex.test(elem[d])) {
                            return elem;
                        }
                    }
                };
            }
        }

        // Like operator (Case Sensitive).
        this.filters['LIKE'] = function likeOperator(d, value, comparator) {
            return generalLike(d, value, comparator);
        };

        // Like operator (Case Insensitive).
        this.filters['iLIKE'] = function likeOperatorI(d, value, comparator) {
            return generalLike(d, value, comparator, 'i');
        };

    };

    // ## METHODS

    /**
     * ### NDDB.throwErr
     *
     * Throws an error with a predefined format
     *
     * The format is "constructor name" . "method name" : "error text" .
     *
     * It does **not** perform type checking on itw own input parameters.
     *
     * @param {string} type Optional. The error type, e.g. 'TypeError'.
     *   Default, 'Error'
     * @param {string} method Optional. The name of the method
     * @param {string} text Optional. The error text. Default, 'generic error'
     */
    NDDB.prototype.throwErr = function(type, method, text) {
        var errMsg;
        text = text || 'generic error';
        errMsg = this._getConstrName();
        if (method) errMsg = errMsg + '.' + method;
        errMsg = errMsg + ': ' + text + '.';
        if (type === 'TypeError') throw new TypeError(errMsg);
        throw new Error(errMsg);
    };

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
        var errMsg;
        options = options || {};

        this.__options = options;

        if (options.tags) {
            if ('object' !== typeof options.tags) {
                errMsg = 'options.tag must be object or undefined';
                this.throwErr('TypeError', 'init', errMsg);
            }
            this.tags = options.tags;
        }

        if ('undefined' !== typeof options.nddb_pointer) {
            if ('number' !== typeof options.nddb_pointer) {
                errMsg = 'options.nddb_pointer must be number or undefined';
                this.throwErr('TypeError', 'init', errMsg);
            }
            this.nddb_pointer = options.nddb_pointer;
        }

        if (options.hooks) {
            if ('object' !== typeof options.hooks) {
                errMsg = 'options.hooks must be object or undefined';
                this.throwErr('TypeError', 'init', errMsg);
            }
            this.hooks = options.hooks;
        }

        if (options.globalCompare) {
            if ('function' !== typeof options.globalCompare) {
                errMsg = 'options.globalCompare must be function or undefined';
                this.throwErr('TypeError', 'init', errMsg);
            }
            this.globalCompare = options.globalCompare;
        }

        if (options.update) {
            if ('object' !== typeof options.update) {
                errMsg = 'options.update must be object or undefined';
                this.throwErr('TypeError', 'init', errMsg);
            }
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
            if ('object' !== typeof options.filters) {
                errMsg = 'options.filters must be object or undefined';
                this.throwErr('TypeError', 'init', errMsg);
            }
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
        // Delete the shared object, it must not be copied by _cloneSettings_.
        delete this.__options.shared;

        if (options.log) {
            this.initLog(options.log, options.logCtx);
        }

        if (options.C) {
            if ('object' !== typeof options.C) {
                errMsg = 'options.C must be object or undefined';
                this.throwErr('TypeError', 'init', errMsg);
            }
            this.__C = options.C;
        }

        if (options.H) {
            if ('object' !== typeof options.H) {
                errMsg = 'options.H must be object or undefined';
                this.throwErr('TypeError', 'init', errMsg);
            }
            for (i in options.H) {
                if (options.H.hasOwnProperty(i)) {
                    this.hash(i, options.H[i]);
                }
            }
        }

        if (options.I) {
            if ('object' !== typeof options.I) {
                errMsg = 'options.I must be object or undefined';
                this.throwErr('TypeError', 'init', errMsg);
            }
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
            if ('object' !== typeof options.V) {
                errMsg = 'options.V must be object or undefined';
                this.throwErr('TypeError', 'init', errMsg);
            }
            this.__V = options.V;
            for (i in options.V) {
                if (options.V.hasOwnProperty(i)) {
                    this.view(i, options.V[i]);
                }
            }
        }

        if (options.formats) {
            if ('object' !== typeof options.formats) {
                errMsg = 'options.formats must be object or undefined';
                this.throwErr('TypeError', 'init', errMsg);
            }
            for (i in options.formats) {
                if (options.formats.hasOwnProperty(i)) {
                    this.addFormat(i, options.formats[i]);
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
     */
    NDDB.prototype.initLog = function(cb, ctx) {
        if ('function' !== typeof cb) {
            this.throwErr('TypeError', 'initLog', 'cb must be function');
        }
        ctx = ctx || this;
        if ('function' !== typeof ctx && 'object' !== typeof ctx) {
            this.throwErr('TypeError', 'initLog', 'ctx must be object or ' +
                          'function');
        }
        this.log = function() {
            var args, i, len;
            len = arguments.length;
            args = new Array(len);
            for (i = 0; i < len; i++) {
                args[i] = arguments[i];
            }
            return cb.apply(ctx, args);
        };
    };

    /**
     * ### NDDB._getConstrName
     *
     * Returns 'NDDB' or the name of the inheriting class.
     */
    NDDB.prototype._getConstrName = function() {
        return this.constructor && this.constructor.name ?
            this.constructor.name : 'NDDB';
    };

    // ## CORE

    /**
     * ### NDDB._autoUpdate
     *
     * Performs a series of automatic checkings and updates the db
     *
     * Checkings are performed according to current configuration, or to
     * local options.
     *
     * @param {object} options Optional. Configuration object
     *
     * @api private
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
            this.throwErr('TypeError', 'importDB', 'db must be array');
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
     * It always returns the length of the full database, regardless of
     * current selection.
     *
     * @return {number} The length of the database
     *
     * @see NDDB.count
     */
    NDDB.prototype.size = function() {
        return this.db.length;
    };

    /**
     * ### NDDB.breed
     *
     * Creates a clone of the current NDDB object
     *
     * Takes care of calling the actual constructor of the class,
     * so that inheriting objects will preserve their prototype.
     *
     * @param {array} db Optional. Array of items to import in the new database.
     *   Default, items currently in the database
     *
     * @return {NDDB|object} The new database
     */
    NDDB.prototype.breed = function(db) {
        if (db && !J.isArray(db)) {
            this.throwErr('TypeError', 'importDB', 'db must be array ' +
                          'or undefined');
        }
        // In case the class was inherited.
        return new this.constructor(this.cloneSettings(), db || this.fetch());
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
     *  - the log and logCtx options (might have cyclyc structures)
     *
     * It is possible to specifies the name of the properties to leave out
     * out of the cloned object as a parameter. By default, all options
     * are cloned.
     *
     * @param {object} leaveOut Optional. An object containing the name of
     *   the properties to leave out of the clone as keys.
     *
     * @return {object} options A copy of the current settings
     *   plus the shared objects
     */
    NDDB.prototype.cloneSettings = function(leaveOut) {
        var i, options, keepShared;
        var logCopy, logCtxCopy;
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
        options.filters = this.__userDefinedFilters;
        options.formats = this.__formats;

        // Must be removed before cloning.
        if (options.log) {
            logCopy = options.log;
            delete options.log;
        }
        // Must be removed before cloning.
        if (options.logCtx) {
            logCtxCopy = options.logCtx;
            delete options.logCtx;
        }

        // Cloning.
        options = J.clone(options);

        // Removing unwanted options.
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

        if (keepShared) {
            options.shared = this.__shared;
        }
        if (logCopy) {
            options.log = logCopy;
            this.__options.log = logCopy;
        }
        if (logCtxCopy) {
            options.logCtx = logCtxCopy;
            this.__options.logCtx = logCtxCopy;
        }
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
     *
     * @return {string} out A machine-readable representation of the database
     *
     * @see JSUS.stringify
     */
    NDDB.prototype.stringify = function(compressed) {
        var spaces, out;
        if (!this.size()) return '[]';
        compressed = ('undefined' === typeof compressed) ? true : compressed;

        spaces = compressed ? 0 : 4;

        out = '[';
        this.each(function(e) {
            // Decycle, if possible
            e = NDDB.decycle(e);
            out += J.stringify(e, spaces) + ', ';
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
     */
    NDDB.prototype.comparator = function(d, comparator) {
        if ('string' !== typeof d) {
            this.throwErr('TypeError', 'comparator', 'd must be string');
        }
        if ('function' !== typeof comparator) {
            this.throwErr('TypeError', 'comparator', 'comparator ' +
                          'must be function');
        }
        this.__C[d] = comparator;
    };

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
        var i, len, comparator, comparators;

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

                    // In case v1 and v2 are of different types
                    // they might not be equal here.
                    if (v2 === v1) return 0;

                    // Return 1 if everything else fails.
                    return 1;
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
                        if ('undefined' !== trigger2 && res === trigger2) {
                            return res;
                        }
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

            };
        }
        return comparator;
    };

    /**
     * ### NDDB.isReservedWord
     *
     * Returns TRUE if a key is a reserved word
     *
     * A word is reserved if a property or a method with
     * the same name already exists in the current instance
     *
     * @param {string} key The name of the property
     *
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
     *
     * @see NDDB.isReservedWord
     * @see NDDB.rebuildIndexes
     */
    NDDB.prototype.index = function(idx, func) {
        if (('string' !== typeof idx) && ('number' !== typeof idx)) {
            this.throwErr('TypeError', 'index', 'idx must be string or number');
        }
        if (this.isReservedWord(idx)) {
            this.throwErr('TypeError', 'index', 'idx is reserved word: ' + idx);
        }
        if ('function' !== typeof func) {
            this.throwErr('TypeError', 'index', 'func must be function');
        }
        this.__I[idx] = func, this[idx] = new NDDBIndex(idx, this);
    };

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
     *
     * @see NDDB.hash
     * @see NDDB.isReservedWord
     * @see NDDB.rebuildIndexes
     */
    NDDB.prototype.view = function(idx, func) {
        var settings;
        if (('string' !== typeof idx) && ('number' !== typeof idx)) {
            this.throwErr('TypeError', 'view', 'idx must be string or number');
        }
        if (this.isReservedWord(idx)) {
            this.throwErr('TypeError', 'view', 'idx is reserved word: ' + idx);
        }
        if ('function' !== typeof func) {
            this.throwErr('TypeError', 'view', 'func must be function');
        }
        // Create a copy of the current settings, without the views
        // functions, else we create an infinite loop in the constructor.
        settings = this.cloneSettings( {V: ''} );
        this.__V[idx] = func, this[idx] = new NDDB(settings);
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
     *
     * @see NDDB.view
     * @see NDDB.isReservedWord
     * @see NDDB.rebuildIndexes
     */
    NDDB.prototype.hash = function(idx, func) {
        if (('string' !== typeof idx) && ('number' !== typeof idx)) {
            this.throwErr('TypeError', 'hash', 'idx must be string or number');
        }
        if (this.isReservedWord(idx)) {
            this.throwErr('TypeError', 'hash', 'idx is reserved word: ' + idx);
        }
        if ('function' !== typeof func) {
            this.throwErr('TypeError', 'hash', 'func must be function');
        }
        this.__H[idx] = func, this[idx] = {};
    };

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

        // Reset current indexes.
        this.resetIndexes({h: h, v: v, i: i});

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
     * Parameter _oldIdx_ is needed if indexing is updating a previously
     * indexed item. In fact if new index is different, the old one must
     * be deleted.
     *
     * @param {object} o The element to index
     * @param {number} dbidx The position of the element in the database array
     * @param {string} oldIdx Optional. The old index name, if any.
     */
    NDDB.prototype._indexIt = function(o, dbidx, oldIdx) {
        var func, index, key;
        if (!o || J.isEmpty(this.__I)) return;

        for (key in this.__I) {
            if (this.__I.hasOwnProperty(key)) {
                func = this.__I[key];
                index = func(o);
                // If the same object has been  previously
                // added with another index delete the old one.
                if (index !== oldIdx) {
                    if ('undefined' !== typeof oldIdx) {
                        if ('undefined' !== typeof this[key].resolve[oldIdx]) {
                            delete this[key].resolve[oldIdx];
                        }
                    }
                }
                if ('undefined' !== typeof index) {
                    if (!this[key]) this[key] = new NDDBIndex(key, this);
                    this[key]._add(index, dbidx);
                }
            }
        }
    };

    /**
     * ### NDDB._viewIt
     *
     * Adds an element to a view
     *
     * @param {object} o The element to index
     *
     * @see NDDB.view
     */
    NDDB.prototype._viewIt = function(o) {
        var func, index, key, settings;
        if (!o || J.isEmpty(this.__V)) return false;

        for (key in this.__V) {
            if (this.__V.hasOwnProperty(key)) {
                func = this.__V[key];
                index = func(o);
                if ('undefined' === typeof index) {
                    // Element must be deleted, if already in hash.
                    if (!this[key]) continue;
                    if ('undefined' !== typeof
                        this[key].nddbid.resolve[o._nddbid]) {

                        this[key].nddbid.remove(o._nddbid);
                    }
                    continue;
                }
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
     *
     * @see NDDB.hash
     */
    NDDB.prototype._hashIt = function(o) {
        var h, hash, key, settings, oldHash;
        if (!o || J.isEmpty(this.__H)) return false;

        for (key in this.__H) {
            if (this.__H.hasOwnProperty(key)) {
                h = this.__H[key];
                hash = h(o);

                if ('undefined' === typeof hash) {
                    oldHash = this.hashtray.get(key, o._nddbid);
                    if (oldHash) {
                        this[key][oldHash].nddbid.remove(o._nddbid);
                        this.hashtray.remove(key, o._nddbid);
                    }
                    continue;
                }
                if (!this[key]) this[key] = {};

                if (!this[key][hash]) {
                    // Create a copy of the current settings,
                    // without the hashing functions, otherwise
                    // we crate an infinite loop at first insert.
                    settings = this.cloneSettings({H: ''});
                    this[key][hash] = new NDDB(settings);
                }
                this[key][hash].insert(o);
                this.hashtray.set(key, o._nddbid, hash);
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
     *   - `insert`: each time an item is inserted
     *   - `remove`: each time an item, or a collection of items, is removed
     *   - `update`: each time an item is updated
     *
     * Examples.
     *
     * ```javascript
     * var db = new NDDB();
     *
     * var trashBin = new NDDB();
     *
     * db.on('insert', function(item) {
     *     item.id = getMyNextId();
     * });
     *
     * db.on('remove', function(array) {
     *     trashBin.importDB(array);
     * });
     * ```
     *
     * @param {string} event The name of an event: 'insert', 'update', 'remove'
     * @param {function} func The callback function associated to the event
     */
    NDDB.prototype.on = function(event, func) {
        if ('string' !== typeof event) {
            this.throwErr('TypeError', 'on', 'event must be string');
        }
        if ('function' !== typeof func) {
            this.throwErr('TypeError', 'on', 'func must be function');
        }
        if (!this.hooks[event]) {
            this.throwErr('TypeError', 'on', 'unknown event: ' + event);
        }
        this.hooks[event].push(func);
    };

    /**
     * ### NDDB.off
     *
     * Deregister an event, or an event listener
     *
     * @param {string} event The event name
     * @param {function} func Optional. The specific function to deregister.
     *   If empty, all the event listensers for `event` are cleared.
     *
     * @return {boolean} TRUE, if the removal is successful
     */
    NDDB.prototype.off = function(event, func) {
        var i;
        if ('string' !== typeof event) {
            this.throwErr('TypeError', 'off', 'event must be string');
        }
        if (func && 'function' !== typeof func) {
            this.throwErr('TypeError', 'off',
                          'func must be function or undefined');
        }
        if (!this.hooks[event]) {
            this.throwErr('TypeError', 'off', 'unknown event: ' + event);
        }
        if (!this.hooks[event].length) return false;

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
    };

    /**
     * ### NDDB.emit
     *
     * Fires all the listeners associated with an event (optimized)
     *
     * Accepts any number of parameters, the first one is the name
     * of the event, and the remaining will be passed to the event listeners.
     */
    NDDB.prototype.emit = function() {
        var event;
        var h, h2;
        var i, len, argLen, args;
        event = arguments[0];
        if ('string' !== typeof event) {
            this.throwErr('TypeError', 'emit', 'first argument must be string');
        }
        if (!this.hooks[event]) {
            this.throwErr('TypeError', 'emit', 'unknown event: ' + event);
        }
        len = this.hooks[event].length;
        if (!len) return;
        argLen = arguments.length;

        switch(len) {

        case 1:
            h = this.hooks[event][0];
            if (argLen === 1) h.call(this);
            else if (argLen === 2) h.call(this, arguments[1]);
            else if (argLen === 3) {
                h.call(this, arguments[1], arguments[2]);
            }
            else {
                args = new Array(argLen-1);
                for (i = 0; i < argLen; i++) {
                    args[i] = arguments[i+1];
                }
                h.apply(this, args);
            }
            break;
        case 2:
            h = this.hooks[event][0], h2 = this.hooks[event][1];
            if (argLen === 1) {
                h.call(this);
                h2.call(this);
            }
            else if (argLen === 2) {
                h.call(this, arguments[1]);
                h2.call(this, arguments[1]);
            }
            else if (argLen === 3) {
                h.call(this, arguments[1], arguments[2]);
                h2.call(this, arguments[1], arguments[2]);
            }
            else {
                args = new Array(argLen-1);
                for (i = 0; i < argLen; i++) {
                    args[i] = arguments[i+1];
                }
                h.apply(this, args);
                h2.apply(this, args);
            }
            break;
        default:

             if (argLen === 1) {
                 for (i = 0; i < len; i++) {
                     this.hooks[event][i].call(this);
                 }
            }
            else if (argLen === 2) {
                for (i = 0; i < len; i++) {
                    this.hooks[event][i].call(this, arguments[1]);
                }
            }
            else if (argLen === 3) {
                for (i = 0; i < len; i++) {
                    this.hooks[event][i].call(this, arguments[1], arguments[2]);
                }
            }
            else {
                args = new Array(argLen-1);
                for (i = 0; i < argLen; i++) {
                    args[i] = arguments[i+1];
                }
                for (i = 0; i < len; i++) {
                    this.hooks[event][i].apply(this, args);
                }

            }
        }
    };

    // ## Sort and Select

    function queryError(text, d, op, value) {
        var miss, err;
        miss = '(?)';
        err = this._getConstrName() + '._analyzeQuery: ' + text +
            '. Malformed query: ' + d || miss + ' ' + op || miss +
            ' ' + value || miss + '.';
        throw new Error(err);
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
        var i, len, errText;

        if ('undefined' === typeof d) {
            queryError.call(this, 'undefined dimension', d, op, value);
        }

        // Verify input.
        if ('undefined' !== typeof op) {

            if (op === '=') {
                op = '==';
            }
            else if (op === '!==') {
                op = '!=';
            }

            if (!(op in this.filters)) {
                queryError.call(this, 'unknown operator ' + op, d, op, value);
            }

            // Range-queries need an array as third parameter instance of Array.
            if (J.in_array(op,['><', '<>', 'in', '!in'])) {

                if (!(value instanceof Array)) {
                    errText = 'range-queries need an array as third parameter';
                    queryError.call(this, errText, d, op, value);
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

            else if (J.in_array(op, ['!=', '>', '==', '>=', '<', '<='])){
                // Comparison queries need a third parameter.
                if ('undefined' === typeof value) {
                    errText = 'value cannot be undefined in comparison queries';
                    queryError.call(this, errText, d, op, value);
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
            errText = 'undefined filter and defined value';
            queryError.call(this, errText, d, op, value);
        }
        else {
            op = 'E'; // exists
            value = '';
        }

        return { d:d, op:op, value:value };
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
     * @see NDDB.fetch()
     * @see NDDB.fetchValues()
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
     *
     * @return {NDDB} A new NDDB instance with the currently
     *   selected items in memory
     *
     * @see NDDB.and
     * @see NDDB.or
     * @see NDDB.execute()
     * @see NDDB.fetch()
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
     *
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
     *
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
     *
     * @return {NDDB} A new NDDB instance with the currently
     *   selected items in memory
     *
     * @see NDDB.select
     * @see NDDB.and
     * @see NDDB.or
     * @see NDDB.execute
     * @see NDDB.fetch
     */
    NDDB.prototype.selexec = function(d, op, value) {
        return this.select(d, op, value).execute();
    };

    /**
     * ### NDDB.execute
     *
     * Returns a new NDDB instance containing only the items currently selected
     *
     * This method is deprecated and might not longer be supported in future
     * versions of NDDB. Use NDDB.breed instead.
     *
     * Does not reset the query object, and it is possible to reuse the current
     * selection multiple times.
     *
     * @param {string} d The dimension of comparison
     * @param {string} op Optional. The operation to perform
     * @param {mixed} value Optional. The right-hand element of comparison
     *
     * @return {NDDB} A new NDDB instance with selected items in the db
     *
     * @see NDDB.select
     * @see NDDB.selexec
     * @see NDDB.and
     * @see NDDB.or
     *
     * @deprecated
     */
    NDDB.prototype.execute = function() {
        return this.filter(this.query.get.call(this.query));
    };

    /**
     * ### NDDB.exists
     *
     * Returns TRUE if a copy of the object exists in the database / selection
     *
     * @param {object} o The object to look for
     *
     * @return {boolean} TRUE, if a copy is found
     *
     * @see JSUS.equals
     * @see NDDB.fetch
     */
    NDDB.prototype.exists = function(o) {
        var i, len, db;
        if ('object' !== typeof o && 'function' !== typeof o) {
            this.throwErr('TypeError', 'exists',
                          'o must be object or function');
        }
        db = this.fetch();
        len = db.length;
        for (i = 0 ; i < db.length ; i++) {
            if (J.equals(db[i], o)) {
                return true;
            }
        }
        return false;
    };

    /**
     * ### NDDB.limit
     *
     * Breeds a new NDDB instance with only the first N entries
     *
     * If a selection is active it will apply the limit to the
     * current selection only.
     *
     * If limit is a negative number, selection is made starting
     * from the end of the database.
     *
     * @param {number} limit The number of entries to include
     *
     * @return {NDDB} A "limited" copy of the current instance of NDDB
     *
     * @see NDDB.breed
     * @see NDDB.first
     * @see NDDB.last
     */
    NDDB.prototype.limit = function(limit) {
        var db;
        if ('number' !== typeof limit) {
            this.throwErr('TypeError', 'exists', 'limit must be number');
        }
        db = this.fetch();
        if (limit !== 0) {
            db = (limit > 0) ? db.slice(0, limit) : db.slice(limit);
        }
        return this.breed(db);
    };

    /**
     * ### NDDB.reverse
     *
     * Reverses the order of all the entries in the database / selection
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
     * Sort the db according to one of the several criteria.
     *
     * Available sorting options:
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
     *
     * @return {NDDB} A sorted copy of the current instance of NDDB
     *
     * @see NDDB.globalCompare
     */
    NDDB.prototype.sort = function(d) {
        var func, that;

        // Global compare.
        if (!d) {
            func = this.globalCompare;
        }
        // User-defined function.
        else if ('function' === typeof d) {
            func = d;
        }
        // Array of dimensions.
        else if (d instanceof Array) {
            that = this;
            func = function(a,b) {
                var i, result;
                for (i = 0; i < d.length; i++) {
                    result = that.getComparator(d[i]).call(that, a, b);
                    if (result !== 0) return result;
                }
                return result;
            };
        }
        // Single dimension.
        else {
            func = this.getComparator(d);
        }

        this.db.sort(func);
        return this;
    };

    /**
     * ### NDDB.shuffle
     *
     * Returns a copy of the current database with randomly shuffled items
     *
     * @param {boolean} update Optional. If TRUE, items in the current database
     *   are also shuffled. Defaults, FALSE.
     *
     * @return {NDDB} A new instance of NDDB with the shuffled entries
     */
    NDDB.prototype.shuffle = function(update) {
        var shuffled;
        shuffled = J.shuffle(this.db);
        if (update) {
            this.db = shuffled;
            this.rebuildIndexes();
        }
        return this.breed(shuffled);
    };

    // ## Custom callbacks

    /**
     * ### NDDB.filter
     *
     * Filters the entries according to a user-defined function
     *
     * If a selection is active it will filter items only within the
     * current selection.
     *
     * A new NDDB instance is breeded.
     *
     * @param {function} func The filtering function
     *
     * @return {NDDB} A new instance of NDDB containing the filtered entries
     *
     * @see NDDB.breed
     */
    NDDB.prototype.filter = function(func) {
        return this.breed(this.fetch().filter(func));
    };

    /**
     * ### NDDB.each || NDDB.forEach (optimized)
     *
     * Applies a callback function to each element in the db
     *
     * If a selection is active, the callback will be applied to items
     * within the current selection only.
     *
     * It accepts a variable number of input arguments, but the first one
     * must be a valid callback, and all the following are passed as parameters
     * to the callback
     *
     * @see NDDB.map
     */
    NDDB.prototype.each = NDDB.prototype.forEach = function() {
        var func, i, db, len, args, argLen;
        func = arguments[0];
        if ('function' !== typeof func) {
            this.throwErr('TypeError', 'each',
                          'first argument must be function');
        }
        db = this.fetch();
        len = db.length;
        argLen = arguments.length;
        switch(argLen) {
        case 1:
            for (i = 0 ; i < len ; i++) {
                func.call(this, db[i]);
            }
            break;
        case 2:
            for (i = 0 ; i < len ; i++) {
                func.call(this, db[i], arguments[1]);
            }
            break;
        case 3:
            for (i = 0 ; i < len ; i++) {
                func.call(this, db[i], arguments[1], arguments[2]);
            }
            break;
        default:
            args = new Array(argLen+1);
            args[0] = null;
            for (i = 1; i < argLen; i++) {
                args[i] = arguments[i];
            }
            for (i = 0 ; i < len ; i++) {
                args[0] = db[i];
                func.apply(this, args);
            }
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
     *
     * @see NDDB.each
     */
    NDDB.prototype.map = function() {
        var func, i, db, len, out, o;
        var args, argLen;
        func = arguments[0];
        if ('function' !== typeof func) {
            this.throwErr('TypeError', 'map',
                          'first argument must be function');
        }
        db = this.fetch();
        len = db.length;
        argLen = arguments.length;
        out = [];
        switch(argLen) {
        case 1:
            for (i = 0 ; i < len ; i++) {
                o = func.call(this, db[i]);
                if ('undefined' !== typeof o) out.push(o);
            }
            break;
        case 2:
            for (i = 0 ; i < len ; i++) {
                o = func.call(this, db[i], arguments[1]);
                if ('undefined' !== typeof o) out.push(o);
            }
            break;
        case 3:
            for (i = 0 ; i < len ; i++) {
                o = func.call(this, db[i], arguments[1], arguments[2]);
                if ('undefined' !== typeof o) out.push(o);
            }
            break;
        default:
            args = new Array(argLen+1);
            args[0] = null;
            for (i = 1; i < argLen; i++) {
                args[i] = arguments[i];
            }
            for (i = 0 ; i < len ; i++) {
                args[0] = db[i];
                o = func.apply(this, args);
                if ('undefined' !== typeof o) out.push(o);
            }
        }
        return out;
    };

    // ## Update

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
     *
     * @return {NDDB} A new instance of NDDB with updated entries
     *
     * @see JSUS.mixin
     */
    NDDB.prototype.update = function(update) {
        var i, len, db;
        if ('object' !== typeof update) {
            this.throwErr('TypeError', 'update', 'update must be object');
        }

        // Gets items and resets the current selection.
        db = this.fetch();
        if (db.length) {
            len = db.length;
            for (i = 0; i < len; i++) {
                this.emit('update', db[i], update);
                J.mixin(db[i], update);
                this._indexIt(db[i]);
                this._hashIt(db[i]);
                this._viewIt(db[i]);
            }
            this._autoUpdate({indexes: false});
        }
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
        this.nddbid.resolve = {};
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
        var i;
        if (confirm) {
            this.db = [];
            this.nddbid.resolve = {};
            this.tags = {};
            this.query.reset();
            this.nddb_pointer = 0;
            this.lastSelection = [];
            this.hashtray.clear();

            for (i in this.__H) {
                if (this[i]) delete this[i];
            }
            for (i in this.__C) {
                if (this[i]) delete this[i];
            }
            for (i in this.__I) {
                if (this[i]) delete this[i];
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
     *
     * @return {NDDB} A new database containing the joined entries
     *
     * @see NDDB._join
     * @see NDDB.breed
     *
     * TODO: allow join on multiple properties.
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
     * Copies the (sub)entries with 'key2' in all the entries with 'key1'
     *
     * Nested properties can be accessed with '.'.
     *
     * @param {string} key1 First property to compare
     * @param {string} key2 Second property to compare
     * @param {string} pos Optional. The property under which the join is
     *   performed. Defaults 'joined'
     * @param {string|array} select Optional. The properties to copy in
     *   the join. Defaults undefined
     *
     * @return {NDDB} A new database containing the concatenated entries
     *
     *  @see NDDB._join
     *  @see JSUS.join
     */
    NDDB.prototype.concat = function(key1, key2, pos, select) {
        return this._join(key1, key2, function(){ return true; }, pos, select);
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
     * @param {string} key1 First property to compare
     * @param {string} key2 Second property to compare
     * @param {function} comparator Optional. A comparator function.
     *   Defaults, `JSUS.equals`
     * @param {string} pos Optional. The property under which the join
     *   is performed. Defaults 'joined'
     * @param {string|array} select Optional. The properties to copy
     *   in the join. Defaults undefined
     *
     * @return {NDDB} A new database containing the joined entries
     *
     * @see NDDB.breed
     *
     * @api private
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
                            // Inject the matched obj into the reference one.
                            o = J.clone(this.db[i]);
                            o2 = select ?
                                J.subobj(this.db[j], select) : this.db[j];
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
     * Splits all the entries  containing the specified dimension
     *
     * If a active selection if found, operation is applied only to the subset.
     *
     * New entries are created and a new NDDB object is breeded
     * to allows method chaining.
     *
     * @param {string} key The dimension along which items will be split
     *
     * @return {NDDB} A new database containing the split entries
     *
     * @see JSUS.split
     */
    NDDB.prototype.split = function(key) {
        var out, i, db, len;
        if ('string' !== typeof key) {
            this.throwErr('TypeError', 'split', 'key must be string');
        }
        db = this.fetch();
        len = db.length;
        out = [];
        for (i = 0; i < len; i++) {
            out = out.concat(J.split(db[i], key));
        }
        return this.breed(out);
    };

    // ## Fetching

    /**
     * ### NDDB.fetch
     *
     * Returns array of selected entries in the database
     *
     * If no selection criteria is specified returns all entries.
     *
     * By default, it resets the current selection, and further calls to
     * `fetch` will return the full database.
     *
     * It stores a reference to the most recent array of selected items
     * under `this.lastSelection`.
     *
     * Examples:
     *
     * ```javascript
     * var db = new NDDB();
     * db.importDB([ { a: 1, b: {c: 2}, d: 3 } ]);
     *
     * db.fetch();    // [ { a: 1, b: {c: 2}, d: 3 } ]
     *
     * db.select('a', '=', 1);
     *
     * db.fetch(); // [ { a: 1 } ]
     * ```
     *
     * No further chaining is permitted after fetching.
     *
     * @param {boolean} doNotReset Optional. If TRUE, it does not reset
     *   the current selection. Default, TRUE
     *
     * @return {array} out The fetched values
     *
     * @see NDDB.fetchValues
     * @see NDDB.fetchArray
     * @see NDDB.fetchKeyArray
     * @see NDDB.fetchSubObj
     * @see NDDB.lastSelection
     */
    NDDB.prototype.fetch = function(doNotReset) {
        var db;
        if (this.db.length && this.query.query.length) {
            if (doNotReset && 'boolean' !== typeof doNotReset) {
                this.throwErr('TypeError', 'fetch',
                              'doNotReset must be undefined or boolean.');
            }
            db = this.db.filter(this.query.get.call(this.query));
            if (!doNotReset) this.query.reset();
        }
        else {
            db = this.db;
        }
        this.lastSelection = db;
        return db;
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
     *
     * @return {array} out The fetched objects
     *
     * @see NDDB.fetch
     * @see NDDB.fetchValues
     * @see NDDB.fetchArray
     * @see NDDB.fetchKeyArray
     */
    NDDB.prototype.fetchSubObj= function(key) {
        var i, el, db, out;
        if (!key) return [];
        db = this.fetch(), out = [];
        for (i = 0; i < db.length; i++) {
            el = J.subobj(db[i], key);
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
     *
     * @return {array} out The fetched values
     *
     * @see NDDB.fetch
     * @see NDDB.fetchArray
     * @see NDDB.fetchKeyArray
     * @see NDDB.fetchSubObj
     */
    NDDB.prototype.fetchValues = function(key) {
        var db, el, i, out, typeofkey;

        db = this.fetch();

        typeofkey = typeof key, out = {};

        if (typeofkey === 'undefined') {
            for (i=0; i < db.length; i++) {
                J.augment(out, db[i], J.keys(db[i]));
            }
        }

        else if (typeofkey === 'string') {
            out[key] = [];
            for (i=0; i < db.length; i++) {
                el = J.getNestedValue(key, db[i]);
                if ('undefined' !== typeof el) {
                    out[key].push(el);
                }
            }
        }

        else if (J.isArray(key)) {
            out = J.melt(key, J.rep([], key.length)); // object not array
            for ( i = 0 ; i < db.length ; i++) {
                el = J.subobj(db[i], key);
                if (!J.isEmpty(el)) {
                    J.augment(out, el);
                }
            }
        }

        return out;
    };

    function getValuesArray(o, key) {
        return J.obj2Array(o, 1);
    }

    function getKeyValuesArray(o, key) {
        return J.obj2KeyedArray(o, 1);
    }


    function getValuesArray_KeyString(o, key) {
        var el = J.getNestedValue(key, o);
        if ('undefined' !== typeof el) {
            return J.obj2Array(el,1);
        }
    }

    function getValuesArray_KeyArray(o, key) {
        var el = J.subobj(o, key);
        if (!J.isEmpty(el)) {
            return J.obj2Array(el,1);
        }
    }


    function getKeyValuesArray_KeyString(o, key) {
        var el = J.getNestedValue(key, o);
        if ('undefined' !== typeof el) {
            return key.split('.').concat(J.obj2KeyedArray(el));
        }
    }

    function getKeyValuesArray_KeyArray(o, key) {
        var el = J.subobj(o, key);
        if (!J.isEmpty(el)) {
            return J.obj2KeyedArray(el);
        }
    }

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
     *
     * @return {array} out The fetched values
     */
    NDDB.prototype._fetchArray = function(key, keyed) {
        var db, cb, out, el, i;

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

        db = this.fetch(), out = [];
        for (i = 0; i < db.length; i++) {
            el = cb.call(db[i], db[i], key);
            if ('undefined' !== typeof el) out.push(el);
        }

        return out;
    };

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
     * Like NDDB.fetchArray, but also the keys are added
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
     *
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
     *
     * @return {array} outs The array of NDDB (or constructor) groups
     */
    NDDB.prototype.groupBy = function(key) {
        var groups, outs, i, el, out, db;
        db = this.fetch();
        if (!key) return db;

        groups = [], outs = [];
        for (i = 0 ; i < db.length ; i++) {
            el = J.getNestedValue(key, db[i]);
            if ('undefined' === typeof el) continue;
            // Creates a new group and add entries to it.
            if (!J.in_array(el, groups)) {
                groups.push(el);
                out = this.filter(function(elem) {
                    if (J.equals(J.getNestedValue(key, elem), el)) {
                        return elem;
                    }
                });
                // Reset nddb_pointer in subgroups.
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
     *
     * @return {number} count The number of items along the specified dimension
     *
     * @see NDDB.size
     */
    NDDB.prototype.count = function(key) {
        var i, count, len, db;
        db = this.fetch();
        len = db.length;
        if ('undefined' === typeof key) return len;
        if ('string' !== typeof key) {
            this.throwErr('TypeError', 'count',
                          'key must be string or undefined');
        }
        count = 0;
        for (i = 0; i < len; i++) {
            if (J.hasOwnNestedProperty(key, db[i])){
                count++;
            }
        }
        return count;
    };

    /**
     * ### NDDB.sum
     *
     * Returns the sum of the values of all the entries with the specified key
     *
     * Non numeric values are ignored.
     *
     * @param {string} key The dimension to sum
     *
     * @return {number} sum The sum of the values for the dimension,
     *   or NaN if it does not exist
     */
    NDDB.prototype.sum = function(key) {
        var sum, i, len, tmp, db;
        if ('string' !== typeof key) {
            this.throwErr('TypeError', 'sum', 'key must be string');
        }
        db = this.fetch(), len = db.length, sum = NaN;
        for (i = 0; i < len; i++) {
            tmp = J.getNestedValue(key, db[i]);
            if (!isNaN(tmp)) {
                if (isNaN(sum)) sum = 0;
                sum += tmp;
            }
        }
        return sum;
    };

    /**
     * ### NDDB.mean
     *
     * Returns the mean of the values of all the entries with the specified key
     *
     * Entries with non numeric values are ignored, and excluded
     * from the computation of the mean.
     *
     * @param {string} key The dimension to average
     *
     * @return {number} The mean of the values for the dimension,
     *   or NaN if it does not exist
     */
    NDDB.prototype.mean = function(key) {
        var sum, count, tmp, db;
        var i, len;
        if ('string' !== typeof key) {
            this.throwErr('TypeError', 'mean', 'key must be string');
        }
        db = this.fetch();
        len = db.length;
        sum = 0, count = 0;
        for (i = 0; i < len; i++) {
            tmp = J.getNestedValue(key, db[i]);
            if (!isNaN(tmp)) {
                sum += tmp;
                count++;
            }
        }
        return (count === 0) ? NaN : sum / count;
    };

    /**
     * ### NDDB.stddev
     *
     * Returns the std. dev. of the values of the entries with the specified key
     *
     * It uses the computational formula for sample standard deviation,
     * using N - 1 at the denominator of the sum of squares.
     *
     * Entries with non numeric values are ignored, and excluded
     * from the computation of the standard deviation.
     *
     * @param {string} key The dimension to average
     *
     * @return {number} The standard deviations of the values for the dimension,
     *   or NaN if it does not exist
     */
    NDDB.prototype.stddev = function(key) {
        var count, tmp, db, i, len;
        var sum, sumSquared;
        if ('string' !== typeof key) {
            this.throwErr('TypeError', 'stddev', 'key must be string');
        }
        db = this.fetch();
        len = db.length;
        if (!len || len === 1) return NaN;
        i = -1;
        sum = 0, sumSquared = 0, count = 0;
        for ( ; ++i < len ; ) {
            tmp = J.getNestedValue(key, db[i]);
            if (!isNaN(tmp)) {
                count++;
                sum += tmp;
                sumSquared += Math.pow(tmp, 2);
            }
        }
        tmp = sumSquared - (Math.pow(sum, 2) / count);
        return Math.sqrt( tmp / (count - 1) );
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
     *
     * @return {number} The smallest value for the dimension,
     *   or NaN if it does not exist
     *
     * @see NDDB.max
     */
    NDDB.prototype.min = function(key) {
        var min, tmp, db, i, len;
        if ('string' !== typeof key) {
            this.throwErr('TypeError', 'min', 'key must be string');
        }
        db = this.fetch();
        len = db.length;
        min = NaN;
        for (i = 0; i < len; i++) {
            tmp = J.getNestedValue(key, db[i]);
            if (!isNaN(tmp) && (tmp < min || isNaN(min))) {
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
     *
     * @return {number} The biggest value for the dimension,
     *   or NaN if it does not exist
     *
     * @see NDDB.min
     */
    NDDB.prototype.max = function(key) {
        var max, i, len, tmp, db;
        if ('string' !== typeof key) {
            this.throwErr('TypeError', 'max', 'key must be string');
        }
        db = this.fetch();
        len = db.length;
        max = NaN;
        for (i = 0; i < len; i++) {
            tmp = J.getNestedValue(key, db[i]);
            if (!isNaN(tmp) && (tmp > max || isNaN(max))) {
                max = tmp;
            }
        }
        return max;
    };

    // ## Skim

    /**
     * ### NDDB.skim
     *
     * Removes the specified properties from the items
     *
     * If a active selection if found, operation is applied only to the subset.
     *
     * Use '.' (dot) to point to a nested property.
     *
     * Items with no property are automatically removed.
     *
     * @param {string|array} skim The selection of properties to remove
     *
     * @return {NDDB} A new database containing the result of the skim
     *
     * @see NDDB.keep
     * @see JSUS.skim
     */
    NDDB.prototype.skim = function(skim) {
        if ('string' !== typeof skim && !J.isArray(skim)) {
            this.throwErr('TypeError', 'skim', 'skim must be string or array');
        }
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
     * Removes all the properties that are not specified from the items
     *
     * If a active selection if found, operation is applied only to the subset.
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
        if ('string' !== typeof keep && !J.isArray(keep)) {
            this.throwErr('TypeError', 'keep', 'keep must be string or array');
        }
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
     * Performs a diff of the entries of a specified databases
     *
     * Returns a new NDDB instance containing all the entries that
     * are present in the current instance, and *not* in the
     * database obj passed as parameter.
     *
     * @param {NDDB|array} nddb The external database to compare
     *
     * @return {NDDB} A new database containing the result of the diff
     *
     * @see NDDB.intersect
     * @see JSUS.arrayDiff
     */
    NDDB.prototype.diff = function(nddb) {
        if (!J.isArray(nddb)) {
            if ('object' !== typeof nddb || !J.isArray(nddb.db)) {
                this.throwErr('TypeError', 'diff',
                              'nddb must be array or NDDB');
            }
            nddb = nddb.db;
        }
        if (!nddb.length) {
            return this.breed([]);
        }
        return this.breed(J.arrayDiff(this.fetch(), nddb));
    };

    /**
     * ### NDDB.intersect
     *
     * Finds the entries in common with a specified database
     *
     * Returns a new NDDB instance containing all the entries that
     * are present both in the current instance of NDDB and in the
     * database obj passed as parameter.
     *
     * @param {NDDB|array} nddb The external database to compare
     *
     * @return {NDDB} A new database containing the result of the intersection
     *
     * @see NDDB.diff
     * @see JSUS.arrayIntersect
     */
    NDDB.prototype.intersect = function(nddb) {
        if (!J.isArray(nddb)) {
            if ('object' !== typeof nddb || !J.isArray(nddb.db)) {
                this.throwErr('TypeError', 'intersect',
                              'nddb must be array or NDDB');
            }
            nddb = nddb.db;
        }
        if (!nddb.length) {
            return this.breed([]);
        }
        return this.breed(J.arrayIntersect(this.fetch(), nddb));
    };


    // ## Iterator

    /**
     * ### NDDB.get
     *
     * Returns the entry at the given numerical position
     *
     * @param {number} pos The position of the entry
     *
     * @return {object|undefined} The requested item, or undefined if
     *  the index is invalid
     */
    NDDB.prototype.get = function(pos) {
        if ('number' !== typeof pos) {
            this.throwErr('TypeError', 'get', 'pos must be number');
        }
        return this.db[pos];
    };

    /**
     * ### NDDB.current
     *
     * Returns the entry at which the iterator is currently pointing
     *
     * The pointer is *not* updated.
     *
     * @return {object|undefined} The current entry, or undefined if the
     *   pointer is at an invalid position
     */
    NDDB.prototype.current = function() {
        return this.db[this.nddb_pointer];
    };

    /**
     * ### NDDB.next
     *
     * Moves the pointer to the next entry in the database and returns it
     *
     * @return {object|undefined} The next entry, or undefined
     *   if none is found
     *
     * @see NDDB.previous
     */
    NDDB.prototype.next = function() {
        var el;
        this.nddb_pointer++;
        el = NDDB.prototype.current.call(this);
        if (!el) this.nddb_pointer--;
        return el;
    };

    /**
     * ### NDDB.previous
     *
     * Moves the pointer to the previous entry in the database and returns it
     *
     * @return {object|undefined} The previous entry, or undefined
     *   if none is found
     *
     * @see NDDB.next
     */
    NDDB.prototype.previous = function() {
        var el;
        this.nddb_pointer--;
        el = NDDB.prototype.current.call(this);
        if (!el) this.nddb_pointer++;
        return el;
    };

    /**
     * ### NDDB.first
     *
     * Returns the last entry in the current selection / database
     *
     * Returns undefined if the current selection / database is empty.
     *
     * @param {string} updatePointer Optional. If set, the pointer
     *   is not moved to the first entry (if any)
     *
     * @return {object} The first entry found
     *
     * @see NDDB.last
     * @see NDDB.fetch
     * @see NDDB.nddb_pointer
     */
    NDDB.prototype.first = function(doNotUpdatePointer) {
        var db = this.fetch();
        if (db.length) {
            if (!doNotUpdatePointer) this.nddb_pointer = 0;
            return db[0];
        }
        return undefined;
    };

    /**
     * ### NDDB.last
     *
     * Returns the last entry in the current selection / database
     *
     * Returns undefined if the current selection / database is empty.
     *
     * @param {string} doNotUpdatePointer Optional. If set, the pointer is not
     *   moved to the last entry (if any)
     *
     * @return {object} The last entry found
     *
     * @see NDDB.first
     * @see NDDB.fetch
     * @see NDDB.nddb_pointer
     */
    NDDB.prototype.last = function(doNotUpdatePointer) {
        var db = this.fetch();
        if (db.length) {
            if (!doNotUpdatePointer) this.nddb_pointer = db.length-1;
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
     * the latter case, the current value of `nddb_pointer`
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
        if ('string' !== typeof tag && 'number' !== typeof tag) {
            this.throwErr('TypeError', 'tag', 'tag must be string or number');
        }

        ref = null, typeofIdx = typeof idx;

        if (typeofIdx === 'undefined') {
            ref = this.db[this.nddb_pointer];
        }
        else if (typeofIdx === 'number') {

            if (idx > this.length || idx < 0) {
                this.throwErr('Error', 'tag', 'invalid index provided: ' + idx);
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
     *
     * @return {object} The object associated with the tag
     *
     * @see NDDB.tag
     */
    NDDB.prototype.resolveTag = function(tag) {
        if ('string' !== typeof tag) {
            this.throwErr('TypeError', 'resolveTag', 'tag must be string');
        }
        return this.tags[tag];
    };

    // ## Save/Load.


    /**
     * ### NDDB.load
     *
     * Reads items in the specified format and loads them into db asynchronously
     *
     * @param {string} file The name of the file or other persistent storage
     * @param {object} options Optional. A configuration object. Available
     *    options are format-dependent.
     * @param {function} cb Optional. A callback function to execute at
     *    the end of the operation. If options is not specified,
     *    cb is the second parameter.
     *
     * @see NDDB.loadSync
     */
    NDDB.prototype.load = function(file, options, cb) {
        if (arguments.length === 2 && 'function' === typeof options) {
            cb = options;
            options = undefined;
        }
        executeSaveLoad(this, 'load', file, cb, options);
    };

    /**
     * ### NDDB.save
     *
     * Saves items in the specified format asynchronously
     *
     * @see NDDB.saveSync
     */
    NDDB.prototype.save = function(file, options, cb) {
        if (arguments.length === 2 && 'function' === typeof options) {
            cb = options;
            options = undefined;
        }
        executeSaveLoad(this, 'save', file, cb, options);
    };

    /**
     * ### NDDB.loadSync
     *
     * Reads items in the specified format and loads them into db synchronously
     *
     * @see NDDB.load
     */
    NDDB.prototype.loadSync = function(file, options, cb) {
        if (arguments.length === 2 && 'function' === typeof options) {
            cb = options;
            options = undefined;
        }
        executeSaveLoad(this, 'loadSync', file, cb, options);
    };

    /**
     * ### NDDB.saveSync
     *
     * Saves items in the specified format synchronously
     *
     * @see NDDB.save
     */
    NDDB.prototype.saveSync = function(file, options, cb) {
        if (arguments.length === 2 && 'function' === typeof options) {
            cb = options;
            options = undefined;
        }
        executeSaveLoad(this, 'saveSync', file, cb, options);
    };

    // ## Formats.

    /**
     * ### NDDB.addFormat
     *
     * Registers a _format_ function
     *
     * The format object is of the type:
     *
     *     {
     *       load:     function() {}, // Async
     *       save:     function() {}, // Async
     *       loadSync: function() {}, // Sync
     *       saveSync: function() {}  // Sync
     *     }
     *
     * @param {string|array} format The format name/s
     * @param {object} The format object containing at least one
     *   pair of save/load functions (sync and async)
     */
    NDDB.prototype.addFormat = function(format, obj) {
        var f, i, len;
        validateFormatParameters(this, format, obj);
        if (!J.isArray(format)) format = [format];
        i = -1, len = format.length;
        for ( ; ++i < len ; ) {
            f = format[i];
            if ('string' !== typeof f || f.trim() === '') {
                this.throwErr('TypeError', 'addFormat', 'format must be ' +
                              'a non-empty string');
            }
            this.__formats[f] = obj;
        }
    };

    /**
     * ### NDDB.getFormat
     *
     * Returns the requested  _format_ function
     *
     * @param {string} format The format name
     * @param {string} method Optional. One of:
     *   `save`,`load`,`saveString`,`loadString`.
     *
     * @return {function|object} Format object or function or NULL if not found.
     */
    NDDB.prototype.getFormat = function(format, method) {
        var f;
        if ('string' !== typeof format) {
            this.throwErr('TypeError', 'getFormat', 'format must be string');
        }
        if (method && 'string' !== typeof method) {
            this.throwErr('TypeError', 'getFormat', 'method must be string ' +
                          'or undefined');
        }
        f = this.__formats[format];
        if (f && method) f = f[method];
        return f || null;
    };

    /**
     * ### NDDB.setDefaultFormat
     *
     * Sets the default format
     *
     * @param {string} format The format name or null
     *
     * @see NDDB.getDefaultFormat
     */
    NDDB.prototype.setDefaultFormat = function(format) {
         if (format !== null &&
            ('string' !== typeof format || format.trim() === '')) {

            this.throwErr('TypeError', 'setDefaultFormat', 'format must be ' +
                          'a non-empty string or null');
        }
        if (format && !this.__formats[format]) {
            this.throwErr('Error', 'setDefaultFormat', 'unknown format: ' +
                          format);
        }
        this.__defaultFormat = format;
    };

    /**
     * ### NDDB.getDefaultFormat
     *
     * Returns the default format
     *
     * @see NDDB.setDefaultFormat
     */
    NDDB.prototype.getDefaultFormat = function() {
        return this.__defaultFormat;
    };

    /**
     * ### NDDB.addDefaultFormats
     *
     * Dummy property. If overwritten it will be invoked by constructor
     */
    NDDB.prototype.addDefaultFormats = null;


    // ## Helper Methods


    /**
     * ### nddb_insert
     *
     * Insert an item into db and performs update operations
     *
     * A new property `.nddbid` is created in the object, and it will be
     * used to add the element into the global index: `NDDB.nddbid`.
     *
     * Emits the 'insert' event, and updates indexes, hashes and views
     * accordingly.
     *
     * @param {object|function} o The item to add to database
     * @param {boolean} update Optional. If TRUE, updates indexes, hashes,
     *    and views. Default, FALSE
     *
     * @see NDDB.nddbid
     * @see NDDB.emit
     *
     * @api private
     */
    function nddb_insert(o, update) {
        var nddbid;
        if (('object' !== typeof o) && ('function' !== typeof o)) {
            this.throwErr('TypeError', 'insert', 'object or function ' +
                          'expected, ' + typeof o + ' received.');
        }

        // Check / create a global index.
        if ('undefined' === typeof o._nddbid) {
            // Create internal idx.
            nddbid = J.uniqueKey(this.nddbid.resolve);
            if (!nddbid) {
                this.throwErr('Error', 'insert',
                              'failed to create index: ' + o);
            }
            if (df) {
                Object.defineProperty(o, '_nddbid', { value: nddbid });
            }
            else {
                o._nddbid = nddbid;
            }
        }
        // Add to index directly (bypass api).
        this.nddbid.resolve[o._nddbid] = this.db.length;
        // End create index.
        this.db.push(o);
        this.emit('insert', o);
        if (update) {
            this._indexIt(o, (this.db.length-1));
            this._hashIt(o);
            this._viewIt(o);
        }
    }

    /**
     * ### validateSaveLoadParameters
     *
     * Validates the parameters of a call to save, saveSync, load, loadSync
     *
     * @param {NDDB} that The reference to the current instance
     * @param {string} method The name of the method invoking validation
     * @param {string} file The file parameter
     * @param {function} cb The callback parameter
     * @param {object} The options parameter
     */
    function validateSaveLoadParameters(that, method, file, cb, options) {
        if ('string' !== typeof file || file.trim() === '') {
            that.throwErr('TypeError', method, 'file must be ' +
                          'a non-empty string');
        }
        if (cb && 'function' !== typeof cb) {
            that.throwErr('TypeError', method, 'cb must be function ' +
                          'or undefined');
        }
        if (options && 'object' !== typeof options) {
            that.throwErr('TypeError', method, 'options must be object ' +
                          'or undefined');
        }
    }

    /**
     * ### extractExtension
     *
     * Extracts the extension from a file name
     *
     * @param {string} file The filename
     *
     * @return {string} The extension or NULL if not found
     */
    function extractExtension(file) {
        var format;
        format = file.lastIndexOf('.');
        return format < 0 ? null : file.substr(format+1);
    }

    /**
     * ### executeSaveLoad
     *
     * Fetches the right format and executes save, saveSync, load, or loadSync
     *
     * @param {NDDB} that The reference to the current instance
     * @param {string} method The name of the method invoking validation
     * @param {string} file The file parameter
     * @param {function} cb The callback parameter
     * @param {object} The options parameter
     */
    function executeSaveLoad(that, method, file, cb, options) {
        var ff, format;
        validateSaveLoadParameters(that, method, file, cb, options);
        if (!that.storageAvailable()) {
            that.throwErr('Error', 'save', 'no persistent storage available');
        }
        options = options || {};
        format = extractExtension(file);
        // If try to get the format function based on the extension,
        // otherwise try to use the default one. Throws errors.
        ff = findFormatFunction(that, method, format);
        ff(that, file, cb, options);
    }

    /**
     * ### findFormatFunction
     *
     * Returns the requested format function or the default one
     *
     * Throws errors.
     *
     * @param {NDDB} that The reference to the current instance
     * @param {string} method The name of the method invoking validation
     * @param {string} format The requested parameter
     *
     * @return {function} The requested format function
     */
    function findFormatFunction(that, method, format) {
        var ff, defFormat;
        if (format) ff = that.getFormat(format);
        if (ff) {
            if (!ff[method]) {
                that.throwErr('Error', method, 'format ' + format + ' found, ' +
                              'but method ' + method + ' not available');
            }
            ff = ff[method];
        }
        // Try to get default format, if the extension is not recognized.
        if (!ff) {
            defFormat = that.getDefaultFormat();
            if (!defFormat) {
                that.throwErr('Error', method, 'format ' + format + ' not ' +
                              'found and no default format specified');
            }
            ff = that.getFormat(defFormat, method);
            if (!ff) {
                that.throwErr('Error', method, 'format ' + format + ' not ' +
                              'found, but default format has no method ' +
                              method);
            }
        }
        return ff;
    }
    /**
     * ### validateFormatParameters
     *
     * Validates the parameters of a call to save, saveSync, load, loadSync
     *
     * @param {NDDB} that The reference to the current instance
     * @param {string|array} method The name/s of format/s
     * @param {object} obj The format object
     */
    function validateFormatParameters(that, format, obj) {
        if ('string' !== typeof format &&
            !J.isArray(format) && !format.length) {

            that.throwErr('TypeError', 'addFormat', 'format must be ' +
                            'a non-empty string or array');
        }
        if ('object' !== typeof obj) {
            that.throwErr('TypeError', 'addFormat', 'obj must be object');
        }
        if (!obj.save && !obj.saveSync) {
            that.throwErr('Error', 'addFormat', 'format must ' +
                          'at least one save function: sync or async');
        }
        if (!obj.load && !obj.loadSync) {
            that.throwErr('Error', 'addFormat', 'format must ' +
                          'at least one load function: sync or async');
        }
        if (obj.save || obj.load) {
            if ('function' !== typeof obj.save) {
                that.throwErr('TypeError', 'addFormat',
                              'save function is not a function');
            }
            if ('function' !== typeof obj.load) {
                that.throwErr('TypeError', 'addFormat',
                              'load function is not a function');
            }
        }
        if (obj.saveSync || obj.loadSync) {
            if ('function' !== typeof obj.saveSync) {
                that.throwErr('TypeError', 'addFormat',
                              'saveSync function is not a function');
            }
            if ('function' !== typeof obj.loadSync) {
                that.throwErr('TypeError', 'addFormat',
                              'loadSync function is not a function');
            }
        }
    }

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
     */
    QueryBuilder.prototype.reset = function() {
        this.query = [];
        this.pointer = 0;
        this.query[this.pointer] = [];
    };


    function findCallback(obj) {
        return obj.cb;
    }

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
        var line, lineLen, f1, f2, f3, type1, type2;
        var query = this.query, pointer = this.pointer;

        // Ready to support nested queries, not yet implemented.
        if (pointer === 0) {
            line = query[pointer];
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
                    };
                case 'AND':
                    return function(elem) {
                        if ('undefined' !== typeof f1(elem) &&
                            'undefined' !== typeof f2(elem)) return elem;
                    };

                case 'NOT':
                    return function(elem) {
                        if ('undefined' !== typeof f1(elem) &&
                            'undefined' === typeof f2(elem)) return elem;
                    };
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
                };

            }

        }
    };

    /**
     * # NDDBHashtray
     *
     * MIT Licensed
     *
     * Helper class for NDDB hash management
     *
     * ---
     */

    /**
     * ## NDDBHashtray constructor
     *
     * Creates an hashtray object to manage maps item-hashes
     *
     * @param {string} The name of the index
     * @param {array} The reference to the original database
     */
    function NDDBHashtray() {
        this.resolve = {};
    }

    NDDBHashtray.prototype.set = function(key, nddbid, hash) {
        this.resolve[key + '_' + nddbid] = hash;
    };

    NDDBHashtray.prototype.get = function(key, nddbid) {
        return this.resolve[key + '_' + nddbid];
    };

    NDDBHashtray.prototype.remove = function(key, nddbid) {
        delete this.resolve[key + '_' + nddbid];
    };

    NDDBHashtray.prototype.clear = function() {
        this.resolve = {};
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
        this.nddb.db.splice(dbidx, 1);
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
        var o, dbidx, nddb;
        dbidx = this.resolve[idx];
        if ('undefined' === typeof dbidx) return false;
        nddb = this.nddb;
        o = nddb.db[dbidx];
        nddb.emit('update', o, update);
        J.mixin(o, update);
        // We do indexes separately from the other components of _autoUpdate
        // to avoid looping through all the other elements that are unchanged.
        if (nddb.__update.indexes) {
            nddb._indexIt(o, dbidx, idx);
            nddb._hashIt(o);
            nddb._viewIt(o);
        }
        nddb._autoUpdate({indexes: false});
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

})(
    ('undefined' !== typeof module && 'undefined' !== typeof module.exports) ?
        module.exports : window ,
    ('undefined' !== typeof module && 'undefined' !== typeof module.exports) ?
        module.parent.exports.JSUS || require('JSUS').JSUS : JSUS,
    ('object' === typeof module && 'function' === typeof require) ?
        module.parent.exports.store ||
        require('shelf.js/build/shelf-fs.js').store : this.store
);

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
