"use strict";

var Rest        = require("../../../lib/plugins/rest");
var Sinon       = require("sinon");
var expect      = require("chai").expect;

describe("The server", function () {
	var restStub;
	var server;
	var DB_URL;
	before(function () {
		DB_URL = process.env.DB_URL;
		process.env.DB_URL = undefined;
		restStub    = Sinon.stub(Rest, "register").callsArg(2);
		server      = require("../../../lib/server");
	});

	after(function () {
		restStub.restore();
		process.env.DB_URL = DB_URL;
		return server.stopAsync();
	});

	it("registers the Rest plugin", function () {
		expect(restStub.calledOnce, "registered").to.be.true;
	});
});
