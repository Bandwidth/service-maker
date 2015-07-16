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
			id         : instance.id,
			ami        : instance.ami,
			type       : instance.type,
			state      : instance.state,
			uri        : null,
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
}

module.exports = AWSAdapter;
