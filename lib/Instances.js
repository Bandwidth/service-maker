var request = require('request');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
  apiVersion: '2014-10-01'
, region: 'us-west-2'
});

function Instances() {}

Instances.canSsh = function(instanceId, callback) {
  var params = {
    InstanceIds: [instanceId]
  };

  ec2.describeInstanceStatus(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      console.log(data.InstanceStatuses[0].SystemStatus);
      var sshable = false;
      // Can ssh when reachability status is passed.
      if (data.InstanceStatuses[0].SystemStatus.Details[0].Status === 'passed') {
        sshable = true;
      }
      callback(sshable);
    }
  });
};

module.exports = Instances;
