var Hapi = require('hapi');
var Good = require('good');
var routes = require('./config/routes');
var AWS = require('aws-sdk');

var ec2 = new AWS.EC2({apiVersion: '2014-10-01'
  , accessKeyId: process.env.AWS_ACCESS_KEY_ID
  , secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  , region: 'us-west-2'
});

var params = {
	DryRun: false
	, Filters: [
		{
			Name: 'Name'
			, Values: [
			'Le Test'
			]
		}
	]
	, MaxResults: 1
};

ec2.describeTags(params, function(err, data) {
  if (err) {
    console.log(err, err.stack);
  } else {
    console.log(data);
  }
});

var server = new Hapi.Server();
server.connection({
  host: '0.0.0.0'
, port: parseInt(process.env.PORT) || 8000
});

server.route(routes);

if (!module.parent) { // Don't start server if testing
  var withGood = {
    register: Good
  , options: {
      reporters: [{
        reporter: require('good-console')
      , args: [{ log: '*', response: '*' }]
      }]
    }
  };
  server.register(withGood, function(error) {
    if (error) { throw error; } // Problem loading Good plugin
    server.start(function() {
      server.log('info', 'Server running at: ' + server.info.uri);
    });
  });
}

// Make the server accessible to other modules for testing
module.exports = server;
