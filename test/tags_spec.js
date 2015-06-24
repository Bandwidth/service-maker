var expect = require('chai').expect;
const proxyquire = require('proxyquire');
const should = require('chai').should();
const sinon = require('sinon');

var AwsHelper = require('../lib/helpers/aws');
var ec2 = AwsHelper.createEc2Client();

var Tags = require('./../lib/Tags');

describe('Tags', function() {

  var testTags = [
    {
      Key: 'key'
    , Value: 'value'
    }
  ];

  it('uses the default AWS client configuration', function() {
    expect(Tags.ec2.config.apiVersion).to.equal(AwsHelper.API_VERSION);
    expect(Tags.ec2.config.region).to.equal(AwsHelper.DEFAULT_REGION);
  });

  describe('#applyTags', function() {
    beforeEach(function() {
      sinon.stub(Tags.ec2, 'createTags', function(params, callback) {
        callback();
      });
    });

    afterEach(function() {
      Tags.ec2.createTags.restore();
    });

    it('should allow you to appply tags', function(done) {
      Tags.applyTags(testTags, 5, function(instanceId) {
        Tags.ec2.createTags.called.should.be.true;
        should.exist(instanceId);
        instanceId.should.equal(5);
        done();
      });
    });

    it('should not require a callback', function() {
      Tags.applyTags(testTags, 42);
      Tags.ec2.createTags.called.should.be.true;
    });
  });

  describe('#removeTags', function() {
    beforeEach(function() {
      sinon.stub(Tags.ec2, 'deleteTags', function(params, callback) {
        callback();
      });
    });

    afterEach(function() {
      Tags.ec2.deleteTags.restore();
    });

    it('should allow you to remove tags', function(done) {
      Tags.removeTags(testTags, 42, function(instanceId) {
        Tags.ec2.deleteTags.called.should.be.true;
        should.exist(instanceId);
        instanceId.should.equal(42);
        done();
      })
    })

    it('should not require a callback', function() {
      Tags.removeTags(testTags, 42);
      Tags.ec2.deleteTags.called.should.be.true;
    });
  });

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
