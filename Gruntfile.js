module.exports = function(grunt) {

  var _ = grunt.util._;

  var sourceFiles = [ '*.js', 'app/**/*.js', 'core/**/*.js', 'travis/**/*.js' ];
  var testFiles = [ 'test/**/*.js' ];
  var allFiles = sourceFiles.concat(testFiles);

  grunt.initConfig({
    jscs: {
      src: allFiles
    , options: {
        config: '.jscsrc'
      }
    }

  , jshint: {
      src: sourceFiles
    , options: {
        laxcomma: true
      }
    }

  , mochaIstanbul: {
      coverage: {
        src: 'test'
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-mocha-istanbul');

  // Rename tasks
  grunt.task.renameTask('mocha_istanbul', 'mochaIstanbul');

  // Register tasks
  grunt.registerTask('test', [ 'mochaIstanbul:coverage' ]);
  grunt.registerTask('lint', 'Check for common code problems.', [ 'jshint' ]);
  grunt.registerTask('style', 'Check for style conformity.', [ 'jscs' ]);
  grunt.registerTask('default', [ 'lint', 'style', 'test' ]);

};
