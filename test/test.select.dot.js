var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB,
    JSUS = require('JSUS').JSUS;

var db = new NDDB();

var select = null;

var items = [
    {
        "p.ainter": "J.esus",
        title: "Tea in the desert",
        year: 0,
    },
    {
        "p.ainter": "D.ali",
        title: [
            "Portrait of Paul Eluard",
            "Das Rätsel der Begierde",
            "Das finstere Spiel oder Unheilvolles Spiel"
        ],
        year: 1929,
        portrait: true
    },
    {
        "p.ainter": "D.ali",
        title: "Barcelonese Mannequin",
        year: 1927
    },
    {
        "p.ainter": "M.onet",
        title: {en: "Water Lilies",de:"Wasser Lilies"},
        year: 1906
    },
    {
        "p.ainter": "M.onet",
        title: "Wheatstacks (End of Summer)",
        year: 1891
    },
    {
        "p.ainter": "M.anet",
        title: "Olympia",
        year: 1863
    },

];


describe('NDDB Selecting with DOT', function() {
    describe('#select simple',function() {
        it('should select all paintings from D.ali', function() {
            db.select('p.ainter', '=', 'D.ali')
              .execute()
              .db.length.should.equal(2);
        });

        it('should select all portraits', function() {
            db.select('portrait')
              .execute()
              .db.length.should.equal(1);
        });

        it('should select all painting of the beginning of the XX centuries',
           function() {

           db.select('year', '><', [1900, 1910])
             .execute()
             .db.length.should.equal(1);
        });

        it('should select all painting *not* between 1900 and 1999',
           function() {

           db.select('year', '<>', [1900, 1999])
                .execute()
                .db.length.should.equal(3);
        });

        it('should select all paintings made by D.ali and M.onet', function() {
            db.select('p.ainter', 'in', ['D.ali','M.onet'])
                .execute()
                .db.length.should.equal(4);
        });

        it('passing from parameter to >< should work like >', function() {
           db.select('year', '><', [1900])
             .execute().db.length.should.equal(3);
        });
        it('passing from parameter to the >< should not accept numbers',
           function() {

           db.select('p.ainter', '><', ['M.onet'])
             .execute()
             .db.length.should.equal(0);
        });

        it('selecting one of the posibles titles', function() {
           db.select('title', '=', 'Das finstere Spiel oder Unheilvolles Spiel')
                 .execute()
                 .db.length.should.equal(0);
        });
    });


    describe('#select up to three conditions',function() {

        it('should select all paintings from D.ali that are from before 1928',
           function() {

           db.select('p.ainter', '=', 'D.ali')
             .and('year', '<', 1928)
             .execute()
             .db.length.should.equal(1);
        });

        it('should select all painting not made by D.ali and Jesus',
           function() {

            var res = db.select('p.ainter', '!in', ['D.ali'])
                .and('p.ainter', '!in', ['J.esus'])
                .execute();
            res.db.length.should.equal(3);
        });

        it('selecting a translation of a title', function() {
           db.select('title.de', '==', 'Wasser Lilies')
             .execute()
             .db.length.should.equal(1);
           db.select('title.de', '==', ['Wasser Lilies'])
                 .and('p.ainter','=','M.anet')
                 .execute()
                 .db.length.should.be.eql(0);
        });

        it('should select all paintings from D.ali OR M.onet', function() {
            db.select('p.ainter', '=', 'D.ali')
              .or('p.ainter', '=', 'M.onet')
              .execute()
              .db.length.should.equal(4);
         });

        it('should select all paintings from D.ali OR M.onet that are ' +
           'from before 1928', function() {

            db.select('p.ainter', '=', 'D.ali')
              .or('p.ainter', '=', 'M.onet')
              .and('year', '<', 1928)
              .execute()
              .db.length.should.equal(3);
         });

    });


    describe('#select more than 3 conditions',function() {

        it('should select all paintings from D.ali OR M.onet that are ' +
           'from before 1928 OR are portrait', function() {

            db.select('p.ainter', '=', 'D.ali')
              .or('p.ainter', '=', 'M.onet')
              .and('year', '<', 1928)
              .or('portrait')
              .execute()
              .db.length.should.equal(4);
         });

        it('should select all paintings from D.ali OR M.onet OR J.esus ' +
           'that are from before 1928 OR are portrait', function() {

            db.select('p.ainter', '=', 'D.ali')
              .or('p.ainter', '=', 'J.esus')
              .or('p.ainter', '=', 'M.onet')
              .and('year', '<', 1928)
              .or('portrait')
              .execute()
              .db.length.should.equal(5);
         });

        it('should select all paintings from D.ali AND J.esus (at the ' +
           'same time) OR M.onet that are from before 1928 OR are portrait',
           function() {

            db.select('p.ainter', '=', 'D.ali')
              .and('p.ainter', '=', 'J.esus')
              .or('p.ainter', '=', 'M.onet')
              .and('year', '<', 1928)
              .or('portrait')
              .execute()
              .db.length.should.equal(3);
            // 2 M.onet that are before 1928 and 1 portrait
         });

        it('should select all paintings from D.ali AND M.onet ' +
           '(at the same time) that are from before 1928 OR are portrait',
           function() {

            db.select('p.ainter', '=', 'D.ali')
              .and('p.ainter', '=', 'M.onet')
              .and('year', '<', 1928)
              .or('portrait')
              .execute()
              .db.length.should.equal(1);
         });

        it('should select all paintings from D.ali OR M.onet OR ' +
           'that are a portrait OR that are before 1928', function() {

            db.select('p.ainter', '=', 'D.ali')
              .or('p.ainter', '=', 'M.onet')
              .or('portrait')
              .or('year', '<', 1928)
              .execute()
              .db.length.should.equal(6);
         });

        it('should select all paintings from D.ali OR M.onet OR ' +
           'that are before 1928 OR that are a portrait ', function() {

            db.select('p.ainter', '=', 'D.ali')
              .or('p.ainter', '=', 'M.onet')
              .or('year', '<', 1928)
              .or('portrait')
              .execute()
              .db.length.should.equal(6);
         });

    });

    describe('#filter',function() {
        describe('',function() {
            before(function() {
                select = db.filter(function(e) {
                   if (JSUS.inArray("Das Rätsel der Begierde", e.title)) {
                       return true;
                   }
                });
            });
            it('select a title in a array', function() {
               select.db.should.eql([items[1]]);
            });
        });
        describe('',function() {
            before(function() {
                select = db.filter(function(e) {
                    return (typeof e.title == 'object');
                });
            });
            it('select all Objects that are titles', function() {
               select.db.should.eql([items[1],items[3]]);
            });
        });
    });


    describe('#select existence (E) with DOT', function() {
        it('should locate 1 M.anet', function() {
            var a = db.select('p.ainter').execute().db.length.should.eql(6);
        });
    });

    before(function() {
        db.clear(true);
        db = new NDDB();
        db.importDB(items);
    });
});


describe('#distinct() with DOT', function() {
        before(function() {
                db.clear(true);
                db.importDB(items);
                db.importDB(items);
        })
        it('should eliminates all duplicated entries', function() {
                db.distinct().fetch().should.be.eql(items);
        });
});
