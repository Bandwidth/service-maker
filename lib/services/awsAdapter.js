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
		.catch(function (error) {
			//To do: Handle specific error cases.
			return error;
		});
	});
}

module.exports = AWSAdapter;
