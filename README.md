# Service Maker   [![Build Status](https://travis-ci.org/inetCatapult/service-maker.svg?branch=master)](https://travis-ci.org/inetCatapult/service-maker)

## Overview 
Service Maker makes interacting with AWS easier. It does this by providing a set of sane defaults by which news AWS instances are created, so rather than specifying each individual setting required to spin up a new instance, all you have to do is tell Service Maker the important stuff. It takes care of the rest.

Service Maker is comprised of three major components. They are described in the following subsections.

### Server
The server (built on hapi.js) is where most all of Service Maker's functionality lives. It is responsible for managing EC2 instances and provides an API endpoint by which the CLI and web interface may retrieve this information. 

#### Instance Pooling
Service Maker achieves its fast response time by implementing and maintaining an instance pool. Basically, Service Maker prepares instances ahead of time so they are available immediately upon request. This lets us avoid all the waiting and confiration that usually accompanies creating an EC2 instance. 

#### Pooling Strategies
What types of instances are maintained by the instance pool is determined by the pooling strategy it employs. Service Maker provides a few strategies by default, but adding customized strategies is as simple as implementing a few required methods. Service Maker comes with the following strategies:

 * **Naive Strategy**: Simple replacement. Defines a list of required instances and creates/destroys pool instances as necessary to maintain this requirement.

### CLI
Users interact with Service Maker via its CLI. The CLI is written using Commander.js and makes API calls to the server to provide its functionality. A detalied list of commands and examples may be found in the [usage](#usage) section, below. 

### Web Interface
The web interface provides a portal by which users may view statistics about AWS usage. This is mainly a tool for management. As such, the web interface does not allow for the creation and destruction of instances--this behavior is encapsulated in the CLI. 

## Installation
Install [npm](https://www.npmjs.com/).

Clone the repo and type `npm install`. That's it. 

## <a name='usage'></a>Usage
Service Maker provides a command-line endpoint for user access. A more detailed list of functionality can be reached by typing `smake --help`. A few basic commands are listed below.

### Searching
`smake list` Lists all current EC2 instances.   
`smake find <InstanceId>` Retrieves information about a specific instance.  

### Instance Management
`smake create <InstanceType>` Returns a new instance of the specified type.  
e.g. `smake create 't1.micro'`  
e.g. `smake create 't1.micro' --name='super awesome instance 1'`  
`smake terminate <InstanceId>` Terminates an instance.  
`smake stop <InstanceId>` Stops an instance.  
`smake start <InstanceId>` Starts an instance.  
`smake restart <InstanceId>` Restarts an instance.  
e.g. `smake restart --name='super awesome instance'` Restarts all instances whose names start with the specified name.

### Instance Tagging
`smake add tag <InstanceId> <key> <value>` Applies a tag to an instance.  
`smake remove tag <InstanceId> <key> <value>` Removes a tag from an instance.  
`smake remove tag <InstanceId> <key>` Removes all tags with the specified key from the instance.

### Keypair Management
Service Make relies on a default keypair. You must download this from the AWS Console to ssh into any instances retrieved from the system. 

**Note on custom keypairs:** Service Maker cannot use custom keypairs for instances as doing so requires the instance to be restarted. If you wish to use a custom keypair, you must do so manually either through the AWS Console or by connecting to the VM and modifying authorized_keys. **You may not delete the default 'smake' keypair.**

## Contributing
Clone. Branch. Code. Push. Pull Request. Wait. Be happy :smile: