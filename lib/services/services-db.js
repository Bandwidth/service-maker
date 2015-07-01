/*"use strict";

var Services = require("../models/services-schema");
var Genesis  = require("genesis");
var generate = require("adjective-adjective-animal");
var _lodash  = require("lodash");

function ServicesDB (mapper) {
	if(!mapper) {
		mapper = new Genesis.MemoryMapper();
	}

	this.create = function () {
		return generate()
		.then(function (id) {
			var service = new Services({id : id, })
		})
	}

	this.get = function () {

	}

	this.update = function () {

	}
}
*/
