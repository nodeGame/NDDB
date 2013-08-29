
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
        db.hash('painter', function(o) {
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

    describe('shared objects and #breed()', function() {
        var db1 = null;
        var db2 = null;
        var sharedObj = {
            a: "a",
            b: "b"
        };
        before(function() {
            db1 = new NDDB({
                log: function(a) { return "AA"; },
                shared: {
                    sh: sharedObj
                }
            });
            db2 = db1.breed();
        });
        it('breeding should share the object',function() {
            db2.__shared.sh.should.equal(db1.__shared.sh);
        });
        it('modifications to shared objects should cascade',function() {
            db2.__shared.sh.a = "a1";
            db1.__shared.sh.a.should.equal("a1");
        });
        it('selexec should breed new NDDB with shared objects',function() {
            var tmp = db1.selexec('a','=',"a1");
            tmp.__shared.sh.a.should.equal("a1");
        });
        it('modifications to non-shared objects should not cascade',function() {
            db2.__V.a = "a";
            ('undefined' === typeof db1.__V.a).should.be.true;
        });
        it('log function should always be shared',function() {
            db1.log("a!").should.be.eql(db2.log("a2!"));
        });
        
       
    });

});