var request = require('request');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
  apiVersion: '2014-10-01'
, region: 'us-west-2'
});

var InstancePool = require('./InstancePool');
var Tags = require('./Tags');

var Instances = exports;

Instances.ec2 = ec2;

Instances.canSsh = function(instanceId, callback) {
  var params = {
    InstanceIds: [instanceId]
  };

  Instances.ec2.describeInstanceStatus(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      var sshable = false;
      if (data.InstanceStatuses.length === 0) {
        return callback(sshable);
      }
      // Can ssh when reachability status is passed.
      if (data.InstanceStatuses[0].SystemStatus.Details[0].Status === 'passed') {
        sshable = true;
      }
      return callback(sshable);
    }
  });
};

// Schedules an instance's termination. terminationTime should
// be a Date object.
Instances.scheduleTermination = function(instanceId, terminationTime, done) {
  var now = new Date();
  var milisInFuture = Math.abs(now.getTime() - terminationTime.getTime());
  setTimeout(function() {
    Instances.terminate(instanceId, function() {
      console.log('Terminated instance', instanceId, 'on schedule.');
    });
  }, milisInFuture);
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
      Key: 'Termination Time'
    , Value: deathTime.toString()
    }
  ];

  Tags.applyTags(tags, instanceId, function(instanceId) {
    Instances.scheduleTermination(instanceId, deathTime, function() {
      if (done) { done(); }
    });
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
  var instanceId = instance.InstanceId;
  var instanceType = instance.instanceType;
  instance.Tags.forEach(function(tag) {
    if (tag.Key === 'Termination Time') {
      var terminationTime = new Date(tag.Value);
      var now = new Date();
      if (terminationTime < now) {
        Instances.terminate(instance.InstanceId, function() {
          console.log('Terminated', instanceType, 'instance', instanceId, 'because its termination time had passed.');
        });
      } else {
        Instances.scheduleTermination(instance.InstanceId, terminationTime);
      }
    }
  });
};

Instances.getInstance = function(instanceId, done) {
  var params = {
    InstanceIds: [instanceId]
  };
  Instances.ec2.describeInstances(params, function(err, data) {
    if (err) {
      console.log(err);
    } else {
      // EC2 returns multiple reservations.
      // Each has a list of instances associated with it.
      var instanceInfo = [];
      data.Reservations.forEach(function(reservation) {
        reservation.Instances.forEach(function(instance) {
          instanceInfo.push(instance);
        });
      });
      done(instanceInfo[0]);
    }
  });
};

// Terminates the specified instance, interrupting any running
// jobs and destroying the attached EBS volume. Completion of
// this non-reversible process is signaled via the callback.
Instances.terminate = function(instanceId, callback) {
  var params = {
    InstanceIds: [instanceId]
  };
  Instances.ec2.terminateInstances(params, function(err, data) {
    if (err) {
      console.log(err, data);
    } else {
      callback(instanceId);
    }
  });
};

module.exports = Instances;
