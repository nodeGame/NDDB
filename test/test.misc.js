
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

    before(function() {
        db.importDB(items);
        db.h('painter', function(o) {
            if (!o) return undefined;
            return o.painter;
        });
        db.rebuildIndexes();
    });

    describe('#forEach()',function() {
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

    describe('#map()',function() {
        var result = null;
        var result2 = null;

        before(function() {
            var addDone = function(item) {
                item['done'] = "10";
                return item['painter'] + " - " +  item['title'];
            };
            result = db.map(addDone);
            var addDoneArgs = function(item,args) {
                var calc = item['year'] + args;
                return calc;
            }
            result2 = db.map(addDoneArgs,5);
        });
        it('result.length should be equal db.length',function() {
            result.length.should.be.eql(6);
        });
        it('the result must be a special modification of the original items array',function() {
            for(var key in items) {
                result[key].should.be.eql(items[key]['painter'] + ' - '  + items[key]['title']);
            }
        });
        it('each year in the result must be increased by 5',function() {
            for(var key in items) {
                var calc = items[key]['year'] + 5;
                result2[key].should.be.eql(calc);
            }
        });
    });
});