"use strict";

var AWS      = require("aws-sdk");
var Bluebird = require("bluebird");

function AWSAdapter (parameters, options) {

	var ec2 = options.ec2 || new AWS.EC2();

	Bluebird.promisifyAll(ec2);

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
		return ec2.runInstancesAsync(params)
		.then(function (data) {
			instanceID = data.Instances[ 0 ].InstanceId;
			console.log("Created instance", instanceID);
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
			return ec2.createTagsAsync(tags);
		})
		.catch(function (error) {
			throw error;
		});
	});
}

module.exports = AWSAdapter;
