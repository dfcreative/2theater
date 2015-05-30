/**
 * Site builder, instead of metalsmiths etc.
 */

var gulp = require('gulp');
var rename = require('gulp-rename');
var map = require('map-stream');
var through = require('through2');
var frontMatter = require('gulp-front-matter');
var nunjucks = require('nunjucks');
var marked = require('marked');
var plumber = require('gulp-plumber');
var fs = require('fs');
var extend = require('xtend/mutable');
var changed = require('gulp-changed');
var clone = require('clone');
var path = require('path');
var imgo = require('gulp-imagemin');
var resize = require('gulp-image-resize');
var browserify = require('browserify');
var postcss = require('gulp-postcss');


nunjucks.configure('template', {
	watch: false
});

/**
 * get base template to use as a wrapper for pages
 */
var tpl = nunjucks.compile(fs.readFileSync('./index.html', {
	encoding: 'utf8'
}));


/** Destination folder */
var DEST = '_site';


/** Project metadata/env. Everything in there will be accessible while rendering */
var metadata = {
	root: '',
	title: 'To theater',
	description: 'A collection of the best theatrical plays'
};


/** Return absolute url from the  */
metadata.getThumbnail = function (item) {
	if (!item.config) return;

	var thumbUrl = item.config.thumbnail;

	return path.normalize(metadata.root + '/' + item.config.slug + '/' + thumbUrl);
};


/** Defaultly build all */
gulp.task('default', [
	'build-static-pages',
	'build-images',
	'build-plays'
]);


/** Build html files */
gulp.task('build-html', [
	'build-static-pages',
	'build-plays'
]);


/** Export all static pages */
gulp.task('build-static-pages', ['build-ia'], function () {
	//special renderer
	var renderer = new marked.Renderer();

	gulp.src('./content/*.md')

		//ignore unchanged files
		.pipe(changed(DEST))

		//parse front matter per file, write to data-attribute
		.pipe(frontMatter({
			remove: true,
			property: 'data'
		}))

		//render base template
		.pipe(map(
			function (file, cb) {
				//prerender content before markdown parser
				var res = file.contents.toString('utf8').trim();

				//provide pre-markdown rendering context
				var data = extend(
					clone(metadata),
					file.data
				);

				res = nunjucks.renderString(res, data);

				//render markdown
				res = marked(res, {
					renderer: renderer
				});

				//provide html rendering context
				data.content = res;
				res = tpl.render(data);

				file.contents = new Buffer(res);
				cb(null, file);
			})
		)

		//rename files to be served as index.html in directories
		.pipe(rename(function (file) {
			if (file.basename !== 'index') {
				file.dirname += '/' + file.basename;
				file.basename = 'index';
			}
			file.extname = '.html';
		}))

		//finally write to the output dir
		.pipe(gulp.dest(DEST));
});


/** Build plays in the dest dir */
gulp.task('build-ia', function () {
	//set metadata global collections
	metadata.genres = {};
	metadata.plays = [];
	metadata.theaters = [];

	//for each play collect genre, group by genres
	gulp.src('./content/play/*/index.md')
		.pipe(changed(DEST))

		//parse front matter per file, write to data-attribute
		.pipe(frontMatter({
			remove: false,
			property: 'data'
		}))

		//for each file - collect data
		.pipe(through.obj(function (file, enc, cb) {
			//get play config info, append to .config property
			var config = fs.readFileSync(path.dirname(file.path) + '/config.json', {
				encoding: 'utf8'
			});
			config = file.data.config = JSON.parse(config);

			//save global genres
			var playGenres = file.data.genre || file.data.genres;
			if (!Array.isArray(playGenres)) playGenres = [playGenres];
			playGenres.forEach(function (genre) {
				if (!metadata.genres[genre]) metadata.genres[genre] = [];

				metadata.genres[genre].push(file.data);
			});

			//save global plays
			metadata.plays.push(file.data);

			cb(null, file);
		}));
});


/** Build plays pages */
gulp.task('build-plays', function () {
	//get plays by configs
	gulp.src('./content/play/**/config.json')
		.pipe(changed(DEST))

		.pipe(through.obj(function (file, enc, cb) {
			var config = JSON.parse(file.contents.toString());
			var slug = config.slug || path.basename(path.dirname(file.path));

			//copy all images to target slug folder

			cb(null, file);
		}));
});


/** Build images */
gulp.task('build-images', function () {
	gulp.src('./content/**/image/*')
		.pipe(changed(DEST))

		.pipe(rename(function (file) {
			var configPath = './content/' + path.dirname(file.dirname) + '/config.json';

			try {
				var config = fs.readFileSync(configPath, {
					encoding: 'utf8'
				});

				config = JSON.parse(config);
			} catch (e) {
				console.error(e);
				config = {};
			}

			var slug = config.slug || path.basename(path.dirname(configPath));

			file.dirname = slug + '/image';
		}))

		//resize
		.pipe(resize({
			width : 200,
			height : 200,
			crop : true,
			upscale : false
		}))

		//optimize image
		.pipe(imgo({
			progressive: true,
			optimizationLevel: 7
		}))

		.pipe(gulp.dest(DEST));
});


/** Build js */
gulp.task('build-js', function () {
	var b = browserify('./index.js');
	b.bundle().pipe(
		fs.createWriteStream(DEST + '/index.js')
	);
});


/** Build css */
gulp.task('build-css', function () {
	gulp.src('./index.css')
		.pipe(postcss([
			require('postcss-import')()
			// , require('autoprefixer')()
			// , require('cssnano')()
		]))
		.pipe(gulp.dest(DEST));
});