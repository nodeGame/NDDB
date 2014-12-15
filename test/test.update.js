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




describe('Updating NDDB', function() {
    before(function() {
        db.importDB(items);
    });

    describe('#update()',function() {

        it('should add an \'old\' tag on old paintings', function() {

            db.select('year', '<', 1900)
                .execute()
                .update({old: true});

            db.select('old').execute().db.length.should.be.eql(3);
        });
    });

    describe('#update() interaction with existing views',function() {
        before(function() {

            var paintersView = function(o) {
                if (!o) return undefined;
                return o.painter;
            }

            db.init({update:{ indexes: true, } });
            db.view('art', paintersView);

            // For the first time, we need to create indexes.
            // Later calls need to update them on the fly.
            db.rebuildIndexes();
        });

        it('should remove the element from the correct view', function() {
            var oldSize, newSize;
            oldSize = db.art.size();

            db.select('title', '=', 'Olympia')
                .update({ painter: undefined });

            newSize = db.art.size();

            newSize.should.be.eql(oldSize -1);
        });
    });

    describe('#update() interaction with existing hashes',function() {
        before(function() {

            var hashPainter = function(o) {
                if (!o) return undefined;
                return o.painter;
            }

            db.init({update:{ indexes: true, } });
            db.hash('painter', hashPainter);
            
            // For the first time, we need to create indexes.
            // Later calls need to update them on the fly.
            db.rebuildIndexes();
        });

        it('should remove the element from the correct hash', function() {
            var oldSize, newSize;
            oldSize = db.painter['Monet'].size();
            
            db.select('title', '=', 'Water Lilies')
                .update({ painter: undefined });

            newSize = db.painter['Monet'].size();

            newSize.should.be.eql(oldSize - 1);
        });
    });
});


