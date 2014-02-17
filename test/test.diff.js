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
    	db = new NDDB();
        db.importDB(items);
    });

    describe("#diff()",function() {
        var difference = null;
        var different_db = null;
        before(function() {
            different_db = new NDDB();
            different_db.importDB(items_less);
            difference = db.diff(different_db);
        });

        it("db.size() should be smaller by 1",function() {
            difference.size().should.be.eql(5);

        });
         it("should contain this objects", function() {
             var should_be_like_this = [ {painter: "Jesus",title: "Tea in the desert",year: 0,},{painter: "Dali",title: "Portrait of Paul Eluard",year: 1929, portrait: true},{ painter: 'Dali', title: 'Barcelonese Mannequin', year: 1927 },{ painter: 'Monet',title: 'Wheatstacks (End of Summer)',year: 1891 },{ painter: 'Manet', title: 'Olympia', year: 1863 } ];
             difference.db.should.eql(should_be_like_this);
         });
         it("should not contain 2 of the items",function() {
             difference.select('title','=',"Water Lilies").execute().size().should.be.eql(0);
             difference.select('title','=',"Das Rätsel der Begierde").execute().size().should.be.eql(0);
         });
    });

    describe("#intersect",function() {
        var difference = null;
        var different_db = null;
        before(function() {
            different_db = new NDDB();
            different_db.importDB(items_less);
            difference = db.intersect(different_db);
        });
 
        it("db.size() should be 1",function() {
            difference.size().should.be.eql(1);
        });
        it("should contain this objects", function() {
            var should_be_like_this = [{painter: "Monet",title: "Water Lilies",year: 1906}];
            difference.db.should.eql(should_be_like_this);
        });
        it("should contain one masterpiece (item)",function() {
            difference.select('title','=',"Water Lilies").execute().size().should.be.eql(1);
        });
    });

});
