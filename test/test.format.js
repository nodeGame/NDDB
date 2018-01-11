// Requiring and exporting JSUS
var JSUS = require('JSUS').JSUS;
module.exports.JSUS = JSUS;

var util = require('util'),
fs = require('fs'),
path = require('path'),
should = require('should'),
NDDB = require('./../index').NDDB;

var db = new NDDB();

var filename = __dirname + '/data.csv';

function save() { console.log('save'); }
function saveSync() { console.log('saveSync'); }
function load() { console.log('load'); }
function loadSync() { console.log('loadSync'); }

describe('Format operations', function() {

    it('should have json as default format', function() {
        db.getDefaultFormat().should.eql('json');
    });
    it('should set a default format', function() {
        db.setDefaultFormat('csv');
        db.getDefaultFormat().should.eql('csv');
    });
    it('should remove default format', function() {
        db.setDefaultFormat(null);
        (null === db.getDefaultFormat()).should.eql(true);
    });
    it('should add a new format', function() {
        db.addFormat('new', {
            save: save,
            load: load,
            loadSync: loadSync,
            saveSync: saveSync
        });
        db.getFormat('new').should.exists;
    });
    it('should get existing formats', function() {
        var f = db.getFormat('new');
        f.save.should.eql(save);
        f.saveSync.should.eql(saveSync);
        f.loadSync.should.eql(loadSync);
        f.load.should.eql(load);
    });
    it('should get existing format functions', function() {
        var f;
        f = db.getFormat('new', 'save');
        f.should.eql(save);
        f = db.getFormat('new', 'saveSync');
        f.should.eql(saveSync)
        f = db.getFormat('new', 'loadSync');
        f.should.eql(loadSync)
        f = db.getFormat('new', 'load');
        f.should.eql(load)
    });
    it('should return null when format not found', function() {
        var f;
        f = db.getFormat('new2');
        (null === f).should.be.true;
        f = db.getFormat('new2', 'save');
        (null === f).should.be.true;
    });

    describe('should fail', function() {

        it('if parameters are wrong (setDefaultFormat)', function() {
            (function() {
                db.setDefaultFormat();
            }).should.throw();
            (function() {
                db.setDefaultFormat('a');
            }).should.throw();
            (function() {
                db.setDefaultFormat({});
            }).should.throw();
        });
        it('if parameters are wrong (addFormat)', function() {
            (function() {
                db.addFormat({});
            }).should.throw();
            (function() {
                db.addFormat('new');
            }).should.throw(); (function() {
                db.addFormat('new', {});
            }).should.throw();
            (function() {
                db.addFormat('new', {
                    load: {},
                    save: {}
                });
            }).should.throw();
            (function() {
                db.addFormat('new', {
                    load: function() {},
                    saveSync: function() {}
                });
            }).should.throw();
            (function() {
                db.addFormat('new', {
                    load: function() {},
                    save: function() {},
                    loadSync: null,
                    saveSync: function() {}
                });
            }).should.throw();
        });
    });

});
