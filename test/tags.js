var should = require('chai').should();

before(function(done) {
  var app = require('../index.js');
  this.server = app;
  done();
});

describe('POST /v1/instances/{instanceId}/tags', function() {

  it('should require an array of objects', function(done) {
    var request = {
      url: '/v1/instances/5/tags'
    , method: 'POST'
    , payload: [
        {
          Name: 'awesome name'
        , Value: 'really, it\'s great'
        }
      ]
    };
    this.server.inject(request, function(response) {
      should.exist(response);
      response.statusCode.should.equal(200);
      done();
    });
  });

  it('should accept multiple objects', function(done) {
    var request = {
      url: '/v1/instances/5/tags'
    , method: 'POST'
    , payload: [
        {
          Name: 'awesome name'
        , Value: 'really, it\'s great'
        }
      , {
          Name: 'just saying hi'
        , Value: 'hey hey hey'
        }
      ]
    };
    this.server.inject(request, function(response) {
      should.exist(response);
      response.statusCode.should.equal(200);
      done();
    });
  });

  it('should require a Value paramater for each object', function(done) {
    var request = {
      url: '/v1/instances/5/tags'
    , method: 'POST'
    , payload: [
        {
          Name: 'awesome name'
        }
      ]
    };
    this.server.inject(request, function(response) {
      should.exist(response);
      response.statusCode.should.equal(400);
      var payload = JSON.parse(response.payload);
      payload.message.should.equal('value at position 0 fails because Value is required');
      done();
    });
  });

  it('should require a Name paramater for each object', function(done) {
    var request = {
      url: '/v1/instances/5/tags'
    , method: 'POST'
    , payload: [
        {
          Value: 'what a value'
        }
      ]
    };
    this.server.inject(request, function(response) {
      should.exist(response);
      response.statusCode.should.equal(400);
      var payload = JSON.parse(response.payload);
      payload.message.should.equal('value at position 0 fails because Name is required');
      done();
    });
  });

});
