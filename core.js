const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const config = require('config');
const db = mongoose.connect(config.DBHost, { useMongoClient: true, promiseLibrary: require('bluebird') });
const ObjectId = require('mongoose').Types.ObjectId;

const GameState = require('./model/gamestate');
const MapTile = require('./model/map-tile');

const ResponseObject = require('./respo');
const utils = require('./util');

const ERROR_QUERY_NO_RESULT = { error: 'Could not retrieve existing game state. Did you tamper with your session id?' };
const ERROR_CREATE_GAMESTATE = { error: 'Could not create new game state' };

/**
 * Returns various promises that can be daisy-chained to form the core application logic.
 */
class Core {

    constructor(req) {}

    /**
     * Returns a promise in which the session is queried for or built as necessary.
     * The resolve returns an updated state variable that contains the GameState object.
     * @param {*} state Holds all information regarding this session.
     */
    init(state) {
        console.log('1. Init state');
        return new Promise((resolve, reject) => {
            if (state.sid && state.sid.length === 24) {
                return GameState.findOne({
                    _id: new ObjectId(state.sid)
                })
                .exec()
                .catch(err => reject(ERROR_QUERY_NO_RESULT))
                .then(gs => {
                    if (gs) {
                        console.log(gs._id);
                        state['gamestate'] = gs;
                        resolve(state);
                    } else {
                        console.log('gamestate not found');
                        return this.buildGameState(state, resolve, reject);
                    }
                });
            } else {
                return this.buildGameState(state, resolve, reject);
            }
        })
        .catch((err) => {
            console.log('Err: in Core.init error');
            throw Error(err);
        });
    }

    /**
     * Builds a new GameState document and returns the updated state.
     * @param {*} state Holds all information regarding this session.
     * @param {*} resolve Promise resolve.
     * @param {*} reject Promise reject.
     */
    buildGameState(state, resolve, reject) {
        console.log('1 - sub. Build GameState');
        var gs = new GameState();
        return gs.save()
            .catch(err => {
                if (reject) {
                    reject(ERROR_CREATE_GAMESTATE);
                } else {
                    return(ERROR_CREATE_GAMESTATE);
                }
            })
            .then(gs => {
                if (gs) {
                    state['sid'] = gs._id;
                    state['gamestate'] = gs;
                    if (resolve) {
                        resolve(state);
                    } else {
                        return(state);
                    }
                } else {
                    if (reject) {
                        reject(ERROR_CREATE_GAMESTATE);
                    } else {
                        return(ERROR_CREATE_GAMESTATE);
                    }
                }
            });
    }

    /**
     * Resets the GameState to starting position on application load.
     * @param {*} state Holds all information about this session.
     * @param {*} resolve Promise resolve.
     * @param {*} reject Promise reject.
     */
    resetGameState(state, resolve, reject) {
        console.log('2. Reset GameState');
        return GameState.findByIdAndUpdate(
            ObjectId(state.gamestate._id),
            { 
                $set: { 
                    pos_x: 0, 
                    pos_y: 0,
                    host: '~',
                    map_type: 'cli',
                    vars: []
                }
            }
        )
        .exec()
        .catch(err => {
            throw Error(err);
        })
        .then(gs => {
            if (gs) {
                console.log(`2 - sub. In GameState update callback`);
                if (resolve) {
                    resolve(state);
                } else {
                    return(state);
                }
            } else {
                if (reject) {
                    reject(ERROR_CREATE_GAMESTATE);
                } else {
                    return(ERROR_CREATE_GAMESTATE);
                }
            }
        });
    }

    /**
     * Returns the MapTile document for a given position and map type. 
     * If values are empty, they are pulled from the supplied state.
     * @param {*} state Holds all information regarding this session.
     * @param {*} pos_x Optional. The target X coordinate.
     * @param {*} pos_y Optional. The target Y coordinate.
     * @param {*} map_type Optional. The map type of the MapTile.
     */
    getMapTile(state, pos_x, pos_y, map_type) {
        console.log(`2. In Get MapTile`);

        pos_x = pos_x || state.gamestate.pos_x;
        pos_y = pos_y || state.gamestate.pos_y;
        map_type = map_type || state.gamestate.map_type;

        console.log(`In getMapTile with pos_x: ${pos_x}, pos_y: ${pos_y}, map_type: ${map_type}`);

        return MapTile.findOne({
            map_type: map_type,
            pos_x: pos_x,
            pos_y: pos_y
        })
        .exec()
        .catch(err => {
            throw Error(err);
        })
        .then(mt => {
            if (mt) {
                state['current_tile'] = mt;
                return state;
            } else {
                console.log('Map tile could not be found');
            }
        });
    }

    /**
     * Not sure if we need this just yet. May refactor later.
     * @param {*} state Holds all information regarding this session.
     */
    setCurrentPosition(state) {
        // Used to update the GameState with new X/Y coordinates
    }

    /**
     * Validates whether the supplied command for endpoint /api/cli/run is valid given the
     * player's current GameState.map_type.
     * @param {*} state Holds all information regarding this session.
     */
    validateCommand(state) {
        console.log(`3. In validate command`);

        if (state.cmd) {
            var cmd = state.cmd.trim();
            var cmd_parts = cmd.split(' ');
            var parts = [];

            for (var i = 0; i < cmd_parts.length; i++) {
                var part = cmd_parts[i];
                console.log(part);
                part = part.trim();
                if (part) {
                    parts.push(part);
                }
            }

            var commands = utils.getCommandSet(state);
            
            if (parts.length > 0 && commands[parts[0]]) {
                state.cmd = parts.shift();
                state['cmd_parts'] = [].concat(parts);
                return state;
            }
        }

        throw ResponseObject('output', '-bash: ' + state.cmd + ': command not found');
    }

    /**
     * Returns a promiuse in which the command that was validated in validateCommand function is run.
     * @param {*} state Holds all information regarding this session.
     */
    runCommand(state) {
        console.log(`4. In run command`);
        return new Promise((resolve, reject) => {
            var commands = utils.getCommandSet(state);
            resolve(commands[state.cmd].runner(state, GameState, MapTile));
        })
        .catch((err) => {
            console.log('Err: in Core.runCommand error');
            throw Error(err);
        });
    }

    /**
     * Validates the output of the runCommand function and either returns the output or an error response.
     * @param {*} state Holds all information regarding this session.
     */
    checkRun(state) {
        console.log(`5. In check run`);
        if (state.out) {
            return state.out;
        } else {
            return ResponseObject('output', '-bash: ' + state.cmd + ': command not found');
        }
    }
}

module.exports = Core;