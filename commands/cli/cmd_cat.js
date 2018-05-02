const ResponseObject = require('../../respo');
const utils = require('../../util');

/**
 * Used to validate the which content targets this command is valid for.
 */
const validForTypes = ['txt'];

/**
 * Function that is run when this command is called.
 * @param {*} state Holds all relevant information about this session and request.
 * @param {*} GameState Schema for Mongoose model/document.
 * @param {*} MapTile Schema for Mongoose model/document.
 */
const runner = (state, GameState, MapTile) => {
    var cmd = module.exports.cat;

    // Validate that the file is present, and that it is the correct type.

    console.log('in cmd_cat runner');
    console.log(state.current_tile);

    // We only care about the first argument; not supporting multiple files
    var filename = state.cmd_parts ? state.cmd_parts[0] : null;

    return new Promise((resolve, reject) => {
        if (!filename) {
            state['out'] = ResponseObject('output', cmd.error_msg(''));
            resolve(state);
        } else {
            // Validate that the target exists and is of the correct type
            var contentTarget = utils.getObjectWithKey(state.current_tile.contents, 'name', filename);
            var validForTarget = utils.isValidForTarget(validForTypes, contentTarget);

            if (validForTarget) {
                // Attempt to locate and return the contents of the file from the ../../docs directory
                var fs = require('fs');
                
                fs.readFile(utils.buildFilePath(filename), 'utf-8', (err, data) => {
                    if (err) {
                        console.log(err);
                        state['out'] = ResponseObject('output', cmd.error_msg(filename));
                        resolve(state);
                    } else {
                        var outArray = data.toString().split('\n');
                        state['out'] = ResponseObject('output', outArray);
                        resolve(state);
                    }
                });
            } else if (contentTarget && !validForTarget) {
                console.log('Target is invalid for this command');
                var target = contentTarget instanceof Object && contentTarget._type ? contentTarget._type : contentTarget;
                var message = target === 'dir' ? cmd.error_is_a_directory(filename) : cmd.error_is_improper_type(filename);
                state['out'] = ResponseObject('output', message);
                resolve(state)
            } else {
                console.log('Target did not match the contents of this directory');
                state['out'] = ResponseObject('output', cmd.error_msg(filename));
                resolve(state);
            }
        }
    });
}

/**
 * Exports this command and all related functions.
 */
module.exports.cat = {
    error_msg: function bem(a) {
        return `cat: ${a}: No such file or directory`;
    },
    error_is_a_directory: function bem(a) {
        return `cat: ${a}: Is a directory`;
    },
    error_is_improper_type: function bem(a) {
        return `cat: ${a}: Use the 'open' command instead. Trust me...`;
    },
    usage: function a() {
        return 'cat     Prints contents of a file to the console.  \n' +
               '        File must be in the current directory      \n' +
               '        -------------------------------------------\n' +
               '        Example usage                              \n' +
               '        -------------------------------------------\n' +
               '        cat [file ...] | Prints content of file    \n' +
               '        cat about.txt  | Prints about.txt content  \n' +
               '\n';
    },
    runner: runner
}