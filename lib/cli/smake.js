#!/usr/bin/env node

var program = require('commander');
var request = require('request');

program
  .version('0.0.1')
  .option('-c, --create', 'Create an AWS resource')
  .option('-e, --error', 'Throw an error!')
  .option('-d, --delete <AwsID or User Name>', 'Delete an AWS instance')
  .option('-s, --search <AwsID or User Name>', 'Search for an AWS instance')
  .option('-l, --listAll', 'List all the AWS instances information')

program
  .command('list')
  .description('list all currently allocated resources')
  .action(function(env, options) {
    var url = 'http://localhost:8000/v1/instances';
    request(url, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('\nThe following instances are currently available: \n');
        var instances = JSON.parse(body);
        instances.forEach(function(instance, index, array) {
          var id = instance.InstanceId;
          var state = instance.State;
          console.log(id + ' (' + state + ')');
        });
      }
    });
  });

program
  .command('find [id]')
  .description('find an instance by its ID')
  .action(function(id) {
    var url = 'http://localhost:8000/v1/instances/' + id;
    request(url, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body)[0];
        console.log(id + ' is ' + body.State + '.');
      } else {
        console.log();
        console.log('It doesn\'t look like that instance exists.');
        console.log();
        console.log('Try running \'smake list\' to get a list of available instances.');
      }
    });
  });

program
  .command('find_by [feature] [query]')
  .description('find an instance by a defining feature')
  .action(function(feature, query) {
    if (feature === 'state') {
      var url = 'http://localhost:8000/v1/instances';
      request(url, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          var printed = false;
          var instances = JSON.parse(body);
          instances.forEach(function(instance, index, array) {
            var id = instance.InstanceId;
            var state = instance.State;
            if (state == query) {
              console.log(id);
              printed = true;
            }
          });
          if (!printed) {
            console.log('There are no ' + query + ' instances.');
          }
        }
      });
    }
  }).on('--help', function() {
    console.log('  Examples: ');
    console.log();
    console.log('   smake find_by state stopped');
    console.log('   smake find_by state running');
    console.log();
  });

program.parse(process.argv);

var AWSInstances = {awsID:'abc123', userName:'Nobody'};

if (program.create) {
  var url = 'http://localhost:8000/new';
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 201) {
      console.log(body);
    }
  });
  console.log('Your resource was created!');
}

if (program.search) {
  if (process.argv[2] == 'search' &&
    (process.argv[3] == AWSInstances.awsID || process.argv[3] == AWSInstances.userName)) {
    console.log(AWSInstances);
  } else {
    console.log(process.argv[3] + ' can\'t be located');
  }
}

if (program.delete) {
  if (process.argv[2] == 'delete' &&
    (process.argv[3] == AWSInstances.awsID || process.argv[3] == AWSInstances.userName)) {
    console.log('Instances has been deleted');
    AWSInstances = {};
  } else {
    console.log(process.argv[3] + ' can\'t be located');
  }
}

if (program.error) {
  var url = 'http://localhost:8000/new/this/shouldnt/work';
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 404) {
      console.log('There\'s nothing here :(');
    }
  });
  console.log('Warning: Error');
}

if (program.listAll) {
  console.log(AWSInstances);
}
