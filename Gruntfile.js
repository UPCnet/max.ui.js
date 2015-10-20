module.exports = function (grunt) {
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
                    sourceMapFilename: 'src/css/maxui.css.map',
                    sourceMapRootpath: "../",
                    sourceMapURL: 'http://localhost:8081/maxui-dev/src/css/maxui.css.map'
                },
                files: {
                    // Create a file called "public/css/site.css" from "less/site.less".
                    // Note: If the directory public/css does not exist, it will be
                    // created by the task.
                    "src/css/maxui.css": "src/less/maxui.less"
                }
            }
        },

        watch: {
            // This task is for detecting changes on *.less files, and execute less compiler
            styles: {
                // The path 'less/**/*.less' will expand to match every less file in
                // the less directory.
                files: ['src/less/*.less', 'src/font/*.less', 'src/less/classes/*.less'],
                // The tasks to run
                tasks: ['less', 'concat:less']
            },
            // This task is for detecting changes in compiled .css files, and signal livereload on the browser
            livereload: {
                options: {
                    livereload: true
                },
                files: ['src/css/*.css']
            },
            templates: {
                // Genereate concatenated templates file on changing templats
                files: ['src/templates/*.mustache'],
                // The tasks to run
                tasks: ['concat:templates']
            }

        },

        // Minify less-compiled css
        cssmin: {
            dist: {
                expand: true,
                cwd: 'src/css/',
                src: ['maxui.css'],
                dest: 'dist/',
                ext: '.min.css'
            }
        },

        replace: {
            // Replaces font location for releases
            fontlocation: {
                src: ['dist/maxui.min.css'],
                overwrite: true, // overwrite matched source files
                replacements: [{
                    from: "../font/maxicons",
                    to: "font/maxicons"
                }]
            },
            // Puts version number from package into place
            version: {
                src: ['src/max.ui.js'],
                overwrite: true, // overwrite matched source files
                replacements: [{
                    from: /maxui.version = '[.\d]+';/g,
                    to: "maxui.version = '<%= grunt.file.readJSON('package.json').version %>';"
                }]
            }

        },

        // Download Fontello fonts based on local configuration
        // A session ID is stored in .fontello-session to be able to
        // download fonts afer a session save on the web
        fontello: {
            dist: {
                options: {
                    config: 'src/font/config.json',
                    zip: 'tmp',
                    fonts: 'src/font',
                    styles: 'src/font',
                    force: true,
                    sass: true
                }
            }
        },

        concat: {
            less: {
                options: {
                    separator: '\n\n/*' +
                        '\n   CSS HACKS for IEx' +
                        '\n*/\n\n'
                },
                src: ["src/css/maxui.css", "src/css/hacks.css"],
                dest: 'src/css/maxui.css'
            },
            templates: {
                options: {
                    separator: ",\n",
                    process: function (src, filepath) {
                        // Strip .mustache extension
                        var variable_name = filepath.substr(14, filepath.length - 23);
                        return "        " + variable_name + ": Hogan.compile('\\\n" + src.replace(/\n/g, '\\\n        ') + "    ')";
                    },
                    banner: '/*global Hogan */' +
                        '/*jshint multistr: true */\n' +
                        '/**\n' +
                        '* @fileoverview Provides hogan compiled templates\n' +
                        '*               ready to render.\n' +
                        '*/\n' +
                        "'use strict';\n\n" +
                        'var max = max || {};\n\n' +
                        'max.templates = function() {\n' +
                        '    var templates = {\n',

                    footer: '\n    };\n' +
                        '    return templates;\n' +
                        '};\n'
                },
                src: ['src/templates/*.mustache'],
                dest: 'src/max.templates.js'
            },
            dist: {
                options: {
                    separator: '\n\n;\n\n',
                    stripBanners: true
                },
                src: [
                    'libs/hogan-2.0.0.js',
                    'libs/jquery.easydate-0.2.4.js',
                    'libs/jquery.iecors.js',
                    'libs/jquery.mousewheel-3.1.9.js',
                    'libs/sockjs-0.3.min.js',
                    'libs/json2.js',
                    'libs/sockjs-0.3.4.js',
                    'libs/stomp-2.3.1.js',
                    'libs/underscore-1.6.0.js',
                    'libs/uuid-1.4.1.js',
                    'libs/ua-parser-1.7.1.js',
                    'src/max.views.inputs.js',
                    'src/max.views.overlay.js',
                    'src/max.views.chatinfo.js',
                    'src/max.views.scrollbar.js',
                    'src/max.views.conversations.js',
                    'src/max.templates.js',
                    'src/max.messaging.js',
                    'src/max.logging.js',
                    'src/max.literals.js',
                    'src/max.utils.js',
                    'src/max.client.js',
                    'src/max.ui.js',
                    'src/max.loader.js'
                ],
                dest: 'dist/maxui.js'
            }
        },

        // Syntax checker
        jshint: {
            options: {
                globalstrict: true,
                undef: true,
                latedef: true,
                indent: 4,
                curly: true,
                eqeqeq: true,
                eqnull: true,
                browser: true,
                es3: true,
                unused: 'vars',
                globals: {
                    "jQuery": true,
                    "alert": true,
                    "module": true,
                    "JSON": true,
                    "_" :true
                }
            },
            all: ['src/max*.js']
        },

        jsbeautifier: {
            "default": {
                src: ["src/max.*.js"],
                options: {
                    js: {
                        braceStyle: "collapse",
                        breakChainedMethods: false,
                        e4x: false,
                        evalCode: false,
                        indentChar: " ",
                        indentLevel: 0,
                        indentSize: 4,
                        indentWithTabs: false,
                        jslintHappy: false,
                        keepArrayIndentation: true,
                        keepFunctionIndentation: true,
                        maxPreserveNewlines: 2,
                        preserveNewlines: false,
                        spaceBeforeConditional: true,
                        spaceInParen: false,
                        unescapeStrings: false,
                        wrapLineLength: 0
                    }
                }
            }
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

        // Copy files plugin

        copy: {
            dist: {
                files: [{
                    src: 'src/font/maxicons.eot',
                    dest: 'dist/font/maxicons.eot'
                }, {
                    src: 'src/font/maxicons.svg',
                    dest: 'dist/font/maxicons.svg'
                }, {
                    src: 'src/font/maxicons.ttf',
                    dest: 'dist/font/maxicons.ttf'
                }, {
                    src: 'src/font/maxicons.woff',
                    dest: 'dist/font/maxicons.woff'
                }]
            },
            build: {
                files: [{
                    expand: true,
                    cwd: 'dist/font',
                    src: '*',
                    dest: 'builds/<%= uglify.pkg.version %>/font/'
                }, {
                    expand: true,
                    cwd: 'dist/',
                    src: 'maxui*',
                    dest: 'builds/<%= uglify.pkg.version %>/'
                }]
            }
        },

        dalek: {
            options: {},
            test: {
                src: ['test/test.js']
            }
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
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-dalek');


    grunt.registerTask('dist', ['replace:version', 'concat:dist', 'uglify:dist', 'cssmin:dist', 'replace:fontlocation', 'copy:dist']);
    grunt.registerTask('build', ['copy:build']);
    grunt.registerTask('templates', ['concat:templates']);
    grunt.registerTask('')

};
