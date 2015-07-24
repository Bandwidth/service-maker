"use strict";

var Bluebird = require("bluebird");
var SshAdapter = require("./sshAdapter");
var Instance = require("../models/Instance");

function AWSAdapter (ec2, options) {
	var tags;
	var instanceID;
	var sshAdapter;
	if (options && options.sshAdapter) {
		sshAdapter = options.sshAdapter;
	}
	else {
		sshAdapter = new SshAdapter(ec2);
	}

	this.runInstances = Bluebird.method(function (instance, instances, serverLog) {
		var self   = this;
		var params = {
			ImageId      : instance.ami,
			InstanceType : instance.type,
			MinCount     : 1,
			MaxCount     : 1
		};

		var result = {
			id    : instance.id,
			ami   : instance.ami,
			type  : instance.type,
			state : instance.state,
			uri   : null,
		};

		return ec2.runInstancesAsync(params)
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
			self.beginPolling(result, instances, serverLog);
			return result;
		});
	});

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

	this.beginPolling = function (result, instances, serverLog) {
		var self = this;
		return sshAdapter.startSshPolling(result.instanceID)
		.then(function () {
			serverLog([ "info", "AWSAdapter", "startSshPolling" ], "Ssh Polling is successful");
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
			instances.updateInstance(updatedInstance);
			serverLog([ "info", "AWSAdapter", "getPublicIPAddress" ], "Updated Instance for " + result.id +
				"with IP Address: " + ipAddress);
			return updatedInstance;
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
			instances.updateInstance(updatedInstance);
			serverLog([ "error", "AWSAdapter", "startSshPolling" ], error);
			return updatedInstance;
		});
	};
}

module.exports = AWSAdapter;
