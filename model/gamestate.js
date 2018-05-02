var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gamestate = new Schema({
    map_type: { type: String, default: 'cli' },
    pos_x: { type: Number, min: 0, max: 4, default: 0 },
    pos_y: { type: Number, min: 0, max: 4, default: 0 },
    host: { type: String, default: 'LambentOwl:~ $' },
    vars: [String]
});

module.exports = mongoose.model('GameState', gamestate);