const { cli } = require('./commands/command_map');
const path = require('path');
const DOCS_DIRECTORY = 'assets';

/**
 * Returns the command state based on current GameState.gametype.
 * @param {*} state Holds all relevant information about this session and request.
 */
module.exports.getCommandSet = (state) => {
    return state.gamestate.map_type === 'cli' ? cli : null;
}

/**
 * Returns whether an array of objects contains a particular object with a provided key and value.
 * @param {*} objects An array of objects.
 * @param {*} key The object property to compare.
 * @param {*} val The value against which the object property is evaluated.
 */
module.exports.hasObjectWithKey = (objects, key, val) => {
    for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        if (obj[key] && obj[key] === val) {
            return true;
        }
    }
    return false;
}

/**
 * Returns a single object from an array of objects based on a matching key and value.
 * @param {*} objects An array of objects.
 * @param {*} key The object property to compare.
 * @param {*} val The value against which the object property is evaluated.
 */
module.exports.getObjectWithKey = (objects, key, val) => {
    for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        if (obj[key] && obj[key] === val) {
            return obj;
        }
    }
    return null;
}

/**
 * Evaluates whether a command is valid for a particular content object based on its _type property.
 * @param {*} validFor An array of strings. Must be an array.
 * @param {*} targetType The object or string to find within the validFor array.
 */
module.exports.isValidForTarget = (validFor, targetType) => {
    if (!targetType || !validFor) {
        return false;
    }
    var target = targetType instanceof Object && targetType._type ? targetType._type : targetType;
    return validFor.indexOf(target) > -1;
}

/**
 * Builds the current host for the 'cli' gametype.
 * @param {*} dir String value of the current directory name.
 */
module.exports.getCurrentHost = (dir) => {
    return `LambentOwl:${dir} $`;
}

/**
 * Builds the full file path based for files in the docs folder.
 * @param {*} filename Target file name.
 */
module.exports.buildFilePath = (filename) => {
    return path.join(process.cwd(), DOCS_DIRECTORY, filename);
}