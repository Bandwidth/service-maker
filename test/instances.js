var should = require('chai').should();

before(function(done) {
  var app = require('../index.js');
  this.server = app;
  done();
});

describe('GET /v1/instances', function() {

  //
  // Need to figure out how to authenticate TravisCI before
  // testing will work here.
  //

});

describe('POST /v1/instances', function() {

  //
  // Need to have a testing discussion before we can write
  // real tests involving instance creation.
  //

});
