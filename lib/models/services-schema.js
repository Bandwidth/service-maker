"use strict";

var Genesis = require("genesis");
var Joi = require("joi");

module.exports = Genesis.create("services",	{
	index  : "id",
	schema : Joi.object().keys({
		id    : Joi.string().required(),                                   // a unique ID
		type  : Joi.string().required(),                                   // the EC2 instance type
		ami   : Joi.string().required(),                                   // the AMI ID for the instance.
		state : Joi.string().regex(/pending|ready/).required(),            // the state of the instance
		uri   : Joi.string().uri().required()                              // the uri location of the server
	})
});
