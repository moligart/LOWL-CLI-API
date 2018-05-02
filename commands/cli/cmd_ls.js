const ResponseObject = require('../../respo');

/**
 * Function that is run when this command is called.
 * @param {*} state Holds all relevant information about this session and request.
 * @param {*} GameState Schema for Mongoose model/document.
 * @param {*} MapTile Schema for Mongoose model/document.
 */
const runner = (state, GameState, MapTile) => {
    var cmd = module.exports.ls;

    console.log('in cmd_ls runner');
    console.log(state.current_tile);

    // No arguments accepted; just run the command against the current MapTile
    // Might add support for other commands later, including crawling directories
    return new Promise((resolve, reject) => {
        if (state.cmd_parts.length > 0) {
            state['out'] = ResponseObject('output', cmd.error_msg());
        } else {
            var out = '';
            var contents = state.current_tile.contents;
            for (var i = 0; i < contents.length; i++) {
                out += contents[i].name + '    ';
            }
            state['out'] = ResponseObject('output', out);
        }
        resolve(state);
    });
}

/**
 * Exports this command and all related functions.
 */
module.exports.ls = {
    error_msg: function a() {
        return '-bash: ls: Currently not supporting any arguments for the ls command. Sorry!';
    },
    usage: function a() {
        return 'ls      Lists the contents of the current directory\n' +
               '\n';
    },
    runner: runner
}