// Requiring and exporting JSUS
var JSUS = require('JSUS').JSUS;
module.exports.JSUS = JSUS;

var util = require('util'),
should = require('should'),
NDDB = require('./../nddb').NDDB;

var db = new NDDB();

var clients = ['a','b','c','d'];
var states = [1,2,3,4];
var ids = ['z','x'];//['z','x','c','v'];

var indexable = [
    {
        id: 1,
        painter: "Jesus",
        title: "Tea in the desert",
        year: 0,
    },
    {
        id: 2,
        painter: "Dali",
        title: "Portrait of Paul Eluard",
        year: 1929,
        portrait: true
    },
    {
        id: 3,
        painter: "Dali",
        title: "Barcelonese Mannequin",
        year: 1927
    },
    {
        id: 4,
        painter: "Monet",
        title: "Water Lilies",
        year: 1906
    },
    {
        id: 5,
        painter: "Monet",
        title: "Wheatstacks (End of Summer)",
        year: 1891
    },
    {
        id: 6,
        painter: "Manet",
        title: "Olympia",
        year: 1863
    },

];

var not_indexable = [
    {
        car: "Ferrari",
        model: "F10",
        speed: 350,
    },
    {
        car: "Fiat",
        model: "500",
        speed: 100,
    },
    {
        car: "BMW",
        model: "Z4",
        speed: 250,
    },
];

var nitems = indexable.length + not_indexable.length;


var element = {
    painter: "Picasso",
    title: "Les Demoiselles d'Avignon",
    year: 1907
};


var indexPainter = function(o) {
    return o.id;
}


db.index('painter', indexPainter);
db.view('pview', indexPainter);
db.hash('phash', indexPainter);
db.init( { update: { indexes: true } } );

var tmp;


describe('NDDB Indexing Operations:', function() {

     describe('Importing not-indexable items', function() {
        before(function(){
            db.importDB(not_indexable);
        });

         it('should not create the special indexes', function() {
             db.painter.should.not.exist;
             db.size().should.eql(not_indexable.length);
         });
     });


     describe('Importing indexable items', function() {
        before(function(){
            db.importDB(indexable);
        });

         it('should create the special indexes', function() {
             db.painter.should.exist;
             db.painter.size().should.be.eql(indexable.length);
         });

     });

     describe('Elements updated in the db should be updated in the indexes',
              function() {

                  before(function(){
                      var j = db.select('painter', '=', 'Jesus')
                          .execute().first();
                      j.painter = 'JSUS';
                  });

        it('updated property \'painter\' should be reflected in the index',
           function() {
               db.painter.get(1).painter.should.be.eql('JSUS');
         });
     });

     describe('Rebuilding the indexes multiple times', function() {
        before(function(){
            db.rebuildIndexes();
            db.rebuildIndexes();
        });

        it('should not change the index', function() {
            db.painter.size().should.be.eql(indexable.length);
         });
        it('should not change the view', function() {
            db.pview.size().should.be.eql(indexable.length);
         });
        it('should not change the hash', function() {
            JSUS.size(db.phash).should.be.eql(indexable.length);
         });
     });

     describe('#NDDBIndex.update()', function() {
        before(function(){
            db.painter.update(6, {
                painter: 'M.A.N.E.T.'
            });
        });

        it('updated property \'painter\' should be reflected in the index',
           function() {
               var elem = db.select('painter', '=', 'M.A.N.E.T.')
                   .execute().fetch();
               elem.length.should.be.eql(1);
               elem[0].id.should.be.eql(6)
           });

         it('updated property \'painter\' should update the get index',
            function() {
                db.painter.get(6).painter.should.be.eql('M.A.N.E.T.');
            });
     });

     describe('#NDDBIndex.pop()', function() {
        before(function(){

            tmp = db.painter.pop(6);
        });

        it('should return element \'M.A.N.E.T.\'', function() {
            tmp.painter.should.be.eql('M.A.N.E.T.');
         });
        it('should remove element from index', function() {
            db.painter.get(6).should.be.false;
         });
        it('should remove element from the main db too', function() {
            db.select('painter', '=', 'M.A.N.E.T.')
                .execute().size().should.be.eql(0);
         });
        it('should remove element from the view too', function() {
            db.pview.select('painter', '=', 'M.A.N.E.T.')
                .execute().size().should.be.eql(0);
         });
     });

     describe('#NDDBIndex.getAllKeys()', function() {
        before(function(){
            tmp = db.painter.getAllKeys();
        });

        it('should return all the indexes', function() {
            tmp.should.be.eql(['1','2','3','4','5']);
         });
     });

     describe('#NDDBIndex.getAllKeyElements()', function() {
        before(function(){
            tmp = db.painter.getAllKeyElements();
        });

        it('should return all the indexes', function() {
            var o = {}, item, i;
            // length -1 : one element removed
            for (i = 0; i < indexable.length-1; i++) {
                item = indexable[i];
                o[item.id] = item;
            }
            tmp.should.be.eql(o);
         });
     });

     describe('#NDDBIndex.update() - removing id painter idx 5', function() {
         before(function() {
             // This alters the default index test below.
             db.painter.update('5', {
                 id: undefined
             });
         });

         it('updated painter 5 should not be found in index', function() {
             var p = db.painter.get('5');
             ('boolean' === typeof p).should.be.true;
             p.should.be.false;
         });

         it('keys array of index should not contain element 5', function() {
             db.painter.keys.indexOf('5').should.eql(-1);
         });

         it('view of painters should not have painter 5',function() {
             db.pview.selexec('id', '=', 5).size().should.be.eql(0);
             db.pview.selexec('painter', '=', 'Monet').size().should.be.eql(1);
         });

         it('hash of player 5 should have length 0', function() {
             db.phash['5'].db.length.should.eql(0);
         });

     });

     describe('#NDDBIndex.getAllKeys() - item with same id', function() {
        before(function() {
            db.insert({id: 5, ah: 1});
            tmp = db.painter.getAllKeys();
        });

        it('should not count twice the same id', function() {
            tmp.should.be.eql(['1','2','3','4','5']);
         });
     });

    // Default hash.

    describe('**default index** Importing not-indexable items', function() {
        before(function(){
            db = new NDDB();
            db.init({ update: { indexes: true } });

            db.index('id');
            db.importDB(not_indexable);
        });

        it('should not create the special indexes', function() {
            db.id.should.not.exist;
            db.size().should.eql(not_indexable.length);
        });
    });

    describe('**default index** Importing indexeable items', function() {
        before(function(){
            db.importDB(indexable);
        });

        it('should create the special indexes', function() {
            db.id.should.exist;
            // One painter was changed id to undefined.
            db.id.size().should.be.eql((indexable.length - 1));
        });

        it('should increase the length of the database', function() {
            db.size().should.be.eql(nitems);
        });
    });

});
