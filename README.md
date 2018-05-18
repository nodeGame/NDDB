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
- Saving and Loading: `save`, `saveSync`, `load`, `loadSync`, `setWD`, `getWD`

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
db.size(); // 6
```

### Select Items

Select statements must begin with `select`, and can be concatened by
any number of subsequent `and` and `or` statements. The comparison in
select statements is performed using three input parameters:

  - 'property'
  - 'operator'
  - any additional number of arguments required by operator

Available operators include standard logical operators:

   - `=`, `==`, `!=`, `>`, `>=`, `<`, `<=`,

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

### Sorting

Define a global comparator function that sorts all the entries chronologically:

```javascript
db.globalCompator = function (o1, o2) {
    if (o1.year < o2.year) return -1;
    if (o1.year > o2.year) return 1;
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

// Default view: returns items with the value
// of the property 'painter' !== undefined.
db.view('painter');

// Make the view function explicit.
db.view('art', function(o) {
  return o.painter;
});

db.view('cars', function(o) {
  return o.car;
});

db.rebuildIndexes();

db.size();          // 9
db.painter.size();  // NDDB with 6 art entries
db.art.size();      // NDDB with 6 art entries
db.cars.size();     // NDDB with 3 car entries
```

### Hashing

Define a custom hash function that creates a new view on each of the
painters in the database:

```javascript
db.hash('painter');
// Or the equivalent explicit function definition.
db.hash('painter', function(o) {
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

Event listeners can block the execution of the operation it is
listening to by returning `false`. No errors are thrown.

```javascript
db.on('insert', function(o) {
    if (o.year > 3000) return false;
});
```

Attention! The order in which the event listeners are added
matters. In fact, if an event listeners return `false`, all successive
event listeners will be skipped.

Other events to listen to are: `update`, `remove`.

### Indexes

Define a custom indexing function that gives fast, direct access to
the items of the database;

```javascript
db.index('id');
// Or the equivalent explicit function definition.
db.index('id', function(o) {
    return o.id;
});

db.rebuildIndexes();

db.id.get(0).name; // Picasso

db.id.update(0, {
  comment: "Good job Pablo!"
});

// Counts items in selection.
db.select('comment').count(); // 1

var picasso = db.id.remove(0);
db.size(); // (0)

// Get all available keys in the index
db.painter.getAllKeys(); // ['0','1', ... ]

// Get all elements indexed by their key in one object
db.painter.getAllKeyElements();
```

#### Default index

The property `._nddbid` is added to every inserted item. The property
is not enumerable (if the environment allows it), and all items are
indexed against it:


```javascript
db.nddbid.get('123456'); // Returns the item with nddbid equal to 123456.
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


## Saving and Loading Items


The items in the database can be saved and loaded using the `save` and
`load` methods, and their synchronous implementations `saveSync` and
`loadSync`.

### Saving and loading to file system (node.js environment)

Two formats are natively supported: `.json` and `.csv`, and they are
detected by the extension of the filename. If a differ extension is
found, NDDB will fall back to the default format (usually json).

It is possible to specify new formats using the `addFormat` method.

#### Code Examples

```javascript
// Saving items in JSON format.
db.save('db.json', function() {
    console.log("Saved db into 'db.json'");
});

// Saving items in CSV format.
db.save('db.csv', function() {
    console.log("Saved db into db.csv'");
});

// Saving items synchronously in CSV format.
db.saveSync('db.csv');
console.log("Saved db into db.csv'");

// Saving items in the default format (usually json).
db.getDefaultFormat(); // json
db.save('db.out', function() {
    console.log("Saved db into db.out'");
});

// Specifying the default format and saving into CSV.
db.setDefaultFormat('csv');
db.save('db.out', function() {
    console.log("Saved db into db.out'");
});

// Transform items before saving them to CSV format.
// Define adapter function that doubles all numbers in column "A".
var options = {};
options.adapter = {
    A: function(item) { return item.A * 2; }
};
db.save('db2.csv', options, function() {
    console.log("Saved db as csv into 'db2.csv', where numbers in column 'A'" +
                "were doubled");
});


// Loading items into database.
db.load('db.csv', function() {
                  console.log("Loaded csv file into database");
});

// Loading items into database synchronously.
db.loadSync('db.csv');
console.log("Loaded csv file into database");

// Loading 'adapted' items into database.
db.load('db2.csv', function() {
                   console.log("Loaded csv file into database");
});

// Transform items before loading them into database.
// Loading items into database.
var options = {};
options.adapter = {
    A: function(item) { return item.A / 2; }
};

db.load('db2.csv', function() {
                   console.log("Loaded csv file into database");
});

// Specify a new format.
db.addFormat('asd', {
   save: function(db, file, cb, options) {
         // save file asynchronously.
   },
   load: function(db, file, cb, options) {
         // load file asynchronously.
   },
   saveSync: function(db, file, cb, options) {
         // save file synchronously.
   },
   loadSync: function(db, file, cb, options) {
         // load file synchronously.
   }
});

// Saving in the new format.
db.save('db.asd');
```

### Setting the current working directory (node.js environment)

It is possible to specify the current working directory to avoid
typing long file paths.

```javascript
// Saving items in JSON format.
db.load('/home/this/user/on/that/dir/db.json');
db.load('/home/this/user/on/that/dir/db2.json');
db.load('/home/this/user/on/that/dir/db3.json');

// Can be shortened to:
db.setWD('/home/this/user/on/that/dir');
db.load('db.json');
db.load('db2.json');
db.load('db3.json');

// Get current working directory:
db.getWD(); // /home/this/user/on/that/dir/
```

#### List of all available options

```javascript
{

   flags: 'w',                        // The Node.js flag to write to fs.
                                      // Default: 'a' (append).

   encoding: 'utf-8',                 // The encoding of the file.

   mode: 0777,                        // The permission given to the file.
                                      // Default: 0666

   // Options below are processed when the CSV format is detected.

   headers: true,                     // Loading:
                                      //  - true: use first line of
                                      //      file as key names (default)
                                      //  - false: use [ 'X1'...'XN' ]
                                      //      as key names;
                                      //  - array of strings: used as
                                      //      is as key names;
                                      //  - array of booleans: selects
                                      //      key names in order from
                                      //      columns in csv file
                                      //
                                      // Saving:
                                      //  - true: use keys of first
                                      //      item as column names (default)
                                      //  - 'all': collect all keys
                                      //      from all elements and use
                                      //      as column names
                                      //  - function: a callback that
                                      //      takes each unique key in
                                      //      the db and returns: 
                                      //      another substitute string,
                                      //      an array of strings to add,
                                      //      null to exclude the key,
                                      //      undefined to keep it.
                                      //  - false: no headers
                                      //  - array of strings: used as
                                      //      is for column names (keys
                                      //      not listed are omitted)
                                      


   adapter: { A: function(row) {      // An obj containing callbacks for
                  return row['A']-1;  // given csv columns. Callbacks take
                 }                    // an object (a row of the csv 
            },                        // file, or an item of the
                                      // database) and return a value to
                                      // be saved to file or inserted
                                      // in the object's key.

   separator: ',',                    // The character used as separator
                                      // between values. Default ','.

   quote: '"',                        // The character used as quote.
                                      // Default: '"'.

   commentchar: '',                   // The character used for comments.
                                      // Default: ''.

   nestedQuotes: false,               // TRUE, if nested quotes allowed.
                                      // Default FALSE.

   escapeCharacter: '\\',             // The char that should be skipped.
                                      // Default: \.
}
```

### Saving and loading to the local storage (browser environment)

Items persistance in the browser is available only if NDDB is built
with the [Shelf.js](https://github.com/shakty/shelf.js)
extension. Alternatively, a custom `store` function taking as input
the name of the local database could be defined.

All items will be saved in the JSON format.

Notice that there exist limitations to maximum number of items that
can be saved, depending on the local storage maximum capacity settings
of the browser. If the limit is reached an error will be thrown.


## Test

NDDB relies on [mocha](http://mochajs.org/) and
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
node make build // Standard build,
node make build -a -o nddb-full // Full build
```

The build file file will be created inside the `build/` directory.


## License

[MIT](LICENSE)
