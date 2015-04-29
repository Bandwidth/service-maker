# Service Maker   [![Build Status](https://travis-ci.org/inetCatapult/service-maker.svg?branch=master)](https://travis-ci.org/inetCatapult/service-maker)

## Overview 
Service Maker makes interacting with AWS easier. It does this by providing a set of sane defaults by which news AWS instances are created, so rather than specifying each individual setting required to spin up a new instance, all you have to do is tell Service Maker the important stuff. It takes care of the rest.

Service Maker is comprised of two major components. They are described in the following subsections.

### Server
The server (built on hapi.js) is where most all of Service Maker's functionality lives. It is responsible for managing EC2 instances and provides an API endpoint by which the CLI may retrieve this information. 

#### Instance Pooling
Service Maker achieves its fast response time by implementing and maintaining an instance pool. Basically, Service Maker prepares instances ahead of time so they are available immediately upon request. This lets us avoid all the waiting and confirmation that usually accompanies creating an EC2 instance. 

#### Pooling Strategies
What types of instances are maintained by the instance pool is determined by the pooling strategy it employs. Service Maker provides a few strategies by default, but adding customized strategies is as simple as implementing a few required methods. Service Maker comes with the following strategies:

 * **Naive Strategy**: Simple replacement. Defines a list of required instances and creates/destroys pool instances as necessary to maintain this requirement.

### CLI
Users interact with Service Maker via its CLI. The CLI is written using Commander.js and makes API calls to the server to provide its functionality. A detalied list of commands and examples may be found in the [usage](#usage) section, below. 

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
Here you will find information helpful to those interested in contributing to this project. Before you get started, please review the information above to get a good idea about how the system works. 

### Getting Started
#### Development Environment
Before you can start developing for Service Maker, you'll need to get your development environment properly set up. While we have automated most of this process, you'll still need to download and install [Node.js](https://nodejs.org/) and your favorite text editor (we like [Sublime](http://www.sublimetext.com/)).  Also please note that this program was designed to be run on a Linux system. It's possible to develop on other systems--OSX isn't too bad--but it will require some wrangling that we won't get to cover here. 

#### Creating a Fork
After you've set up your development environment, go ahead and create a fork of this repository by clicking the big Fork button at the top right of this page. This will create a local copy of the repository under your own github account, allowing you and your fellow developers to write code without having to worry about things like merge conflicts until you need to. After you've forked the repository, go ahead and clone it by doing something like `git clone <myamazingrepositoryurl>` from the command line. Then `cd service-maker/` to change into the directory. You'll now want to set up your repository so it can pull from the master branch when necessary. Right now there won't be any differences between your fork and its parent (unless you have some very active teammates), but you'll want to pull in changes when they happen at a later date. To do this type `git add remote inetCatapult https://github.com/inetCatapult/service-maker`. This allows you to say things like `git pull inetCatapult master` later on to grab changes from the master repository.

#### Installing Dependencies
This part is pretty easy. Just type `npm install` and the Node Package Manager will automatically install all dependencies you need to start coding. Then type `npm test` to make sure everything worked. 

### Code Organization
The project is organized primarily according to function. The project's root is `index.js` and can be found in the root directory.  Here the server is created, routes are added, logging is started, the instance pool is initialized, and, finally, the server is made accessible. Our server utilized [Hapi.js](http://hapijs.com/), a server abstraction library from [walmartlabs](https://github.com/walmartlabs) (yes, really). It's a bit different than its more ubiquitous counterpart, Express.js, but we like it for its simplicity and flexibility. 

#### CLI
The CLI is located in `lib/cli/smake.js` and is implemented using a library called [Commander.js](https://github.com/tj/commander.js?utm_source=jobboleblog). If you're going to be developing the CLI, you should really check out the documentation for Commander. It's pretty awesome. 




