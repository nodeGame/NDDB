var util = require('util'),
should = require('should'),
NDDB = require('./../nddb').NDDB,
J = require('JSUS').JSUS;

var items = [
    {
        painter: "Jesus",
        title: "Tea in the desert",
        year: 0
    },
    {
        painter: "Monet",
        title: "Monet",
        year: 1901,
    },
    {
        painter: "Dali",
        title: "Monet",
        year: 1902,
    },
    {
        painter: "Monet",
        title: "Dali",
        year: 1903,
    },
    {
        painter: "Dali",
        title:  ["Portrait of Paul Eluard",
                 "Das Rätsel der Begierde",
                 "Das finstere Spiel oder Unheilvolles Spiel"],
        year: 1929,
        portrait: true
    },
    {
        painter: "Dali",
        title: "Barcelonese Mannequin",
        year: 1927,
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


var items_for_concat = [

    {
        painter: "Dali",
        title: "Portrait of Paul Eluard",
        year: 1929,
        count: 0
    },
    {
        painter: "Dali",
        title: "Barcelonese Mannequin",
        year: 1927,
        count: 0
    },
    {
        painter: "Monet",
        title: "Water Lilies",
        year: 1906,
        count: 0
    },


];

var items_for_groupby = [
    {
        painter: "Dali",
        title: "Portrait of Paul Eluard",
        year: 1929,
        fake: true,
    },
    {
        painter: "Dali",
        title: "Barcelonese Mannequin",
        year: 1927,
        fake: true,
    },
    {
        painter: "Monet",
        title: "Water Lilies",
        year: 1906,
        fake: false,
    },
    {
        painter: "Monet",
        title: "Wheatstacks (End of Summer)",
        year: 1891,
    },

];

var db = new NDDB();

var split_db = null;
var split_db_2 = null;
var join_db = null;
var concat_db = null;
var group_db = null;
var group_db_2 = null;

describe('NDDB Advanced Operation', function() {
    //split*, join, concat

    before(function() {

        db.importDB(items);
        db.hash('painter', function(o) {
            if (!o) return undefined;
            return o.painter;
        });
        db.rebuildIndexes();
    });

    describe('#groupBy()', function() {
        before(function() {
            group_db = new NDDB();
            group_db.importDB(items_for_groupby);
            group_db_2 = group_db.groupBy('fake');
        });
        it('result should be two items', function() {
            group_db_2.length.should.eql(2);
        });
        it('fetch of group should equal to items', function() {
            group_db_2[0].fetch().should.eql([
                {
                    painter: "Dali",
                    title: "Portrait of Paul Eluard",
                    year: 1929,
                    fake: true,
                },
                {
                    painter: "Dali",
                    title: "Barcelonese Mannequin",
                    year: 1927,
                    fake: true,
                }
            ]);
        });
        it('fetch of group should equal to items', function() {
            group_db_2[1].first().should.eql( {
                painter: "Monet",
                title: "Water Lilies",
                year: 1906,
                fake: false,
            });
        });
    });

    describe('#split()',function() {
        before(function() {
            split_db = db.split('title', 1, true);
            split_db.rebuildIndexes();
            split_db_2 = db.split('painter', 1, true);
        });
        describe('splitting titles',function() {
            it('db should have two more entries',function() {
                split_db.size().should.eql(db.size()+2);
            });
            it('should have two more Dalis',function() {
                split_db.painter.Dali.size().should.eql(5);
            });
            it('should have only one picture per new split entry', function() {
                Object.keys(split_db.get(4)['title']).length.should.eql(1);
            });
            it('should have some specific new items', function() {
                var it_should_be_like_this = [
                    {
                        painter: "Dali",
                        title: "Monet",
                        year: 1902
                    },
                    {
                        painter: 'Dali',
                        title: { '0': 'Portrait of Paul Eluard' },
                        year: 1929,
                        portrait: true
                    },
                    { painter: 'Dali',
                      title: { '1': 'Das Rätsel der Begierde' },
                      year: 1929, portrait: true
                    },
                    { painter: 'Dali',
                      title: { '2':
                               'Das finstere Spiel oder Unheilvolles Spiel' },
                      year: 1929, portrait: true },
                    {
                        painter: 'Dali',
                        title: 'Barcelonese Mannequin',
                        year: 1927
                    }
                ];
                split_db.painter.Dali.db.should.eql(it_should_be_like_this);
            })
        });
        describe('splitting painters', function() {
            it('should have the same count of items in the db', function() {
                split_db_2.size().should.be.eql(db.size());
            });
        });

    });

    describe('#join()', function() {

        describe('parameter set (painter, painter)', function() {
            before(function() {
                join_db = null;
                join_db = db.join('painter','painter');
            });
            it('should have 9 entries if using not splited db', function() {
                join_db.size().should.be.eql(9);
            });

            it('the painter of the joined one should equal to the joining one',
               function() {
                   var trues = 0;
                   for (var key in join_db.db) {
                       if (join_db.db[key]['joined']['painter'] ==
                           join_db.db[key]['painter']) {
                           trues++;
                       }
                   }
                   trues.should.eql(9);
               });

            it('joined properties should be a copy of the original item',
               function() {

                   join_db.each(function(e) {
                       var painter = e.joined.painter;
                       var year = e.joined.year;
                       var title = e.joined.title;

                       var original = db.select('painter', '=', painter)
                           .and('year', '=', year)
                           .and('title', '=', title)
                       //.execute()
                           .first();

                       e.joined.should.be.eql(original);
                   });

               });

            // Value 7 is the addition of the following calculation
            // x!/(2!*(x-2)!) for each painter
            it('should have 16 entries if using splited db', function() {
                var join_db_2 = split_db.join('painter','painter');
                join_db_2.size().should.be.eql(16);
            });

        });

        describe('parameter set (painter, painter, xxx)', function() {
            before(function() {
                join_db = null;
                join_db = db.join('painter','painter', 'xxx');
            });
            it('should have 9 entries if using not splited db', function() {
                join_db.size().should.be.eql(9);
            });

            it('the painter of the joined one should equal to the joining one',
               function() {
                   var trues = 0;
                   for (var key in join_db.db) {
                       if (join_db.db[key]['xxx']['painter'] ==
                           join_db.db[key]['painter']) {
                           trues++;
                       }
                   }
                   trues.should.eql(9);
               });

            it('joined properties should be a copy of the original item',
               function() {
                join_db.each(function(e) {
                    var painter = e.xxx.painter;
                    var year = e.xxx.year;
                    var title = e.xxx.title;

                    var original = db.select('painter', '=', painter)
                        .and('year', '=', year)
                        .and('title', '=', title)
                    //.execute()
                        .first();

                    e.xxx.should.be.eql(original);
                });

            });
        });


        describe('parameter set ' +
                 '(painter,painter,joined,[painter,title,year, portrait])',
                 function() {

                     before(function() {
                         join_db = null;
                         join_db = db.join(
                             'painter','painter','joined',
                             ['painter','title','year','portrait']);
                     });
                     it('should have 9 entries if using not splited db',
                        function() {
                         join_db.size().should.be.eql(9);
                     });

                     it('the joined painter should equal to the joining one',
                        function() {

                            var trues = 0;
                         for (var key in join_db.db) {
                             if (join_db.db[key]['joined']['painter'] ==
                                 join_db.db[key]['painter']) {
                                 trues++;
                             }
                         }
                         trues.should.eql(9);
                     });

                     it('joined properties should be a copy of the original',
                        function() {
                         join_db.each(function(e) {
                             var painter = e.joined.painter;
                             var year = e.joined.year;
                             var title = e.joined.title;

                             var original = db.select('painter', '=', painter)
                                 .and('year', '=', year)
                                 .and('title', '=', title)
                             //.execute()
                                 .first();

                             e.joined.should.be.eql(original);
                         });

                     });

                     // Value 7 is the addition of the following calculation
                     // x!/(2!*(x-2)!) for each painter
                     it('should have 16 entries if using splited db',
                        function() {
                         var join_db_2 = split_db.join(
                             'painter','painter','sibling',
                             ['painter','title','year', 'portrait']);
                         join_db_2.size().should.be.eql(16);
                     });

                 });


        describe('parameter set (painter,title,undefined,[title,year])',
                 function() {
            before(function() {
                join_db = null;
                join_db = db.join('painter','title',undefined,['title','year']);
                join_db.rebuildIndexes();
            });
            it('should have 2 entries if using not split db', function() {
                join_db.size().should.be.eql(2);
            });
            it('should have a new key in each item named joined', function() {
                join_db.select('joined').execute().db.length.should.eql(2);
            });
            it('should be like this', function() {
                var it_should_be_like_this = [
                    { painter: 'Monet', title: 'Monet', year: 1901,
                      joined: { title: 'Monet', year: 1902 } },
                    { painter: 'Dali', title: 'Monet', year: 1902,
                      joined: { title: 'Dali', year: 1903 } } ];

                join_db.db.should.eql(it_should_be_like_this);
            });
            // Value 7 is the addition of the following calculation
            // x!/(2!*(x-2)!) for each painter
            it('should have 2 entries if using splited db', function() {
                var join_db_2 = split_db.join(
                    'painter', 'title', undefined, ['title','year']);
                join_db_2.size().should.be.eql(2);
            });

        });
        describe('parameter set (painter,painter,undefined,year)', function() {
            before(function() {
                join_db = null;
                join_db = db.join('painter','painter',undefined,'year');
                join_db.rebuildIndexes();
            });
            it('should have 9 entries if using not splited db', function() {
                join_db.size().should.be.eql(9);
            });
            it('should have a new key in each item named joined', function() {
                join_db.select('joined').execute().db.length.should.eql(9);
            });
            it('should have 6 Monet', function() {
                join_db.select('painter','=','Monet')
                    .execute().db.length.should.eql(6);
            });
            it('should have 3 Dali', function() {
                join_db.select('painter','=','Dali')
                    .execute().db.length.should.eql(3);
            });
            // Value 7 is the addition of the following calculation
            // x!/(2!*(x-2)!) for each painter
            it('should have 16 entries if using splited db', function() {
                var join_db_2 = split_db.join(
                    'painter','painter',undefined,'year');
                join_db_2.size().should.be.eql(16);
            });

        });
        describe("invalid parameter set ('painter',undefined,undefined,'year')",
                 function() {
            before(function() {
                join_db = null;
                join_db = db.join('painter',undefined,undefined,'year');
                join_db.rebuildIndexes();
            });
            it('should have 0 entries if using not splited db', function() {
                join_db.db.length.should.be.eql(0);
            });
        });

    });


    describe('#concat()', function() {
        describe('first parameter set', function() {
            before(function() {
                db = new NDDB();
                db.importDB(items_for_concat);
                concat_db = db.concat('painter','title','friend',
                                      ['painter','title','year']);
            });
            it('should have 3 entries if using not split db', function() {
                concat_db.db.length.should.be.eql(3);
            });

            it('should have every picture twice', function() {
                var stat_ar = new Array();
                var mytype;
                for (var key in concat_db.db) {
                    mytype = typeof stat_ar[concat_db.db[key].friend.title];
                    if (mytype == 'undefined') {
                        stat_ar[concat_db.db[key]['friend']['title']] = 1;
                    }
                    else {
                        stat_ar[concat_db.db[key]['friend']['title']]++;
                    }
                    mytype = typeof stat_ar[concat_db.db[key].title];
                    if (mytype == 'undefined') {
                        stat_ar[concat_db.db[key]['title']] = 1;
                    }
                    else {
                        stat_ar[concat_db.db[key]['title']]++;
                    }
                }
                for (var key in stat_ar) {
                    stat_ar[key].should.be.eql(2);
                }
            });
        });
        describe('second parameter set', function() {
            before(function() {
                db = new NDDB();
                db.importDB(items_for_concat);
                concat_db = db.concat('painter','painter',undefined,['year']);
                concat_db.rebuildIndexes();
            });
            it('should have 3 entries if using not splited db', function() {
                concat_db.db.length.should.be.eql(3);
            });
            it('the sum of year should be 11524', function() {
                var first_sum = concat_db.sum('year');
                var joined_sum = concat_db.sum('joined.year');
                var total_sum = first_sum + joined_sum;
                total_sum.should.be.eql(11524);
            });
        });
    });

});
