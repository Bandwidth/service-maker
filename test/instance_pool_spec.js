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
var clock;

before(function(done) {
  pool = new InstancePool();
  pool.ec2 = ec2;
  done();
})

after(function(done) {
  if (stub) { stub.restore(); }
  if (clock) { clock.restore(); }
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
      var tagsStub = {};
      tagsStub.applyTags = function(tags, instanceId, callback) {
        callback(instanceId);
      }
      var InstancePool = proxyquire('./../lib/InstancePool', { './Tags': tagsStub });
      Instances.ec2 = ec2;

      var now = new Date();
      clock = sinon.useFakeTimers(now.getTime());

      done();
    })

  })

  describe('#removeFromPool', function() {

    it('removes pool tags', function(done) {
      var tagsStub = {};
      tagsStub.removeTags = function(tags, instanceId, callback) {
        callback();
      }
      var InstancePool = proxyquire('./../lib/InstancePool', { './Tags': tagsStub });

      const id = 42;
      var spy = sinon.spy();
      InstancePool.removeFromPool(id, spy);
      spy.called.should.be.true;
    })

  })

})
