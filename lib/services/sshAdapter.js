"use strict";

var Bluebird = require("bluebird");

function SshAdapter (ec2) {

	this.canSsh = function (instanceID) {
		var params = {
			InstanceIds : [ instanceID ]
		};

		return ec2.describeInstanceStatusAsync(params)
		.then(function (data) {
			var sshable = false;
			if (data.InstanceStatuses.length === 0) {
				return sshable;
			}
			else {
				switch (data.InstanceStatuses[ 0 ].SystemStatus.Details[ 0 ].Status) {
					case "passed" : {
						sshable = true;
						break;
					}
					case "failed" : {
						return Bluebird.reject(new Error("System Checks Failed"));
					}

					case "insufficient-data" : {
						return Bluebird.reject(new Error("System Checks Failed due to insufficient data"));
					}
				}
				return sshable;
			}
		});
	};
}
Object.freeze(SshAdapter);

module.exports = SshAdapter;
