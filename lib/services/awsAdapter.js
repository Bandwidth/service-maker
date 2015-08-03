"use strict";

var Bluebird        = require("bluebird");
var SshAdapter      = require("./sshAdapter");
var Instance        = require("../models/Instance");
var InstanceAdapter = require("./instanceAdapter");
var Joi             = require("joi");
var AWS             = require("aws-sdk");

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

	this.runInstances = function (instance) {
		var self   = this;
		var groupName = process.env.AWS_DEFAULT_SECURITY_GROUP || "service-maker";

		var result = {
			id    : instance.id,
			ami   : instance.ami,
			type  : instance.type,
			state : instance.state,
			uri   : null,
		};

		var securityGroupParams = {
			Description : "The default security group for service-maker.",
			GroupName   : groupName
		};

		return self.createSecurityGroup(securityGroupParams)
		.then(function () {
			var params = {
				ImageId        : instance.ami,
				InstanceType   : instance.type,
				MinCount       : 1,
				MaxCount       : 1,
				SecurityGroups : [ groupName ]
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
			self.beginPolling(result);
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

	this.beginPolling = function (result) {
		var self = this;
		return sshAdapter.SshPolling(result.instanceID)
		.then(function () {
			serverLog([ "info", "AWSAdapter", "SshPolling" ], "Ssh Polling is successful");
			return self.getPublicIPAddress(result.instanceID);
		})
		.then(function (ipAddress) {
			var updatedInstance;

			updatedInstance = new Instance({
				id    : result.id,
				type  : result.type,
				ami   : result.ami,
				state : "ready",
				uri   : "https://" + ipAddress,
			});
			return instances.updateInstance(updatedInstance)
			.then(function (data) {
				serverLog([ "info", "AWSAdapter", "getPublicIPAddress" ], "Updated Instance for " + result.id +
				"with IP Address: " + ipAddress);
				return data;
			});
		})
		.catch(function (error) {
			var updatedInstance;
			updatedInstance = new Instance({
				id    : result.id,
				type  : result.type,
				ami   : result.ami,
				state : "failed",
				uri   : null
			});
			return instances.updateInstance(updatedInstance)
			.then(function (data) {
				serverLog([ "error", "AWSAdapter", "SshPolling" ], error);
				serverLog([ "error", "AWSAdapter", "updateInstance" ], data);
				return updatedInstance;
			})
			.catch (function (err) {
				serverLog([ "error", "AWSAdapter", "updateInstance" ], err);
				return Bluebird.reject(err);
			});
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

	this.createSecurityGroup = function (params) {
		var groupName = params.GroupName;

		return ec2.createSecurityGroupAsync(params)
		.then(function (data) {
			var params = {
				GroupName     : groupName,
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
		.catch(function (error) {
			if (error.name === "InvalidGroup.Duplicate") {
				serverLog([ "info", "createSecurityGroup" ], "The Security Group already exists. No action needed.");
			}
			else {
				serverLog([ "error", "createSecurityGroup" ], "Something went wrong with creating a security group.");
				return Bluebird.reject(error);
			}
		});
	};

}

module.exports = AWSAdapter;
