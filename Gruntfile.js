"use strict";
module.exports = function (grunt) {

	var _ = grunt.util._;

	var sourceFiles = [ "*.js", "config/**/*.js", "lib/**/*.js", "travis/**/*.js" ];
	var testFiles = [ "test/**/*.js" ];
	var allFiles = sourceFiles.concat(testFiles);

	var defaultJsHintOptions = grunt.file.readJSON("./.jshint.json");
	var testJsHintOptions = _.defaults(
		grunt.file.readJSON("./test/.jshint.json"),
		defaultJsHintOptions
	);

	grunt.initConfig({
		jscs : {
			src     : allFiles,
			options : {
				config : ".jscsrc"
			}
		},

		jshint : {
			src     : sourceFiles,
			options : defaultJsHintOptions,
			test    : {
				options : testJsHintOptions,
				files   : {
					test : testFiles
				}
			}
		},
		mochaIstanbul : {
			coverage : {
				src     : "test/unit",
				options : {
					check : {
						statements : 100,
						branches   : 100,
						lines      : 100,
						functions  : 100
					},

					mask      : "**/*_spec.js",
					recursive : true
				}
			}
		}
	});

	// Load plugins
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-jscs");
	grunt.loadNpmTasks("grunt-mocha-istanbul");

	// Rename tasks
	grunt.task.renameTask("mocha_istanbul", "mochaIstanbul");

	// Register tasks
	grunt.registerTask("test", [ "mochaIstanbul:coverage" ]);
	grunt.registerTask("lint", "Check for common code problems.", [ "jshint" ]);
	grunt.registerTask("style", "Check for style conformity.", [ "jscs" ]);
	grunt.registerTask("default", [ "lint", "style", "test" ]);
};
