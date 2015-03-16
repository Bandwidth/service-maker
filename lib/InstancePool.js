var request = require('request');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
  apiVersion: '2014-10-01'
, region: 'us-west-2'
});

var NaiveStrategy = require('./poolingStrategies/NaiveStrategy');

function InstancePool(strat) {

  // TODO: This should eventually change based on what
  // the user passes in.
  this.poolingStrategy = new NaiveStrategy();

  // Returns a list of all existing pool resources.
  this.getCurrentInstances = function(callback) {
    var params = {
      Filters: [
        {
          Name: 'tag-key'
        , Values: ['smake']
        }
      , {
          Name: 'tag-value'
        , Values: ['pool']
        }
      ]
    };

    // Query EC2 for existing smake pool resources
    ec2.describeInstances(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        callback(undefined);
      } else {

        var instances = data.Reservations[0].Instances;
        var currentInstances = {};

        // Iterate over each returned instance
        instances.forEach(function(instance) {
          var type = instance.InstanceType;
          var id = instance.InstanceId;

          // Define an object for the instance type if it doesn't already exist.
          if (currentInstances[type] === undefined) {
            currentInstances[type] = {
              ids: []
            };
          }

          // Add the instance id to a list.
          currentInstances[type].ids.push(id);
        });

        callback(currentInstances);
      }
    });
  };
}

InstancePool.prototype.initialize = function(server, done) {
  // Get a list of required instance types.
  var requiredInstances = this.poolingStrategy.getRequiredInstances();

  // Get a list of all current pool instances.
  this.getCurrentInstances(function(currentInstances) {
    if (currentInstances === undefined) {
      done();
      return;
    }
    server.log('info', 'Assimilating existing pool resources...');

    // Compare required and current instance counts.
    var diff = {};
    // Below is an example diff object
    // {
    //   { 't1.micro': 3 } // Create three t1.micro instances
    //   { 't2.micro': -1} // Destroy one t2.micro instance
    //   ...
    // }
    requiredInstances.forEach(function(requiredInstance) {
      var type = requiredInstance.type;
      var required = requiredInstance.count;
      var currently = 0;
      if (currentInstances[type] !== undefined) {
        currently = currentInstances[type].ids.length;
      }
      diff[type] = required - currently;
    });

    // Iterate over diff and create/destroy instances as necessary.
    Object.keys(diff).forEach(function(instanceType) {
      var typeDiff = diff[instanceType];

      // Destroy instances
      if (typeDiff < 0) {
        var destroyed = 0;
        currentInstances[instanceType].ids.forEach(function(id) {
          if (destroyed++ < Math.abs(typeDiff)) {
            server.log('info', 'Terminating ' + instanceType + ' instance ' + id);
          }
        });
      }

      // Create instancess
      if (typeDiff > 0) {
        var created = 0;
        if (currentInstances[instanceType]) {
          created = currentInstances[instanceType].ids.length;
        }
        for (; created < typeDiff; created++) {
          server.log('info', 'Starting new ' + instanceType + ' instance');
        }
      }

      // If typeDiff == 0, do nothing
    });

    server.log('info', 'Instance pool started successfully!');

    done();
  });
};

module.exports = InstancePool;
