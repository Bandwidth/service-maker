"use strict";

function connect(DB_URL, DB_USER, DB_PASSWORD) {
	return "mongodb://" + DB_USER + ":" + DB_PASSWORD + "@" + DB_URL;
}

exports.connect = connect;
