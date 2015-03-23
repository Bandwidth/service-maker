var request = require('request');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
  apiVersion: '2014-10-01'
, region: 'us-west-2'
});

var poolingStrategy;

function InstancePool(strategy) {

  // Default to naive strategy.
  if (typeof(strategy) === 'undefined') {
    strategy = 'NaiveStrategy';
  }
  var _strategy = require('./poolingStrategies/' + strategy);
  poolingStrategy = new _strategy();
}


// Terminates the specified instance, interrupting any running
// jobs and destroying the attached EBS volume. Completion of
// this non-reversible process is signaled via the callback.
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

// Creates an instance of the specified type. Uses the default
// keypair. Completion signaled via callback.
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

// Starts the instance pool. Examines all current EC2 instances.
// If there are existing pool resources, this function will
// assimilate them into the pooling strategy or terminate them,
// as necessary.
InstancePool.prototype.initialize = function(server, done) {
  // Get a list of required instance types.
  var requiredInstances = poolingStrategy.getRequiredInstances();

  // Get a list of all current pool instances.
  this.getPoolInstances(function(currentInstances) {
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

// Returns all instances that are currently in the instance pool.
// These instances are not removed from the pool.
InstancePool.prototype.getPoolInstances = function(callback) {
  var filters = [
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
  ];

  this.getPoolInstancesByFilters(filters, function(instances) {
    if (instances === undefined) {
      callback(undefined);
    } else {
      var currentInstances = {};
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

// Returns pool instances, grouped by type.
// Output is formatted as follows:
// {
//   running: [id1, id2, id3, ...]
// , pending: [id4, id5, ...]
// }
InstancePool.prototype.getPoolInstancesByState = function(type, callback) {
  var filters = [
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
    , Values: [type]
    }
  ];

  this.getPoolInstancesByFilters(filters, function(instances) {
    var instancesByState = {
      running: []
    , pending: []
    };
    instances.forEach(function(instance) {
      var type = instance.InstanceType;
      var id = instance.InstanceId;
      var state = instance.State.Name;

      // Add the instanceId to a list depending on its state.
      instancesByState[state].push(id);
    });
    callback(instancesByState);
  });
};

// Returns all instances that match the specified filters.
// Note that this method may return instances that are not
// part of the instance pool.
InstancePool.prototype.getPoolInstancesByFilters = function(filters, callback) {
  // Get an instance of the specified type
  var params = {
    Filters: filters
  };

  // Query EC2 for resources
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
      var instances = [];
      reservations.forEach(function(reservation) {
        reservation.Instances.forEach(function(instance) {
          instances.push(instance);
        });
      });

      callback(instances);
    }
  });
};

// Gets an instance of the specified type from the instance pool.
// The returned instance will no longer be part of the pool after calling
// this method. Its replacement will be handled by the pooling
// strategy specified when the instance pool was initialized.
InstancePool.prototype.getInstance = function(instance, callback) {
  this.getPoolInstancesByState(instance.type, function(instances) {
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
  });
};

module.exports = InstancePool;
