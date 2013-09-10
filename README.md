# NDDB

[![Build Status](https://travis-ci.org/nodeGame/NDDB.png?branch=master)](https://travis-ci.org/nodeGame/NDDB)

NDDB is a powerful and versatile object database for node.js and the browser.

---

NDDB (N-Dimensional DataBase) supports indexes, views, joins, group-by, basic statistics, 
custom operations, saving and loading from file system and browser localStorage and much more.

Developer-friendly thanks to an easy api, detailed documentation, and full unit tests coverage.

## List of features

- Selecting: `select`, `and`, `or`, `selexec`
- Sorting: `sort`, `reverse`, `last`, `first`, `limit`, `distinct`, `shuffle`
- Indexing: `index`, `hash`, `comparator`
- Custom callbacks: `map`, `each`, `filter`
- Updating and Deletion: `update`, `remove`, `clear`
- Advanced operations: `split`, `join`, `concat`, `groupBy`
- Fetching and transformations: `fetch`, `fetchArray`, `fetchKeyArray`, `fetchValues`, `fetchSubObj`
- Statistics operator: `count`, `max`, `min`, `mean`, `stddev`
- Diff: `diff`, `intersect`
- Skim: `skim`, `keep`
- Iterator: `previous`, `next`, `first`, `last`
- Tagging: `tag`
- Event listener / emitter: `on`, `off`, `emit`
- Saving and Loading: `save`, `load`, `loadCSV`

The complete NDDB api documentation is available [here](http://nodegame.github.com/NDDB/docs/nddb.js.html).

## Usage

Create an instance of NDDB

```javascript
    var NDDB = require('NDDB').NDDB;
    var db = new NDDB();
```

Insert an item into the database

```javascript
    db.insert({
        painter: "Picasso",
        title: "Les Demoiselles d'Avignon",
        year: 1907
    });
```

Import a collection of items

```javascript

    var items = [
        {
            painter: "Dali",
            title: "Portrait of Paul Eluard",
            year: 1929,
            portrait: true
        },
        {
            painter: "Dali",
            title: "Barcelonese Mannequin",
            year: 1927
        },
        {
            painter: "Monet",
            title: "Water Lilies",
            year: 1906
        },
        {
            painter: "Monet",
            title: "Wheatstacks (End of Summer)",
            year: 1891
        },
        {
            painter: "Manet",
            title: "Olympia",
            year: 1863
        }
    ];
    
    db.importDB(items);
```
    
Retrieve the database size

```javascript
    var db_size = db.length; // 6
 ```
    
Select all paintings from Dali

```javascript
    db.select('painter', '=', 'Dali'); // 2 items
```
    
Select all portraits

```javascript
    db.select('portrait'); // 1 item
```
    
Fetch all paintings from Dali that are before 1928

```javascript
    db.select('painter', '=', 'Dali')
      .and('year', '<', 1928);
      .execute() 
      .fetch(); // 1 item
```

Fetch all paintings of the beginning of XX's century

```javascript
    db.select('year', '><', [1900, 1910])
      .execute()
      .fetch(); // 2 items    
```

Fetch separately all the painters and all the dates of execution of the paintings

```javascript
    db.select('year', '><', [1900, 1910])
      .execute() 
      .fetchValues(['painter', 'title']);

// { painter: [ 'Jesus', 'Dali', 'Dali', 'Monet', 'Monet', 'Manet' ],
//   year: [ 0, 1929, 1927, 1906, 1891, 1863 ] }
```

## Advanced commands

### Sorting

Define a global comparator function that sorts all the entries chronologically

```javascript
    db.globalCompator = function (o1, o2) {
        if (o1.year < o2.year) return 1;
        if (o1.year < o2.year) return 2;
        return 0;
    };
```

Sort all the items (global comparator function is automatically used)

```javascript
    db.sort(); // Order: Manet, Monet, Monet, Picasso, Dali, Dali
```

Reverse the order of the items

```javascript
    db.reverse(); // Order: Dali, Dali, Picasso, Monet, Monet, Manet
```

Define a custom comparator function for the name of the painter, which gives highest priorities to the canvases of Picasso;

```javascript
    db.c('painter', function (o1, o2) {
        if (o1.painter === 'Picasso') return -1;
        if (o2.painter === 'Picasso') return 1;
    }
```
   
Sort all the paintings by painter

```javascript
    db.sort('painter'); // Picasso is always listed first
```

### Views

Splits the database in sub-database, each containing semantically consistent set of entries

```javascript
  
    // Let us add some cars to our previous database of paintings
    var not_art_items = [
        {
          car: "Ferrari",
          model: "F10",
          speed: 350,
        },
        {
          car: "Fiat",
          model: "500",
          speed: 100,
        },
        {
          car: "BMW",
          model: "Z4",
          speed: 250,
        },
    ];
  
    db.view('art', function(o) {
      return o.painter;
    });
    
    db.view('cars', function(o) {
      return o.car;
    });
      
    db.rebuildIndexes();
    
    db.length;          // 9
    db.art.length;      // NDDB with 6 art entries
    db.cars.length;     // NDDB with 3 car entries
    
```  

### Hashing

Define a custom hash function that creates a new view on each of the painters in the database;
    
```javascript
    db.hash('painter', function(o) {
        if (!o) return undefined;
        return o.painter;
    });
    
    db.rebuildIndexes();

    db.length;          // 6, unchanged;
    db.painter.Picasso; // NDDB with 1 element in db
    db.painter.Monet    // NDDB with 2 elements in db
    db.painter.Manet    // NDDB with 1 elements in db
    db.painter.Dali     // NDDB with 2 elements in db
```

### Listenting to events

Listen to the `insert` event and modify the inserted items by adding an external index to them;
    
```javascript

    var id = 0;
    function getMyId(){ return id++; };
    
    db.on('insert', function(o) {
        o.painter.id = getMyId();
    });
```  
  
### Indexes

Define a custom indexing function that gives fast, direct access to the items of the database;
    
```javascript
    db.index('pid', function(o) {
        return o.id;
    });
    
    db.rebuildIndexes();
    
    db.pid.get(0).name; // Picasso
    
    db.pid.update(0, {
      comment: "Good job Pablo!"
    });
    
    // Changes are reflected in the main database    
    db.selexec('comment').count(); // 1
    
    var picasso = db.pid.pop(0);
    db.length; //(-1)
    
    // Get all available keys in the index
    db.painter.getAllKeys(); // ['0','1', ... ]
    
    // Get all elements indexed by their key in one object
    db.painter.getAllKeyElements(); 

```  


## Example of a configuration object

```javascript

    var logFunc = function(txt, level) {
      if (level > 0) {
        console.log(txt);
      }
    };

    var options = {
      tags:  {},          // Collection of tags
      update: {           // On every insert, remove and update:
        indexes:  true,   // updates the indexes, if any  
        sort:     true,   // sorts the items of the database 
        pointer:  true,   // moves the iterator pointer to the last inserted element
      },
      C:  {},             // Collection of comparator functions
      H:  {},             // Collection of hashing functions
      I:  {},             // Collection of indexing functions
      V:  {},             // Collection of view functions
      log: logFunc,       // Default stdout
      nddb_pointer: 4,    // Set the pointer to element of index 4. 
      operators: {       // Extends NDDB with new operators for select queries
        '%': function(d, value, comparator){
              return function(elem) {
                if ((elem[d] % value) === 0) {
                  return elem;
                }
              }
      }
    }
    
    var nddb = new NDDB(options);
    
    // or
    
    nddb = new NDDB();
    nddb.init(options);
```

## Save and load from file or to localStorage

In the node.js environment, it is possible to save the state of the database to a file and load it afterwards.

```javascript

   // database exists and items inserted 
   db.save('./db.out');

   var db2 = new NDDB();
   db2.load('./db.out');
```

The above command are valid also in the browser environment if [Shelf.js](https://github.com/shakty/shelf.js) is loaded. A string id instead of the path to a file must be given instead.

## Test

NDDB relies on [mocha](http://visionmedia.github.com/mocha/) and [should.js](http://github.com/visionmedia/should.js) for testing.

    $ npm install # will load all necessary dependencies
    $ npm test # will run the test suite against nddb.js


## Build

Create your customized build of NDDB using the make file in the `bin` directory

```javascript
node make.nddb.js build // Standard build, 
node make.nddb.js build -a -o nddb-full // Full build
```

### Help

```javascript
node make.nddb.js --help
```

## API Documentation

Create html API documentation using the make file in the bin directory  

```javascript
node make.nddb.js doc
```

## ChangeLog

### 0.9.0
  - Fixed bug with views and hashs created within constructor of inheriting class
  - `#hash()` and `#view()` nows creates NDDB objects and not inheriting class objects
  - Fixed bug in loading from browser storage
  - Better error messages
  - Code for Node.js and browser clearly separated

### 0.8.10
  - Support for shared objects across all breeded instances of NDDB
  - NDDB.log -> this.log
  - `#initLog()` to execute the log function in the proper context
  - Fixed indexes and views not appearing on empty DBs

### 0.8.6
  - Support for property names containing dots

### 0.8.5
  - `#loadCSV`: load the content of a csv file into the database
  - Minor fixes

### 0.8.4

  - NDDBIndexes: `#getAllKeys()` and `#getAllKeyElements`
  - Integration with updated version of Shelf.js
  - Minor fixes

### 0.8.0

  - New faster and more powerful indexing engine
  - Indexes are now objects with own methods: `#get()`, `#update()`, `#pop()`, `#size()`
  - Support for multiple _views_ on the database
  - `#comparator()` becomes `#getComparator()`, and `#compare()` becomes `#comparator()`
  - Deprecated `c`,`h`,`i`; use human readable `comparator`, `hash`, `index` from now on!
  - `#current()` replaces the old `#get()`
  - `#get()` always returns the element at the specified ordinal position in the database
  - Callback functions of hash and index functions must always be specified
  - Hash functions creates NDDB instances of constructor
  

### 0.7.2

  - `#selexec()` shorthand  for `select().execute()`
  - Fixed bug on emit('update')
  - `#tag()` returns the tagged element
  - `#clear()` removes all volatile data, not just the entries in the database
  - Minor doc improvements

### 0.7.0

  - More efficient selector engine. 
  - Select queries can be chained with and, and or methods
  - Select queries are executed with an execute method
  - Objects are not maskeraded at insertation (no hidden .nddbid property injected)
  - Remove method does not remove the elements in parent database
  - Constructor changed, no parent parameter

### 0.6.0

  - fetch accepts no arguments
  - fetchValues returns an object containing all the values in the grouped by property
  - fetchSubObj
  - fetchArray and fetchKeyArray operate only on the first level, and objects in properties are not further flattened
  - fetchArray, fetchKeyArray, and fetchValues accept either a string or an array of strings as key-selector parameter

### 0.5.8

  - Serialization of functions, null and undefined values
  - Removed eval from select queries
  - Travis-ci continous integration
  - Minor bug fixing

### 0.5.0

  - Support for events: 'remove', 'insert'
  - NDDB.index(): provides fast access to objects
  - NDDB.tag(): accepts also objects

### 0.4.0

  - IE compatibility
  - Bug fixing

### 0.3.6

  - Bug fixing
  - NDDB.save beautifies the output by default
  - Post install scripts build the libraries

### 0.3.0 

  - NDDB.skim() and NDDB.keep()
  - Full test coverage
  - Make file in bin directory
  - Custom builds
  - Bug fixing

### 0.2.5

  - NDDB.distinct() + test
  - Support for cyclic objects when saving the database to file
  - NDDB.stddev()
  - Bug fixing
  - More tests

### 0.2

  - Introduced indexing. Indexes are created with NDDB.h() or the alias NDDB.hash()
  - NDDB.set() was already deprecated and it has been removed. NDDB.c() or the alias NDDB.compare() should be used instead.
  - NDDB.init() can sets the configuration of the database
  
## License

Copyright (C) 2012 Stefano Balietti

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
