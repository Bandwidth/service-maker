const proxyquire = require('proxyquire');
const should = require('chai').should();
const sinon = require('sinon');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
  apiVersion: '2014-10-01'
, region: 'us-west-2'
});

var Tags = require('./../lib/Tags');

var testTags = [
  {
    Key: 'key'
  , Value: 'value'
  }
];

var stub;

before(function(done) {
  Tags.ec2 = ec2;
  done();
})

afterEach(function(done) {
  if (stub) {
    stub.restore();
  }
  done();
})

describe('Tags', function() {

  describe('#applyTags', function() {

    it('should allow you to appply tags', function(done) {
      stub = sinon.stub(ec2, 'createTags', function(params, callback) {
        callback();
      });

      Tags.applyTags(testTags, 5, function(instanceId) {
        stub.called.should.be.true;
        should.exist(instanceId);
        instanceId.should.equal(5);
        done();
      });
    });

    it('should not require a callback', function(done) {
      stub = sinon.stub(ec2, 'createTags', function(params, callback) {
        callback();
      });

      Tags.applyTags(testTags, 42);
      stub.called.should.be.true;
      done();
    });

  })

  describe('#removeTags', function() {

    it('should allow you to remove tags', function(done) {
      stub = sinon.stub(ec2, 'deleteTags', function(params, callback) {
        callback();
      });

      Tags.removeTags(testTags, 42, function(instanceId) {
        stub.called.should.be.true;
        should.exist(instanceId);
        instanceId.should.equal(42);
        done();
      })
    })

    it('should not require a callback', function(done) {
      stub = sinon.stub(ec2, 'deleteTags', function(params, callback) {
        callback();
      });

      Tags.removeTags(testTags, 42);
      stub.called.should.be.true;
      done();
    });

  })

  describe('#getTags', function() {

    it('should be able to get tags', function(done) {
      var instancesStub = {};
      instancesStub.getInstance = function(instanceId, callback) {
        var stubInstance = {
          Tags: testTags
        };
        callback(stubInstance);
      }
      var proxyTags = proxyquire('./../lib/Tags', { './Instances': instancesStub });

      proxyTags.getTags(42, function(tags) {
        should.exist(tags);
        done();
      });
    })

  })

});
