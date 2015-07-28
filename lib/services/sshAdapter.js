"use strict";

var Bluebird = require("bluebird");

function SshAdapter (ec2) {
	var SSH_POLLING_INTERVAL = 30; /*Time in Seconds*/
	var	TOTAL_NO_OF_ATTEMPTS = 15;

	this.SshPolling = function (instanceID, attemptsMade) {
		var self = this;
		if (!attemptsMade) {
			attemptsMade = 0;
		}
		return self.canSsh(instanceID)
		.then(function (sshable) {
			if (attemptsMade === TOTAL_NO_OF_ATTEMPTS) {
				return Bluebird.reject(new Error("Timeout occured!"));
			}
			if (sshable) {
				return sshable;
			}
			else {
				attemptsMade = attemptsMade + 1;
				return Bluebird.delay(SSH_POLLING_INTERVAL * 1000)
				.then(function () {
					return self.SshPolling(instanceID, attemptsMade);
				});
			}
		});
	};
	this.canSsh = function (instanceID) {
		var params = {
			InstanceIds : [ instanceID ]
		};

		return ec2.describeInstanceStatusAsync(params)
		.then(function (data) {
			var sshable = false;
			console.log("Data is: " + JSON.stringify(data));
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
