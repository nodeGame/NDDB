

var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB;

var db = new NDDB();

var hashable = [
            {
                painter: "Jesus",
                title: "Tea in the desert",
                year: 0,
            },
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
            },           
];

var not_hashable = [
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

var all_items = hashable.concat(not_hashable);

var hashPainter = function(o) {
    if (!o) return undefined;
    return o.painter;
}


// Array for .fetchArray()
var array_of_all_items = new Array();
for(var entry in Object.keys(all_items)) {
    var line = new Array();
    for(var key in Object.keys(all_items[entry])) {
        keys = Object.keys(all_items[entry]);
        line.push(all_items[entry][keys[key]]);
    }
    array_of_all_items.push(line);
}

//Array for .fetchKeyArray()
var key_array_of_all_items = new Array();
for(var entry in Object.keys(all_items)) {
    var line = new Array();
    for(var key in Object.keys(all_items[entry])) {
        keys = Object.keys(all_items[entry]);
        line.push(keys[key]);
        line.push(all_items[entry][keys[key]]);
    }
    key_array_of_all_items.push(line);
}


describe('NDDB Fetching', function() {
	//fetch, fetchArray, fetchKeyArray
	
    before(function() {
        db.import(hashable);
        db.import(not_hashable);
    });

    describe('the complete database',function() {
        describe('#fetch()',function() {
            it('should be like the items array',function() {
                db.fetch().should.eql(all_items);
            });
        });
        describe('#fetchArray()',function() {
            it('should be like the Array of all the items',function() {
                db.fetchArray().should.eql(array_of_all_items);
            });
        });
        describe('#fetchKeyArray()',function() {
            it('should be like the KeyArray of all the items',function() {
                db.fetchKeyArray().should.eql(key_array_of_all_items);
            });
        });
        
    });

    describe('all values but only the painter key values',function() {
        it('should be all the painters',function() {
            var should_be_like_this = [ 'Jesus', 'Dali', 'Dali', 'Monet', 'Monet', 'Manet' ];
            db.fetch('painter').should.eql(should_be_like_this);
        });
    });

});