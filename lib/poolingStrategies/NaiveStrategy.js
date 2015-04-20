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
NaiveStrategy.prototype.notifyOfRemoval = function(instanceType, callback) {
  // TODO: Probably a better way to do this.
  var createPlease = {};
  createPlease[instanceType] = 1;
  callback(createPlease);
};

module.exports = NaiveStrategy;
