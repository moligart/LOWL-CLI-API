const ResponseObject = require('../../respo');
const utils = require('../../util');

/**
 * Function that is run when this command is called.
 * @param {*} state Holds all relevant information about this session and request.
 * @param {*} GameState Schema for Mongoose model/document.
 * @param {*} MapTile Schema for Mongoose model/document.
 */
const runner = (state, GameState, MapTile) => {

    console.log('in cmd_help runner');
    
    // Get keys from the command set and run the usage function for each
    // Return the usage text in an array
    return new Promise((resolve, reject) => {
        var commands = utils.getCommandSet(state);
        var keys = Object.keys(commands);
        var usages = [];

        for (var i = 0; i < keys.length; i++) {
            var func = commands[keys[i]];
            if (func.usage) {
                usages.push(func.usage());
            }
        }

        state['out'] = ResponseObject('output', usages);
        resolve(state);
    });
}

/**
 * Exports this command and all related functions.
 */
module.exports.help = {
    usage: function a() {
        return 'help    Returns list of commands and their usages  \n' +
               '\n';
    },
    runner: runner
}