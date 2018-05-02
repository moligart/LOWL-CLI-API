const ResponseObject = require('../../respo');
const utils = require('../../util');


/**
 * Used to validate the which content targets this command is valid for.
 */
const validForTypes = ['img', 'txt', 'pdf'];

/**
 * Function that is run when this command is called.
 * @param {*} state Holds all relevant information about this session and request.
 * @param {*} GameState Schema for Mongoose model/document.
 * @param {*} MapTile Schema for Mongoose model/document.
 */
const runner = (state, GameState, MapTile) => {
    var cmd = module.exports.open;

    // Validate that the file is present, and that it is the correct type.

    console.log('in cmd_open runner');
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
                fs.readFile(utils.buildFilePath(filename), 'base64', (err, data) => {
                    if (err) {
                        console.log(err);
                        state['out'] = ResponseObject('output', cmd.error_msg(filename));
                        resolve(state);
                    } else {
                        // Get file type, build fully qualified data uri
                        var ext = filename.split('.')[1];
                        var type, out, extras;

                        switch (contentTarget._type) {
                            case 'img':
                                type = 'image';
                                out = 'data:image/' + ext + ';base64,' + data;
                                extras = {title: filename};
                                break;
                            case 'pdf':
                                type = 'pdf';
                                out = 'data:application/' + ext + ';base64,' + data;
                                extras = {title: filename};
                                break;
                            case 'txt':
                                // Convert text/plain back so it can be displayed as normal output
                                type = 'output';
                                out =  new Buffer.from(data, 'base64').toString("utf-8");
                                break;
                            default:
                                type = 'output';
                                out = data;
                        }
                        
                        console.log(out);
                        state['out'] = ResponseObject(type, out, null, extras);
                        resolve(state);
                    }
                });
            } else if (contentTarget && !validForTarget) {
                console.log('Target is invalid for this command');
                state['out'] = ResponseObject('output', cmd.error_is_a_directory(filename));
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
module.exports.open = {
    error_msg: function bem(a) {
        return `open: ${a}: No such file or directory`;
    },
    error_is_a_directory: function bem(a) {
        return `open: ${a}: Is a directory`;
    },
    usage: function a() {
        return 'open    Opens the specified file.                  \n' +
               '        File must be in the current directory      \n' +
               '        -------------------------------------------\n' +
               '        Example usage                              \n' +
               '        -------------------------------------------\n' +
               '        open [file ...] | Displays the specified file\n' +
               '        open cat1.png   | Displays the image       \n' +
               '\n';
    },
    runner: runner
}