#!/usr/bin/env node

var program = require('commander');
var request = require('request');

program
  .version('0.0.1')
  .option('-c, --create', 'Create an AWS resource')
  .option('-e, --error', 'Throw an error!');

program
  .command('list')
  .description('list all currently allocated resources')
  .action(function(env, options) {
    var url = 'http://localhost:8000/v1/instances';
    request({
        method: 'GET'
      , url: url
      }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('\nThe following instances are currently available: \n');
        var instances = JSON.parse(body);
        instances.forEach(function(instance, index, array) {
          var id = instance.InstanceId;
          var state = instance.State;
          var instanceType = instance.InstanceType;
          console.log(id + ' -' + instanceType + ' [' + state + ']');
        });
      }
    });
  });

program
  .command('find [id]')
  .description('find an instance by its ID')
  .action(function(id) {
    var url = 'http://localhost:8000/v1/instances/' + id;
    request({
        method: 'GET'
      , url: url
      }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body)[0];
        console.log(id);
        console.log('State:  ' + body.State);
        console.log('Type:   ' + body.InstanceType);
        console.log('sshKey: ' + body.KeyName);
        //console.log(body.Tags[0]);
        if (body.Tags) {
          console.log('Tag Info:');
          body.Tags.forEach(function(tag) {
            console.log('Key:', tag.Key, '   ', 'Value:', tag.Value);
          });
          console.log('No tag available');
        }
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
      request({
        method: 'GET'
      , url: url
      }, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          var printed = false;
          var instances = JSON.parse(body);
          instances.forEach(function(instance, index, array) {
            var id = instance.InstanceId;
            var state = instance.State.Name;
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

program
  .command('create [instanceType]')
  .description('Create a new instance of the specified type')
  .action(function(instanceType, options) {
    var url = {
      url: 'http://localhost:8000/v1/instances'
    , method: 'POST'
    , body: JSON.stringify({
        type: instanceType
      , sshKeyPair: 'smake'
      })
    };
    request(url, function(error, response, body) {
      if (!error && response.statusCode == 201) {
        console.log('\n New instance has been created \n');
      }
    });
  });

program
  .command('terminate [instanceID]')
  .description('Terminate instance with the specified ID')
  .action(function(instanceID, options) {
    var url = 'http://localhost:8000/v1/instances/' + instanceID;
    request({
        method: 'PUT'
      , url: url
      , body: JSON.stringify({
          state: 'terminated'
        })
      }, function(error, response, body) {
      if (!error && response.statusCode == 204) {
        console.log('\n ' + instanceID + ' has been terminated' + '\n');
      }
    });
  });

program
  .command('stop [instanceID]')
  .description('Stop instance with the specified ID')
  .action(function(instanceID, options) {
    var url = 'http://localhost:8000/v1/instances/' + instanceID;
    request({
        method: 'PUT'
      , url: url
      , body: JSON.stringify({
          state: 'stopped'
        })
      }, function(error, response, body) {
      if (!error && response.statusCode == 204) {
        console.log('\n ' + instanceID + ' has been stopped' + '\n');
      }
    });
  });

program
  .command('start [instanceID]')
  .description('Start instance with the specified ID')
  .action(function(instanceID, options) {
    var url = 'http://localhost:8000/v1/instances/' + instanceID;
    request({
        method: 'PUT'
      , url: url
      , body: JSON.stringify({
          state: 'running'
        })
      }, function(error, response, body) {
      if (!error && response.statusCode == 204) {
        console.log('\n ' + instanceID + ' has been started' + '\n');
      }
    });
  });
program.parse(process.argv);

if (program.error) {
  var urls = 'http://localhost:8000/new/this/shouldnt/work';
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 404) {
      console.log('There\'s nothing here :(');
    } else {
      console.log(error);
    }
  });
  console.log('Warning: Error');
}

if (program.listAll) {
  console.log(AWSInstances);
}
