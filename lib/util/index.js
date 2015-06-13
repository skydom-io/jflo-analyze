/**
 @module index.js
 @author mtarkiai
 @since 5/22/15
 */

var flat    = require('flat'),
    base58 = require('base58');

var PATH_DELIMITER = '/';

/**
 * Flattens a pojs object, prepends every component path with key
 * @param key
 * @param value
 */
function flatten(prefix_path, value, options) {

    var flattened;
    var delimiter = (options || {}).delimiter || PATH_DELIMITER;
        prefix_path = prefix_path.split(delimiter).filter(function (part) {
            return part.length > 0
        }).join(PATH_DELIMITER);
    if ((prefix_path || "").length) {
        var obj = {};
        obj[prefix_path] = value;
        flattened = flat.flatten(obj, {delimiter: delimiter});
    }
    else {
        flattened = flat.flatten(value, {delimiter: delimiter});
    }

    if (options.container_paths) {
        // Add container entries - key: {} or key: []
        _flattenContainers(value, prefix_path, flattened);
    }
    return flattened;

    function _flattenContainers(obj, curpath, flat) {
        if (Object(obj) !== obj) {
            return;
        }
        flat[curpath] = Array.isArray(obj) ? [] : {};
        for (var key in obj) {
            _flattenContainers(obj[key], [curpath, key].join(delimiter), flat)
        }
    }
}

/**
 * Unflattens the branch implied by key into a pojs object
 * @param key
 * @param flattened
 */
function unflatten(branch_path, flattened) {

    var delimiter = (options || {}).delimiter || PATH_DELIMITER;
    var unflat = flat.unflatten(flattened, {delimiter: delimiter});
    var parts = branch_path.split(delimiter).filter(function (part) {
        return part.length > 0;
    });
    var part;
    while (part = parts.shift()) {
        unflat = (unflat || {})[part];
    }
    return unflat;
}

/**
 * Converts arrays to real hashes with immutable keys; ordering is lost
 * @param obj
 * @returns {*}
 */
function hashify_arrays(obj) {
    if (obj !== Object(obj)) {
        return obj;
    }
    else if (Array.isArray(obj)) {
        return obj.reduce(function (out, item) {
            var new_key = "_" + base58.encode(parseInt(Math.random() * 10000000) + 1000000);
            out[new_key] = hashify_arrays(item);
            return out;
        }, {})
    }
    else {
        return Object.keys(obj).reduce(function (out, key) {
            out[key] = hashify_arrays(obj[key]);
            return out;
        }, {});
    }
}

/**
 * Transforms the values in an array or object
 * @param coll      => Array or Hash
 * @param mapper    => function(value, key)
 * @returns {*}     => Array or Hash
 */
function object_map(coll, mapper) {
    if (Array.isArray(coll)) {
        return coll.map(mapper);
    }
    else if (Object(coll) === coll) {
        return Object.keys(coll).reduce(function (mapped, key) {
            mapped[key] = mapper(coll[key], key);
            return mapped;
        }, {});
    }
    else {
        throw new Error("Cannot map a non-collection thing");
    }
}

/**
 * Filters elements in an Array or Object
 * @param coll      => Array or Hash
 * @param filter    => function(value, key)
 * @returns {*}     => Array or Hash
 */
function object_filter(coll, filter) {
    if (Array.isArray(coll)) {
        return coll.filter(filter);
    }
    else if (Object(coll) === coll) {
        return Object.keys(coll)
            .filter(function (key) {
                return filter(coll[key], key);
            })
            .reduce(function (mapped, key) {
                mapped[key] = coll[key];
                return mapped;
            }, {})
    }
}

function pluck(obj, fields) {
    if (Object(obj) !== obj) {
        return obj;
    }

    return object_filter(obj, function (value, key) {
        return fields.indexOf(key) >= 0
    })
}

/***
 * Conditional formatting of hashkey-encoded lists as JSON arrays
 * @param obj
 * @param options
 * @returns {*}
 */
function formatJSON(obj, options) {
    options = options || {};
    if (obj !== Object(obj)) {
        return obj;
    }
    else if (!options.hasOwnProperty('array_keys') && Object.keys(obj).every(function (key) {
            return key.indexOf('_') == 0
        })) {
        // Output as array
        return Object.keys(obj).map(function (key) {
            return formatJSON(obj[key], options);
        })
    }
    else {
        return Object.keys(obj).reduce(function (output, key) {
            output[key] = formatJSON(obj[key], options);
            return output;
        }, {});
    }
}

module.exports = {
    flatten: flatten,
    unflatten: unflatten,
    hashify_arrays: hashify_arrays,
    object_map: object_map,
    object_filter: object_filter,
    pluck: pluck,
    formatJSON: formatJSON,
    PATH_DELIMITER: PATH_DELIMITER
}