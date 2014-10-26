var util = require('util'),
should = require('should'),
NDDB = require('./../nddb').NDDB;

var db = new NDDB();

var update =  {           // On every insert and remove:
    indexes:  true,   // updates the indexes, if any
    sort:     true,   // sorts the items of the database
    pointer:  true,   // moves the iterator pointer to the last inserted element
};

var items = [
    {
	painter: "Jesus",
	title: "Tea in the desert",
	year: 0
    },
    {
        painter: "Monet",
        title: "Monet",
        year: 1901,
    },
    {
        painter: "Dali",
        title: "Monet",
        year: 1902,
    },
    {
        painter: "Monet",
        title: "Dali",
        year: 1903,
    },
    {
        painter: "Dali",
        title:  ["Portrait of Paul Eluard", "Das Rätsel der Begierde", "Das finstere Spiel oder Unheilvolles Spiel"],
        year: 1929,
        portrait: true
    },
    {
        painter: "Dali",
        title: "Barcelonese Mannequin",
        year: 1927,
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

describe('NDDB Single Inserting', function(){
    beforeEach(function(){
	db.clear(true);
    });


    it('number', function(){
    	db.insert(1);
    	db.size().should.be.eql(0);
    });

    it('string', function(){
    	db.insert('foo');
    	db.size().should.be.eql(0);
    });

    it('NaN', function(){
    	db.insert(NaN);
    	db.size().should.be.eql(0);
    });

    it('Infinity', function(){
    	db.insert(Infinity);
    	db.size().should.be.eql(0);
    });

});

describe('NDDB Inserting a Collection', function(){
    before(function(){
	db.clear(true);
	db.init({update: update});
	db.importDB(items);
    });


    it('should update the database length', function(){
    	db.size().should.be.eql(items.length);
    });

    it('should not affect the indexing options', function(){
    	db.__update.should.be.eql(update);
    });
});
