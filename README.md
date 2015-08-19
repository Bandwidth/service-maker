# Service Maker   [![Build Status](https://travis-ci.org/inetCatapult/service-maker.svg?branch=v1.0)](https://travis-ci.org/inetCatapult/service-maker)

Service Maker streamlines the process of deploying new imaged EC2 instances for your scaling service. Request a new server, and Service Maker will create it according to the AMI you specify, with configuration for instance size and region.


# Running the unit tests

The unit test should run successfully out of the box.
```
npm install
npm test
```

# Running the integration tests
```
npm install
npm run-script integration-tests
```
