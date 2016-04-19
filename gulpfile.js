const gulp = require('gulp');
const webpack = require('webpack-stream');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const postcss = require('gulp-postcss');
const modules = require('postcss-modules');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const imp = require('postcss-import');
const named = require('vinyl-named');

// 1. Build js + css bundle for browser. Enough for server side rendering.
gulp.task('webpack-full', () =>
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

// 2. Build js bundle for browser. No bundle css, need to run (4) for it.
gulp.task('webpack-no-css', () =>
  gulp.src('src/entry.js')
    .pipe(webpack({
      module: {
        loaders: [
          { test: /\.css$/, loader: 'css/locals?modules' }
        ]
      },
      output: {
        filename: '[name].js',
        libraryTarget: 'commonjs2'
      }
    }))
    .on('error', e => { console.log(e) })
    .pipe(gulp.dest('dist'))
);

// 3. Build individual js modules exporting class names for server and e2e test.
// Use as complementary of (1).
// NOTE: Not enough for isomorphic rendering, packing togeter with renderer is required.
gulp.task('prerender', () =>
  gulp.src(['src/*.css', '!src/entry.css'])
    .pipe(named())
    .pipe(webpack({
      module: {
        loaders: [
          { test: /\.css$/, loader: 'css/locals?modules' }
        ]
      },
      output: {
        libraryTarget: 'commonjs2'
      },
      plugins: [
        new webpack.webpack.optimize.UglifyJsPlugin()
      ]
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

// 4. Build bundle css + individual jsons without webpack for cleaner outputs.
// Gives everything needed for server-side rendering.
gulp.task('postcss-2nd', ['postcss'], () =>
  gulp.src('src/entry.css')
    .pipe(postcss([imp, autoprefixer, cssnano]))
    .on('error', e => { console.log(e) })
    .pipe(gulp.dest('dist'))
);

// WINNER: (2) + (4)
gulp.task('default', ['postcss-2nd', 'webpack-no-css']);
