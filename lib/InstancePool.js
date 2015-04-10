var request = require('request');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
  apiVersion: '2014-10-01'
, region: 'us-west-2'
});

var Instances = require('./Instances');
var Tags = require('./Tags');

var poolingStrategy;
const POOL_TAGS = [
  {
    Key: 'smake'
  , Value: 'pool'
  }
];
const SSHABLE_TAG = {
  Key: 'sshable'
, Value: 'false'
};
const SSH_POLLING_INTERVAL = 30; // seconds

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

// Adds an instance of the specified type to the instance pool.
// Uses the default keypair. Completion signaled via callback.
InstancePool.create = function(type, _callback) {
  function callback(instanceId) {
    if (_callback) {
      _callback(instanceId);
    }
  }

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

    // Apply pool tags to the new instance.
    var instanceId = data.Instances[0].InstanceId;
    var tags = POOL_TAGS;
    tags.push(SSHABLE_TAG);
    Tags.applyTags(tags, instanceId, callback(instanceId));

    // We just notifed the caller that we were done, but there's a
    // bit more we should do. Doing it like this allows the caller
    // to continue chugging along while we wrap things up. This
    // enables the system to respond more quickly than it would otherwise.

    // Periodically check if the instance is accepting ssh connections.
    InstancePool.startSshPolling(instanceId);
  });
};

// Periodically check if it's possible to ssh into the instance.
// SSH_POLLING_INTERVAL determines the interval for polling.
// Checks immediately upon calling, and then at the specified interval.
InstancePool.startSshPolling = function(instanceId) {
  var pollingInterval = SSH_POLLING_INTERVAL * 1000; // Convert to ms
  var interval = setInterval(function() {
    Instances.canSsh(instanceId, function(sshable) {
      if (sshable) {
        InstancePool.onSshable(instanceId, interval);
      } else {
      }
    });
  }, pollingInterval);
};

// Called when it becomes possible to ssh into the instance.
// Sets the 'sshable' tag to 'true'
// Also cancels the setInterval function that was polling
// AWS to determine this.
InstancePool.onSshable = function(instanceId, interval) {
  if (interval) { clearInterval(interval); } // Stop polling.
  Tags.removeTags([SSHABLE_TAG], instanceId, function() {
    var tags = SSHABLE_TAG;
    tags.Value = 'true';
    Tags.applyTags([tags], instanceId, function() {
      console.log('Instance', instanceId, 'reports status checks passed. Adding to pool.');
    });
  });
};

// Removes smake pool tags from the specified instance.
// The instanceId is passed to the callback function.
InstancePool.removeFromPool = function(instanceId, _done) {
  function done() { if (_done) { _done(); } }
  var tags = POOL_TAGS;
  tags.push({ Key: SSHABLE_TAG.Key });
  Tags.removeTags(tags, instanceId, function() {
    done();
  });
};

// Assimilates an existing pool resource into a newly created pool.
InstancePool.assimilate = function(instance, _done) {
  function done() { if (_done) { _done(); } }

  // Take appropriate action based on ttl tag.
  Instances.handleTtl(instance);

  // Set 'sshable' tag as appropriate
  Instances.canSsh(instance.InstanceId, function(sshable) {
    if (sshable === true) {
      InstancePool.onSshable(instance.InstanceId);
    } else {
      InstancePool.startSshPolling(instance.InstanceId);
    }
  });
};

// Starts the instance pool. Examines all current EC2 instances.
// If there are existing pool resources, this function will
// assimilate them into the pooling strategy or terminate them,
// as necessary.
InstancePool.prototype.initialize = function(server, done) {
  // Restart existing termination schedules (TTL's)
  this.getPoolInstancesByFilters(undefined, function(instances) {
    instances.forEach(function(instance) {
      Instances.handleTtl(instance);
    });
  });

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

    // Reschedule existing termination times.
    Object.keys(currentInstances).forEach(function(instanceType) {
      currentInstances[instanceType].forEach(function(instance) {
        InstancePool.assimilate(instance);
      });
    });

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
        currently = currentInstances[type].length;
      }
      diff[type] = required - currently;
    });

    // Iterate over diff and create/destroy instances as necessary.
    Object.keys(diff).forEach(function(instanceType) {
      var typeDiff = diff[instanceType];

      // Destroy instances
      if (typeDiff < 0) {
        var destroyed = 0;
        currentInstances[instanceType].forEach(function(currentInstance) {
          if (destroyed++ < Math.abs(typeDiff)) {
            InstancePool.terminate(currentInstance.InstanceId, function(instanceId) {
              server.log('info', 'Terminating ' + instanceType + ' instance ' + instanceId);
            });
          }
        });
      }

      // Create instancess
      if (typeDiff > 0) {
        var created = 0;
        if (currentInstances[instanceType]) {
          created = currentInstances[instanceType].length;
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

// Creates the specified number of instances.
// Specify creation details as follows:
// {
//   't1.micro': 1
// , 't2.micro': 3
//   ...
// }
InstancePool.createInstances = function(instances, callback) {
  Object.keys(instances).forEach(function(instanceType) {
    var typeDiff = instances[instanceType];

    // Create instancess
    if (typeDiff > 0) {
      for (var created = 0; created < typeDiff; created++) {
        var instanceId = InstancePool.create(instanceType, function(instanceId) {
          console.log('info', 'Starting new ' + instanceType + ' instance ' + instanceId);
        });
      }
    }

    // If typeDiff == 0, do nothing
  });
  if (callback) {
    callback();
  }
};

// Returns all instances that are currently in the instance pool,
// grouped by type. Example return object:
// {
//   't1.micro': [InstanceObject1, InstanceObject2, ...]
//   ...
// }
// These instances are not removed from the pool, nor is their
// formatting changed.
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
          currentInstances[type] = [];
        }

        // Add the instance to a list.
        currentInstances[type].push(instance);
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
InstancePool.prototype.getPoolInstancesByType = function(type, callback) {
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
    callback(instances);
  });
};

// Returns all instances that match the specified filters.
// Note that this method may return instances that are not
// part of the instance pool.
InstancePool.prototype.getPoolInstancesByFilters = function(filters, callback) {
  // Refine filters
  var params = {};
  if (filters) {
    params.Filters = filters;
  }

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
InstancePool.prototype.getInstance = function(instanceSpec, callback) {
  this.getPoolInstancesByType(instanceSpec.type, function(instances) {
    // Organize the instances by state.
    // This will allow us to return pending instances if no
    // running instances are available.
    var instancesByState = {
      running: []
    , pending: []
    };
    instances.forEach(function(instance) {
      var type = instance.InstanceType;
      var id = instance.InstanceId;
      var state = instance.State.Name;
      var tags = instance.Tags;

      // Add the instanceId to a list depending on its state.
      instancesByState[state].push(instance);
    });

    // Choose an instance to return:
    var toReturn;
    // Need an instance that is running...
    if (instancesByState.running.length > 0) {
      // ..and that we can ssh into
      instancesByState.running.forEach(function(instance) {
        instance.Tags.forEach(function(tag) {
          if (tag.Key == 'sshable' && tag.Value == 'true') {
            toReturn = instance.InstanceId;
          }
        });
      });

      // If no instances are ready, stop
      if (toReturn === undefined) {
        console.log('Client requested', instanceSpec.type, 'instance, but one wasn\'t ready');
        return callback(undefined);
      }

    } else { // No running instances
      console.log('Client requested', instanceSpec.type, 'instance, but one wasn\'t ready');
      return callback(undefined);
    }

    // // Prefer running instances...
    // if (instancesByState.running.length > 0) {
    //   toReturn = instancesByState.running[0];
    // // ...but can also return pending instances, if necessary
    // } else if (instancesByState.pending.length > 0) {
    //   toReturn = instancesByState.pending[0];
    // }

    // Apply TTL tags if specified
    if (instanceSpec.ttl !== undefined) {
      Instances.addTtl(toReturn, instanceSpec.ttl);
    }

    InstancePool.removeFromPool(toReturn, function() {
      poolingStrategy.notifyOfRemoval(instanceSpec.type, function(toCreate) {
        InstancePool.createInstances(toCreate);
      });
      callback(toReturn);
    });
  });
};

module.exports = InstancePool;
