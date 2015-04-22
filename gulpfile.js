var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    concat = require('gulp-concat-util'),
    del = require('del'),
    es = require('event-stream'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),
    argv = process.argv,
    major, 
    minor,
    pkg,
    lic,
    watch;

// check if should live reload and watch.
watch = (argv.indexOf('--nowatch') === -1 && argv.indexOf('-n') === -1);
minor = argv.indexOf('--minor') !== -1;
major = argv.indexOf('--major') !== -1;
pkg = require('./package.json');

lic ='\n/**\n' +
'* @license\n' +
'* Ai: <http://github.com/origin1tech/ai>\n' +
'* Version: ' + pkg.version + '\n' +
'* Author: Origin1 Technologies <origin1tech@gmail.com>\n' +
'* Copyright: 2014 Origin1 Technologies\n' +
'* Available under MIT license <http://github.com/origin1tech/stukko-client/license.md>\n' +
'*/\n\n';

// plumber util
function plumber() {
    return plugins.plumber({errorHandler: plugins.notify.onError()});
}

// notification for jshint
function jshintNotify() {
    return plugins.notify(function(file) {
        if (file.jshint.success)
            return false;
        var errors = file.jshint.results.map(function (data) {
            return data.error ? '(' + data.error.line + ':' + data.error.character + ') ' + data.error.reason : '';
        }).join('\n');
        return file.relative + ' (' + file.jshint.results.length + ' errors)\n' + errors;
    });
}

// clean directories
gulp.task('clean', function (cb) {

    del([
        './dist/**/*.*'
    ], cb);
    
});

// build sass
gulp.task('build-sass', ['clean'], function () {

    var tasks = [],
        taskBundle,
        taskModules;

    taskBundle = gulp.src('./src/ai.scss')
        .pipe(plugins.sass())
        .pipe(gulp.dest('./dist'));
        //.pipe(plugins.cssmin())
        //.pipe(plugins.rename({suffix: '.min'}))
        //.pipe(gulp.dest('./dist'));
    tasks.push(taskBundle);

    taskModules = gulp.src('./src/**/*.scss')
        .pipe(plugins.sass())
        .pipe(gulp.dest('./dist'))
        .pipe(plugins.cssmin())
        .pipe(plugins.rename({suffix: '.min'}))
        .pipe(gulp.dest('./dist'));
    tasks.push(taskModules);
    
    return es.concat.apply(null, tasks);
});

// build lib
gulp.task('build-lib', ['clean'], function () {

    return gulp.src([
            '!./src/app.js',
            './src/ai.js',
            './src/helpers.js',
            './src/**/*.js'
         ])
        .pipe(plugins.concat('ai.js'))
        .pipe(concat.header(lic + '(function(window, document, undefined) {\n\'use strict\';\n'))
        .pipe(concat.footer('\n})(window, document);\n'))
        .pipe(gulp.dest('./dist'))
        .pipe(plugins.uglify())
        .pipe(plugins.rename({suffix: '.min'}))
        .pipe(gulp.dest('./dist'));
});

// copy lib
gulp.task('copy-lib', ['clean'], function () {
    gulp.src([
        './src/**/*.*'
    ])
    .pipe(gulp.dest('./dist'));
});

// Note: favor linting in IDE.
gulp.task('jshint', ['clean'],  function() {
  return gulp.src(['./src/**/*.js'])
    .pipe(plumber())
    .pipe(plugins.cached('jshint'))
    .pipe(plugins.jshint())
    .pipe(jshintNotify())
    .pipe(plugins.jshint.reporter('jshint-stylish'));
});

// livereload.
gulp.task('reload', ['clean', 'build-sass', 'build-lib', 'copy-lib'], function reload () {
    if(!watch) return;
    gulp.src('./src/**/*.*')
        .pipe(plugins.connect.reload());
});

// build the library.
gulp.task('build', ['clean', 'build-sass', 'build-lib', 'copy-lib'], function() {
    if(watch) {
        gulp.watch(
            ['./src/**/*.*'],
            {debounceDelay: 400},
            ['reload']
        );
    }
});

// serve examples.
gulp.task('serve', ['build'], function() {  
    var conf = {
        root: './dist',
        livereload: true,
        fallback: 'dist/index.html',
        host: '0.0.0.0',
        // quick hack for demo the loader.
        middleware: function (conn, options){
            return [ function (req, res, next) {
                var isLoader = /\/api\/loader/i.test(req.url);
                var isTree = /\/api\/tree/i.test(req.url);
                var isPassport = /\/api\/passport/i.test(req.url);

                if(isLoader){
                    var q = url.parse(req.url).query.split('=');
                    var timeout = parseInt(q[1] || 2000);
                    setTimeout(function () {
                        res.end('done');
                    }, timeout);
                }

                else if(isTree) {
                    var source = [
                        { value: 1, label: 'item one' },
                        { value: 2, label: 'item two', children: [
                            { value: 21, label: 'child item 2-1'},
                            { value: 22, label: 'child item 2-2'},
                            { value: 23, label: 'child item 2-3', children: [
                                { value: 231, label: 'child child item 2-3-1' },
                                { value: 232, label: 'child child item 2-3-2' }
                            ]}
                        ] },
                        { value: 3, label: 'item three' },
                        { value: 4, label: 'item four' }
                    ];
                    res.end(JSON.stringify(source));
                }

                else if (isPassport) {
                    var user, roles;
                    user = {
                        firstName: 'Irwin',
                        lastName: 'Fletcher',
                        email: 'fletchlives@gmail.com'
                    };
                    roles = {
                        0: '*',
                        1: 'user',
                        2: 'manager',
                        3: 'admin',
                        4: 'superadmin'
                    };
                    res.end(JSON.stringify({user: user, roles: roles}));
                }

                else {
                    next();
                }
            }];
        }
    };

    setTimeout(function () {
        var app = plugins.connect.server(conf);        
    }, 0);

});

// bumps the version for package/bower.
gulp.task('bump', function () {
 
    gulp.src(['./package.json', './bower.json'])
        .pipe(plugins.bump())
        .pipe(gulp.dest('./'));

});


