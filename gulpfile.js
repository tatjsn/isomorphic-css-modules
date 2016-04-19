const gulp = require('gulp');
const webpack = require('webpack-stream');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const postcss = require('gulp-postcss');
const modules = require('postcss-modules');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const imp = require('postcss-import');
const named = require('vinyl-named');
const path = require('path');
const stringHash = require('string-hash');

const cssLoaderParams = 'modules&localIdentName=[name]-[local]-[hash:base64:5]'

// Method 1. Build js + css bundle for browser. Enough for client-only rendering.
gulp.task('bundle', () =>
  gulp.src('src/entry.js')
    .pipe(webpack({
      module: {
        loaders: [
          { test: /\.css$/, loader: ExtractTextPlugin.extract('style', 'css?' + cssLoaderParams) }
        ]
      },
      output: {
        filename: 'bundle.js'
      },
      plugins: [
        new ExtractTextPlugin('bundle.css'),
        new webpack.webpack.optimize.UglifyJsPlugin()
      ]
    }))
    .on('error', e => { console.log(e) })
    .pipe(gulp.dest('dist'))
);

// Complementary of the bundles, individual js modules exporting class names for e2e test.
// NOTE: Not enough for isomorphic rendering because of different name, extra work of wrapping
// with depender components and exporting as a single server-side renderer module is required.  
gulp.task('prerender', () =>
  gulp.src(['src/*.css', '!src/entry.css'])
    .pipe(named())
    .pipe(webpack({
      module: {
        loaders: [
          { test: /\.css$/, loader: 'css/locals?' + cssLoaderParams }
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

const generateScopedName = (name, filename, css) => {
  const file = path.basename(filename, '.css');
  const hash = stringHash(css).toString(36).substr(0, 5);
  return [file, name, hash].join('-');
}

// Method 2. Build bundle css + individual jsons without webpack for cleaner outputs.
// Gives everything needed for server-side rendering.
// First pass: Generate individual css + json
gulp.task('postcss', () =>
  gulp.src(['src/*.css', '!src/entry.css'])
    .pipe(postcss([modules({ generateScopedName })]))
    .on('error', e => { console.log(e) })
    .pipe(gulp.dest('temp'))
);

// Second pass: Combine each css then post-processing and remove possible duplicate
// classes as result of the composes property
gulp.task('postcss-2nd', ['postcss'], () =>
  gulp.src('src/entry.css')
    .pipe(postcss([imp, autoprefixer, cssnano]))
    .on('error', e => { console.log(e) })
    .pipe(gulp.dest('dist'))
);

// WINNER: Method 2 with isomorphic app importing the json products.
// Maintaining entry.css feels better than designing renderer module for webpack.
gulp.task('default', ['postcss-2nd']);
gulp.task('all', ['bundle', 'prerender', 'postcss-2nd']);
