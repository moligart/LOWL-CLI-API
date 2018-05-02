var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var mapTile = new Schema({
    map_type: String,
    primary_name: String,
    tile_name: [String],
    pos_x: { type: Number, min: 0, max: 4 },
    pos_y: { type: Number, min: 0, max: 4 },
    objects: [{
        noun: { type: String },
        text: { type: String },
        pCode: { type: String },
        rules: {
            visibility: [{
                name: { type: String },
                condition: { type: Boolean }
            }],
            usage: [{
                name: { type: String },
                condition: { type: Boolean },
                text: { type: String }
            }]
        },
        verbs: [String],
        prepositions: [String],
        movement: [String],
        target: { 
            ppos_x: { type: Number, min: 0, max: 4 },
            pos_y: { type: Number, min: 0, max: 4 }
        },
        action: {
            name: { type: String },
            props: { type: String }
        }
    }],
    contents: [{
        name: { type: String },
        _type: { type: String }
    }],
    moves: [{ 
        pos_x: { type: Number, min: 0, max: 4 },
        pos_y: { type: Number, min: 0, max: 4 }
    }]
});

module.exports = mongoose.model('MapTile', mapTile);