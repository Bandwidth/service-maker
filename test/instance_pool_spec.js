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

beforeEach(function(done) {
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

  it ('defaults to the NaiveStrategy', function(done) {
    var pool = new InstancePool();
    pool.strategy().should.equal('NaiveStrategy');
    done();
  })

  it('initializes by creating instances', function(done) {
    var instancesStub = {};
    instancesStub.create = function(type, callback) {
      callback(42);
    }
    instancesStub.handleTtl = function(instance) {}
    var InstancePool = proxyquire('./../lib/InstancePool', { './Instances': instancesStub });
    var pool = new InstancePool();

    pool.getPoolInstancesByFilters = function(filters, callback) {
      var instances = [];
      instances.push({
        InstanceType: 't2.micro'
      , InstanceId: 42
      });
      callback(instances);
    }
    // stub = sinon.stub(Instances, 'handleTtl');

    var createStub = sinon.stub(InstancePool, 'create');
    var assimmilateStub = sinon.stub(InstancePool, 'assimilate');

    pool.initialize();
    // stub.called.should.be.true;
    createStub.called.should.be.true;
    assimmilateStub.called.should.be.true;
    done();
  })

  it('initializes by destroying instances', function(done) {
    var instancesStub = {};
    instancesStub.create = function(type, callback) {
      callback(42);
    }
    instancesStub.handleTtl = function(instance) {}
    var InstancePool = proxyquire('./../lib/InstancePool', { './Instances': instancesStub });
    var pool = new InstancePool();

    pool.getPoolInstancesByFilters = function(filters, callback) {
      var instances = [];
      var fakeInstance = {
        InstanceType: 't2.micro'
      , InstanceId: 42
      }
      for (var i = 0; i < 5; i++) {
        instances.push(fakeInstance);
      }
      callback(instances);
    }
    // stub = sinon.stub(Instances, 'handleTtl');

    var createStub = sinon.stub(InstancePool, 'create');
    var terminateStub = sinon.stub(InstancePool, 'terminate');
    var assimmilateStub = sinon.stub(InstancePool, 'assimilate');

    var spy = sinon.spy();
    pool.initialize(undefined, spy);
    spy.called.should.be.true;
    createStub.called.should.be.true;
    terminateStub.called.should.be.true;
    assimmilateStub.called.should.be.true;
    done();
  })

  it('logs to server while initializing', function(done) {
    var instancesStub = {};
    instancesStub.create = function(type, callback) {
      callback(42);
    }
    instancesStub.handleTtl = function(instance) {}
    var InstancePool = proxyquire('./../lib/InstancePool', { './Instances': instancesStub });
    var pool = new InstancePool();

    pool.getPoolInstancesByFilters = function(filters, callback) {
      var instances = [];
      var fakeInstance = {
        InstanceType: 't2.micro'
      , InstanceId: 42
      }
      for (var i = 0; i < 5; i++) {
        instances.push(fakeInstance);
      }
      callback(instances);
    }
    // stub = sinon.stub(Instances, 'handleTtl');

    var createStub = sinon.stub(InstancePool, 'create');
    var terminateStub = sinon.stub(InstancePool, 'terminate');
    var assimmilateStub = sinon.stub(InstancePool, 'assimilate');

    var spy = sinon.spy();
    var fakeServer = {};
    fakeServer.log = sinon.spy();
    pool.initialize(fakeServer, spy);
    fakeServer.log.called.should.be.true;
    spy.called.should.be.true;
    createStub.called.should.be.true;
    terminateStub.called.should.be.true;
    assimmilateStub.called.should.be.true;
    done();
  })

  describe('#startSshPolling', function() {

    it('polls instances', function(done) {
      var tagsStub = {};
      tagsStub.applyTags = function(tags, instanceId, callback) {
        callback(instanceId);
      }
      var InstancePool = proxyquire('./../lib/InstancePool', { './Tags': tagsStub });
      InstancePool.ec2 = ec2;

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
      done();
    })

  })

  describe('#assimilate', function(done) {

    it('adds sshable instances', function(done) {
      var instancesStub = {};
      instancesStub.handleTtl = function(instanceId) {
        return;
      }
      instancesStub.canSsh = function(instanceId, callback) {
        callback(true);
      }
      var InstancePool = proxyquire('./../lib/InstancePool', { './Instances': instancesStub })

      const id = 42;
      var spy = sinon.spy();
      stub = sinon.stub(InstancePool, 'onSshable');
      InstancePool.assimilate(id);
      stub.called.should.be.true;
      done();
    })

    it('adds non-sshable instances', function(done) {
      var instancesStub = {};
      instancesStub.handleTtl = function(instanceId) {
        return;
      }
      instancesStub.canSsh = function(instanceId, callback) {
        callback(false);
      }
      var InstancePool = proxyquire('./../lib/InstancePool', { './Instances': instancesStub })

      const id = 42;
      var spy = sinon.spy();
      stub = sinon.stub(InstancePool, 'startSshPolling');
      InstancePool.assimilate(id);
      stub.called.should.be.true;
      done();
    })

  })

  describe('#createInstances', function() {

    it('creates instances', function(done) {
      stub = sinon.stub(InstancePool, 'create');
      var instances = {};
      instances['t2.micro'] = 1;

      var spy = sinon.spy();
      InstancePool.createInstances(instances, spy);
      stub.called.should.be.true;
      spy.called.should.be.true;
      done();
    })

  })

  describe('getPoolInstanccesByType', function() {

    it('gets instances', function(done) {
      pool.getPoolInstancesByFilters = function(filters, callback) {
        callback();
      }
      spy = sinon.spy();
      const type = 't1.micro';
      pool.getPoolInstancesByType(type, spy);
      spy.called.should.be.true;
      done();
    })

  })

  describe('getPoolInstances', function() {

    it('returns undefined if no pool instances', function(done) {
      pool.getPoolInstancesByFilters = function(filters, callback) {
        callback(undefined);
      }
      var spy = sinon.spy();
      pool.getPoolInstances(spy);
      spy.called.should.be.true;
      spy.calledWith(undefined).should.be.true;
      done();
    })

    it('returns pool instances', function(done) {
      pool.getPoolInstancesByFilters = function(filters, callback) {
        var instances = [];
        instances.push({
          InstanceType: 't2.micro'
        , InstanceId: 42
        });
        callback(instances);
      }
      var spy = sinon.spy();
      pool.getPoolInstances(function(currentInstances) {
        should.exist(currentInstances);
        done();
      });
    })

  })

})
