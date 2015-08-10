var Genesis  = require("genesis");

function cacheAdapter (mapper) {
	if (!mapper) {
		mapper = new Genesis.MemoryMapper();
	}
};

module.exports = cacheAdapter;