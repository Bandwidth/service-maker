var request = require('request');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
  apiVersion: '2014-10-01'
, region: 'us-west-2'
});

var InstancePool = require('./InstancePool');
var Tags = require('./Tags');

var Instances = exports;

Instances.canSsh = function(instanceId, done) {
  var params = {
    InstanceIds: [instanceId]
  };

  ec2.describeInstanceStatus(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      var sshable = false;
      if (data.InstanceStatuses.length === 0) {
        return done(sshable);
      }
      // Can ssh when reachability status is passed.
      if (data.InstanceStatuses[0].SystemStatus.Details[0].Status === 'passed') {
        sshable = true;
      }
      return done(sshable);
    }
  });
};

// Schedules an instance's termination. terminationTime should
// be a Date object.
Instances.scheduleTermination = function(instanceId, terminationTime, done) {
  console.log('Termination of', instanceId, 'scheduled for', terminationTime);
  if (done) { done(); }
};

// Applies time to live tags to the specified instance.
// Assumes TTL is specifed in time from now, e.g. specifying
// 5 will result in a termination time 5 hours in the future.
// Minimum increments of time are specified in hours because
// AWS billing is hourly.
Instances.addTtl = function(instanceId, timeToLive, done) {
  var minutes = timeToLive * 60;
  var deathTime = new Date(new Date().getTime() + minutes * 60000);

  var tags = [
    {
      Key: 'terminationTime'
    , Value: deathTime.toString()
    }
  ];

  Tags.applyTags(tags, instanceId, function(instanceId) {
    console.log('Instance', instanceId, 'termination time set for', deathTime.toString());
    if (done) { done(); }
  });
};

// Searches the specified instance for TTL tags. If none,
// immediately return. Otherwise, schedule the TTL with the
// system. If the specified terminationTime has passed,
// stop the instance.
Instances.handleTtl = function(instance, done) {
  if (instance.State.Name != 'running') {
    if (done) { done(); }
    return;
  }
  if (instance.Tags === undefined) {
    if (done) { done(); }
    return;
  }
  instance.Tags.forEach(function(tag) {
    if (tag.Key === 'terminationTime') {
      var terminationTime = new Date(tag.Value);
      Instances.scheduleTermination(instance.InstanceId, terminationTime);
    }
  });
};

module.exports = Instances;
