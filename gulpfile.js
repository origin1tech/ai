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
    es = require('event-stream');


function toArray(val) {
    if(!(val instanceof Array))
        return [val];
    return val;
}

function clear(sources) {
    sources = toArray(sources);
    gulp.src(sources, { read: false })
        .pipe(clean({force: true}));
}

function bundle(sources, dest, name) {

    var minName;

    minName = name.replace('{{suffix}}', '.min');
    name = name.replace('{{suffix}}', '');

    gulp.src(sources)
        .pipe(concat(name))
        .pipe(gulp.dest(dest))
        .pipe(concat(minName))
        .pipe(uglify())
        .pipe(gulp.dest(dest));



}


gulp.task('clean', [], function () {
    clear('./dist');
});

gulp.task('bundle', ['clean'], function () {
    var sources, dest, name;
    sources = [

        // prefix
        './src/prefix.js',

        // module
        './src/index.js',

        // providers
        './src/click2call.js',
        './src/resolver.js',

        // directives
        './src/nicescroll.js',

        './src/suffix.js'

    ];
    dest =  './dist';
    name = 'ai{{suffix}}.js';
    bundle(sources, dest, name);
});

gulp.task('build', ['clean', 'bundle']);
