var program = require('commander');
var request = require('request');

program
  .version('0.0.1')
  .option('-c, --create', 'Create an AWS resource')
  .option('-e, --error', 'Throw an error!')
  .option('-e, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
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
} 

if (program.error) {
  var url = 'http://localhost:8000/new/this/shouldnt/work';
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 404) {
      console.log('There\'s nothing here :(')
    }
  });
}

// console.log(program);

// console.log('Your resource was created!');
// if (program.peppers) console.log('  - peppers');
// if (program.pineapple) console.log('  - pineapple');
// if (program.bbq) console.log('  - bbq');
// console.log('  - %s cheese', program.cheese);
