module.exports = (format, opts = {}) => {
    let Format;
    try {
        Format = require(`./formats/${format}.js`);
    }
    catch(e) {
        throw new Error('Could not load requested format: ' + format);
    }
    try {
        let format = new Format(opts);
        if (opts.type) format.type = opts.type;
        format.toString = function() {
            let res = format.name;
            if (format.type) res += ':' + format.type;
            return res;
        };
        return format;
    }
    catch(e) {
        throw new Error('Format: ' + format + ' errored: ' + e);
    }
};
