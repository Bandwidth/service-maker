"use strict";

var Bluebird        = require("bluebird");
var SshAdapter      = require("./sshAdapter");
var Instance        = require("../models/Instance");
var InstanceAdapter = require("./instanceAdapter");
var Joi             = require("joi");
var AWS             = require("aws-sdk");
var _               = require("lodash");

function AWSAdapter (options) {
	var tags;
	var instanceID;
	var sshAdapter;
	var instances;
	var serverLog;
	var ec2;
	var schema = Joi.object().keys({
		sshAdapter : Joi.object().type(SshAdapter).required(),
		ec2        : Joi.object().type(AWS.EC2).required(),
		serverLog  : Joi.func().required(),
		instances  : Joi.object().type(InstanceAdapter).required()
	});

	if (options) {
		if (options.sshAdapter) {
			sshAdapter = options.sshAdapter;
		}
		else if (options.ec2) {
			sshAdapter = new SshAdapter(options.ec2);
			options.sshAdapter = sshAdapter;
		}
		instances  = options.instances;
		serverLog  = options.serverLog;
		ec2        = options.ec2;
	}

	var JoiValidator = Joi.validate(options, schema);

	if (JoiValidator.error) {
		serverLog([ "error", "AWSAdapter" ], JoiValidator.error.message);
		throw new Error(JoiValidator.error.message);
	}

	this.runInstances = function (instance, instanceOptions) {
		var self   = this;

		var result = _.clone(instance);

		return self.getSecurityGroup(instanceOptions.createSecurityGroup, instanceOptions.existingSecurityGroup)
		.then(function (securityGroup) {
			var params = {
				ImageId        : instance.ami,
				InstanceType   : instance.type,
				MinCount       : 1,
				MaxCount       : 1,
				SecurityGroups : [ securityGroup ]
			};

			return ec2.runInstancesAsync(params);
		})
		.then(function (data) {
			instanceID = data.Instances[ 0 ].InstanceId;
			tags = {
				Resources : [ instanceID ],
				Tags      : [ {
					Key   : "Name",
					Value : "Service Maker"
				},
				{
					Key   : "ID",
					Value : instance.id
				} ]
			};
			return ec2.createTagsAsync(tags);
		})
		.then(function () {
			result.instanceID = instanceID;
			return result;
		});
	};

	this.getPublicIPAddress = function (instanceID) {
		return this.describeInstance(instanceID)
		.then(function (instance) {
			return	instance[ 0 ].PublicIpAddress;
		});
	};

	this.describeInstance = function (instanceID) {
		var params = {
			InstanceIds : [ instanceID ]
		};
		return ec2.describeInstancesAsync(params)
		.then(function (data) {
			var instanceInfo = [];
			data.Reservations.forEach(function (reservation) {
				reservation.Instances.forEach(function (instance) {
					instanceInfo.push(instance);
				});
			});
			return instanceInfo;
		});
	};

	this.updatePollingStatus = function (result) {
		var self = this;
		var instanceIPAddress;

		serverLog([ "info", "AWSAdapter", "SshPolling" ], "Ssh Polling is successful for id: " + result.id);
		return self.getPublicIPAddress(result.instanceID)
		.then(function (ipAddress) {
			instanceIPAddress = ipAddress;
			serverLog([ "info", "AWSAdapter", "SshPolling" ], "IP Address for id: " + result.id + " is: " + ipAddress);
			return instances.getInstance({ id : result.id });
		})
		.then(function (response) {
			var updatedInstance;

			if (response.revision !== result.revision) {
				//State has already been changed. Do Nothing
				serverLog([ "info", "AWSAdapter" ], "Instance: " + response.id + " has already been updated" +
				"with state: " + response.state);
				return response;
			}
			updatedInstance = new Instance({
				id       : response.id,
				type     : response.type,
				ami      : response.ami,
				state    : "ready",
				uri      : "https://" + instanceIPAddress,
				revision : response.revision
			});
			return instances.updateInstance(updatedInstance)
			.then(function (data) {
				serverLog([ "info", "AWSAdapter", "getPublicIPAddress" ], "Updated Instance for " + response.id +
				"with IP Address: " + instanceIPAddress);
				return data;
			});
		});
	};

	this.handlePollingErrors = function (result, error) {
		return instances.getInstance({ id : result.id })
		.then(function (response) {
			var updatedInstance;
			if (response.revision !== result.revision) {
				//State has already been changed
				serverLog([ "info", "AWSAdapter" ], error);
				serverLog([ "info", "AWSAdapter" ], "Instance: " + response.id + " has already been updated" +
				"with state: " + response.state);
				return response;
			}
			updatedInstance = new Instance({
				id       : response.id,
				type     : response.type,
				ami      : response.ami,
				state    : "failed",
				uri      : null,
				revision : response.revision
			});
			return instances.updateInstance(updatedInstance);
		})
		.then(function (data) {
			serverLog([ "error", "AWSAdapter", "SshPolling" ], error);
			serverLog([ "error", "AWSAdapter", "updateInstance" ], data);
			return data;
		})
		.catch (function (err) {
			serverLog([ "error", "AWSAdapter", "updateInstance" ], err);
			return Bluebird.reject(err);
		});
	};

	this.terminateInstances = function (instanceId) {
		var params = {
			Filters : [ {
				Name   : "tag:ID",
				Values :  [ instanceId ]
			} ]
		};
		return ec2.describeInstancesAsync(params)
		.then(function (result) {
			var params = {
				InstanceIds : [ result.Reservations[ 0 ].Instances[ 0 ].InstanceId ]
			};
			return ec2.terminateInstancesAsync(params);
		})
		.then(function () {
			var params = {
				Filters : [ {
					Name   : "tag:ID",
					Values :  [ instanceId ]
				} ]
			};
			return ec2.waitForAsync("instanceTerminated", params);
		})
		.then(function (response) {
			return response;
		});

	};

	this.getSecurityGroup = function (create, existing) {

		var securityGroupParams;

		if (create === undefined) {
			if (existing === undefined) {
				//The default service maker security group.
				existing = "service-maker";
			}

			securityGroupParams = {
				GroupNames : [ existing ]
			};

			return ec2.describeSecurityGroupsAsync(securityGroupParams)
			.then(function () {
				return existing;
			})
			.catch(function (error) {
				return Bluebird.reject(error);
			});
		}
		else if (create !== undefined && existing === undefined) {

			securityGroupParams = {
				Description : "A security group created for use by Service Maker",
				GroupName   : [ create ]
			};

			return ec2.createSecurityGroupAsync(securityGroupParams)
			.then(function (data) {
				var params = {
					GroupName     : create,
					GroupId       : data.GroupId,
					IpPermissions : [ {
						FromPort   : 22,
						IpProtocol : "tcp",
						ToPort     : 22,
						IpRanges   : [ { CidrIp : "0.0.0.0/0" } ]
					} ]
				};
				return ec2.authorizeSecurityGroupIngressAsync(params);
			})
			.then(function () {
				return create;
			})
			.catch(function (error) {
				return Bluebird.reject(error);
			});
		}
		else {
			var error = new Error();
			error.name = "ValidationError";
			error.message = "Bad request: Both createSecurityGroup and existingSecurityGroup were specified.";
			return Bluebird.reject(error);
		}
	};

	this.stopInstances = function (instanceId) {
		var params = {
			Filters : [ {
				Name   : "tag:ID",
				Values :  [ instanceId ]
			} ]
		};

		return ec2.describeInstancesAsync(params)
		.then(function (result) {
			var stopParams = {
				InstanceIds : [ result.Reservations[ 0 ].Instances[ 0 ].InstanceId ]
			};
			return ec2.stopInstancesAsync(stopParams);
		})
		.then(function () {
			return ec2.waitForAsync("instanceStopped", params);
		})
		.then(function (response) {
			return response;
		});
	};

	this.startInstances = function (instance) {
		var awsResult;
		var instanceEc2Id;
		var instanceWithEc2Id;

		var params = {
			Filters : [ {
				Name   : "tag:ID",
				Values :  [ instance.id ]
			} ]
		};
		return ec2.describeInstancesAsync(params)
		.then(function (result) {
			awsResult = result;
			instanceEc2Id = result.Reservations[ 0 ].Instances[ 0 ].InstanceId;
			instanceWithEc2Id = {
				id         : instance.id,
				ami        : instance.ami,
				type       : instance.type,
				state      : instance.state,
				uri        : instance.uri,
				revision   : instance.revision,
				instanceID : instanceEc2Id
			};
			var startParams = {
				InstanceIds : [ instanceEc2Id ]
			};
			return ec2.startInstancesAsync(startParams);
		})
		.then(function () {
			return instance;
		});
	};

	this.checkInstanceStatus = function (instance) {
		var self   = this;
		var params = {
			Filters : [ {
				Name   : "tag:ID",
				Values :  [ instance.id ]
			} ]
		};
		var instanceProp = _.clone(instance);

		return ec2.describeInstancesAsync(params)
		.then(function (result) {
			var instanceId = result.Reservations[ 0 ].Instances[ 0 ].InstanceId;
			instanceProp.instanceID = instanceId;
			return sshAdapter.canSsh(instanceId);
		})
		.then(function (sshable) {
			if (sshable) {
				return self.updatePollingStatus(instanceProp);
			}
			else {
				return instances.getInstance({ id : instance.id });
			}
		})
		.catch(function (error) {
			return self.handlePollingErrors(instanceProp, error);
		});
	};
}

module.exports = AWSAdapter;
