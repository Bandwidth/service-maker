"use strict";

var Bluebird = require("bluebird");

<<<<<<< HEAD
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

=======
Bluebird.promisifyAll(ec2);

function AWSAdapter (parameters) {
	var tags;
	var instanceID;
	var params = {
		ImageId      : parameters.ami,
		InstanceType : parameters.type,
		MinCount     : 1,
		MaxCount     : 1
	};

	this.runInstances = Bluebird.method(function () {
		console.log(params);
>>>>>>> Fixed issues with rest_spec.js
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
<<<<<<< HEAD

			ec2.createTagsAsync(tags);
=======
			return ec2.createTagsAsync(tags);
>>>>>>> Fixed issues with rest_spec.js
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
