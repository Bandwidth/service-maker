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

  // it('should be able to get all instances', function(done) {
  //   var request = {
  //     url: '/v1/instances/'
  //   , method: 'GET'
  //   };
  //   this.server.inject(request, function(response) {
  //     should.exist(response);
  //     console.log(response.payload);
  //     response.statusCode.should.equal(200);
  //     done();
  //   });
  // });

  // it('should be able to retrieve info for instance i-12182a1e', function(done) {
  //   var request = {
  //     url: '/v1/instances/i-12182a1e'
  //   , method: 'GET'
  //   };
  //   this.server.inject(request, function(response) {
  //     should.exist(response);
  //     response.statusCode.should.equal(200);
  //     should.exist(response.payload.Tags);
  //     response.payload.Tags[0].Key.should.equal('Name');
  //     response.payload.Tags[0].Value.should.equal('Huehuehue')
  //     done();
  //   });
  // });

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
