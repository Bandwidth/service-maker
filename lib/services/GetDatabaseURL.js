"use strict";

function getUrl(DB_URL, DB_USER, DB_PASSWORD) {
	if (DB_URL === undefined) {
		return "mongodb://localhost/test";
	}
	else {
		return "mongodb://" + DB_USER + ":" + DB_PASSWORD + "@" + DB_URL;
	}
}

exports.getUrl = getUrl;
