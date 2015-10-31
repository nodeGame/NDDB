# NDDB

[![Build Status](https://travis-ci.org/nodeGame/NDDB.png?branch=master)](https://travis-ci.org/nodeGame/NDDB)

NDDB is a powerful and versatile object database for node.js and the browser.

---

NDDB (N-Dimensional DataBase) supports indexes, views, hashes, joins,
group-by, basic statistics, custom operations, saving and loading from
file system and browser localStorage, and much more.

Developer-friendly thanks to an easy api, detailed documentation, and
**100%** test coverage.

## List of features

- Selecting: `select`, `and`, `or`
- Sorting: `sort`, `reverse`, `last`, `first`, `limit`, `distinct`,
  `shuffle`
- Indexing: `view`, `index`, `hash`, `comparator`
- Custom callbacks: `map`, `each`, `filter`
- Updating and Deletion: `update`, `remove`, `clear`
- Advanced operations: `split`, `join`, `concat`, `groupBy`
- Fetching and transformations: `fetch`, `fetchArray`,
  `fetchKeyArray`, `fetchValues`, `fetchSubObj`
- Statistics operator: `count`, `max`, `min`, `mean`, `stddev`
- Diff: `diff`, `intersect`
- Skim: `skim`, `keep`
- Iterator: `previous`, `next`, `first`, `last`
- Tagging: `tag`
- Event listener / emitter: `on`, `off`, `emit`
- Saving and Loading: `save`, `load`, `loadCSV`

The complete NDDB api documentation is available
[here](http://nodegame.github.com/NDDB/docs/nddb.js.html).

## Usage

Load the library in Node.js:

```javascript
var NDDB = require('NDDB').NDDB;
```

or in the browser add a script tag in the page:

```html
<!-- Must load a version of NDDB that includes JSUS (see 'build/' dir) -->
<script src="/path/to/nddb.js"></script>
```

Create an instance of NDDB:

```javascript
var db = new NDDB();
```

Insert an item into the database:

```javascript
db.insert({
    painter: "Picasso",
    title: "Les Demoiselles d'Avignon",
    year: 1907
});
```

Import a collection of items:

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

Retrieve the database size:

```javascript
var db_size = db.size(); // 6
```

### Select Items

Select statements must begin with `select`, and can be concatened by
any number of subsequent `and` and `or` statements. The comparison in
select statements is performed using three input parameters:

  - 'property'
  - 'operator'
  - any additional number of arguments required by operator

Available operators include standard logical operators:

   - `=`, `==`, `!=`, `>`, >=`, `<`, `<=`,

or advanced comparison operators:

   - `E`: field exists (can be omitted, it is the default one)
   - `><`: between values (expects array)
   - `<>`: not between values (expects array)
   - `in`: element is found in array (expects array)
   - `!in`: element is noi found in array (expects array)
   - `LIKE`: string SQL LIKE (case sensitive)
   - `iLIKE`: string SQL LIKE (case insensitive)

It is possible to access and compare nested properties simply
separating them with `.`.

After a selection is finished, items can be returned using one of the
`fetch` statements.

#### Select Examples

Select all paintings from Dali:

```javascript
db.select('painter', '=', 'Dali'); // 2 items
```

Case sensitive `LIKE` operator:

```javascript
db.select('painter', 'LIKE', 'M_net'); // 3 items
```

Select on multiple properties (`*`) with case insensitive `LIKE`:

```javascript
db.select('*', 'iLIKE', '%e%'); // All items
db.select(['painter', 'portrait'], 'iLIKE', '%e%') // 5 items
```

Select all portraits:

```javascript
db.select('portrait'); // 1 item
```

Fetch all paintings from Dali that are before 1928:

```javascript
db.select('painter', '=', 'Dali')
  .and('year', '<', 1928);
  .fetch(); // 1 item
```

Fetch all paintings of the beginning of XX's century:

```javascript
    db.select('year', '><', [1900, 1910])
      .fetch(); // 2 items
```

Fetch separately all the painters and all the dates of the paintings:

```javascript
db.select('year', '><', [1900, 1910])
  .fetchValues(['painter', 'title']);

// { painter: [ 'Jesus', 'Dali', 'Dali', 'Monet', 'Monet', 'Manet' ],
//   year: [ 0, 1929, 1927, 1906, 1891, 1863 ] }
```
### Saving to file

Database can be saved to filesystem using `save` and `saveSync` methods.
If not specified the format is deducted from the ending of the filename.
An adapter can be specified to alter the data before storing.
The adapter is an item in the `options` object.
Further options can be specified:

```
{

   headers: true,                     // if options.headers === true: use
                                      //   first line of file as headers;
                                      // if !options.headers: use
                                      //   ['X1'...'XN'] as headers;
                                      // if options.headers is an array of
                                      //   strings use it as headers;
                                      // if options.headers is an array
                                      //   containing true/false use entry
                                      //   from file/'Xi' respectively;


   adapter: { A: function(row) {      // An obj containing callbacks for
                  return row['A']-1;  // each header. The callbacks take
                 }                    // an object of strings and
            },                        // return a string. Each entry in
                                      // the file is the result of
                                      // applying the callback of its
                                      // column to its row.


   separator: ',',                    // The character used as separator
                                      // between values. Default ','.

   quote: '"',                        // The character used as quote.
                                      // Default: '"'.

   escapeCharacter: '\',              // The char that should be skipped.
                                      // Default: '\'.

   commentchar: '',                   // The character used for comments.
                                      // Default: ''.

   nestedQuotes: false,               // TRUE, if nested quotes allowed.
                                      // Default FALSE.

   flags: 'w',                        // The Node.js flag to write to fs.
                                      // Default: 'a' (append).

   encoding: 'utf-8',                 // The encoding of the file.

   mode: 0777,                        // The permission given to the file.
                                      // Default: 0666
}
```

#### Saving Examples

db.save("MyCSV.csv",function() {
    console.log("Saved db as csv into 'MyCSV.csv'.")
});

// Define adapter that doubles all numbers in column "A".
options.adapter = {
    A: function(item) {
        var out;
        out = parseFloat(item["A"]);
        return (isNaN(out) ? item["A"] : 2*out + '');
    }
};
db.save("MyCSV.csv", options, function() {
    console.log("Saved db as csv into 'MyCSV.csv', where numbers in column 'A' "
    +"were doubled.");
});

### Loading from file
Entries from file are read and inserted into database using `load` and
`loadSync` methods.
Options and adapter are handled analogous to "save" and "saveSync".

#### Loading Example

db.load("MyCSV.csv",function() {console.log("Loaded csv file into database")});

### Sorting

Define a global comparator function that sorts all the entries chronologically:

```javascript
db.globalCompator = function (o1, o2) {
    if (o1.year < o2.year) return 1;
    if (o1.year < o2.year) return 2;
    return 0;
};
```

Sort all the items (global comparator function is automatically used):

```javascript
db.sort(); // Order: Manet, Monet, Monet, Picasso, Dali, Dali
```

Reverse the order of the items:

```javascript
db.reverse(); // Order: Dali, Dali, Picasso, Monet, Monet, Manet
```

Define a custom comparator function for the name of the painter, which
gives highest priorities to the canvases of Picasso;

```javascript
db.compare('painter', function (o1, o2) {
    if (o1.painter === 'Picasso') return -1;
    if (o2.painter === 'Picasso') return 1;
}
```

Sort all the paintings by painter

```javascript
db.sort('painter'); // Picasso is always listed first
```

### Views

Splits the database in sub-database, each containing semantically
consistent set of entries:

```javascript
// Let us add some cars to our previous database of paintings.
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

db.size();          // 9
db.art.size();      // NDDB with 6 art entries
db.cars.size();     // NDDB with 3 car entries
```

### Hashing

Define a custom hash function that creates a new view on each of the
painters in the database:

```javascript
db.hash('painter', function(o) {
    if (!o) return undefined;
    return o.painter;
});

db.rebuildIndexes();

db.size();          // 6, unchanged;
db.painter.Picasso; // NDDB with 1 element in db
db.painter.Monet    // NDDB with 2 elements in db
db.painter.Manet    // NDDB with 1 elements in db
db.painter.Dali     // NDDB with 2 elements in db
```

### Listenting to events

Listen to the `insert` event and modify the inserted items by adding
an external index to them:

```javascript
var id = 0;
function getMyId(){ return id++; };

db.on('insert', function(o) {
    o.painter.id = getMyId();
});
```

### Indexes

Define a custom indexing function that gives fast, direct access to
the items of the database;

```javascript
db.index('pid', function(o) {
    return o.id;
});

db.rebuildIndexes();

db.pid.get(0).name; // Picasso

db.pid.update(0, {
  comment: "Good job Pablo!"
});

// Counts items in selection.
db.select('comment').count(); // 1

var picasso = db.pid.remove(0);
db.size(); // (0)

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
    indexes:  true,   // Updates the indexes, if any
    sort:     true,   // Sorts the items of the database
    pointer:  true,   // Moves the iterator to the last inserted element
  },
  C:  {},             // Collection of comparator functions
  H:  {},             // Collection of hashing functions
  I:  {},             // Collection of indexing functions
  V:  {},             // Collection of view functions
  log: logFunc,       // Default stdout
  logCtx: logCtx      // The context of execution for the log function
  nddb_pointer: 4,    // Set the pointer to element of index 4
  globalCompare: function(o1, o2) {
    // comparing code
  },
  filters: {          // Extends NDDB with new operators for select queries
    '%': function(d, value, comparator){
          return function(elem) {
            if ((elem[d] % value) === 0) {
              return elem;
            }
          }
  },
  share: {           // Contains objects that are copied by reference to
                     // in every new instance of NDDB.
    sharedObj: sharedObj
  }
}

var nddb = new NDDB(options);

// or

nddb = new NDDB();
nddb.init(options);
```

## Save and load from file or to localStorage

In the node.js environment, it is possible to save the state of the
database to a file and load it afterwards.

```javascript
// Database exists and items inserted.
db.save('./db.out');

var db2 = new NDDB();
db2.load('./db.out');
```

The above command are valid also in the browser environment if
[Shelf.js](https://github.com/shakty/shelf.js) is loaded. A string id
instead of the path to a file must be given instead.

## Test

NDDB relies on [mocha](http://visionmedia.github.com/mocha/) and
[should.js](http://github.com/visionmedia/should.js) for testing.

    $ npm install # will load all necessary dependencies
    $ npm test # will run the test suite against nddb.js

## Build

Create your customized build of NDDB using the make file in the `bin`
directory:


In order to run in the browser NDDB needs to have
[JSUS](http://github.com/nodeGame/JSUS) loaded. You can include it
separately, or create a new build that includes it already. See the
build help for options.

```javascript
node make.nddb.js build // Standard build,
node make.nddb.js build -a -o nddb-full // Full build
```

The build file file will be created inside the `build/` directory.


### Help

```javascript
node make.nddb.js --help
```

## API Documentation

Create html API documentation using the make file in the bin directory:

```javascript
node make.nddb.js doc
```

## License

[MIT](LICENSE)
