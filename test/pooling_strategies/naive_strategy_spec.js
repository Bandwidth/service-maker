const sinon = require('sinon');
const should = require('chai').should();

const NaiveStrategy = require('./../../lib/poolingStrategies/NaiveStrategy');

describe('NaiveStrategy', function() {
  var strat;

  beforeEach(function() {
    strat = new NaiveStrategy();
  })

  describe('.getRequiredInstances', function() {
    it('should return an array of required instances', function(done) {
      done();
    })
  })

  describe('#notifyOfRemoval', function() {
    it('should require that the instance be replaced', function(done) {
      done();
    })
  })

})
