"use strict";

var ServiceDBSchema = require("../models/services-schema");
var Genesis         = require("genesis");
var uuid            = require("uuid");
var Bluebird        = require("bluebird");

Bluebird.promisifyAll(uuid);

function Instance (mapper) {
	if (!mapper) {
		mapper = new Genesis.MemoryMapper();
	}

	this.createInstance = function (ami, type) {
		if (arguments.length > 2) {
			throw new Error("Extra parameter present");
		}
		var instance = new ServiceDBSchema({ id : uuid.v4(), ami : ami, type : type });
		return mapper.create(instance);
	};
}

Object.freeze(Instance);

module.exports = Instance;
