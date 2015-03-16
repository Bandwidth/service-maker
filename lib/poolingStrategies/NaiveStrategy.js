function NaiveStrategy() {
  this.requiredInstances = [
    {
      type: 't1.micro'
    , count: 0
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

module.exports = NaiveStrategy;
