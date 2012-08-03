
var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB;

var db = new NDDB();

var items = [
			 {
				 painter: "Jesus",
				 title: "Tea in the desert",
				 year: 0
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
             }
             
];


describe('NDDB Misc Operation', function() {
	//split*, join, concat

    before(function() {
        db.importDB(items);
        db.h('painter', function(o) {
            if (!o) return undefined;
            return o.painter;
        });
        db.rebuildIndexes();
    });

    describe('#map()',function() {
        before(function() {
            var addDone = function(item) {
                item['done'] = "10";
            };

            db.forEach(addDone);
        });
        it('every entry should have a new key',function() {
            db.select('done','=','10').length.should.be.eql(db.length);
        });

    });
    
    
    describe('#count()', function() {
    	it('should count the entries having the specified property',function() {
    		db.count('done').should.be.eql(db.length);
        });
    });

    
	
});

