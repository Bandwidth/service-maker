"use strict";

var Bluebird = require("bluebird");

function AWSAdapter (ec2) {

	var tags;
	var instanceID;

	this.runInstances = Bluebird.method(function (instance) {
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
			ec2.createTagsAsync(tags);
		})
		.then(function () {
			result.instanceID = instanceID;
			return result;
		});
	});

	this.getPublicIPAddress = Bluebird.method(function (instanceID) {
		return this.describeInstance(instanceID)
		.then(function (instance) {
			return	Bluebird.resolve(instance[ 0 ].PublicIpAddress);
		});
	});
	this.describeInstance = Bluebird.method(function (instanceID) {
		var params = {
			InstanceIds : [ instanceID ]
		};
		console.log("Reacher her");
		return ec2.describeInstancesAsync(params)
		.then(function (data) {
			var instanceInfo = [];
			data.Reservations.forEach(function (reservation) {
				reservation.Instances.forEach(function (instance) {
					instanceInfo.push(instance);
				});
			});
			return Bluebird.resolve(instanceInfo);
		});
	});
}

module.exports = AWSAdapter;
