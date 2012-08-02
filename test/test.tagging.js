

var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB;

var db = new NDDB();

var items = [
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




describe('NDDB Tagging', function() {
    before(function() {
        db.importDB(items);
    });


    describe('a pre-selected entry', function() {
        it('should return the position of the entry',function() {
            db.last();
            db.tag('someone');
            db.resolveTag('someone').should.eql(5);
        });
        
        it('should return the position of the entry',function() {
            db.previous();
            db.tag('a other one');
            db.resolveTag('a other one').should.eql(4);
        });

        it('should return the correct position after db.sort(year)',function() {
            var sortedDb = db.sort('year');
            sortedDb.resolveTag.should.eql(1);
        });

    });

    describe('a specific entry', function() {
        it('should return the position of the entry',function() {
            db.tag('the secret one',3);
            db.resolveTag('the secret one').should.eql(3);
        });
    });

    describe('the count of tags',function() {
        it('should return the count of made tags',function() {
            Object.keys(db.tags).length.should.eql(3);
        });

    });



});



