var should = require('chai').should();

before(function(done) {
  var app = require('../index.js');
  this.server = app;
  done();
});

describe('GET /v1/instances', function() {

  it('should be able to retrieve info for instance 5', function(done) {
    var request = {
      url: '/v1/instances/5'
    , method: 'GET'
    };
    this.server.inject(request, function(response) {
      should.exist(response);
      response.statusCode.should.equal(200);
      done();
    });
  });

  it('should require an instance ID', function(done) {
    var request = { url: '/v1/instances/', method: 'GET' };
    this.server.inject(request, function(response) {
      should.exist(response);
      response.statusCode.should.equal(404);
      done();
    });
  });

  it('should fail for instance ID 0', function(done) {
    var request = { url: '/v1/instances/0', method: 'GET' };
    this.server.inject(request, function(response) {
      should.exist(response);
      response.statusCode.should.equal(400);
      done();
    });
  });

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
