
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

var split_db = null;
var join_db = null;
var concat_db = null;


describe('NDDB Advanced Operation', function() {
	//split*, join, concat

    before(function() {
        db.importDB(items);
        db.h('painter', function(o) {
            if (!o) return undefined;
            return o.painter;
        });
        db.rebuildIndexes();
    });

    describe('#split()',function() {
        before(function() {
            split_db = db.split('title');
            split_db.rebuildIndexes();
            
        });
        it('db should have two more entries',function() {
            split_db.length.should.eql(db.length+2);
        });
        it('should have two more Dalis after rebuilding indexes',function() {
            split_db.painter.Dali.length.should.eql(4);
        });
        it('should have only one picture per new split entry',function() {
            Object.keys(split_db.get(1)['title']).length.should.eql(1);
            //console.log(array_length);
        });
    });

    describe('#join()',function() {
        before(function() {
            join_db = db.join('painter','painter','joined',['painter','title','year']);

        });
        it('should have 2 entries if using not splited db',function() {
            join_db.length.should.be.eql(2);
        });
        // Value 7 is the addition of the following calculation
        // x!/(2!*(x-2)!) for each painter
        it('should have 7 entries if using splited db',function() {
            var join_db_2 = split_db.join('painter','painter','joined',['painter','title','year']);
            join_db_2.length.should.be.eql(7);
        });
    });

    describe('#concat()',function() {
        before(function() {
            concat_db = db.concat('painter','painter','joined',['painter','title','year']);

        });
        it('should have 15 entries if using not splited db',function() {
            concat_db.length.should.be.eql(15);
        });
        // Value 28 is the result of the following calculation
        // x!/(2!*(x-2)!) 
        it('should have 28 entries if using splited db',function() {
            var concat_db_2 = split_db.concat('painter','painter','joined',['painter','title','year']);
            concat_db_2.length.should.be.eql(28);
        });
    });
	
});

