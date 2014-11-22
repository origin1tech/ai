var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    concat = require('gulp-concat-util'),
    es = require('event-stream'),
    fs = require('fs'),
    path = require('path');

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
    gulp.src(__dirname + '/src/**/*.{js,html,css,svg,png,gif,jpg,jpeg}')
        .pipe(plugins.connect.reload());
}

gulp.task('clean', function () {

    return gulp.src([__dirname + '/dist/**/*.*'], {read: false})
        .pipe(plugins.rimraf({force: true}));
});

// build sass
gulp.task('build-sass', ['clean'], function () {

    var tasks = [],
        taskBundle,
        taskModules;

    taskBundle = gulp.src(__dirname + '/src/ai.scss')
        .pipe(plugins.sass())
        .pipe(gulp.dest(__dirname + '/dist'))
        .pipe(plugins.cssmin())
        .pipe(plugins.rename({suffix: '.min'}))
        .pipe(gulp.dest(__dirname + '/dist'));
    tasks.push(taskBundle);

    taskModules = gulp.src(__dirname + '/src/**/*.scss')
        .pipe(plugins.sass())
        .pipe(gulp.dest(__dirname + '/dist'))
        .pipe(plugins.cssmin())
        .pipe(plugins.rename({suffix: '.min'}))
        .pipe(gulp.dest(__dirname + '/dist'));
    tasks.push(taskModules);

    return es.concat.apply(null, tasks);

});

// build lib
gulp.task('build-lib', ['clean'], function () {
    return gulp.src([
            '!' + __dirname + '/src/register/register.js',
            __dirname + '/src/**/*.js'
         ])
        .pipe(plugins.concat('ai.js'))
        .pipe(concat.header('(function(window, document, undefined) {\n\'use strict\';\n'))
        .pipe(concat.footer('\n})(window, document);\n'))
        .pipe(gulp.dest(__dirname + '/dist'))
        .pipe(plugins.uglify())
        .pipe(plugins.rename({suffix: '.min'}))
        .pipe(gulp.dest(__dirname + '/dist'));
});

// copy lib
gulp.task('copy-lib', ['clean'], function () {
    gulp.src([
        '!' + __dirname + '/src/**/_*.scss',
            __dirname + '/src/**/*.*'
    ])
    .pipe(gulp.dest(__dirname + '/dist'));
});

// run jshint
gulp.task('jshint', ['clean'],  function() {
  return gulp.src([__dirname + '/src/**/*.js'])
    .pipe(plumber())
    .pipe(plugins.cached('jshint'))
    .pipe(plugins.jshint())
    .pipe(jshintNotify())
    .pipe(plugins.jshint.reporter('jshint-stylish'));
});

// serve examples.
gulp.task('serve', ['build'], function() {

    gulp.watch([
         __dirname + '/dist/**/*.*'
    ], {
        debounceDelay: 400
    }, function() {
        reload();
    });

    setTimeout(function () {
        plugins.connect.server({
            root: './dist',
            livereload: true,
            fallback: 'dist/index.html'
        });
    },200);

});

// build the library.
gulp.task('build', ['clean', 'build-sass', 'build-lib', 'copy-lib'], function() {

    gulp.watch(
        [__dirname + '/src/**/*.*'],
        {debounceDelay: 400},
        ['clean', 'build-sass', 'build-lib', 'copy-lib']
    );

});

