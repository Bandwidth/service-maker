var request = require('request');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
  apiVersion: '2014-10-01'
, region: 'us-west-2'
});

var NaiveStrategy = require('./poolingStrategies/NaiveStrategy');

var poolingStrategy;

function InstancePool(strat) {

  // TODO: This should eventually change based on what
  // the user passes in.
  poolingStrategy = new NaiveStrategy();

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
      , {
          Name: 'instance-state-name'
        , Values: ['running', 'pending']
        }
      ]
    };

    // Query EC2 for existing smake pool resources
    ec2.describeInstances(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        callback(undefined);
      } else {

        var reservations = data.Reservations;
        if (!reservations) {
          callback(undefined);
          return;
        }
        if (!reservations[0]) {
          callback(undefined);
          return;
        }
        var currentInstances = {};
        reservations.forEach(function(reservation) {
          reservation.Instances.forEach(function(instance) {
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
        });

        callback(currentInstances);
      }
    });
  };
}

InstancePool.terminate = function(instanceId, callback) {
  var params = {
    InstanceIds: [instanceId]
  };
  ec2.terminateInstances(params, function(err, data) {
    if (err) {
      console.log(err, data);
    } else {
      callback(instanceId);
    }
  });
};

InstancePool.create = function(type, callback) {
  // Get ami list
  var amis = require('./defaultAmis.json');

  // Define instance paramaters
  var params = {
    ImageId: amis[type]
  , InstanceType: type
  , KeyName: '123abc'
  , MinCount: 1
  , MaxCount: 1
  };

  // Create the instance.
  ec2.runInstances(params, function(err, data) {
    if (err) {
      console.log('There was a problem creating the instance.', err);
      return;
    }

    // Get the instance ID
    var instanceId = data.Instances[0].InstanceId;

    // Apply tags.
    var tags = {
      Resources: [instanceId]
    , Tags: [
        {
          Key: 'smake'
        , Value: 'pool'
        }
      ]
    };

    ec2.createTags(tags, function(err) {
      if (err) {
        console.log('There was a problem applying tags to instance ' + instanceId, err);
        callback(undefined);
      } else {
        if (callback) {
          callback(instanceId);
        }
      }
    });
  });
};

// Removes smake pool tags from the specified instance.
// The instanceId is passed to the callback function.
InstancePool.removeFromPool = function(instanceId, callback) {
  // Remove pool tags
  var params = {
    Resources: [instanceId]
  , Tags: [
      {
        Key: 'smake'
      }
    ]
  };

  ec2.deleteTags(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      callback(instanceId);
    }
  });
};

InstancePool.prototype.initialize = function(server, done) {
  // Get a list of required instance types.
  var requiredInstances = poolingStrategy.getRequiredInstances();

  // Get a list of all current pool instances.
  this.getCurrentInstances(function(currentInstances) {
    if (currentInstances === undefined) {
      server.log('info', 'Did not find existing pool resources');
      // Create necessary instances.
      requiredInstances.forEach(function(requiredInstance) {
        var type = requiredInstance.type;
        var count = requiredInstance.count;
        for (var i = 0; i < count; i++) {
          InstancePool.create(type, function(instanceId) {
            server.log('info', 'Starting new ' + type + ' instance ' + instanceId);
          });
        }
      });
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
            InstancePool.terminate(id, function(instanceId) {
              server.log('info', 'Terminating ' + instanceType + ' instance ' + id);
            });
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
          var instanceId = InstancePool.create(instanceType, function(instanceId) {
            server.log('info', 'Starting new ' + instanceType + ' instance ' + instanceId);
          });
        }
      }

      // If typeDiff == 0, do nothing
    });

    server.log('info', 'Instance pool started successfully!');

    done();
  });
};

InstancePool.prototype.getInstance = function(instance, callback) {
  // Check if the instance is in the pool
  // If not, reply with something clever

  // Get an instance of the specified type
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
    , {
        Name: 'instance-state-name'
      , Values: ['running', 'pending']
      }
    , {
        Name: 'instance-type'
      , Values: [instance.type]
      }
    ]
  };

  // Query EC2 for existing smake pool resources
  ec2.describeInstances(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      callback(undefined);
    } else {

      var reservations = data.Reservations;
      if (!reservations) {
        callback(undefined);
        return;
      }
      if (!reservations[0]) {
        callback(undefined);
        return;
      }
      var instances = {
        running: []
      , pending: []
      };
      reservations.forEach(function(reservation) {
        reservation.Instances.forEach(function(instance) {
          var type = instance.InstanceType;
          var id = instance.InstanceId;
          var state = instance.State.Name;

          // Add the instanceId to a list depending on its state.
          instances[state].push(id);
        });
      });

      // Choose an instance to return:
      var toReturn;
      // Prefer running instances...
      if (instances.running.length > 0) {
        toReturn = instances.running[0];
      // ...but can also return pending instances, if necessary
      } else if (instances.pending.length > 0) {
        toReturn = instances.pending[0];
      //TODO: Handle case wherein no instances (running or pending) are available.
      }

      InstancePool.removeFromPool(toReturn, function() {
        poolingStrategy.notifyOfRemoval(toReturn);
        callback(toReturn);
      });

    }
  });
};

module.exports = InstancePool;
