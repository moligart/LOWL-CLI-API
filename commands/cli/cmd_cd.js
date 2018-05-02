const ResponseObject = require('../../respo');
const ObjectId = require('mongoose').Types.ObjectId;
const utils = require('../../util');

/**
 * Used to validate the which content targets this command is valid for.
 */
const validForTypes = ['dir'];

/**
 * Function that is run when this command is called.
 * @param {*} state Holds all relevant information about this session and request.
 * @param {*} GameState Schema for Mongoose model/document.
 * @param {*} MapTile Schema for Mongoose model/document.
 */
const runner = (state, GameState, MapTile) => {
    var cmd = module.exports.cd;

    // Need to parse the portions after cd, immediate directory only
    // Gamestate should hold the current MapTile
    // MapTile.contents holds directory contents of files and sub-directories
    // MapTile.commands holds the available commands
    // No arguments should return the user to ~/$HOME

    console.log('in cmd_cd runner');
    console.log(state);
    console.log(state.current_tile);

    // The OSX terminal only parses the first argument, so disregard the rest
    state.cmd_parts = state.cmd_parts[0];
    // Support for multiple levels later. For now throw a friendly reminder if dirs.length > 1
    var dirs = state.cmd_parts ? state.cmd_parts.split('/') : ['~'];

    return new Promise((resolve, reject) => {
        if (dirs.length > 1) {
            state['out'] = ResponseObject('output', cmd.error_too_deep(dirs.join('/')));
            resolve(state);
        } else {
            // Validate that the target directory exists. If it does, find that MapTile and update GameState
            var target = dirs[0];
            var target = target.toUpperCase() === '$HOME' ? '~' : target;
            var contentTarget = utils.getObjectWithKey(state.current_tile.contents, 'name', target);
            var validForTarget = utils.isValidForTarget(validForTypes, contentTarget);

            var destX, destY;
            var backShortcut = false;
            if (target === '..') {
                var currX = state.current_tile.pos_x;
                destX = currX > 0 ? currX - 1 : 0;
                destY = destX > 0 ? state.current_tile.pos_y : 0;
                backShortcut = true;
            }

            if (validForTarget || backShortcut || target === '~') {
                var criteria = {
                    map_type: 'cli'
                };

                if (backShortcut) {
                    criteria['pos_x'] = destX;
                    criteria['pos_y'] = destY;
                } else {
                    criteria['primary_name'] = target;
                }

                console.log(criteria);

                return MapTile.findOne(criteria)
                .exec()
                .catch(err => {
                    throw Error(err);
                })
                .then(mt => {
                    if (mt) {
                        state['current_tile'] = mt;
                        return GameState.findByIdAndUpdate(
                            ObjectId(state.gamestate._id), 
                            { 
                                $set: { 
                                    pos_x: mt.pos_x, 
                                    pos_y: mt.pos_y,
                                    host: mt.primary_name
                                }
                            }
                        )
                        .exec()
                        .catch(err => {
                            throw Error(err);
                        })
                        .then(gs => {
                            if (gs) {
                                console.log(`new gamestate:`);
                                console.log(gs);
                                state['out'] = ResponseObject('input', '', utils.getCurrentHost(mt.primary_name));
                                resolve(state);
                            } else {

                            }
                        });
                    } else {
                        console.log('Map tile could not be found');
                        state['out'] = ResponseObject('output', cmd.error_msg(target));
                        resolve(state);
                    }
                });
            } else if (contentTarget && !validForTarget) {
                console.log('Target is invalid for this command');
                state['out'] = ResponseObject('output', cmd.error_not_a_directory(target));
                resolve(state)
            } else {
                console.log('Target did not match the contents of this directory');
                state['out'] = ResponseObject('output', cmd.error_msg(target));
                resolve(state);
            }
        }
    });
}

/**
 * Exports this command and all related functions.
 */
module.exports.cd = {
    error_msg: function a(a) {
        return `-bash: cd: ${a}: No such file or directory`;
    },
    error_too_deep: function a(a) {
        return `-bash: cd: ${a}: Support for direct child/parent directories only at the moment. Sorry!`;
    },
    error_not_a_directory: function a(a) {
        return `-bash: cd: ${a}: Not a directory`;
    },
    usage: function a() {
        return 'cd      Traverses the directory tree.              \n' +
               '        -------------------------------------------\n' +
               '        Example usage  | Result                    \n' +
               '        -------------------------------------------\n' +
               '        cd ~           | Return to root dir        \n' +
               '        cd $HOME       | Return to root dir        \n' +
               '        cd [dir name]  | Go to specified directory \n' +
               '        cd ..          | Go to previous directory  \n' +
               '\n';
    },
    runner: runner
}