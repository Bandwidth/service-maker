"use strict";

var Request = require("apparition").Request;
var Bluebird = require("bluebird");
var Hapi = require("hapi");
var Rest = require("../../../lib/plugins/rest");

var expect = require("chai").expect;

Bluebird.promisifyAll(Hapi);

describe("The Rest plugin", function () {
	it("is a Hapi plugin", function () {
		expect(Rest, "attributes").to.have.property("register")
		.that.is.a("function")
		.and.that.has.property("attributes")
		.that.has.property("name", "rest");
	});

	describe("when registered", function () {
		var server = new Hapi.Server();

		before(function () {
			server.connection();
			return server.registerAsync(Rest);
		});

		it("provides the '/' route", function () {
			return new Request("GET", "/").inject(server)
			.then(function (response) {
				expect(response.statusCode, "status").to.equal(200);
			});
		});
	});
});
