const gulp = require('gulp');
const webpack = require('webpack-stream');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const postcss = require('gulp-postcss');
const modules = require('postcss-modules');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const imp = require('postcss-import');
const named = require('vinyl-named');

gulp.task('webpack', () =>
  gulp.src('src/entry.js')
    .pipe(webpack({
      module: {
        loaders: [
          { test: /\.css$/, loader: ExtractTextPlugin.extract('style', 'css?modules') }
        ]
      },
      plugins: [
        new ExtractTextPlugin('dist/extracted.css')
      ]
    }))
    .on('error', e => { console.log(e) })
    .pipe(gulp.dest('dist'))
);

gulp.task('prerender', () =>
  gulp.src(['src/hoge.css', 'src/fuga.css'])
    .pipe(named())
    .pipe(webpack({
      module: {
        loaders: [
          { test: /\.css$/, loader: 'css/locals?modules' }
        ]
      },
      output: {
        libraryTarget: 'commonjs2'
      }
    }))
    .on('error', e => { console.log(e) })
    .pipe(gulp.dest('dist'))
);

gulp.task('postcss', () =>
  gulp.src(['src/*.css', '!src/entry.css'])
    .pipe(postcss([modules()]))
    .on('error', e => { console.log(e) })
    .pipe(gulp.dest('temp'))
);

gulp.task('postcss-2nd', ['postcss'], () =>
  gulp.src('src/entry.css')
    .pipe(postcss([imp, autoprefixer, cssnano]))
    .on('error', e => { console.log(e) })
    .pipe(gulp.dest('dist'))
);

gulp.task('default', ['postcss-2nd', 'prerender']);
