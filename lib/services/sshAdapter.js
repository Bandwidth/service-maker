"use strict";

var Bluebird = require("bluebird");

function SshAdapter (ec2) {
	var SSH_POLLING_INTERVAL = 30; /*Time in Seconds*/

	this.checkIfSshable = Bluebird.method(function (instanceID) {
		return this.canSsh(instanceID)
		.then(function (sshable) {
			if (sshable) {
				return Bluebird.resolve();
			}
			else {
				return Bluebird.delay(SSH_POLLING_INTERVAL * 1000)
				.then(this.checkIfSshable.bind(this, instanceID));
			}
		}.bind(this));
	});

	this.startSshPolling = Bluebird.method(function (instanceID) {

		return this.checkIfSshable(instanceID)
		.catch(function (err) {
			return Bluebird.reject(err);
		});
	});

	this.canSsh = Bluebird.method(function (instanceID) {
		var sshable;
		var params = {
			InstanceIds : [ instanceID ]
		};

		return ec2.describeInstanceStatusAsync(params)
		.then(function (data) {
			sshable = false;
			if (data.InstanceStatuses.length === 0) {
				return (Bluebird.resolve(sshable));
			}
			else {
				switch (data.InstanceStatuses[ 0 ].SystemStatus.Details[ 0 ].Status) {
					case "passed" : {
						sshable = true;
						break;
					}
					case "failed" :

					/* falls through */
					case "insufficient-data" : {
						return Bluebird.reject(new Error("System Checks Failed"));
					}
				}
				return (Bluebird.resolve(sshable));
			}
		})
		.catch(function (err) {
			return Bluebird.reject(err);
		});
	});
}
Object.freeze(SshAdapter);

module.exports = SshAdapter;