var AwsHelper   = require('../../lib/helpers/aws');
var Environment = require('apparition').Environment;

var expect = require('chai').expect;

describe('The AWS helper', function() {
  function itIsReadOnly(object, property) {
    it('is read-only', function() {
      var originalValue = object[property];

      object[property] = 'foo';

      expect(object[property]).to.equal(originalValue);
    });
  }

  describe('API version', function() {
    it('is exported', function() {
      expect(AwsHelper).to.have.property('API_VERSION', '2015-04-15');
    });

    itIsReadOnly(AwsHelper, 'API_VERSION');
  });

  describe('default region', function() {
    it('is exported', function() {
      expect(AwsHelper).to.have.property('DEFAULT_REGION', 'us-east-1');
    });

    itIsReadOnly(AwsHelper, 'DEFAULT_REGION');
  });

  describe('creating a new EC2 client', function() {
    var client;

    before(function() {
      client = AwsHelper.createEc2Client();
    });

    it('uses the API version from the helper', function() {
      expect(client.config.apiVersion).to.equal(AwsHelper.API_VERSION);
    });

    it('uses the default region', function() {
      expect(client.config.region).to.equal(AwsHelper.DEFAULT_REGION);
    });

    describe('with a custom region', function() {
      var environment = new Environment();
      var region      = 'us-west-1';
      var client;

      before(function() {
        environment.set('AWS_REGION', region);
        client = AwsHelper.createEc2Client();
      });

      after(function() {
        environment.restore();
      });

      it('uses the specified region', function() {
        expect(client.config.region).to.equal(region);
      });
    });
  });
});
