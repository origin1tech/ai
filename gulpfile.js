'use strict';

var fs = require('fs'),
    p = require('path'),
    gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    clean = require('gulp-rimraf'),
    concat = require ('gulp-concat'),
    cssmin = require('gulp-cssmin'),
    argv = require('yargs').argv,
    sass = require('gulp-sass'),
    es = require('event-stream'),
    conf;

conf = require(p.join(process.cwd(), '/conf.json'));
if(!conf) return;

// converts plain string to array.
function toArray(val) {
    if(!(val instanceof Array))
        return [val];
    return val;
}

// cleans target dir.
function clear(sources) {
    sources = toArray(sources);
    gulp.src(sources, { read: false })
        .pipe(clean({force: true}));
}

// bundles AI.
function bundle(sources, dest, name) {

    var minName;

    minName = name.replace('{{min}}', '.min');
    name = name.replace('{{min}}', '');

    gulp.src(sources)
        .pipe(concat(name))
        .pipe(gulp.dest(dest))
        .pipe(concat(minName))
        .pipe(uglify())
        .pipe(gulp.dest(dest));
}

// copies AI to development dirs.
// handy when editing source.
function copy(sources, dests) {
    if(!sources || !sources.length) return;
    var tasks = sources.map(function (src, idx) {
        var dest = dests[idx] || dests[0];
        if(!dest) return;
        return gulp.src(src)
            .pipe(gulp.dest(dest));
    });
    return es.concat.apply(null, tasks);
}

gulp.task('clean', [], function (sources) {
    clear(sources);
});

gulp.task('bundle', [], function () {
    var sources, dest, name;
    sources = conf.bundle.sources;
    dest =  conf.bundle.dest;
    name = conf.bundle.name;
    bundle(sources, dest, name);
});

gulp.task('copy', ['bundle'], function () {
    copy(conf.copy.sources, conf.copy.dests);
});
gulp.task('build', ['copy'], function () {

});
