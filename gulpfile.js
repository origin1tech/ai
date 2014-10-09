var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    concat = require('gulp-concat-util'),
    es = require('event-stream'),
    fs = require('fs'),
    path = require('path');

// plumber util
function plumber() {
    return $.plumber({errorHandler: $.notify.onError()});
}

// jshint notification
function jshintNotify() {
    return $.notify(function(file) {

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
    gulp.src(__dirname + '/examples/**/*.*')
        .pipe($.connect.reload());
}

gulp.task('clean', function () {
    return gulp.src([__dirname + '/dist/js/**/*.*', __dirname + '/dist/css/**/*.*'], {read: false})
        .pipe($.rimraf({force: true}));
});

// build sass
gulp.task('build-sass', ['clean'], function () {
    return gulp.src(__dirname + '/src/css/ai.scss')
        .pipe($.sass())
        .pipe(gulp.dest(__dirname + '/dist/css'))
        .pipe($.cssmin())
        .pipe($.rename({suffix: '.min'}))
        .pipe(gulp.dest(__dirname + '/dist/css'));

});

// build lib
gulp.task('build-lib', ['clean'], function () {
    return gulp.src([
            __dirname + '/src/js/index.js',
            __dirname + '/src/js/directives/**/*.js',
            __dirname + '/src/js/helpers/**/*.js'])
        .pipe($.concat('ai.js'))
        .pipe(concat.header('(function(window, document, undefined) {\n\'use strict\';\n'))
        .pipe(concat.footer('\n})(window, document);\n'))
        .pipe(gulp.dest(__dirname + '/dist/js'))
        .pipe($.uglify())
        .pipe($.rename({suffix: '.min'}))
        .pipe(gulp.dest(__dirname + '/dist/js'))
});

// copy lib
gulp.task('copy-lib', [], function () {
    var components = gulp.src([
            '!' + __dirname + '/src/js/index.js',
            __dirname + '/src/js/**/*.js'
    ])
    .pipe(gulp.dest(__dirname + '/dist/js/components'));
});

// copy lib
gulp.task('copy-sass', ['clean'], function () {
    return gulp.src([__dirname + '/src/css/**/*.scss'])
        .pipe(gulp.dest(__dirname + '/dist/css/components'));
});

// run jshint
gulp.task('jshint', ['clean'],  function() {
  return gulp.src([__dirname + '/src/js/**/*.js'])
    .pipe(plumber())
    .pipe($.cached('jshint'))
    .pipe($.jshint())
    .pipe(jshintNotify())
    .pipe($.jshint.reporter('jshint-stylish'));
});

// serve examples.
gulp.task('serve', ['build'], function() {

    gulp.watch([
         __dirname + '/examples/**/*.{js,html,css,svg,png,gif,jpg,jpeg}'
    ], {
        debounceDelay: 400
    }, function() {
        reload();
    });

    // watch styles
    gulp.watch(
        [__dirname + '/src/css/**/*.scss'],
        {debounceDelay: 400},
        ['build-sass']
    );

    // watch app
    gulp.watch(
        [__dirname + '/src/js/**/*.js'],
        {debounceDelay: 400},
        ['build-lib']
    );

    setTimeout(function () {
        $.connect.server({
            root: './examples',
            livereload: true,
            fallback: 'examples/index.html'
        });
    },200);

});

// build the library.
gulp.task('build', ['clean', 'build-sass', 'build-lib', 'copy-lib', 'copy-sass'], function() {
    // watch styles
    gulp.watch(
        [__dirname + '/src/css/**/*.scss'],
        {debounceDelay: 400},
        ['build-sass']
    );

    // watch app
    gulp.watch(
        [__dirname + '/src/js/**/*.js'],
        {debounceDelay: 400},
        ['build-lib']
    );
});

// gulp default.
gulp.task('default', $.taskListing.withFilters(null, 'default'));
