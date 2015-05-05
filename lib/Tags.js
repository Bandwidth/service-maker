var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
  apiVersion: '2014-10-01'
, region: 'us-west-2'
});

var Instances = require('./Instances');

var Tags = exports;

// So we can swap it out later on (for testing)
Tags.ec2 = ec2;

// Adds the specified tags to the specified instance.
// Will make up to three attempts to apply tags (it can take
// a second for new instances to be ready for tags).
Tags.applyTags = function(tags, instanceId, _callback) {
  function callback(instanceId) {
    if (_callback) { _callback(instanceId); }
  }
  var tries = 3;
  _applyTags(tags, instanceId, tries, function lambda(instanceId, triesLeft) {
    if (instanceId) {
      callback(instanceId);
    } else if (triesLeft > 0) {
      _applyTags(tags, instanceId, triesLeft, lambda);
    } else {
      console.log('There was a problem applying tags to instance ' + instanceId);
      callback(undefined);
    }
  });
};

// Helper for applyTags
var _applyTags = function(tags, instanceId, tries, callback) {
  var params = {
    Resources: [instanceId]
  , Tags: tags
  };
  Tags.ec2.createTags(params, function(err) {
    if (err) {
      callback(undefined, tries - 1);
    } else {
      callback(instanceId, tries);
    }
  });
};

// Removes the specified tags from the specified instance.
Tags.removeTags = function(tags, instanceId, done) {
  var params = {
    Resources: [instanceId]
  , Tags: tags
  };
  Tags.ec2.deleteTags(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
    } else if (done) {
      done(instanceId);
    }
  });
};

// Returns the tags of the specified instance.
Tags.getTags = function(instanceId, done) {
  Instances.getInstance(instanceId, function(instance) {
    done(instance.Tags);
  });
};
