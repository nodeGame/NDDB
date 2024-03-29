/**
 * # NDDB: N-Dimensional Database
 * Copyright(c) 2023 Stefano Balietti
 * MIT Licensed
 */
const NDDB = require('./nddb.js');
NDDB.lineBreak = require('os').EOL;
module.exports = NDDB;

// Lib
require('./lib/static.js');
require('./lib/fs.js');


// Cycle/Decycle
require('./external/cycle.js');
