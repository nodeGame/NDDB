# NDDB

NDDB provides a simple, lightweight NO-SQL database for node.js and the browser.

---

NDDB provides a simple, lightweight, NO-SQL object database 
for node.js and the browser. It depends on JSUS.

Allows to define any number of comparator and indexing functions, 
which are associated to any of the dimensions (i.e. properties) of 
the objects stored in the database. 

Whenever a comparison is needed, the corresponding comparator function 
is called, and the database is updated.

Whenever an object is inserted that matches one of the indexing functions
an hash is produced, and the element is added to one of the indexes.


Additional features are: methods chaining, tagging, and iteration 
through the entries.

NDDB is work in progress. Currently, the following methods are
implemented:

  * Sorting and selecting:

     - select, sort, reverse, last, first, limit, distinct, shuffle
 
  * Custom callbacks
 
     - map, each, filter
 
  * Deletion
 
     - remove, clear
 
  * Advanced operations
 
     - split, join, concat
 
  * Fetching
 
     - fetch, fetchArray, fetchKeyArray
 
  * Statistics operator
 
     - count, max, min, mean
 
  * Diff
 
     - diff, intersect

  * Skim

     - skim, keep
 
  * Iterator
 
     - previous, next, first, last

  * Tagging
 
     - tag
        
  * Updating
  
     - Update must be performed manually after a selection

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
    
Select all paintings from Dali that are before 1928

```javascript
    db.select('painter', '=', 'Dali')
      .select('year', '<', 1928); // 1 item
```

Select all paintings of the beginning of XX's century

```javascript
    db.select('year', '><', [1900, 1910]); // 2 items    
```

## Advanced commands

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

Define a custom index (hash) function for the name of the painter, which splits the inserted items according to the;
    
```javascript
    db.h('painter', function(o) {
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
  

## Example of Configuration object

```javascript

    var logFunc = function(txt, level) {
      if (level > 0) {
        console.log(txt);
      }
    };

    var options = {
      tags:  {},          // Collection of tags
      update: {           // On every insert and remove:
        indexes:  true,   // updates the indexes, if any  
        sort:     true,   // sorts the items of the database 
        pointer:  true,   // moves the iterator pointer to the last inserted element
      },
      C:  {},             // Collection of comparator functions
      H:  {},             // Collection of hashing functions
      log: logFunc,       // Default stdout
      nddb_pointer: 4,    // Set the pointer to element of index 4. 
    }
    
    var nddb = new NDDB(options);
    
    // or
    
    nddb = new NDDB();
    nddb.init(options);
```

## Save and load from file

Only in the node.js environment, it is possible to save the state of the database to a file and load it afterwards.

```javascript

   // database exists and items inserted 
   db.save('./db.out');

   var db2 = new NDDB();
   db2.load('./db.out');
```


## Test

NDDB relies on [mocha](http://visionmedia.github.com/mocha/) and [should.js](http://github.com/visionmedia/should.js) for testing.

    $ npm install # will load all necessary dependencies
    $ npm test # will run the test suite against nddb.js


## Build

Create your customized build of NDDB using the make file in the `bin` directory

```javascript
node make.nddb.js build // Standard build, about 28Kb minified
node make.nddb.js build -a -o nddb-full // Full build, about 40Kb minified
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
