

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

var items_less = [
             {
                 painter: "Monet",
                 title: "Water Lilies",
                 year: 1906
             },
             {
                 painter: "Dali",
                 title: "Das Rätsel der Begierde",
                 year: 1929,
             },
];


describe('NDDB Diff', function() {
	//diff, intersect
	
    before(function() {
        db.import(items);
    });

    describe("#diff()",function() {
        var difference = null;
        var different_db = null;
        before(function() {
            different_db = new NDDB();
            different_db.import(items_less);
            difference = db.diff(different_db);
        });

        it("db.length should decrease by 1",function() {
            difference.length.should.be.eql(db.length - 1);

        });

        it("should not contain 2 of the items",function() {
            difference.select('title','=',"Water Lilies").length.should.be.eql(0);
            difference.select('title','=',"Das Rätsel der Begierde").length.should.be.eql(0);
        });
        
        // Add test should contain
    });

    describe("#intersect()",function() {
        var difference = null;
        var different_db = null;
        before(function() {
            different_db = new NDDB();
            different_db.import(items_less);
            difference = db.intersect(different_db);
        });

        it("the count should be 1",function() {
            difference.length.should.be.eql(1);
        });

        it("should contain one masterpiece (item)",function() {
            difference.select('title','=',"Water Lilies").length.should.be.eql(1);
        });
    });

});
