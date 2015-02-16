var program = require('commander');
var request = require('request');

program
  .version('0.0.1')
  .option('-c, --create', 'Create an AWS resource')
  .option('-e, --error', 'Throw an error!')
  .option('-d, --delete <AwsID or User Name>', 'Delete an AWS instance')
  .option('-s, --search <AwsID or User Name>', 'Search for an AWS instance')
  .option('-l, --listAll', 'List all the AWS instances information')
  .parse(process.argv);

var AWSInstances = {awsID:'abc123',userName:'Nobody'};

if (program.create) {
  var url = 'http://localhost:8000/new';
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 201) {
      console.log(body);
    }
  });
  console.log('Your resource was created!');
}

if (program.search){
  if (process.argv[2] == 'search' &&
    (process.argv[3] == AWSInstances.awsID || process.argv[3] == AWSInstances.userName)){
    console.log(AWSInstances);
  }else{
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
