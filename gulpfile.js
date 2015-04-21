/*
 * - run babel
 * - build sourcemaps
 */

var gulp = require('gulp')

var babel = require('gulp-babel')
var sourcemaps = require('gulp-sourcemaps')

var buildList = [ 'dagoba.js' ]

gulp.task('build', function () {
  gulp.src(buildList)
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('build'))
})

gulp.task('default',['build'])
