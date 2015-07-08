"use strict";

var Instance = require("../models/Instance");
var Genesis  = require("genesis");
var uuid     = require("uuid");

function InstanceAdapter (mapper) {
	if (!mapper) {
		mapper = new Genesis.MemoryMapper();
	}

	this.createInstance = function (ami, type) {
		var instance = new Instance({ id : uuid.v4(), ami : ami, type : type });
		return mapper.create(instance);
	};

	this.getInstance = function (query) {
		return mapper.findOne(Instance,query);
	};

	this.getAllInstances = function (query) {
		return mapper.find(Instance,query);
	};

}

Object.freeze(InstanceAdapter);

module.exports = InstanceAdapter;
