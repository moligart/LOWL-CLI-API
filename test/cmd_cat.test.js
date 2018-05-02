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

describe('cmd_cat test suite', () => {

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

        // cat negative scenario, target is a directory
        it('it should return a warning when the target is a directory', (done) => {
            chai.request(server)
                .post('/api/cli/run')
                .send({ sid, cmd: 'cat Documents' })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('object');
                    expect(res.body.body).to.include('Is a directory');
                    done();
                });
        });

        // cd positive scenario
        it('it should return the cd command response when navigating to a directory', (done) => {
            chai.request(server)
                .post('/api/cli/run')
                .send({ sid, cmd: 'cd Documents' })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('object');
                    expect(res.body.body).to.eql('');
                    expect(res.body.host).to.include('Documents');
                    done();
                });
        });

        // cat positive scenario
        it('it should return the resume document', (done) => {
            chai.request(server)
                .post('/api/cli/run')
                .send({ sid, cmd: 'cat resume.txt' })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('object');
                    expect(res.body.body).to.be.an('array');
                    done();
                });
        });

        // cat negative scenario, binary file
        it('it should return a warning to use the open command for certain files', (done) => {
            chai.request(server)
                .post('/api/cli/run')
                .send({ sid, cmd: 'cat resume.pdf' })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('object');
                    expect(res.body.body).to.include("Use the 'open' command instead");
                    done();
                });
        });

        // cat negative scenario, file does not exist
        it('it should return a warning when the specified file does not exist', (done) => {
            chai.request(server)
                .post('/api/cli/run')
                .send({ sid, cmd: 'cat somerandomfile.txt' })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('object');
                    expect(res.body.body).to.include('No such file or directory');
                    done();
                });
        });
    });

});