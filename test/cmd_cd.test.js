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

describe('cmd_cd test suite', () => {

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

        // cd negative scenario, missing target
        it('it should return the cd command error response for missing targets', (done) => {
            chai.request(server)
                .post('/api/cli/run')
                .send({ sid, cmd: 'cd Documents' })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('object');
                    expect(res.body.body).to.include('No such file or directory');
                    done();
                });
        });

        // cd negative scenario, improper target
        it('it should return the cd command error response for improper targets', (done) => {
            chai.request(server)
                .post('/api/cli/run')
                .send({ sid, cmd: 'cd resume.txt' })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('object');
                    expect(res.body.body).to.include('Not a directory');
                    done();
                });
        });

        // cd ..
        it('it should return the cd command response when navigating back using cd ..', (done) => {
            chai.request(server)
                .post('/api/cli/run')
                .send({ sid, cmd: 'cd ..' })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('object');
                    expect(res.body.body).to.eql('');
                    expect(res.body.host).to.include('~');
                    done();
                });
        });

        // cd ~
        it('it should return the cd command response when navigating back using cd ~', (done) => {
            chai.request(server)
                .post('/api/cli/run')
                .send({ sid, cmd: 'cd ~' })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('object');
                    expect(res.body.body).to.eql('');
                    expect(res.body.host).to.include('~');
                    done();
                });
        });
    });

});