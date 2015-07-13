"use strict";

var AWS      = require("aws-sdk");
var Bluebird = require("bluebird");
var ec2      = new AWS.EC2();

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
		//To do: Call AWS runInstances to create an instance
		return ec2.runInstancesAsync(params)
		.then(function (data) {
			instanceID = data.Instances[ 0 ].InstanceId;
			console.log("Created instance", instanceID);
		})
		.then(function (data) {
			tags = {
				Resources : [ instanceID ],
				Tags      : [ {
					Key   : "Name",
					Value : "Service Maker"
				},
				{
					Key   : "ID",
					Value : parameters.id
				} ]
			};
			return ec2.createTagsAsync(tags)
			.then(function (data) {
				//To do: Check what happens in the case of a success
			})
			.catch(function (error) {
				//To do: Check what the API returns in case of an error
				throw error;
			});
		})
		.catch(function (error) {
			throw error;
		});
	});

	this.createTagsAsync = Bluebird.method(function () {
		return ec2.createTagsAsync(tags)
		.then(function (data) {
			//To do: Check what happens in the case of a success
		})
		.catch(function (error) {
			//To do: Check what the API returns in case of an error
			throw error;
		});
	});
}

//Object.freeze(AWSAdapter);

module.exports = AWSAdapter;
