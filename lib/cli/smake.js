#!/usr/bin/env node

var program = require('commander');
var request = require('request');
var table = require('text-table');
var util = require('util');

program
  .version('1.0.0');

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
  .command('list')
  .description('list all currently allocated resources')
  .option('-d, --details', 'List more information about each individual instance')
  .action(function(env, options) {
    var counter = 0;
    var isAvailable = [];
    var isUnavailable = [];
    var instancesRequest = {
      url: 'http://localhost:8000/v1/instances'
    , method: 'GET'
    };
    request(instancesRequest, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var instances = JSON.parse(body);
        console.log();

        instances.forEach(function(instance) {
          var type = instance.InstanceType;
          // Check for terminated instances so they won't be included in the output
          if (instance.State === 'running') {
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

        console.log('The following instance types are ready for use');
        var keys = Object.keys(isAvailable);
        if (keys.length === 0) {
          console.log('No instances are ready.');
          console.log('This is likely because the system is under high demand and ' +
            'instances are being used faster than they are being replaced. Trying again ' +
            'later should fix the problem.');
          console.log('This could also be because the server was not configured to ' +
            'start any instances. If you experience this problem regulalry, contact the administrator.');
        } else {
          keys.forEach(function(type) {
            console.log(type, ':', isAvailable[type].length);
          });
        }
        console.log();
        console.log('The following instance types are running, but either in use or starting up');
        keys = Object.keys(isUnavailable);
        if (keys.length === 0) {
          console.log('None!');
        } else {
          keys.forEach(function(type) {
            console.log(type, ':', isUnavailable[type].length);
          });
        }
        console.log();
      }
    });
  });

// Print instance details in tabular format.
function printDetailsOf(instance) {
  var i = instance;
  var sshable = isSshable(instance);
  var details = table([
    ['InstanceId', 'State', 'Type',        'Key',     'PublicIP',      'SSH Ready']
  , [i.InstanceId, i.State, i.InstanceType, i.KeyName, i.PublicIpAddress, sshable]
  ]);
  console.log();
  console.log(details);
  console.log();
}

// Checks for sshable tag.
function isSshable(instance) {
  var sshable = false;
  if (instance.Tags) {
    instance.Tags.forEach(function(tag) {
      if (tag.Key === 'sshable' && tag.Value === 'true') {
        sshable = true;
      }
    });
  }
  return sshable;
}

program
  .command('find [id]')
  .description('Find an instance by its ID')
  .action(function(id) {
    var forDetails = {
      url: 'http://localhost:8000/v1/instances/' + id
    , method: 'GET'
    };
    request(forDetails, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body)[0];
        printDetailsOf(body);
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
  .option('-n, --iname <name>', 'Set the instance name')
  .option('-t, --ttl <hours>', 'Set the instance\'s time to live')
  .action(function(instanceType, options) {
    var instance = {
      type: instanceType
    , sshKeyPair: 'smake'
    };
    if (options.ttl) {
      instance.ttl = options.ttl;
    }
    var url = {
      url: 'http://localhost:8000/v1/instances'
    , method: 'POST'
    , body: JSON.stringify(instance)
    };
    // Make a POST request to create a new instance of the specified type
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
            console.log('Your new instance is located at', body.PublicIpAddress + '.');
            if (options.ttl) {
              console.log('It will be terminated', options.ttl, 'hours from now, deleting all local data.');
            }
            console.log();
            var instanceTagUrl = instanceUrl + '/tags';
            if (options.iname) {
              var tagUrl = {
                url: instanceTagUrl
              , method: 'POST'
              , body: JSON.stringify({
                  Tags: [{
                    Key: 'Name'
                  , Value: options.iname
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
      } else { // Response error or code other than 201
        console.log('Sorry, there aren\'t any', instanceType, 'instances right now.');
        console.log('Type \'smake list\' for a list of available instances');
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
          // Check whether the instance is in the pool
          if (inPool(body)) {
            isInPool = true;
          }
          // If instance is not in the pool (aka it is being used), then it can be terminated
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
      } else {
        console.log();
        console.log('It doesn\'t like that that instance exists');
        console.log();
      }
    });
  });

program
  .command('start [instanceID]')
  .description('Start instance with the specified ID')
  .action(function(instanceID, options) {
    var url = 'http://localhost:8000/v1/instances/' + instanceID;
    var startInstance = {
      method: 'PUT'
    , url: url
    , body: JSON.stringify({
        state: 'running'
      })
    };

    request(startInstance, function(error, response, body) {
      if (!error && response.statusCode == 204) {
        console.log('\n ' + instanceID + ' has been started' + '\n');
      } else {
        console.log();
        console.log('It doesn\'t look like that instance exists');
        console.log();
      }
    });
  });

program.parse(process.argv);

if (program.listAll) {
  console.log(AWSInstances);
}
