# NDDB

[![Build Status](https://travis-ci.org/nodeGame/NDDB.png?branch=master)](https://travis-ci.org/nodeGame/NDDB)

NDDB is a powerful and versatile object database for node.js and the browser.

---

NDDB (N-Dimensional DataBase) supports indexes, views, hashes, joins,
group-by, basic statistics, custom operations, saving and loading from
file system and browser localStorage, and much more.

Developer-friendly thanks to an easy api, detailed documentation, and
wide test coverage.

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

<!-- The complete NDDB api documentation is available
[here](http://nodegame.github.com/NDDB/docs/nddb.js.html). -->

## Usage

Load the library in Node.js:

```javascript
const NDDB = require('NDDB');

// Backward-compatible mode.
// const NDDB = require('NDDB').NDDB;
```

or in the browser add a script tag in the page:

```html
<!-- Must load a version of NDDB that includes JSUS (see 'build/' dir) -->
<script src="/path/to/nddb.js"></script>
```

Create an instance of NDDB:

```javascript
let db = new NDDB();
```

Insert an item into the database:

```javascript
// Add one item to the database.
db.insert({
    painter: "Picasso",
    title: "Les Demoiselles d'Avignon",
    year: 1907
});
```

Import a collection of items:

```javascript
let items = [
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

// Import an array of items at once.
db.importDB(items);
```

Retrieve the database size:

```javascript
db.size(); // 6
```

### Select Items

Select statements begin with `select` and can be refined with
`and` and `or` statements. Select statements accept three input parameters:

  - 'property'
  - 'operator'
  - any additional number of arguments required by operator

Basic operators include standard logical operators:

   - `=`, `==`, `!=`, `>`, `>=`, `<`, `<=`,

Advanced comparison operators include:

   - `E`: field exists (can be omitted, it is the default one)
   - `><`: between values (expects an array as third parameter)
   - `<>`: not between values (expects an array as third parameter)
   - `in`: element is found in array (expects an array as third parameter)
   - `!in`: element is noi found in array (expects an array as third parameter)
   - `LIKE`: string SQL LIKE (case sensitive)
   - `iLIKE`: string SQL LIKE (case insensitive)

It is possible to access and compare nested properties simply
separating them with `.`.

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
// Property 'portrait' must not be undefined.
db.select('portrait'); // 1 item
```

Select all paintings from Dali that are before 1928:

```javascript
db.select('painter', '=', 'Dali')
  .and('year', '<', 1928); // 1 item
```

Select all paintings of the beginning of XX's century:

```javascript
db.select('year', '><', [1900, 1910]) // 2 items
```

### Fetching items

Select statements are not evaluated until a `fetch` statement is invoked, returning the array of selected items, and preventing further chaining.

```javascript
db.select('painter', '=', 'Dali').fetch();

// [
// {
//     painter: "Dali",
//     title: "Portrait of Paul Eluard",
//     year: 1929,
//     portrait: true
// },
// {
//     painter: "Dali",
//     title: "Barcelonese Mannequin",
//     year: 1927
// }
// ]
```

Other fetch methods can manipulate the items before they are returned.

```javascript
// Create a new database without the items by Picasso.
let newDb = db.select('painter', '!=', 'Picasso').breed();

// fetchValues
//
// Fetch all the values of specified properties and return them in an object.
newDb.fetchValues(['painter', 'title']);

// {
//   painter: [ 'Dali', 'Dali', 'Monet', 'Monet', 'Manet' ],
//   year: [ 1929, 1927, 1906, 1891, 1863 ]
// }

// fetchSubObj
//
// Keeps only specified properties in the objects, before returning them in
// an array (items in the original database are NOT modified).
newDb.fetchSubObj(['painter', 'title']);

// [
//     {
//         painter: "Dali",
//         year: 1929
//     },
//     {
//         painter: "Dali",
//         year: 1927
//     },
//     {
//         painter: "Monet",
//         year: 1906
//     },
//     {
//         painter: "Monet",
//         year: 1891
//     },
//     {
//         painter: "Manet",
//         year: 1863
//     }
// ]    

// fetchArray
//
// Returns the items as arrays.
newDb.fetchArray()
// [
//  [ 'Dali', 'Portrait of Paul Eluard', 1929, true ],
//  [ 'Dali', 'Barcelonese Mannequin', 1927 ],
//  [ 'Monet', 'Water Lilies', 1906 ],
//  [ 'Monet', 'Wheatstacks (End of Summer)', 1891 ],
//  [ 'Manet', 'Olympia', 1863 ]
// ]


// fetchKeyArray
//
// Returns the items as arrays (including the keys).
newDb.fetchKeyArray()
// [
//   [
//     'painter', 'Dali', 'title', 'Portrait of Paul Eluard', 'year',
//     1929, 'portrait', true
//   ],
//   [ 'painter', 'Dali', 'title', 'Barcelonese Mannequin', 'year', 1927 ],
//   [ 'painter', 'Monet', 'title', 'Water Lilies', 'year', 1906 ],
//   [
//     'painter', 'Monet', 'title', 'Wheatstacks (End of Summer)', 'year', 1891
//   ],
//   [ 'painter', 'Manet', 'title', 'Olympia', 'year', 1863 ]
// ]
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
gives highest priorities to the canvases of Picasso:

```javascript
db.compare('painter', function (o1, o2) {
    if (o1.painter === 'Picasso') return -1;
    if (o2.painter === 'Picasso') return 1;
});
```

Sort all the paintings by painter using the new comparator:

```javascript
db.sort('painter'); // Picasso is always listed first.
```

### Views

Splits the database in sub-databases, each containing semantically
consistent set of entries:

```javascript
// Let us add some cars to our previous database of paintings.
let not_art_items = [
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

Define a custom hash function that creates a new view for each of the
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

### Listening to events

NDDB fires the following events: `insert`, `update`, `remove`, `setwd`, `save`, `load`. Users can listen to these events and modify their behavior.

#### Decorating objects on insert

Listen to the `insert` event and modify the inserted items by adding
an index that is incremented sequentially:

```javascript
let id = 0;
function getMyId(){ return id++; };

db.on('insert', function(item) {
    item.myId = getMyId();
});
```

#### Canceling operations: insert, update, remove.

Event listeners can block the execution of the operation by returning `false`. No errors are thrown.

```javascript
// Insert event.
// Parameters:
//  - item: the item to insert.
db.on('insert', function(item) {
    if (item.year > 3000) return false; // Item is not added.
});

// Update event.
// Parameters:
//   - item: the item to update.
//   - update: an object containing the properties to update/add.
//   - idx: the index of the item in the reference database (note: in a
//          sub-selection, the index of the item may differ from its index
//          in the main database.)
db.on('update', function(item, update, idx) {
    if (update.year > 3000) return false; // Item is not updated.
});

// Remove event.
// Parameters:
//   - item: the item to remove.
//   - idx: the index of the item in the reference database (note: in a
//          sub-selection, the index of the item may differ from its index
//          in the main database.)
db.on('remove', function(item, idx) {
    if (item.year < 3000) return false; // Item is not removed.
});
```

Attention! The order in which the event listeners are added matters.
If an event listener returns `false`, all successive event listeners are skipped.

#### Modifying save/load options.

```javascript
// Save/load event (both sync or async).
// Parameters:
//   - options: object with the user options for the save/load event.
//   - info: an object containing information about the save/load command,
//           which cannot be altered. Format:
//           {
//               file:     'path/to/file.csv',
//               format:   'csv',
//               cb:       function() {},   // User defined function, if any.
//           }
//
db.on('save', function(options, info) {
    if (info.format === 'csv') {
        options.header = [ 'id', 'time', 'action'];  // Modify header.
    }
});
```

#### Intercept changes in working directory

```javascript
// Set working directory event.
// Parameters:
//   - wd: The new working directory.
db.on('setwd', function(wd) {
    // Take note of the change, the value cannot be modified.
});
```

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

let picasso = db.id.remove(0);
db.size(); // (0)

// Get all available keys in the index
db.painter.getAllKeys(); // ['0','1', ... ]

// Get all elements indexed by their key in one object
db.painter.getAllKeyElements();
```

#### Default index

The property `._nddbid` is added to every inserted item. The property
is not enumerable (if the environment permits it), and all items are
indexed against it:


```javascript
db.nddbid.get('123456'); // Returns the item with nddbid equal to 123456.
```

## Configuration Options

```javascript
let logFunc = function(txt, level) {
  if (level > 0) {
    console.log(txt);
  }
};

let options = {
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
    // Comparator.
  },
  filters: {          // Extends NDDB with new operators for select queries
    '%': function(d, value, comparator) {
          return function(elem) {
            if ((elem[d] % value) === 0) {
              return elem;
            }
          }
      }
  },
  share: {           // Contains objects that are copied by reference to
                     // in every new instance of NDDB.
    sharedObj: sharedObj
  }
}

let nddb = new NDDB(options);

// or

nddb = new NDDB();
nddb.init(options);
```

## Saving and Loading Items

The items in the database can be saved and loaded using the `save` and
`load` methods, and their synchronous implementations `saveSync` and
`loadSync`.

### Saving and loading to file system (node.js environment)

Two formats are natively supported: `.json` and `.csv` (automatically
detected by the filename's extension. For unknown extensions, NDDB falls
back to the default format (json, but it can be overridden).

It is possible to specify new formats using the `addFormat` method.

#### Save/Load Examples

```javascript

// SAVING.

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

// LOADING.

// Loading items into database synchronously.
db.loadSync('db.csv');
console.log("Loaded csv file into database");

// Loading 'adapted' items into database.
db.load('db.csv', function() {
                   console.log("Loaded csv file into database");
});

```

#### Adding a New Format

```js
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

### CSV Advanced Options

#### Specifying an Adapter

```js
// Transform items before saving them to CSV format.

let options = {
    adapter: {

        // Double all numbers in column "A".
        A: function(item) { return item.A * 2; },

        // Rename a property (must add shorterName to a custom header).
        shorterName: 'moreComplexAndLongerName'
    }
};
db.save('db2.csv', options, function() {
    console.log("Saved db as csv into 'db2.csv', where numbers in column 'A'" +
                "were doubled");
});


// Transform items before loading them into database.
// Loading items into database.
options = {
    adapter: {
        A: function(item) { return item.A / 2; }
    }
};

db.load('db2.csv', options, function() {
                   console.log("Loaded csv file into database");
});
```

#### Saving Updates

To automatically save to the file system every new entry added to the database (as well as views and hashes) use the `keepUpdated` flag. This feature is especially useful for incremental processes, such as logs.

Let's assume that objects containing user comments are added to the database at random intervals. Here is the code snippet to automatically save them:

```js
// Create a new 'comment' view and save all updates to CSV file.
db.view('comment').save('comments.csv', {

    // Specify a custom header.
    header: [ 'timestamp', 'user', 'comment' ],

    // Incrementally save to the same csv file all new entries.
    keepUpdated: true,  

    // As new items are generally clustered in time, it is good to add some
    // delay before saving the updates. Default: 10000 milliseconds
    updateDelay: 5000    
});
```

Alternatively, if you know already when a new set of comments are added to the database, you can manually control when to save the new updates, using the `updatesOnly` flag.

```js
// Feedback view already created.
db.comment.save('comments.csv', {

    // Custom header.
    header: [ 'timestamp', 'user', 'feedback' ],

    // Saves only updates from previous save command.
    updatesOnly: true
});
```

#### Flatten Items

If a single user enters multiple items in the database, but you need only one row in the CSV file, you can use the `flatten` flag.

```js
db.view('user').save('users.csv', {

    // Custom header.
    header: [
        "user", "comment", "date", "name", "last", "rating"
    ],

    // Merges all items together.
    flatten: true,
});
```

If you have multiple users in the database, the option `flattenByGroup` will create one CSV row per group (e.g., user).


```js
db.user.save('users.csv', {

    // Custom header.
    header: [
        "user", "comment", "date", "name", "last", "rating"
    ],

    // Merges all items together.
    flatten: true,

    // One row per user (can also be a function returning the id of the group).
    flattenByGroup: 'user',
});
```

In case you need to periodically flatten the items, use the `flatten` option in combination with the `updatesOnly` flag.

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

    flags: 'w',                     // The Node.js flag to write to fs.
                                    // Default: 'a' (append).

    encoding: 'utf-8',              // The encoding of the file.

    mode: 0777,                     // The permission given to the file.
                                    // Default: 0666

    // Options below are processed when the CSV format is detected.

    header: true,                  // Loading:
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
                                    //  - false: no header
                                    //  - array of strings: used as
                                    //      is for column names (keys
                                    //      not listed are omitted)

    adapter: {
        // Update the year property
        year: function(row) {       // An object containing callbacks for
            return row['year']-1;   // given csv column names. Callbacks take
        }                           // an object (a row of the csv file
    },                              // file on load, or an item of the
                                    // database on save) and return a value to
                                    // be saved/loaded under that property name.

    separator: ',',                 // The character used as separator
                                    // between values. Default ','.

    quote: '"',                     // The character used as quote.
                                    // Default: '"'.

    commentchar: '',                // The character used for comments.
                                    // Default: ''.

    nestedQuotes: false,            // TRUE, if nested quotes allowed.
                                    // Default FALSE.

    escapeCharacter: '\\',          // The char that should be skipped.
                                    // Default: \.

    // API experimental (syntax may change), SAVE ONLY.

    flatten: true,                  // If TRUE, it flattens all items
                                    // currently selected into one row.

    recurrent: true,                // If TRUE, it periodically checks if
                                    // new items are inserted in the database
                                    // and saves them to file system.

    recurrentInterval: 20000,       // Number of milliseconds to wait before
                                    // checking for updates in the database.
                                    // Default: 10000

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

The build file will be created inside the `build/` directory.


## License

[MIT](LICENSE)
