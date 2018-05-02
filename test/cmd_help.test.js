/* eslint-disable */

process.env.NODE_ENV = 'dev';

let mongoose = require("mongoose");
mongoose.Promise = require('bluebird');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
let expect = chai.expect;

chai.use(chaiHttp);

describe('cmd_help test suite', () => {

    describe('/api/cli/run', () => {
        let sid = '';

        it('it should return a new session id', (done) => {
            chai.request(server)
                .post('/api/init')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('object');
                    res.body.sid.should.have.lengthOf(24);
                    sid = res.body.sid;
                    done();
                });
        });

        // help positive scenaro
        it('it should return a list of commands and usages', (done) => {
            chai.request(server)
                .post('/api/cli/run')
                .send({ sid, cmd: 'help' })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('object');
                    res.body.body.should.be.an('array');
                    done();
                });
        });
    });

});