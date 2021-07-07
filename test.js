const NDDB = require('NDDB');

const db = new NDDB({ sync: 'db.json' });

// db.sync({ updateDelay: 100 });

db.insert({a: 1, b: 2 });
db.insert({a: 2, b: 3 });
db.insert({a: 3, b: 4 });
setTimeout(() => db.insert({a:3, b:5}), 200);


return;


setTimeout(() => {
    let db2 = new NDDB();
    db2.loadSync('nddb.json', { sync: true });
    console.log(db2.size());
    db2.each(i => console.log(i));
}, 3000);
