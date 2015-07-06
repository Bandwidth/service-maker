"use strict";

var Instance = require("../../../lib/models/services-schema");
var _        = require("lodash");
var expect   = require("chai").expect;

describe("The services schema", function () {

	var VALID_ID            = "somestringwith12903";
	var VALID_TYPE          = "t2.micro";
	var VALID_AMI           = "ami-d05e75b8";
	var VALID_STATE_PENDING = "pending";
	var VALID_STATE_READY   = "ready";
	var VALID_URI           = "https://location.com";

	var INVALID_AMI         = [ "ami-imagename", "ami-imagename-2" ];
	var INVALID_STATE       = "something else";
	var INVALID_URI         = "this is not a uri";

	function describeInitWith (description, options, fails) {
		var expectedOptions = _.defaults(
			options,
			{
				id    : undefined,
				type  : "t2.micro",
				ami   : "ami-d05e75b8",
				state : "pending",
				uri   : null
			}
		);
		describe("initialized with " + description, function () {
			if (!fails) {
				it("returns a services object", function () {
					var instances = new Instance(options);
					expect(instances, "properties").to.deep.equal(expectedOptions);
				});
			}
			else {
				it("fails", function () {
					expect(function () { return new Instance(options); }, "throws").to.throw(Error);
				});
			}
		});
	}

	describeInitWith("all valid parameters",
		{
			id    : VALID_ID,
			type  : VALID_TYPE,
			ami   : VALID_AMI,
			state : VALID_STATE_READY,
			uri   : VALID_URI
		}
	);

	describeInitWith("all valid parameters",
		{
			id    : VALID_ID,
			type  : VALID_TYPE,
			ami   : VALID_AMI,
			state : VALID_STATE_PENDING,
			uri   : VALID_URI
		}
	);

	describeInitWith("invalid uri",
		{
			id    : VALID_ID,
			type  : VALID_TYPE,
			ami   : VALID_AMI,
			state : VALID_STATE_READY,
			uri   : INVALID_URI
		},
		true
	);

	describeInitWith("invalid state",
		{
			id    : VALID_ID,
			type  : VALID_TYPE,
			ami   : VALID_AMI,
			state : INVALID_STATE,
			uri   : VALID_URI
		},
		true
	);

	describeInitWith("id missing",
		{
			type  : VALID_TYPE,
			ami   : VALID_AMI,
			state : VALID_STATE_READY,
			uri   : VALID_URI
		},
		true
	);

	describeInitWith("using an array instead of string",
		{
			id    : VALID_ID,
			type  : VALID_TYPE,
			ami   : INVALID_AMI,
			state : VALID_STATE_READY,
			uri   : VALID_URI
		},
		true
	);

	describeInitWith("some parameters null",
		{
			id    : VALID_ID,
			type  : null,
			ami   : null,
			state : null,
			uri   : null
		},
		true
	);

	describeInitWith("type missing",
		{
			id    : VALID_ID,
			ami   : VALID_AMI,
			state : VALID_STATE_PENDING,
			uri   : null
		}
	);

	describeInitWith("some missing parameters",
		{
			id   : VALID_ID,
			type : null
		},
		true
	);

	describeInitWith("all missing parameters",
		{},
		true
	);

	describeInitWith("adding properties that don't exist",
		{
			id    : VALID_ID,
			type  : VALID_TYPE,
			ami   : VALID_AMI,
			state : VALID_STATE_PENDING,
			uri   : VALID_URI,
			test  : "this shouldn't work"
		},
		true
	);

});
