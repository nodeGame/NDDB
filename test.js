const NDDB = require('NDDB');


// NDDB.convert('bb.json', {
//     filename: 'aa.csv', header: ['a', 'b', 'c', 'd', 'n', 'm', 'f', 's'] }
// );

// const db = NDDB.db();


let cb = (db) => {
    console.log(db);
    console.log(db.size());
};

let db = NDDB.load('_a.json', cb);

return;

// db.stream('_test.ndjson');
// db.stream('_test2.csv', { flatten: true, flattenByGroup: 'a' }); //
// db.stream('_test.json');

a = {a: 1, b: 2, s: 'also dice "Hello!"\r\n OK!' };
b = {a: 2, b: 3, n: null, m: undefined, f: function() { return 1; } };
c = {};
d = { c: c};
c.d = d;

// dd = NDDB.decycle(d);
// dc = NDDB.decycle(c);

// NDDB.retrocycle(dd);
// NDDB.retrocycle(dc);
//
// array = [dd, dc];

db.insert(a);
db.insert(b);
db.insert(c);
db.insert(d);

db.save('_a.ndjson', function() {console.log('done')});
console.log('Before done');

return;


aa = db.stringify();

console.log(aa)

return

db.saveSync('aa.ndjson');

// db.saveSync('aa.json');

// db.saveSync('aa.nddb');

db2 = new NDDB();

db2.loadSync('aa.ndjson');


console.log(db2.size());
