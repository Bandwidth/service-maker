var should = require('chai').should();

before(function(done) {
  var app = require('../index.js');
  this.server = app;
  this.server.connection({ host: 'test' });
  done();
});

describe('GET /', function() {

  it('should be connectable', function(done) {
    var request = { url: '/', method: 'GET' };
    this.server.inject(request, function(response) {
      response.statusCode.should.equal(200);
      done();
    });
  });

});
