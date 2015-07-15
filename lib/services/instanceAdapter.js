"use strict";

var Instance   = require("../models/Instance");
var Genesis    = require("genesis");
var uuid       = require("uuid");
var Bluebird   = require("bluebird");
//var SshAdapter = require("./SshAdapter");
function InstanceAdapter (mapper) {
	if (!mapper) {
		mapper = new Genesis.MemoryMapper();
	}

	this.createInstance = Bluebird.method(function (ami, type) {
		var instance   = new Instance({ id : uuid.v4(), ami : ami, type : type });
		//var sshAdapter = new SshAdapter();
		//sshAdapter.startSshPolling(instance.id);
		return mapper.create(instance);
	});

	this.updateInstance = Bluebird.method(function (instance) {
		return mapper.update(instance);
	});

	this.getInstance = Bluebird.method(function (query) {
		return mapper.findOne(Instance, query);
	});

	this.getAllInstances = Bluebird.method(function (query) {
		return mapper.find(Instance, query);
	});
}

Object.freeze(InstanceAdapter);

module.exports = InstanceAdapter;
