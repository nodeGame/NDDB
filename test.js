const NDDB = require('NDDB');


NDDB.convert('bb.json', {
    filename: 'aa.csv', header: ['a', 'b', 'c', 'd', 'n', 'm', 'f', 's'] });
return;

const db = new NDDB();


db.loadSync('test.ndjson');
console.log(db.size())
db.forEach((item, i) => console.log(item));

return;
db.stream('test.ndjson');
db.stream('test.csv');
db.stream('test.json');

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



aa = db.stringify();

console.log(aa)

db.saveSync('aa.ndjson');

// db.saveSync('aa.json');

// db.saveSync('aa.nddb');

db2 = new NDDB();

db2.loadSync('aa.ndjson');


console.log(db2.size());
