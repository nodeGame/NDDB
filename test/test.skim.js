var util = require('util'),
should = require('should'),
NDDB = require('./../nddb').NDDB,
JSUS = require('JSUS').JSUS;

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


describe('NDDB skim', function() {	

    describe("#skim('year')",function() {
    	var skim;
        before(function() {
            db.clear(true);
            db.importDB(items);
            skim = db.skim('year');
        });

        it("should return " + items.length + " items",function() {
            skim.size().should.be.eql(items.length);

        });
        it("should create a database where no item has the 'year' property", function() {
            skim.each(function(e) {
            	e.should.not.have.property('year')
            })
                });
    });
    
    describe("#skim('portrait')",function() {
    	var skim;
        before(function() {
            db.clear(true);
            db.importDB(items);
            skim = db.skim('portrait');
        });

        it("should return " + items.length + " items",function() {
            skim.size().should.be.eql(items.length);

        });
        it("should create a database where no item has the 'portrait' property", function() {
            skim.each(function(e) {
            	e.should.not.have.property('portrait')
            })
                });
    });
    
    describe("#skim(['portrait', 'year', 'painter', 'title']) #all properties",function() {
    	var skim;
        before(function() {
            db.clear(true);
            db.importDB(items);
            skim = db.skim(['portrait', 'year', 'painter', 'title']);
        });

        it("should return 0 items",function() {
            skim.size().should.be.eql(0);

        });        
    });
});


describe('NDDB keep', function() {	

    describe("#keep('year')",function() {
    	var keep;
        before(function() {
            db.clear(true);
            db.importDB(items);
            keep = db.keep('year');
        });

        it("should return " + items.length + " items",function() {
            keep.size().should.be.eql(items.length);
        });
        it("should create a database where all items have only the 'year' property", function() {
            keep.each(function(e) {
            	JSUS.size(e).should.be.eql(1);
            	e.should.have.keys(['year']);
            })
                });
    });
    
    describe("#keep('portrait')",function() {
    	var keep;
        before(function() {
            db.clear(true);
            db.importDB(items);
            keep = db.keep('portrait');
        });

        it("should return 1 item",function() {
            keep.size().should.be.eql(1);

        });
        
        it("should create a database where all items have only the 'portrait' property", function() {
            keep.each(function(e) {
            	JSUS.size(e).should.be.eql(1);
            	e.should.have.keys(['portrait']);
            })
                });
    });
    
    describe("#keep(['portrait','year'])",function() {
    	var keep;
        before(function() {
            db.clear(true);
            db.importDB(items);
            keep = db.keep(['portrait','year']);
        });

        it("should return " + items.length + " items",function() {
            keep.size().should.be.eql(items.length);
        });
        
        it("should create a database where all items have only the 'portrait', and 'year' properties", function() {
            keep.each(function(e) {
            	JSUS.size(e).should.not.be.above(2);
            	if (JSUS.size(e) === 2) {
            	    e.should.have.keys(['portrait', 'year']);
            	} else {
            	    e.should.have.keys(['year']);
            	}
            })
                });
    });
    
    describe("#keep('xxx') [unexisting property]",function() {
    	var keep;
        before(function() {
            db.clear(true);
            db.importDB(items);
            keep = db.keep('xxx');
        });

        it("should return " + items.length + " items",function() {
            keep.size().should.be.eql(0);

        });
    });
});
