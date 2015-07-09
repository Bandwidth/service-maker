"use strict";

var Instance = require("../models/Instance");
var Genesis  = require("genesis");
var uuid     = require("uuid");
var Bluebird = require("bluebird");

function InstanceAdapter (mapper) {
	if (!mapper) {
		mapper = new Genesis.MemoryMapper();
	}

	this.createInstance = Bluebird.method(function (ami, type) {
		var instance = new Instance({ id : uuid.v4(), ami : ami, type : type });
		return mapper.create(instance);
	});
}

Object.freeze(InstanceAdapter);

module.exports = InstanceAdapter;
