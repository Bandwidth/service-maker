var AWS       = require('aws-sdk');
var AwsHelper = module.exports = {};

AwsHelper.API_VERSION    = '2015-04-15';
AwsHelper.DEFAULT_REGION = 'us-east-1';

AwsHelper.createEc2Client = function() {
  return new AWS.EC2({
    apiVersion : AwsHelper.API_VERSION
  , region     : process.env.AWS_REGION || AwsHelper.DEFAULT_REGION
  });
};

Object.freeze(AwsHelper);
