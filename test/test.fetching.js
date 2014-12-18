var util = require('util'),
should = require('should'),
J = require('JSUS').JSUS,
NDDB = require('./../nddb').NDDB;

var db = new NDDB();

var hashable = [
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

var not_hashable = [
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



var all_items = hashable.concat(not_hashable);

var hashPainter = function(o) {
    if (!o) return undefined;
    return o.painter;
}

// Array for fetchValues

var array_fetch_values = [];
for (i=0; i < all_items.length; i++) {
    J.augment(array_fetch_values, all_items[i], J.keys(all_items[i]));
} 

// Array for .fetchArray()
var array_of_all_items = new Array();
for(var entry in Object.keys(all_items)) {
    var line = new Array();
    for(var key in Object.keys(all_items[entry])) {
        keys = Object.keys(all_items[entry]);
        line.push(all_items[entry][keys[key]]);
    }
    array_of_all_items.push(line);
}

//Array for .fetchKeyArray()
var key_array_of_all_items = new Array();
for(var entry in Object.keys(all_items)) {
    var line = new Array();
    for(var key in Object.keys(all_items[entry])) {
        keys = Object.keys(all_items[entry]);
        line.push(keys[key]);
        //        if((typeof all_items[entry][keys[key]]) == 'object') {
        //            keys2 = Object.keys(all_items[entry][keys[key]]);
        //            for(var key2 in Object.keys(all_items[entry][keys[key]])) {
        //                keys2 = Object.keys(all_items[entry][keys[key]]);
        //                if('undefined' === (typeof all_items[entry][keys[key]][key2])) {
        //                    line.push(keys2[key2]);
        //                    line.push(all_items[entry][keys[key]][keys2[key2]]);
        //                }else{
        //                    line.push(keys2[key2]);
        //                    line.push(all_items[entry][keys[key]][key2]);
        //                }
        //            }
        //        } else {
        line.push(all_items[entry][keys[key]]);
        //}
    }
    key_array_of_all_items.push(line);
}




describe('NDDB Fetching', function() {
    //fetch, fetchArray, fetchKeyArray
    
    before(function() {
        db.importDB(hashable);
        db.importDB(not_hashable);
    });

    describe('#fetch()', function() {
        describe('the complete database',function() {
            it('should be like the original items array',function() {
                db.fetch().should.eql(all_items);
            });
        });
    });

    describe('#fetchValues()', function() {
        describe('the complete database',function() {
            it('should be like the original items array',function() {
                // For some weird reason in new versions of should.js
                // I need to specify the object here.
                var bb = {
                    car: [ 'Ferrari', 'Fiat', 'BMW' ],
                    model: [ 'F10', '500', 'Z4' ],
                    painter: [ 'Jesus', 'Dali', 'Dali', 'Monet', 'Monet', 'Manet' ],
                    portrait: [ true ],
                    speed: [ 350, 100, 250 ],
                    title: [
                        'Tea in the desert',
                        [
                            'Portrait of Paul Eluard',
                            'Das Rätsel der Begierde',
                            'Das finstere Spiel oder Unheilvolles Spiel'
                        ],
                        'Barcelonese Mannequin',
                        { de: 'Wasser Lilies', en: 'Water Lilies' },
                        'Wheatstacks (End of Summer)',
                        'Olympia'
                    ],
                    year: [ 0, 1929, 1927, 1906, 1891, 1863 ]
                }
                db.fetchValues().should.eql(bb);
            });
        });
        describe('passing a key as argument',function() {
            it('key \'painter\'',function() {
                var should_be_like_this = [ 'Jesus', 'Dali', 'Dali', 'Monet', 'Monet', 'Manet' ];
                db.fetchValues('painter').should.eql({painter: should_be_like_this});
            });
            it('key \'title\' (object in key)',function() {
                var should_be_like_this = [ 'Tea in the desert' ,['Portrait of Paul Eluard','Das Rätsel der Begierde','Das finstere Spiel oder Unheilvolles Spiel' ], 'Barcelonese Mannequin' ,{en: "Water Lilies", de: "Wasser Lilies"}, 'Wheatstacks (End of Summer)' , 'Olympia' ];
                db.fetchValues('title').should.eql({title: should_be_like_this});
            });
        });
        
        describe('passing two keys: [\'painter\',\'year\'] as argument',function() {
            it('should be like this ',function() {
                var should_be_like_this = {
                    painter: ['Jesus', 'Dali', 'Dali', 'Monet', 'Monet', 'Manet'],
                    year: [0, 1929, 1927, 1906, 1891, 1863]
                };
                
                db.fetchValues(['painter','year']).should.eql(should_be_like_this);
            });
        });
    });
    
    describe('#fetchArray()',function() {
	describe('the complete database',function() {
	    it('should be like the Array of all the items',function() {
	        db.fetchArray().should.eql(array_of_all_items);
	    });
	});
	describe('passing a key as argument',function() {
	    it('should be like that when passing key title (if Object in key)',function() {
	        var should_be_like_this = [ [ 'Tea in the desert' ],[ 'Portrait of Paul Eluard','Das Rätsel der Begierde','Das finstere Spiel oder Unheilvolles Spiel' ],[ 'Barcelonese Mannequin' ],[ 'Water Lilies', 'Wasser Lilies' ],[ 'Wheatstacks (End of Summer)' ],[ 'Olympia' ] ];
	        db.fetchArray('title').should.eql(should_be_like_this);
	    });
	});
	describe('passing two keys: [\'painter\',\'year\'] as argument',function() {
	    it('should be like this ',function() {
		var should_be_like_this = [ ['Jesus', 0], ['Dali', 1929], ['Dali', 1927], ['Monet', 1906], ['Monet', 1891], ['Manet', 1863] ];
		db.fetchArray(['painter','year']).should.eql(should_be_like_this);
	    });
	}); 
	
    });

    describe('#fetchKeyArray()',function() {
	describe('the complete database',function() {
	    it('should be like the Array of all the items',function() {
		db.fetchKeyArray().should.eql(key_array_of_all_items);
	    });
	});
	describe('passing a key as argument',function() {
	    it('should be like that when passing key title (if Object in key)',function() {
		var should_be_like_this = [ [ 'title', 'Tea in the desert' ],[ 'title','0','Portrait of Paul Eluard','1','Das Rätsel der Begierde','2','Das finstere Spiel oder Unheilvolles Spiel' ],[ 'title', 'Barcelonese Mannequin' ],[ 'title', 'en', 'Water Lilies', 'de', 'Wasser Lilies' ],[ 'title', 'Wheatstacks (End of Summer)' ],[ 'title', 'Olympia' ] ];
		db.fetchKeyArray('title').should.eql(should_be_like_this);
	    });
	});
	describe('passing a invalid key as argument',function() {
	    it('should be like []',function() {
		var should_be_like_this = [];
		db.fetchKeyArray('1h2eh7').should.eql(should_be_like_this);
	    });
	});    
	describe('passing two keys: [\'painter\',\'year\'] as argument',function() {
	    it('should be like this ',function() {
		var should_be_like_this = [ [ 'painter', 'Jesus', 'year', 0 ], [ 'painter', 'Dali', 'year', 1929 ], [ 'painter', 'Dali', 'year', 1927 ], 
		                            [ 'painter', 'Monet', 'year', 1906 ], [ 'painter', 'Monet', 'year', 1891 ], [ 'painter', 'Manet', 'year', 1863 ]
		                          ];
		db.fetchKeyArray(['painter','year']).should.eql(should_be_like_this);
	    });
	});
    });

    describe('#fetchSubObj()',function() {
	describe('without parameters',function() {
	    it('should return an empty array',function() {
		db.fetchSubObj().should.eql([]);
	    });
	});
        describe('passing a key as argument',function() {
            it('should be like that when passing key title (if Object in key)',function() {
                var should_be_like_this = [ {title: 'Tea in the desert'}, {title: [ 'Portrait of Paul Eluard', 'Das Rätsel der Begierde', 'Das finstere Spiel oder Unheilvolles Spiel'] }, {title: 'Barcelonese Mannequin'}, {title: {en: 'Water Lilies', de: 'Wasser Lilies'} }, {title: 'Wheatstacks (End of Summer)'}, {title: 'Olympia' } ];
                db.fetchSubObj('title').should.eql(should_be_like_this);
            });
        });
        describe('passing a invalid key as argument',function() {
            it('should be like []',function() {
                db.fetchSubObj('1h2eh7').should.eql([]);
            });
        });
    });

});

