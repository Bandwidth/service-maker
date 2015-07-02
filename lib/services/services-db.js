"use strict";

var ServiceDBSchema = require("../models/services-schema");
var Genesis  = require("genesis");
var uuid = require("uuid");
var Bluebird = require("bluebird");

Bluebird.promisifyAll(uuid);

function Services (mapper) {
	if (!mapper) {
		mapper = new Genesis.MemoryMapper();
	}

	this.create = function (parameter) {

		var service = new ServiceDBSchema({ id : uuid.v4(), ami : parameter.ami, type : parameter.type });
		return mapper.create(service);

	};
/*
	this.get = function (query) {
		return mapper.findOne(ServiceDBSchema, query);
	};

	this.update = function (newService) {
		return mapper.update(newService);
	};*/
}

Object.freeze(Services);

module.exports = Services;
