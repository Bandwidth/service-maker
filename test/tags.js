const should = require('chai').should();
const mockery = require('mockery');
const nock = require('nock');
const request = require('request');

const API_PATH = 'http://localhost:8000';

var Tags;

before(function(done) {
  mockery.registerSubstitute('./../../lib/Tags', './mocks/tags_mocks');
  mockery.registerAllowable('./_stream_duplex');
  mockery.enable();

  Tags = require('./../../lib/Tags');

  done();
});

after(function(done) {
  mockery.disable();
  done();
});

describe('Tags', function() {
  it('should use the mocked library', function(done) {
    should.exist(Tags);
    Tags.foo().should.equal('this is mocked');
    done();
  });

  describe('#applyTags', function(done) {

    it('should apply tags', function(done) {
      Tags.applyTags('wonderful tags', 'instanceId', function(instanceId) {
        instanceId.should.equal('instanceId');
        done();
      })
    });

  });

  describe('#removeTags', function(done) {

    it('should remove tags', function(done) {
      Tags.removeTags('wonderful tags', 'instanceId', function(instanceId) {
        instanceId.should.equal('instanceId');
        done();
      })
    });

  });
});

describe('POST /v1/instances/{instanceId}/tags', function() {

  it('should require an array of objects', function(done) {

    var tags = {
      Tags: [
        {
          Key: 'awesome name'
        , Value: 'really, it\'s awesome'
        }
      ]
    }

    var api = nock('http://localhost:8000')
      .post('/v1/instances/5/tags', tags)
      .reply(200);

    var params = {
      url: API_PATH + '/v1/instances/5/tags'
    , method: 'POST'
    , body: JSON.stringify(tags)
    };
    request(params, function(error, response, body) {
      should.not.exist(error);
      response.statusCode.should.equal(200);
      api.done();
      done();
    })
  });

  it('should accept multiple objects', function(done) {
    var tags = {
      Tags: [
        {
          Key: 'awesome name'
        , Value: 'really, it\'s awesome'
        }
      , {
          Key: 'just saying hi'
        , Value: 'hey hey hey'
        }
      ]
    };

    var api = nock('http://localhost:8000')
      .post('/v1/instances/5/tags', tags)
      .reply(200);

    var params = {
      url: API_PATH + '/v1/instances/5/tags'
    , method: 'POST'
    , body: JSON.stringify(tags)
    };
    request(params, function(err, response, body) {
      should.exist(response);
      response.statusCode.should.equal(200);
      api.done();
      done();
    });
  });

  it('should require a Value paramater for each object', function(done) {
    var tags = {
      Tags: [
        {
          Key: 'awesome name'
        }
      ]
    };

    var api = nock('http://localhost:8000')
      .post('/v1/instances/5/tags', tags)
      .reply(400);

    var params = {
      url: API_PATH + '/v1/instances/5/tags'
    , method: 'POST'
    , body: JSON.stringify(tags)
    };
    request(params, function(err, response, body) {
      should.exist(response);
      response.statusCode.should.equal(400);
      api.done();
      done();
    });
  });

  it('should require a Key paramater for each object', function(done) {
    var tags = {
      Tags: [
        {
          Value: 'waht a value'
        }
      ]
    };

    var api = nock('http://localhost:8000')
      .post('/v1/instances/5/tags', tags)
      .reply(400);

    var params = {
      url: API_PATH + '/v1/instances/5/tags'
    , method: 'POST'
    , body: JSON.stringify(tags)
    };
    request(params, function(err, response, body) {
      should.exist(response);
      response.statusCode.should.equal(400);
      api.done();
      done();
    })
  });

});
