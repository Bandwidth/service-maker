const sinon = require('sinon');
const should = require('chai').should();
const proxyquire = require('proxyquire');

var InstancePool = require('./../lib/InstancePool');
var Helper = require('./test_helper');

var stub;

after(function(done) {
  if (stub) { stub.restore(); }
  done();
})

describe('InstancePool', function() {

  describe('constructor', function() {

    it('should accept a strategy paramater', function(done) {

      var strategy = 'amazing_strategy';
      var stubbedFunctions = {};
      var strategyStub = ['./poolingStrategies', strategy].join('/');
      console.log(strategyStub);
      poolStub = proxyquire('./../lib/InstancePool', { strategyStub: stubbedFunctions });
      pool = new poolStub('amazing_strategy');

      stub.called.should.be.true();
      done();
    })

  })

})
