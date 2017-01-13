var util = require('util'),
should = require('should'),
NDDB = require('./../nddb').NDDB,
J = require('JSUS').JSUS;

var db = new NDDB();

var items = [
    {
        painter: "Jesus",
        title: "Tea in the desert",
        year: 0,
        comment: "Pretty cool!"
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

var p1 = 10, p2 = 100, p3 = 1000;
var copy = null, copy2 = null;
var counter = 0;

describe('NDDB Events', function() {

    describe('#on(\'insert\') ',function() {
        before(function() {
            copy = [];
            db.on('insert', function(o) {
                copy.push(o);
            });
            db.on('insert', function(o) {
                db.tag(o.year, o);
            });
            db.importDB(items);
        });

        it('should copy all the inserted elements', function() {
            db.db.should.eql(copy);
        });

        it('should add a tag for each inserted element', function() {
            J.size(db.tags).should.eql(items.length);
            db.tags['1863'].should.eql({
                painter: "Manet",
                title: "Olympia",
                year: 1863
            });
        });

    });

    describe('#on(\'update\') ',function() {
        before(function() {
            copy2 = [];
            db = new NDDB();

            db.on('update', function(o, update){
                copy2.push(o);
            });
            db.on('update', function(o, update){
                db.tag(o.year, o);
            });
            db.on('update', function(o, update){
                o.oldComment = o.comment;
            });

            db.importDB(items);
            db.selexec('painter', '=', 'Jesus')
                .update({comment: "Was he a painter !?"});

        });
        it('copy should have length 1', function() {
            copy2.length.should.be.eql(1);
        });
        it('should add a tag for each updated element', function() {
            J.size(db.tags).should.eql(1);
            db.tags['0'].should.eql({
                painter: 'Jesus',
                title: 'Tea in the desert',
                year: 0,
                comment: 'Was he a painter !?',
                oldComment: 'Pretty cool!',
            });
        });

    });

    describe('#on(\'remove\') ',function() {
        before(function() {
            copy = [];
            db.clear(true);
            db.on('remove', function(o){
                copy = o;
            });
            db.importDB(items);
            db.removeAllEntries();
        });

        it('should copy all the inserted elements', function() {
            items.should.eql(copy);
        });

    });

    describe('#emit(\'insert\') + 1 param',function() {
        before(function() {
            copy = [];
            db.off('insert');
            db.on('insert', function(o, p1){
                o.p1 = p1;
                copy.push(o);
            });
            var i, len;
            i = -1, len = items.length;
            for ( ; ++i < len ; ) {
                db.emit('insert', items[i], p1);
            }
        });

        it('should preduce a copy of equal length', function() {
            items.length.should.eql(copy.length);
        });

        it('should add a new property p1 to every element', function() {
            var i, len;
            i = -1, len = copy.length;
            for ( ; ++i < len ; ) {
                copy[i].p1.should.be.eql(p1);
            }
        });

    });

    describe('#emit(\'insert\') + 2 param', function() {
        before(function() {
            copy = [];
            db.off('insert');
            db.on('insert', function(o, p1, p2) {
                o.pp1 = p1;
                o.pp2 = p2
                copy.push(o);
            });
            var i, len;
            i = -1, len = items.length;
            for ( ; ++i < len ; ) {
                db.emit('insert', items[i], p1, p2);
            }
        });

        it('should preduce a copy of equal length', function() {
            items.length.should.eql(copy.length);
        });

        it('should add new properties p1, p2 to every element', function() {
            var i, len;
            i = -1, len = copy.length;
            for ( ; ++i < len ; ) {
                copy[i].pp1.should.be.eql(p1);
                copy[i].pp2.should.be.eql(p2);
            }
        });

    });

    describe('#on(\'insert\') return=FALSE',function() {
        before(function() {
            copy = [];
            db.on('insert', function(o) {
                return false;
            });
            db.on('insert', function(o) {
                db.tag(o.year, o);
                counter++;
            });
            db.importDB(items);
        });

        it('should create a db with size 0', function() {
            db.size().should.eql(0);
        });

        it('should create a db with no tags', function() {
            J.size(db.tags).should.eql(0);
        });

        it('should not execute subsequent event listeners', function() {
            counter.should.eql(0);
        });
    });

    describe('#emit(\'insert\') + 2 param return = FALSE', function() {
        before(function() {
            copy = [];
            db.off('insert');
            db.on('insert', function(o, p1, p2) {
                return false;
            });
            db.on('insert', function(o, p1, p2) {
                counter++;
            });
            var i, len;
            i = -1, len = items.length;
            for ( ; ++i < len ; ) {
                db.emit('insert', items[i], p1, p2);
            }
        });

        it('should create a db with size 0', function() {
            db.size().should.eql(0);
        });

        it('should not execute subsequent event listeners', function() {
            counter.should.eql(0);
        });

    });
});

describe('NDDB Events with auto-update indexes and hashes', function() {

    describe('#on(\'insert\') ', function() {
        before(function() {
            db = new NDDB({update: { indexes: true }});
            copy = [];
            db.hash('painter', function(o) {
                return o.painter;
            });
            db.on('insert', function(o) {
                copy.push(o);
            });
            db.insert(items[0]);
        });

        it('should copy all the inserted elements', function() {
            copy.length.should.eql(1);
        });


    });
});
