const express = require('express');
const app = express();
const http = require('http');
const bodyParser = require('body-parser');
const core = require('./core');

const ERROR_MISSING_STATE = { error: 'Missing state in response callback' };

/**
 * mongo db: mongod -dbpath $HOME/LOWL/data/db
 * connect to mongo: mongo
 * run node server: node server
 */

// Allow all requests from all domains and localhost
app.all('/*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'POST, GET');
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

/**
 * Endpoint for initializing the session. User hits this on every page load and refresh.
 * Gamestate is built if not found, reset if found, and the session id returned.
 */
app.post('/api/init', (req, res) => {
    let _core = new core(req);
    let state = { 
        sid: req.body.sid 
    };

    _core.init(state)
    .then(state => _core.resetGameState(state))
    .then(state => handleResolve(state, res))
    .catch(err => {
        console.log('Err: in server.post - /api/init - error');
        console.log(err);
        handleReject(err, res);
    });
});

/**
 * Endpoint for running commands from the web cli. Runs through a sequence of checks where:
 * 1. The session is validated.
 * 2. The current map tile is retrieved based on stored session information.
 * 3. The command is validated against available commands by game type.
 * 4. If valid, the command is run.
 * 5. Command run output is validated and a response is built.
 * 6. The response is sent.
 * 
 * If an error occurs, the rejection is handled here and response built accordingly.
 */
app.post('/api/cli/run', (req, res) => {
    let _core = new core(req);
    let state = { 
        sid: req.body.sid, 
        cmd: req.body.cmd 
    };
    
    _core.init(state)
    .then(state => _core.getMapTile(state))
    .then(state => _core.validateCommand(state))
    .then(state => _core.runCommand(state))
    .then(state => _core.checkRun(state))
    .then(state => handleResolve(state, res))
    .catch(err => {
        console.log('Err: in server.post - /api/cli/run - error');
        console.log(state);
        handleReject(err, res);
    });
});

/**
 * Helper function that builds a response from a resolved Promise.
 * @param {*} state Holds all information regarding this session.
 * @param {*} res Response object.
 */
const handleResolve = (state, res) => {
    console.log('OK: in server.handleResolve');
    if (state) {
        res.status(200).send(state);
    } else {
        handleReject(ERROR_MISSING_STATE, res);
    }
}

/**
 * Helper function that builds a 400 response in response to an error or rejected Promise.
 * @param {*} err The error output, whether from a thrown error or rejected state.
 * @param {*} res Response object.
 */
const handleReject = (err, res) => {
    console.log('Err: in server.handleReject');
    console.log(err);
    res.status(400).send(err);
}

const port = process.env.PORT || '9494';
app.set('port', port);

const server = http.createServer(app);
server.listen(port, () => console.log(`Running on localhost:${port}`));

module.exports = app;