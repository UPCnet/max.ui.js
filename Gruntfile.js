module.exports = function(grunt) {
  // Configure
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    // The less task.
    less: {
      // This is the target's name "production".
      // You can run this task like this:
      //   grunt less:production
      production: {
        options: {
          // Set the option to compress the resulting css.
          yuicompress: false,
          sourceMap: true,
          sourceMapFilename: 'css/maxui.css.map',
          sourceMapRootpath: "../",
          sourceMapURL: 'http://localhost:8081/maxui-dev/css/maxui.css.map'
        },
        files: {
          // Create a file called "public/css/site.css" from "less/site.less".
          // Note: If the directory public/css does not exist, it will be
          // created by the task.
          "css/maxui.css": "less/maxui.less"
        }
      }
    },

    watch: {
      // This task is for detecting changes on *.less files, and execute less compiler
      styles: {
        // The path 'less/**/*.less' will expand to match every less file in
        // the less directory.
        files: [ 'less/*.less' , 'font/maxicons.less', 'less/classes/*.less'],
        // The tasks to run
        tasks: [ 'less' ]
      },
      // This task is for detecting changes in compiled .css files, and signal livereload on the browser
      livereload: {
        options: { livereload: true },
        files: ['css/*.css']
      }

    },

    // Minify less-compiled css
    cssmin: {
      dist: {
        expand: true,
        cwd: 'css/',
        src: ['maxui.css'],
        dest: 'dist/',
        ext: '.min.css'
      }
    },

    replace: {
      dist: {
        src: ['dist/maxui.min.css'],
        overwrite: true,                 // overwrite matched source files
        replacements: [{
          from: "../font/maxicons",
          to: "font/maxicons"
        }]
      }
    },

    // Download Fontello fonts based on local configuration
    // A session ID is stored in .fontello-session to be able to
    // download fonts afer a session save on the web
    fontello: {
      dist: {
        options: {
            config  : 'font/config.json',
            zip     : 'tmp',
            fonts   : 'font',
            styles  : 'font',
            force   : true,
            sass    : true
        }
      }
    },

    concat: {
      options: {
          separator: '\n\n;\n\n',
          stripBanners: true,
      },
      dist: {
          src: [
              'libs/hogan-2.0.0.js',
              'libs/jquery.easydate-0.2.4.js',
              'libs/jquery.iecors.js',
              'libs/jquery.mousewheel-3.1.9.js',
              'libs/sockjs-0.3.min.js',
              'libs/json2.js',
              'libs/sockjs-0.3.4.js',
              'libs/stomp-2.3.1.js',
              'max.templates.js',
              'max.literals.js',
              'max.utils.js',
              'max.client.js',
              'max.ui.js',
              'max.loader.js'
          ],
          dest: 'dist/maxui.js',
      },
    },

    // Syntax checker
    jshint: {
      all: ['max.*.js',]
    },

    // JS Compressor
    uglify: {
        pkg: grunt.file.readJSON('package.json'),
        dist: {
           options: {
            sourceMap: true,
            banner: '/*! <%= uglify.pkg.name %> - v<%= uglify.pkg.version %> - ' +
              '<%= grunt.template.today("yyyy-mm-dd") %> */'
          },

          files: {
            'dist/maxui.min.js': ['dist/maxui.js']
          }
        }
      },

      copy: {
        dist: {
          files: [
              {src: 'font/maxicons.eot', dest: 'dist/font/maxicons.eot'},
              {src: 'font/maxicons.svg', dest: 'dist/font/maxicons.svg'},
              {src: 'font/maxicons.ttf', dest: 'dist/font/maxicons.ttf'},
              {src: 'font/maxicons.woff', dest: 'dist/font/maxicons.woff'},
          ]
        },
        build: {
          files: [
              {expand:true, cwd: 'dist/', src: 'font', dest: 'builds/<%= uglify.pkg.version %>/'},
              {expand:true, cwd: 'dist/', src: 'maxui*', dest: 'builds/<%= uglify.pkg.version %>/'}
          ]
        },
      }

  });

  // Load tasks
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-fontello');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');


  grunt.registerTask('dist', ['concat:dist', 'uglify:dist', 'cssmin:dist', 'replace:dist', 'copy:dist'])
  grunt.registerTask('build', ['copy:build'])

};

