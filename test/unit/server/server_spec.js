"use strict";

var Rest        = require("../../../lib/plugins/rest");
var Sinon       = require("sinon");
var expect      = require("chai").expect;

describe("The server", function () {
	var restStub;
	var server;
	before(function () {
		restStub    = Sinon.stub(Rest, "register").callsArg(2);
		server      = require("../../../lib/server");
	});

	after(function () {
		restStub.restore();
		return server.stopAsync();
	});

	it("registers the Rest plugin", function () {
		expect(restStub.calledOnce, "registered").to.be.true;
	});
});

describe("The Rest Plugin", function () {
	var VALID_AMI     = "ami-default";
	var VALID_TYPE    = "t2.micro";
	//var INVALID_AMI   = [ "ami-defualt" ];
	//var INVALID_TYPE  = [ "t2.micro" ];

	describe("when a valid request is made", function () {
		var server = new Hapi.Server();

		before(function () {
			server.connection();
			return server.registerAsync(Rest);
		});

		it("creates the instance and returns the canonical url", function () {
			var request = new Request("POST", "/v1/instances").mime("application/json").payload({
				ami  : VALID_AMI,
				type : VALID_TYPE
			});
			return request.inject(server)
			.then(function (response) {
				expect(response.statusCode, "status").to.equal(201);
				//expect(response.location, "location").to.match(/v1/instances/);
			});
		});
	});
});
