#!/usr/bin/env node

var program = require('commander');
var request = require('request');
var table = require('text-table');

program
  .version('0.0.1')
  .option('-e, --error', 'Throw an error!');

program
  .command('list')
  .description('list all currently allocated resources')
  .action(function(env, options) {
    var url = 'http://localhost:8000/v1/instances';
    var counter = 0;
    var isAvailable = [];
    var isUnavailable = [];
    request({
        method: 'GET'
      , url: url
      }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var instances = JSON.parse(body);
        console.log();

        instances.forEach(function(instance) {
          var type = instance.InstanceType;
          // Check for terminated instances so they won't be included in the output
          if (instance.State !== 'terminated') {
            if (inPool (instance)) {
              if (isAvailable[type] === undefined) {
                isAvailable[type] = [];
              }
              isAvailable[type].push(instance);
            } else {
              if (isUnavailable[type] === undefined) {
                isUnavailable[type] = [];
              }
              isUnavailable[type].push(instance);
            }
          }
        });

        console.log('The following instance typs are ready for use');
        Object.keys(isAvailable).forEach(function(type) {
          console.log(type, ':', isAvailable[type].length);
        });
        console.log();
        console.log('The following instance types are currently in use');
        Object.keys(isUnavailable).forEach(function(type) {
          console.log(type, ':', isUnavailable[type].length);
        });
        console.log();
      }
    });
  });

//Check to see if an instance is in the pool
function inPool(instance) {
  var sshable = false;
  instance.Tags.forEach (function(tag) {
    if (tag.Key == 'sshable' && tag.Value == 'true') {
      sshable = true;
    }
  });
  return sshable;
}

program
  .command('find [id]')
  .description('Find an instance by its ID')
  .action(function(id) {
    var url = 'http://localhost:8000/v1/instances/' + id;
    request({
        method: 'GET'
      , url: url
      }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body)[0];
        var sshable = false;
        if (body.Tags) {
          body.Tags.forEach(function(tag) {
            if (tag.Key === 'sshable' && tag.Value === 'true') {
              sshable = true;
            }
          });
        }
        //Print out instance info in tabular format
        var t = table([
          ['Instance ID', 'State', 'Type', 'Key', 'IP Address', 'sshable']
          , [id, body.State, body.InstanceType, body.KeyName, body.PublicIpAddress, sshable]
        ]);
        console.log('\n' + t + '\n');
      } else {
        console.log();
        console.log('It doesn\'t look like that instance exists.');
        console.log();
        console.log('Try running \'smake list\' to get a list of available instances.');
      }
    });
  });

program
  .command('create [instanceType]')
  .description('Create a new instance of the specified type')
  .option('-n, --name <name>', 'Set the instance name')
  .action(function(instanceType, options) {
    var url = {
      url: 'http://localhost:8000/v1/instances'
    , method: 'POST'
    , body: JSON.stringify({
        type: instanceType
      , sshKeyPair: 'smake'
      })
    };
    //Make a POST request call to create a new instance with the specified type
    request(url, function(error, response, body) {
      if (!error && response.statusCode == 201) {
        console.log('\n' + 'Okay ');
        var instanceUrl = 'http://localhost:8000' + response.headers.location;
        //Make a GET request call to get instance info to be used for applying tag later
        request({
          method: 'GET'
        , url: instanceUrl
        }, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            body = JSON.parse(body)[0];
            console.log('Your new instance is located at', body.PublicIpAddress, '\n');
            var instanceTagUrl = instanceUrl + '/tags';
            if (options.name) {
              var tagUrl = {
                url: instanceTagUrl
              , method: 'POST'
              , body: JSON.stringify({
                  Tags: [{
                    Key: 'Name'
                  , Value: options.name
                  }]
                })
              };
              //Make a POST request call to apply tag to the instance
              request (tagUrl, function(error, repsonse, body) {
                if (error && response.statusCode != 200) {
                  console.log('Tag wasn\'t successfully applied');
                }
              });
            }
          }
        });
      }
    });
  });

program
  .command('terminate [instanceID]')
  .description('Terminate instance with the specified ID')
  .action(function(instanceID, options) {
    var url = 'http://localhost:8000/v1/instances/' + instanceID;
    request({
        method: 'GET'
      , url: url
      }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          body = JSON.parse(body)[0];
          var isInPool = false;
          //Check to see if the instance is in the pool
          if (inPool(body)) {
            isInPool = true;
          }
          //If instance is not in the pool (is being used), then it can be terminated
          if (isInPool === false) {
            request({
              method: 'PUT'
            , url: url
            , body: JSON.stringify({
              state: 'terminated'
            })
            }, function(error, response, body) {
              if (!error && response.statusCode == 204) {
                console.log('\n' + instanceID + ' has been terminated' + '\n');
              }
            });
          } else {
            console.log('\n ' + instanceID + ' is in the pool. Cannot be terminated' + '\n');
          }
        } else {
          console.log();
          console.log('It doesn\'t look like that instance exists.');
          console.log();
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
