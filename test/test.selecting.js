var util = require('util'),
should = require('should'),
NDDB = require('./../nddb').NDDB,
JSUS = require('JSUS').JSUS;

var db = new NDDB();

var select = null;

var items = [
    {
        painter: "Jesus",
        title: "Tea in the desert",
        year: 0,
    },
    {
        painter: "Dali",
        title: [
            "Portrait of Paul Eluard",
            "Das Rätsel der Begierde",
            "Das finstere Spiel oder Unheilvolles Spiel"
        ],
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
        title: { en: "Water Lilies", de: "Wasser Lilies" },
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

var items_with_other_types = [
    {
        painter: "Manet",
        title: "Copy of Olympia",
        year: "1863"
    },
    {
        painter: "Monet",
        title: "Copy of Wheatstacks (End of Summer)",
        year: "1891"
    },
];



describe('NDDB Selecting', function() {

    before(function() {
        db.clear(true);
        db = new NDDB();
        db.importDB(items);
    });

    describe('#select simple',function() {
        it('should select all paintings from Dali', function() {
            db.select('painter', '=', 'Dali')
                .execute()
                .db.length.should.equal(2);
        });

        it('should select all portraits', function() {
            db.select('portrait')
                .execute()
                .db.length.should.equal(1);
        });

        it('should select all portraits with painter != from Manet',
           function() {

            db.select('painter', '!=', 'Manet')
                .execute()
                .db.length.should.equal(5);
        })

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

        it('should select all paintings made by Dali and Monet', function() {
            db.select('painter', 'in', ['Dali','Monet'])
                .execute()
                .db.length.should.equal(4);
        });

        it('should select all paintings *not* made by Dali and Monet',
           function() {

            db.select('painter', '!in', ['Dali','Monet'])
                .execute()
                .db.length.should.equal(2);
        });

        it('passing from parameter to >< should work like >', function() {
            db.select('year', '><', [1900])
                .execute().db.length.should.equal(3);
        });
        it('passing from parameter to the >< should not accept numbers',
           function() {

            db.select('painter', '><', ['Monet'])
                .execute()
                .db.length.should.equal(0);
        });

        it('selecting one of the posibles titles', function() {
            db.select('title', '=',
                      'Das finstere Spiel oder Unheilvolles Spiel')
                .execute()
                .db.length.should.equal(0);
        });

        it('selecting one an not-existing field should not return results',
           function() {

            db.select('year2', '>', 1)
                .execute()
                .db.length.should.equal(0);
        });
    });


    describe('#select up to three conditions',function() {

        it('should select all paintings from Dali that are from before 1928',
           function() {

            db.select('painter', '=', 'Dali')
                .and('year', '<', 1928)
                .execute()
                .db.length.should.equal(1);
        });

        it('should select all painting not made by Dali and Jesus',
           function() {

            var res = db.select('painter', '!in', ['Dali'])
                .and('painter', '!in', ['Jesus'])
                .execute();
            res.db.length.should.equal(3);
        });

        it('selecting a translation of a title', function() {
            db.select('title.de', '==', 'Wasser Lilies')
                .execute()
                .db.length.should.equal(1);
            db.select('title.de', '==', ['Wasser Lilies'])
                .and('painter','=','Manet')
                .execute()
                .db.length.should.be.eql(0);
        });

        it('should select all paintings from Dali OR Monet', function() {
            db.select('painter', '=', 'Dali')
                .or('painter', '=', 'Monet')
                .execute()
                .db.length.should.equal(4);
        });

        it('should select all paintings from Dali OR Monet ' +
           'that are from before 1928', function() {

            db.select('painter', '=', 'Dali')
                .or('painter', '=', 'Monet')
                .and('year', '<', 1928)
                .execute()
                .db.length.should.equal(3);
        });

    });

    describe('#select more than 3 conditions',function() {

        it('should select all paintings from Dali OR Monet that are from ' +
           'before 1928 OR are portrait', function() {

            db.select('painter', '=', 'Dali')
                .or('painter', '=', 'Monet')
                .and('year', '<', 1928)
                .or('portrait')
                .execute()
                .db.length.should.equal(4);
        });

        it('should select all paintings from Dali OR Monet OR Jesus that ' +
           'are from before 1928 OR are portrait', function() {

            db.select('painter', '=', 'Dali')
                .or('painter', '=', 'Jesus')
                .or('painter', '=', 'Monet')
                .and('year', '<', 1928)
                .or('portrait')
                .execute()
                .db.length.should.equal(5);
        });

        it('should select all paintings from Dali AND Jesus (at the same ' +
           'time) OR Monet that are from before 1928 OR are portrait',
           function() {

            db.select('painter', '=', 'Dali')
                .and('painter', '=', 'Jesus')
                .or('painter', '=', 'Monet')
                .and('year', '<', 1928)
                .or('portrait')
                .execute()
                .db.length.should.equal(3);
               // 2 Monet that are before 1928 and 1 portrait
        });

        it('should select all paintings from Dali AND Monet (at the ' +
           'same time) that are from before 1928 OR are portrait', function() {
            db.select('painter', '=', 'Dali')
                .and('painter', '=', 'Monet')
                .and('year', '<', 1928)
                .or('portrait')
                .execute()
                .db.length.should.equal(1);
        });

        it('should select all paintings from Dali OR Monet OR that are ' +
           'a portrait OR that are before 1928', function() {
            db.select('painter', '=', 'Dali')
                .or('painter', '=', 'Monet')
                .or('portrait')
                .or('year', '<', 1928)
                .execute()
                .db.length.should.equal(6);
        });

        it('should select all paintings from Dali OR Monet OR that are ' +
           'before 1928 OR that are a portrait ', function() {

            db.select('painter', '=', 'Dali')
                .or('painter', '=', 'Monet')
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


    describe('#select items with different types', function() {
        before(function() {
            db.importDB(items_with_other_types);
        });
        it('should select all paintings with year as string equal to 1863',
           function() {

            db.select('year', '=', '1863')
                .fetch().length.should.equal(1);
        });
        it('should select nothing when a wrong string is given', function() {
            db.select('year', '=', '_')
                .fetch().length.should.equal(0);
        });

    });
});


describe('#distinct()', function() {
    before(function() {
        db.clear(true);
        db.importDB(items);
        db.importDB(items);
    })
    it('should eliminates all duplicated entries', function() {
        db.distinct().fetch().should.be.eql(items);
    });
});
