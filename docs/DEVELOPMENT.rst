max.ui.js development notes
===========================


In the process of developing new features for max.ui.js, grunt is used to automate some of the tasks.
The first thing that is automated


Code organization
-----------------

The third party libraries used in this project are located in the libs folder. All libraries include the version on the file (if any version available) and
are the original sources NOT minified. This is important as we contatenate and minify them in the build process to be able to create source maps.

The actual sources of the project live in the src folder, and are javascript files with the max.*.js naming pattern.

Font folder: All the icons used in the project are font-based, created with fontello, and live inside the font folder. There is a grunt task to automate the process
of updationg those fonts with new images.

Less folder: All the styles are created using lesscss, and they are splitted and organized into separate files. There is a grunt task that compiles less into css.

Css folder: Compiled less files into maxui.css reside in this folder, along with a convenient css.map, to use with the ChromeDevTools.

Templates folder: Each *.mustache file holds a template used in the project, and we keep them separated in files for conveninence, to avoid maintaining multiline strings
on javascript files. There is a grunt task that compiles all the templates into max.templates.js, which is the real file that is executed.


Widget visualization
--------------------

This widget in development mode is tipycally ran from the maxserver buildout, so it will be served from http://localhost:8081/maxui-dev/. In that root, a widget is
loaded directly from sources in the src/ folder, and libs in the libs/ folder. If a dist version is compiled from sources, the widget can be reached from http://localhost:8081/maxui-dev/dist.
This version is loaded from a single js file, which includes all sources and libs minified, and loaded with the auto-loading pattern that is used in production sites, in order to test it in the compiled form.


Grunt tasks
-----------

grunt watch

    It runs 3 watchers:

    less : When any .less file is changed added or removed in the less folder, the less compile task is executed, and css file is generated
    livereload : When the maxui.css file is generated, a singlar is sent trough the livereload server, that will reload only css files on the browser (a client line of javascript is required in the html)
    templates: When any .moustache file is changed added or removed in the templates folder, the src/max.templates.js file is regenerated, providing a Hogan compiled template named as the original .moustache file

grunt less

    Compiles less files as explained before

grunt concat:templates

    Compiles templates as explained before

grunt fontello

    Updates font files from fontello.com. Use following this workflow

    - First execution of grunt fontello, connects to fontello.com and starts a session with the font data found on src/font/config.json.
    - A session id is stored in the .fontello-session file, and the task prints the url to go to make the changes.
    - Go to the provided url, make needed changes to the font, and save session
    - Execute again grunt fontello, and it will grab the new font from the web session.

grunt jshint

    Runs jshint on the source files, to check for syntax errors

grunt jsbeautifier

    Formats sources files

grunt dist
    Prepares a compiled release

    - Minifies css into dist folder with grunt cssmin:dist task, with fixed font relative paths
    - concatenates all js files into one on dist folder
    - Compresses js file, and generates a source map
    - Copies the project font files,

grunt build

    Copies contents of dist folder into builds/{version}/, picking version from package.json

