const touch = require('touch');
const sinon = require('sinon');
const should = require('chai').should();
const proxyquire = require('proxyquire');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
  apiVersion: '2014-10-01'
, region: 'us-west-2'
});

var InstancePool = require('./../lib/InstancePool');
var Helper = require('./test_helper');

var pool;
var stub;

before(function(done) {
  pool = new InstancePool();
  pool.ec2 = ec2;
  done();
})

after(function(done) {
  if (stub) { stub.restore(); }
  done();
})

describe('InstancePool', function() {

  describe('constructor', function() {

    it ('defaults to the NaiveStrategy', function(done) {
      var pool = new InstancePool();
      pool.strategy().should.equal('NaiveStrategy');
      done();
    })

  })

  describe('#startSshPolling', function() {

    it('polls instances', function(done) {

      done();
    })

  })

})
