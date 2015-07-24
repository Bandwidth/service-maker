"use strict";

var Bluebird = require("bluebird");

function SshAdapter (ec2) {
	var SSH_POLLING_INTERVAL = 30; /*Time in Seconds*/

	this.checkIfSshable = function (instanceID) {
		var self = this;
		return this.canSsh(instanceID)
		.then(function (sshable) {
			if (sshable) {
				return sshable;
			}
			else {
				return Bluebird.delay(SSH_POLLING_INTERVAL * 1000)
				.then(self.checkIfSshable.bind(self, instanceID));
			}
		}.bind(self));
	};

	this.startSshPolling = function (instanceID) {
		return this.checkIfSshable(instanceID);
	};

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
