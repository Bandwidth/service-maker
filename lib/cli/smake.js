var program = require('commander');
var request = require('request');

program
  .version('0.0.1')
  .option('-c, --create', 'Create an AWS resource')
  .option('-e, --error', 'Throw an error!')
  .option('-d, --delete', 'Delete an AWS instance')
  .option('-s, --search', "Search for an AWS instance")
  .parse(process.argv);

if (program.create) {
  var url = 'http://localhost:8000/new';
  request(url, function(error, response, body) {
    // console.log(response.statusCode);
    if (!error && response.statusCode == 201) {
      console.log(body)
    }
  });
  console.log('Your resource was created!');
};


if (program.error) {
  var url = 'http://localhost:8000/new/this/shouldnt/work';
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 404) {
      console.log('There\'s nothing here :(')
    }
  });
  console.log('Warning: Error');
};
