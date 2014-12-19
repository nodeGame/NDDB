var util = require('util'),
should = require('should'),
NDDB = require('./../nddb').NDDB,
JSUS = require('JSUS').JSUS;

var cycle = {};

var options = {    
    shared: {
        a: 1,
        b: 2,
        c: cycle
    },
    log: function() {
    },
    logCtx: {
        a: 1,
        b: 2
    }
};

cycle.cycle = options;
options.logCtx.cycle = cycle;
var db;

var items = [
    {
	painter: "Jesus",
	title: "Tea in the desert",
	year: 0,
    },
    {
        painter: "Dali",
        title: ["Portrait of Paul Eluard", "Das Rätsel der Begierde", "Das finstere Spiel oder Unheilvolles Spiel"],
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
        title: {en: "Water Lilies", de: "Wasser Lilies"},
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

db = new NDDB(options);
db.importDB(items);

db.addFilter('aa', function() {});

describe('NDDB cloneSettings', function() {

    it('should copy shared properties by reference', function(){
        var o2 = db.cloneSettings();
        o2.shared.c.cycle.should.be.type('object');
    });

    it('a new db should not have options.shared', function(){
        ('undefined' === typeof db.__options.shared).should.be.true;
        db.__shared.should.be.type('object');
    });

    it('should copy shared properties by reference with breed method', 
       function(){

        var db2 = db.breed();
        ('undefined' === typeof db2.__options.shared).should.be.true;
        db2.__shared.should.be.type('object');
    });

    it('should copy log and logCtx properties by reference', function(){
        var o2 = db.cloneSettings();
        o2.logCtx.cycle.should.be.type('object');
        o2.log.should.be.type('function');
    });

    it('should copy user-defined filters', function(){
        var o2 = db.cloneSettings();
        o2.filters.aa.should.be.type('function');
    });
});
