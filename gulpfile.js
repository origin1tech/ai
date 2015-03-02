var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    concat = require('gulp-concat-util'),
    es = require('event-stream'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),
    argv = process.argv,
    pkg,
    lic,
    watch;

// check if should live reload and watch.
watch = (argv.indexOf('--nowatch') === -1 && argv.indexOf('-n') === -1);

pkg = require('./package.json');

lic ='\n/**\n' +
'* @license\n' +
'* Ai: <http://github.com/origin1tech/ai>\n' +
'* Version: ' + pkg.version.replace('*', '') +
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

// reload server util
function reload () {
    gulp.src('./src/**/*.{js,html,css,svg,png,gif,jpg,jpeg}')
        .pipe(plugins.connect.reload());
}

gulp.task('clean', function () {
    return gulp.src(['./dist/**/*.*'], {read: false})
        .pipe(plugins.rimraf({force: true}));
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
            '!./src/common/**/*.js',
            '!./src/main.js',
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
        '!./src/**/_*.scss',
        './src/**/*.*'
    ])
    .pipe(gulp.dest('./dist'));
});

// run jshint
gulp.task('jshint', ['clean'],  function() {
  return gulp.src(['./src/**/*.js'])
    .pipe(plumber())
    .pipe(plugins.cached('jshint'))
    .pipe(plugins.jshint())
    .pipe(jshintNotify())
    .pipe(plugins.jshint.reporter('jshint-stylish'));
});

gulp.task('reload', ['build'], reload);

// serve examples.
gulp.task('serve', ['build'], function() {  
    var conf = {
        root: './dist',
        //livereload: true,
        fallback: 'dist/index.html',
        middleware: function (conn, options){
            return [ function (req, res, next) {
                var isLoader = /\/api\/loader/.test(req.url);             
                if(isLoader){
                    var q = url.parse(req.url).query.split('=');
                    var timeout = parseInt(q[1] || 2000);
                    setTimeout(function () {
                        return res.end('done');
                    }, timeout);
                } else {
                    next();
                }
            }];
        }
    };
    setTimeout(function () {
        var app = plugins.connect.server(conf);
        gulp.watch(
            ['./src/**/*.{js,html,css,svg,png,gif,jpg,jpeg}'],
            { debounceDelay: 400 }, ['reload']);
        
    }, 0);
});

// build the library.
gulp.task('build', ['clean', 'build-sass', 'build-lib', 'copy-lib'], function() {
    if(watch) {
        gulp.watch(
            ['./src/**/*.*'],
            {debounceDelay: 400},
            ['clean', 'build-sass', 'build-lib', 'copy-lib']
        );
    }
});

