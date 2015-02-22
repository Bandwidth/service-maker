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

  it('should require sshKeyPair', function(done) {
    var request = {
      url: '/v1/instances'
    , method: 'POST'
    };
    this.server.inject(request, function(response) {
      should.exist(response);
      response.statusCode.should.equal(400);
      done();
    });
  });

  it('should only require sshKeyPair', function(done) {
    var request = {
      url: '/v1/instances'
    , method: 'POST'
    , payload: {
        sshKeyPair: '42'
      }
    };
    this.server.inject(request, function(response) {
      should.exist(response);
      response.statusCode.should.equal(201);
      done();
    });
  });

  it('should respond with resource location in header', function(done) {
    var request = {
      url: '/v1/instances'
    , method: 'POST'
    , payload: {
        sshKeyPair: '42'
      }
    };
    this.server.inject(request, function(response) {
      should.exist(response);
      response.statusCode.should.equal(201);
      should.exist(response.headers);
      should.exist(response.headers.location)
      response.headers.location.should.contain('/v1/instances/')
      done();
    });
  });

});
