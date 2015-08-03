"use strict";

var InstanceAdapter = require("../services/instanceAdapter.js");
var Boom            = require("boom");
var _               = require("lodash");
var Joi             = require("joi");
var AwsAdapter      = require("../services/awsAdapter");
var AWS             = require("aws-sdk");
var Instance        = require("../models/Instance");
var Bluebird        = require("bluebird");

exports.register = function (server, options, next) {
	var ec2 = new AWS.EC2({
		region : "us-east-1"
	});

	Bluebird.promisifyAll(ec2);

	var instances  = options.instances || new InstanceAdapter(options.mapper);
	var awsOptions = { serverLog : server.log.bind(server), instances : instances, ec2 : ec2 };
	var awsAdapter;
	try {
		awsAdapter = options.awsAdapter || new AwsAdapter(awsOptions);
	}
	catch (error) {
		server.log([ "error", "awsAdapter", "Initialization Error" ], error);
		throw error;
	}

	server.route({
		method  : "GET",
		path    : "/",

		handler : function (request, reply) {
			reply();
		}
	});

	server.route({
		method  : "POST",
		path    : "/v1/instances",

		handler : function (request, reply) {
			var result;
			var ami  = request.payload.ami;
			var type = request.payload.type;
			instances.createInstance(ami, type)
			.then(function (instance) {
				result = instance;
				return awsAdapter.runInstances(instance);
			})
			.then(function (instance) {
				reply(instance).created("/v1/instances/" + instance.id);
			})
			.catch(function (error) {
				var failedInstance;
				switch (error.name) {

					case ("ValidationError") : {
						server.log([ "error", "rest", "ValidationError" ], "Bad Request: Incorrect parameters");
						reply(Boom.badRequest("Bad Request: Please check the parameters passed."));
						break;
					}
					case ("InvalidAMIID.Malformed") : {
						failedInstance = new Instance({
							id    : result.id,
							type  : result.type,
							ami   : result.ami,
							state : "failed",
							uri   : null
						});
						instances.updateInstance(failedInstance);
						server.log([ "error", "rest", "InvalidAMIID" ], "AMI ID entered incorrectly.");
						reply(Boom.badRequest("The AMI entered does not exist. Ensure it is of the form ami-xxxxxx."));
						break;
					}

					case ("InvalidParameterValue") : {
						failedInstance = new Instance({
							id    : result.id,
							type  : result.type,
							ami   : result.ami,
							state : "failed",
							uri   : null
						});
						server.log([ "error", "rest", "ValidationError" ], "Type entered incorrectly");
						instances.updateInstance(failedInstance);
						reply(Boom.badRequest("The Type entered does not exist. Ensure it is a valid EC2 type."));
						break;
					}

					case ("AuthFailure") : {
						failedInstance = new Instance({
							id    : result.id,
							type  : result.type,
							ami   : result.ami,
							state : "failed",
							uri   : null
						});
						server.log([ "error", "rest", "AuthFailure" ], "Authentication failure. Check credentials.");
						instances.updateInstance(failedInstance);
						reply(Boom.wrap(error));
						break;
					}

					default : {
						server.log([ "error", "rest", "DefaultFailure" ],error);
						reply(Boom.wrap(error));
					}
				}
			});
		}
	});

	server.route({
		method  : "GET",
		path    : "/v1/instances/{instanceId}",

		handler : function (request, reply) {

			var instanceId = request.params.instanceId;

			instances.getInstance({ id : instanceId })
			.then (function (instance) {
				if (!instance) {
					throw Boom.notFound("No instances found for id " + instanceId);
				}
				reply(instance);
			})
			.catch (function (error) {
				server.log([ "error", "rest", "NotFound" ], "404: Instance not found.");
				reply(Boom.wrap(error));
			});
		}
	});

	server.route({
		method  : "GET",
		path    : "/v1/instances",
		handler : function (request, reply) {

			var	query  = {};
			var schema = Joi.object().keys({
				id    : Joi.string(),
				type  : Joi.string(),
				ami   : Joi.string(),
				state : Joi.string(),
				uri   : Joi.string()
			});

			query = _.pick(request.query, "id", "ami", "type", "state", "uri");

			Joi.validate(query, schema, function (error) {
				if (error) {
					reply(Boom.badRequest("Bad Request: Please check the parameters passed."));
				}
				else {
					instances.getAllInstances(query)
					.then (function (allInstances) {
						var payload = {};
						payload.instances = allInstances;
						reply(payload);
					})
					.catch (function (error) {
							reply(Boom.wrap(error));
						}
					);
				}
			});
		}
	});

	server.route({
		method  : "PUT",
		path    : "/v1/instances/{id}",
		handler : function (request, reply) {
			var schema = Joi.object().keys({
				type     : Joi.string(),
				ami      : Joi.string(),
				state    : Joi.string(),
				uri      : Joi.string().allow(null),
				revision : Joi.number().integer()
			});

			var payload = _.pick(request.payload, "ami", "type", "state", "uri", "revision");
			Joi.validate(payload, schema, function (error) {
				if (error) {
					reply(Boom.badRequest("The parameters were entered incorrectly."));
				}
				else {
					var instance = new Instance({
						id       : request.params.id,
						ami      : request.payload.ami,
						type     : request.payload.type,
						state    : request.payload.state,
						uri      : request.payload.uri,
						revision : request.payload.revision
					});
					switch (instance.state) {
						case ("terminating") : {
							return instances.updateInstance(instance)
							.then(function (response) {
								reply(response);
								awsAdapter.terminateInstances(request.params.id).return(response)
								.then(function () {
									instance = new Instance({
										id       : response.id,
										ami      : response.ami,
										type     : response.type,
										state    : "terminated",
										uri      : null,
										revision : response.revision
									});
									return instances.updateInstance(instance);
								})
								.catch (function (error) {
									server.log([ "error", "rest", "put" ], error.message);
									if (!(error.toString().match(/\bdocument\b|\bconcurrency\b|\bdatabase\b/))) {
										return instances.getInstance({ id : request.params.id })
										.then(function (instance) {
											instance = new Instance({
												id       : instance.id,
												ami      : instance.ami,
												type     : instance.type,
												state    : "failed",
												uri      : null,
												revision : instance.revision
											});
											return instances.updateInstance(instance);
										})
										.catch(function (error) {
											server.log([ "error", "rest", "put" ], error.message);
										});
									}
								});
							})
							.catch (function (error) {
								server.log([ "error", "rest" ], error.message);
								if (error.toString().match(/\bnot exist\b/)) {
									reply(Boom.notFound("This instance does not exist."));
								}
								else if (error.toString().match(/\bconcurrency\b/)) {
									reply(Boom.conflict("Conflict error. Ensure you have the latest document version"));
								}
								else {
									reply(Boom.wrap(error));
								}
							});
						}

						case ("stopping") : {
							return instances.updateInstance(instance)
							.then(function (response) {
								reply(response);
								awsAdapter.stopInstances(request.params.id).return(response)
								.then(function () {
									instance = new Instance({
										id       : response.id,
										ami      : response.ami,
										type     : response.type,
										state    : "stopped",
										uri      : null,
										revision : response.revision
									});
									return instances.updateInstance(instance);
								})
								.catch (function (error) {
									server.log([ "error", "rest", "put" ], error.message);
									if (!(error.toString().match(/\bdocument\b|\bconcurrency\b|\bdatabase\b/))) {
										return instances.getInstance({ id : request.params.id })
										.then(function (instance) {
											instance = new Instance({
												id       : instance.id,
												ami      : instance.ami,
												type     : instance.type,
												state    : "failed",
												uri      : null,
												revision : instance.revision
											});
											return instances.updateInstance(instance);
										})
										.catch(function (error) {
											server.log([ "error", "rest", "put" ], error.message);
										});
									}
								});
							})
							.catch (function (error) {
								server.log([ "error", "rest" ], error.message);
								if (error.toString().match(/\bnot exist\b/)) {
									reply(Boom.notFound("This instance does not exist."));
								}
								else if (error.toString().match(/\bconcurrency\b/)) {
									reply(Boom.conflict("Conflict error. Ensure you have the latest document version"));
								}
								else {
									reply(Boom.wrap(error));
								}
							});
						}

						default : {
							server.log([ "error", "rest" ], "Incorrect parameters");
							reply(Boom.badRequest("The state entered is not valid."));
							break;
						}
					}
				}
			});
		}
	});

	next();
};

exports.register.attributes = {
	name : "rest"
};
