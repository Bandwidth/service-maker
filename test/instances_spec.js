var expect = require('chai').expect;
const proxyquire = require('proxyquire');
const should = require('chai').should();
const sinon = require('sinon');

var AWS = require('aws-sdk');
var AwsHelper = require('../lib/helpers/aws');
var ec2 = AwsHelper.createEc2Client();

var Instances = require('./../lib/Instances');
var Helper = require('./test_helper');

describe('Instances', function() {

  var clock;
  var stub;
  var tagsStub;

  after(function(done) {
    Helper.enableLogging(); // In case any test forgot
    done();
  })

  afterEach(function(done) {
    if (stub) {
      stub.restore();
    }
    if (clock) {
      clock.restore();
    }
    done();
  })

  it('uses the default AWS client configuration', function() {
    expect(Instances.ec2.config.apiVersion).to.equal(AwsHelper.API_VERSION);
    expect(Instances.ec2.config.region).to.equal(AwsHelper.DEFAULT_REGION);
  });

  describe('#terminate', function() {
    before(function() {
      sinon.stub(Instances.ec2, 'terminateInstances', function(params, callback) {
        callback();
      });
    });

    after(function() {
      Instances.ec2.terminateInstances.restore();
    });

    it('should terminate the instance', function(done) {
      Instances.terminate(42, function(callback) {
        Instances.ec2.terminateInstances.called.should.be.true;
        done();
      });
    })

  })

  describe('#getInstance', function() {
    before(function() {
      sinon.stub(Instances.ec2, 'describeInstances', function(params, callback) {
        var data = {
          Reservations: [{
            Instances: [{
              InstanceId: 42
            }]
          }]
        };
        callback(undefined, data);
      });
    });

    after(function() {
      Instances.ec2.describeInstances.restore();
    });

    it('should get the instance', function(done) {
      Instances.getInstance(42, function(instance) {
        Instances.ec2.describeInstances.called.should.be.true;
        instance.InstanceId.should.equal(42);
        done();
      });
    })

  })

  describe('#handleTtl', function() {

    it('should stop if instance is not running', function(done) {
      var testInstance = {
        InstanceId: 42
      , State: {
          Name: 'stopped'
        }
      }

      var spy = sinon.spy();
      Instances.handleTtl(testInstance, spy);
      spy.called.should.be.true;
      done();
    })

    it('should stop if instance has no tags', function(done) {
      var testInstance = {
        InstanceId: 42
      , State: {
          Name: 'running'
        }
      }

      var spy = sinon.spy();
      Instances.handleTtl(testInstance, spy);
      spy.called.should.be.true;
      done();
    })

    it('should terminate an instance if its termination time has passed', function(done) {
      var now = new Date();
      var past = new Date(now);
      past.setMonth(now.getMonth() - 1);

      (past < now).should.be.true;

      var testInstance = {
        InstanceId: 42
      , InstanceType: 'c4xxxxxxlarge'
      , State: {
          Name: 'running'
        }
      , Tags: [{
          Key: 'Termination Time'
        , Value: past.toString()
        }]
      };

      var instancesStub = {};
      instancesStub.terminate = function(instanceId, callback) {
        callback();
      }

      stub = sinon.stub(Instances, 'terminate');
      Instances.handleTtl(testInstance);
      stub.called.should.be.true;
      done();
    })

    it('should schedule instance termination', function(done) {
      var now = new Date();
      var future = new Date(now);
      future.setMonth(now.getMonth() + 1);
      (future < now).should.be.false;

      var testInstance = {
        InstanceId: 42
      , InstanceType: 'c4xxxxxxlarge'
      , State: {
          Name: 'running'
        }
      , Tags: [{
          Key: 'Termination Time'
        , Value: future.toString()
        }]
      };

      stub = sinon.stub(Instances, 'scheduleTermination');
      Instances.handleTtl(testInstance);
      stub.called.should.be.true;
      done();
    })

  })

  describe('#addTtl', function() {

    it('should add ttl tags to the instance', function(done) {

      var tagsStub = {};
      tagsStub.applyTags = function(tags, instanceId, callback) {
        callback(instanceId);
      }
      var Instances = proxyquire('./../lib/Instances', { './Tags': tagsStub });
      stub = sinon.stub(Instances, 'scheduleTermination', function(id, deathTime, callback) {
        callback();
      });

      const id = 42;
      const ttl = 5;
      const spy = sinon.spy();
      Instances.addTtl(id, ttl, spy);
      stub.called.should.be.true;
      spy.called.should.be.true;
      done();
    })
  })

  describe('#getInstance', function() {
    before(function() {
      sinon.stub(Instances.ec2, 'describeInstances', function(params, callback) {
        var data = {
          Reservations: [{
            Instances: [{
              InstanceId: 42
            }]
          }]
        };
        callback(undefined, data);
      });
    });

    after(function() {
      Instances.ec2.describeInstances.restore();
    });

    it('should get an instance', function(done) {
      Instances.getInstance(42, function(instance) {
        should.exist(instance);
        instance.InstanceId.should.equal(42);
        done();
      })
    })

  })

  describe('#scheduleTermination', function() {

    it('should use setTimeout', function(done) {
      stub = sinon.stub(Instances, 'terminate', function(instanceId, callback) {
        callback();
      });

      var now = new Date();
      clock = sinon.useFakeTimers(now.getTime()); // Fake time starts now (is otherwise epoch)
      var now2 = new Date();

      var tenSecondsFromNow = new Date();
      tenSecondsFromNow.setSeconds(now.getSeconds() + 10);

      var scheduled = sinon.spy();
      const instanceId = 42;
      Helper.disableLogging();
      Instances.scheduleTermination(instanceId, tenSecondsFromNow, scheduled);
      scheduled.called.should.be.true;
      stub.called.should.be.false;

      clock.tick(9 * 1000); // ms
      stub.called.should.be.false;

      clock.tick(1 * 1000);
      stub.called.should.be.true;
      Helper.enableLogging();
      done();
    })

  })

  describe('#canSsh', function() {
    describe('for an instance that is not fully provisioned', function() {
      before(function() {
        sinon.stub(Instances.ec2, 'describeInstanceStatus', function(params, callback) {
          var data = {
            InstanceStatuses: []
          };
          callback(null, data);
        });
      });

      after(function() {
        Instances.ec2.describeInstanceStatus.restore();
      });

      it('should determine that SSH in not available', function(done) {
        Instances.canSsh(42, function(sshable) {
          stub.called.should.be.true;
          should.exist(sshable);
          sshable.should.be.false;
          done();
        });
      });
    });

    describe('for an instance that is fully provisioned', function() {
      before(function() {
        sinon.stub(Instances.ec2, 'describeInstanceStatus', function(params, callback) {
          var data = {
            InstanceStatuses: [{
              SystemStatus: {
                Details: [{
                  Status: 'passed'
                }]
              }
            }]
          };
          callback(undefined, data);
        });
      });

      after(function() {
        Instances.ec2.describeInstanceStatus.restore();
      });

      it('should determine if is sshable', function(done) {
        Instances.canSsh(42, function(sshable) {
          stub.called.should.be.true;
          should.exist(sshable);
          sshable.should.be.true;
          done();
        });
      })
    })
  })
})
