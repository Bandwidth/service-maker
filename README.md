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
To use Service Maker, you'll need to have [node](http://www.nodejs.org) and [npm](https://www.npmjs.com/) installed. Service Maker was designed to run on Linux, specifically Ubuntu 14.04, and while it's possible to get it working on other operating systems, we only cover Linux in this guide. You can install Node however you like, but we recommend installing it via [Linuxbrew](https://github.com/Homebrew/linuxbrew). This way you won't need superuser access to manage your packages. [Here's](https://github.com/Homebrew/linuxbrew) a great guide detailing the specifics. 

After doing that, you'll want to `git clone` our repository to a memorable location on your local machine. Then `cd service-maker` and `npm install`. This will install Service Maker on your machine. Type `npm test` to make sure it works (you may need to `npm install -g grunt` to install our task manager, Grunt). If you've installed Node via Linuxbrew as we recommended, none of this will require superuser access. The next sections describe the steps necessary to get the API and CLI working, respectively. If you're only worried about installing the CLI, feel free to skip to that section.

### <a name='apiinstall'></a>Installing the API
Note: This is only required if you are deploying the server. If you're only interested in using the CLI, you should skip this section. Before the API will work, you need to configure your AWS credentials. By default, Service Maker is configured to look in your system's environment variables for these. Specifically, you need to set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. If you'll be using Service Maker regularly, you might wish to append these to your `~/.bashrc` file: 

 - `export AWS_ACCESS_KEY_ID="super_secret_id"` 
 -  `export AWS_SECRET_ACCESS_KEY="really_secret_access_key"`

Something else you should note is that the system currently only supports being deployed on the same machine that uses it. We see this is an area for major future improvement. 

### <a name='cli-install'></a> Installing the CLI
The CLI is located in `lib/cli/smake.js` and can be executed by running that file directly. It's much easier, however, to add an alias to your system so you don't always have to worry about being in the service-maker directory. Do to this, add `alias smake='path/to/service-maker/lib/cli/smake.js'` to your `~/.bash_aliases` file.

### Troubleshooting/Backout plan
If anything goes wrong, don't panic! Service Maker can easily be uninstalled by deleting the service-maker directory. Before you try again, make sure you've done everything on this list:
 
 - Installed Linuxbrew (requires Ruby), Node, and npm successfully and in that order
 - If you're getting access denied errors, you didn't use Linuxbrew to install npm. You can continue by sudo'ing your commands, but it's better to start over using Linuxbrew. 
 - If you're using the CLI and nothing is happening, it's likely that the API server isn't set up properly. Make sure it's running and your CLI is configured to access it correctly. 
 - If AWS is complaining about credentials, make sure you've set them up [properly](#apiinstall)

### Verification
You can verify that Service Maker was installed correctly by typing `npm test`. If you wish to veryfy that your `smake` commands are doing what you want them to, you can always check the AWS Console for confirmation.
 

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
Before you can start developing for Service Maker, you'll need to get your development environment properly set up. While we have automated most of this process, you'll still need to download and install [Node.js](https://nodejs.org/) and your favorite text editor (we like [Sublime](http://www.sublimetext.com/)). You might also consider installing [Nodemon](https://github.com/remy/nodemon), a tool which automatically restarts the server when you change code. It makes development much easier. [Postman](https://chrome.google.com/webstore/detail/postman-rest-client/fdmmgilgnpjigdojojpjoooidkmcomcm?hl=en) too is a great tool for testing API functionality. Also please note that this program was designed to be run on a Linux system. It's possible to develop on other systems--OSX isn't too bad--but it will require some wrangling that we won't get to cover here. 

#### Creating a Fork
After you've set up your development environment, go ahead and create a fork of this repository by clicking the big Fork button at the top right of this page. This will create a local copy of the repository under your own github account, allowing you and your fellow developers to write code without having to worry about things like merge conflicts until you need to. After you've forked the repository, go ahead and clone it by doing something like `git clone <myamazingrepositoryurl>` from the command line. Then `cd service-maker/` to change into the directory. You'll now want to set up your repository so it can pull from the master branch when necessary. Right now there won't be any differences between your fork and its parent (unless you have some very active teammates), but you'll want to pull in changes when they happen at a later date. To do this type `git add remote inetCatapult https://github.com/inetCatapult/service-maker`. This allows you to say things like `git pull inetCatapult master` later on to grab changes from the master repository.

#### Installing Dependencies
This part is pretty easy. Just type `npm install` and the Node Package Manager will automatically install all dependencies you need to start coding. Then type `npm test` to make sure everything worked. 

### Code Organization
The project is organized primarily according to function. The project's root is `index.js` and can be found in the root directory.  Here the server is created, routes are added, logging is started, the instance pool is initialized, and, finally, the server is made accessible. Our server utilized [Hapi.js](http://hapijs.com/), a server abstraction library from [walmartlabs](https://github.com/walmartlabs) (yes, really). It's a bit different than its more ubiquitous counterpart, Express.js, but we like it for its simplicity and flexibility. 

#### CLI
The CLI is located in `lib/cli/smake.js` and is implemented using a library called [Commander.js](https://github.com/tj/commander.js?utm_source=jobboleblog). If you're going to be developing the CLI, you should really check out the documentation for Commander. It's pretty awesome. 

#### API 
The rest of the project's code goes toward making the API functional. Routing information can be found in `config/routes/`. Functionality for such routes is made possible by code in the `lib/` directory. `lib/schemas.js` is where we specify what we would like data passed to the API to look like. For this we use a validation framework called [Joi](https://github.com/hapijs/joi). `lib/instance_pool.js` is where the magic happens. Here is where we mainain the pool of ready-to-go instances, deferring to a strategy (in `lib/pooling_strategies/` to determine how many instances to start on intialization and what to do when one is taken from the pool. `lib/instances.js` is a library for manipulating instances. Code here allows you to check whether the instance can be ssh'ed into and to schedule a termination time, among other things. `lib/tags.js` is a library for manipulating instance tags. Here you can add, remove, and read tags. `lib/defalut_amis.json` is a file in which you may specify what AMI you wish to be used when requesting a specific instance type. Right now we have Ubuntu 14.04 AMI's specified, but this in theory should be customizable by the user. (It's necessary to specify an AMI for each instance type because different instance types support different virtualization schemas, which in turn require different AMI's. Kind of annoying.) 

#### Tests
Tests are located in the `test/` directory. We use a combination of [Mocha](http://mochajs.org/), [Chai](http://chaijs.com/), and [Sinon](http://sinonjs.org/) for testing. Mocha is a behavioral testing framework (which usually means functional tests but can also mean unit, as is the case for some of our more specific tests). Chai allows us to use `should` statements. It also supports `expect` and traditional xUnit-style `assert` messages, but we think `should` is a little more readable. We use Sinon for mocking the functionality of EC2, allowing our tests to be both fast and free (yay!). Following behavioral testing conventions, test files should end in `_spec.js` (they *specify* what the tested unit should do). 



