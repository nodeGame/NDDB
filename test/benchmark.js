var util = require('util'),
should = require('should'),
NDDB = require('./../nddb').NDDB,
JSUS = require('JSUS').JSUS;

var db = new NDDB();

var select = null;


var painters = ['Rotko', 'Kandinsky', 'Matisse', 'Braque', 'Modigliani', 'Manet', 'Monet', 'Dali', 'Picasso'];

var items = [];

var items2 = [
    {
	painter: "Jesus",
	title: "Tea in the desert",
	year: 0,
    },
    {
        painter: "Dali",
        title: ["Portrait of Paul Eluard", "Das Rätsel der Begierde", "Das finstere Spiel oder Unheilvolles Spiel"],
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
        title: {en: "Water Lilies",de:"Wasser Lilies"},
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
    },

];

var ITEMS = 100000;

for (var i=0; i < ITEMS; i++) {
    items.push({
	painter: painters[i % painters.length],
	title: Math.random(),
	year: JSUS.randomInt(0,2013)
    });
}

items =  items.concat(items2);

var db = new NDDB();

db.importDB(items);

var start = Date.now();

db.select('painter', '=', 'Manet').fetch();

var stop =  Date.now();


console.log('Time for select query with ' + db.size() + ' items = ' + (stop - start) + 'ms');

