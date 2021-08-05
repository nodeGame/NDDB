const os = require('os');
const path = require('path');

module.exports = {

    /**
     * ### getExtension
     *
     * Extracts the extension from a file name
     *
     * NOTE: duplicaetd from nddb.js
     *
     * @param {string} file The filename
     *
     * @return {string} The extension or NULL if not found
     */
    getExtension: file => {
        let format = file.lastIndexOf('.');
        return format < 0 ? null : file.substr(format+1);
    },

    /**
     * ### addWD
     *
     * Adds the working directory to relative paths
     *
     * Note: this function should stay in nddb.js, but there we do
     * not have have the path module (when in browser).
     *
     * @param {NDDB} The current instance of NDDB
     * @param {string} file The file to check
     *
     * @return {string} file The adjusted file path
     *
     * @api private
     */
    addWD: (that, file) => {
        // Add working directory (if previously set, and if not absolute path).
        if (that.__wd && !path.isAbsolute(file)) {
            file = path.join(that.__wd, file);
        }
        return file;
    },


    /**
     * ### Adds elements from an array into another array if not already there
     *
     * Works only with primitive types (e.g., names in header).
     *
     * @param {array} ar1 will contain missing elements from ar2
     * @param {array} ar2 will add elements to ar1
     *
     * @api private
     */
    addIfNotThere: (ar1, ar2) => {
        let len = ar2.length;
        if (len < 4) {
            if (len > 0 && !ar1.find(i => i === ar2[0])) ar1.push(ar2[0]);
            if (len > 1 && !ar1.find(i => i === ar2[1])) ar1.push(ar2[1]);
            if (len > 2 && !ar1.find(i => i === ar2[2])) ar1.push(ar2[2]);
        }
        else {
            ar2.forEach((item) => {
                if (!ar1.find(i => i === item)) ar1.push(item);
            });
        }
    },

    /**
     * ### findLineBreak
     *
     * Try to find the lineBreak characters in a text
     *
     * @param {string} text The text to search for
     *
     * @return {string} lineBreak The lineBreak characters
     *
     * @api private
     */
    findLineBreak: text => {
        let lineBreak = os.EOL;
        if (os.EOL === '\n') {
            if (text.indexOf('\r\n') !== -1) lineBreak = '\r\n';
            else if (text.indexOf('\r')!== -1) lineBreak = '\r';
        }
        else if (os.EOL === '\r\n') {
            if (text.indexOf('\n') !== -1) lineBreak = '\n';
            else if (text.indexOf('\r')!== -1) lineBreak = '\r';
        }
        else {
            if (text.indexOf('\r\n') !== -1) lineBreak = '\r\n';
            else if (text.indexOf('\n')!== -1) lineBreak = '\n';
        }
        return lineBreak;
    },

    /**
     * ### Adds elements from an array into another array if not already there
     *
     * Works only with primitive types (e.g., names in header).
     *
     * @param {array} ar1 will contain missing elements from ar2
     * @param {array} ar2 will add elements to ar1
     *
     * @api private
     */
    addIfNotThere: (ar1, ar2) => {
        let len = ar2.length;
        if (len < 4) {
            if (len > 0 && !ar1.find(i => i === ar2[0])) ar1.push(ar2[0]);
            if (len > 1 && !ar1.find(i => i === ar2[1])) ar1.push(ar2[1]);
            if (len > 2 && !ar1.find(i => i === ar2[2])) ar1.push(ar2[2]);
        }
        else {
            ar2.forEach((item) => {
                if (!ar1.find(i => i === item)) ar1.push(item);
            });
        }
    }

};
