var request = require('request');

function NaiveStrategy() {
  this.requiredInstances = [
    {
      type: 't1.micro'
    , count: 1
    }
  , {
      type: 't2.micro'
    , count: 1
    }
  ];

  this.getRequiredInstances = function() {
    return this.requiredInstances;
  };
}

// The naive strategy adopts a simple replacement mechanism.
NaiveStrategy.prototype.notifyOfRemoval = function(instanceId) {
  // TODO: Probably a better way to do this.
  var url = 'http://localhost:8000/v1/instances/' + instanceId;
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var instance = JSON.parse(body)[0];
      var type = instance.InstanceType;
      var InstancePool = require('./../InstancePool');
      InstancePool.create(type);
    }
  });
};

module.exports = NaiveStrategy;
