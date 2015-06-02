/**
 * Site builder, instead of metalsmiths etc.
 */

var gulp = require('gulp');
var rename = require('gulp-rename');
var map = require('map-stream');
var frontMatter = require('gulp-front-matter');
var plumber = require('gulp-plumber');
var fs = require('fs');
var extend = require('xtend/mutable');
var changed = require('gulp-changed');
var clone = require('clone');
var path = require('path');
var i18n = require('i18n');
var nunjucks = require('nunjucks');
var marked = require('marked');
var palette = require('image-palette');
var Color = require('color');



/** Get translation for the current locale */
i18n.configure({
	locales: metadata.locales,
	defaultLocale: metadata.locale,
	directory: paths.locale
});
metadata._ = function () {
	return i18n.__.apply(this, arguments);
};
metadata._n = function () {
	return i18n.__n.apply(this, arguments);
};


//preset stringifier
Color.prototype.toString = function () {
	return this.rgbString();
};


/** Don’t read configs twice */
var configsCache = new Map();


/**
 * Set up templater
 */
var renderer = new marked.Renderer();
renderer.code = function (inp) { return inp; };

//ignore paragraphs starting with html
renderer.paragraph = function (i) {
	if (i.trim()[0] === '<') return i;
	return marked.Renderer.prototype.paragraph(i);
};

nunjucks.configure('./template', {
	watch: false
});


/** Paths */
var paths = {
	html: './template/*',
	dest: '_site',
	js: './index.js',
	css: './index.css',
	locale: './locale'
};


/** Project metadata/env. Everything in there will be accessible while rendering */
var metadata = {
	root: '_site',
	locale: 'ru',
	locales: ['en', 'ru' ,'fr'],
	title: 'To theater',
	description: 'A collection of the best theatrical plays',
	items: []
};


/** Return absolute url from the  */
metadata.getThumbnailUrl = function (item, url, size) {
	if (!item.config) return;

	size = size || '';

	var thumbUrl = url || item.config.thumbnail;

	//FIXME: handle absolute urls
	var res = path.normalize('/' + metadata.root + '/' + item.config.slug + '/' + thumbUrl);

	//insert thumb size
	res = path.dirname(res) + '/' + path.basename(res).slice('.')[0] + (size ? '-' + size : '') + path.extname(res);

	return res;
};

/** Return item url */
metadata.getItemUrl = function (item) {
	if (!item.config) return '/' + metadata.root + '/';

	return '/' + metadata.root + '/' + item.config.slug;
};

/** Return absolute url */
metadata.getUrl = function (path) {
	if (path[0] === '/') path = path.slice(1);
	return '/' + metadata.root + '/' + path;
};


/** Defaultly build production */
gulp.task('default', function () {
	metadata.root = require('./package.json').name;
	gulp.start([
		'build-js',
		'build-css',
		'build-html'
	]);
});


/** Build html files */
gulp.task('build-html', ['build-items'], function () {
	//build all static pages
	return gulp.src('./content/*.md')

		//ignore unchanged files
		// .pipe(changed(paths.dest))

		.pipe(plumber({
			errorHandler: function (e) {
				console.log(e);
			}
		}))

		//parse front matter per file, write to data-attribute
		.pipe(frontMatter({
			remove: true,
			property: 'data'
		}))

		//render base template
		.pipe(map(
			function (file, cb) {
				file.contents = new Buffer(renderMdFile(file));
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
		.pipe(gulp.dest(paths.dest));
});


/** Collect IA structure */
gulp.task('build-ia', function () {
	//for each json file - collect it’s info and provide in global env
	return gulp.src('./content/*.json')
		.pipe(map(function (file, cb) {

			var dataName = path.basename(file.path, '.json');

			var data = JSON.parse(file.contents.toString('utf8').trim());
			metadata[dataName] = data;

			cb(null, file);
		}));
});


/** Return config for an .md file */
function getConfig(filePath) {
	var fileDir = path.dirname(filePath);
	var resolvedPath = path.resolve(fileDir);

	//return cached
	if (configsCache.get(resolvedPath)) return configsCache.get(resolvedPath);

	try {

		//get play config info, append to .config property
		var config = fs.readFileSync(fileDir + '/config.json', {
			encoding: 'utf8'
		});
		config = JSON.parse(config);

		//ensure config slug
		if (!config.slug) config.slug = path.basename(fileDir);
	} catch (e) {
		config = {slug: path.basename(fileDir)};
	}

	//save cache
	configsCache.set(resolvedPath, config);

	return config;
}


/** Return rendered markdown string */
function renderMdFile(file) {
	//prerender content before markdown parser
	var res = file.contents.toString('utf8').trim();

	//provide pre-markdown rendering context
	var data = clone(metadata);

	//pass item object to items template
	if (file.data.type) {
		data = extend(data, {
			item: file.data
		});
	}
	res = nunjucks.renderString(res, data);

	//render markdown
	res = marked(res, {
		renderer: renderer
	});

	//provide html rendering context
	data.content = res;

	//default template for single items is single.html, otherwise declare it
	var tpl = ( data.item && data.item.config && data.item.config.template )
		|| ( data.item && data.item.template )
		|| data.template
		|| ( data.item && data.item.type ? 'single.html' : 'base.html' );

	res = nunjucks.render(tpl, data);

	return res;
}


/** Build plays pages */
gulp.task('build-items', ['build-ia'], function () {
	//find each md, render it and place to folder
	return gulp.src('./content/*/index.md')
		// .pipe(changed(paths.dest))

		.pipe(plumber({
			errorHandler: function (e) {
				console.log(e);
			}
		}))

		//parse front matter per file, write to data-attribute
		.pipe(frontMatter({
			remove: true,
			property: 'data'
		}))

		//for each file - collect data
		.pipe(map(function (file, cb) {
			var config = getConfig(file.path);
			file.data.config = config;

			//calc mean image color
			if (config.thumbnail && !config.color) {
				palette(
					path.resolve(path.dirname(file.path) + '/' + config.thumbnail),
					function (colors) {
						//add color to a file
						file.data.config.color = toRgb(colors[0]);
						file.data.config.colors = colors.map(toRgb);

						file.contents = new Buffer(renderMdFile(file));

						//save global items cache
						metadata.items.push(file.data);

						cb(null, file);
					},
					6
				);
			} else {
				cb(null, file);
			}
		}))

		//rename files to be served as index.html in directories
		.pipe(rename(function (file) {
			var config = getConfig('./content/' + file.dirname + '/config.json');

			file.extname = '.html';
			file.dirname = config.slug;
		}))

		.pipe(gulp.dest(paths.dest))
});


/** Convert rgb array to css string */
function toRgb(arr) {
	return Color().rgb(arr);
}


/** Build images */
var imgo, resize;
gulp.task('build-images', function () {
	imgo = require('gulp-imagemin');
	resize = require('gulp-image-resize');

	return gulp.start([
		'build-images-original',
		'build-images-l',
		'build-images-m',
		'build-images-s'
	]);
});


/** Copy original images */
gulp.task('build-images-original', function () {
	return gulp.src('./content/*/image/*')
		.pipe(changed(paths.dest))

		.pipe(rename(function (file) {
			var configPath = './content/' + path.dirname(file.dirname) + '/config.json';

			config = getConfig(configPath);

			file.dirname = config.slug + '/image';
		}))

		//optimize image
		.pipe(imgo({
			progressive: true,
			optimizationLevel: 1
		}))

		.pipe(gulp.dest(paths.dest));
});

/** make big thumbnails 1024.. */
gulp.task('build-images-l', function () {
	return gulp.src('./content/*/image/*')
		// .pipe(changed(paths.dest))

		.pipe(rename(function (file) {
			var configPath = './content/' + path.dirname(file.dirname) + '/config.json';

			config = getConfig(configPath);

			file.dirname = config.slug + '/image';

			file.basename += '-l';
		}))

		//resize to golden ratio
		.pipe(resize({
			width : 1024,
			height : 633,
			crop : true,
			upscale : true
		}))

		//optimize image
		.pipe(imgo({
			progressive: true,
			optimizationLevel: 4
		}))

		.pipe(gulp.dest(paths.dest));
});

/** make medium thumbnails (320..640) */
gulp.task('build-images-m', function () {
	return gulp.src('./content/*/image/*')
		// .pipe(changed(paths.dest))

		.pipe(rename(function (file) {
			var configPath = './content/' + path.dirname(file.dirname) + '/config.json';

			config = getConfig(configPath);

			file.dirname = config.slug + '/image';

			file.basename += '-m';
		}))

		//resize to golden ratio
		.pipe(resize({
			width : 640,
			height : 396,
			crop : true,
			upscale : true
		}))

		//optimize image
		.pipe(imgo({
			progressive: true,
			optimizationLevel: 6
		}))

		.pipe(gulp.dest(paths.dest));
});

/** Small thumbnails ..320 */
gulp.task('build-images-s', function () {
	return gulp.src('./content/*/image/*')
		// .pipe(changed(paths.dest))

		.pipe(rename(function (file) {
			var configPath = './content/' + path.dirname(file.dirname) + '/config.json';

			config = getConfig(configPath);

			file.dirname = config.slug + '/image';

			file.basename += '-s';
		}))

		//resize to golden ratio
		.pipe(resize({
			width : 320,
			height : 198,
			crop : true,
			upscale : true
		}))

		//optimize image
		.pipe(imgo({
			progressive: true,
			optimizationLevel: 7
		}))

		.pipe(gulp.dest(paths.dest));
});


/** Build js */
gulp.task('build-js', function () {
	var browserify = require('browserify');
	var b = browserify(paths.js);
	b.bundle().pipe(
		fs.createWriteStream(paths.dest + '/index.js')
	);
});


/** Build css */
gulp.task('build-css', function () {
	var postcss = require('gulp-postcss');

	gulp.src(paths.css)
		.pipe(plumber({
			errorHandler: function (e) {
				console.log(e)
			}
		}))
		.pipe(postcss([
			require('postcss-import')()
			, require('autoprefixer')()
		]))
		.pipe(gulp.dest(paths.dest));
});


/** Rerun the task when a file changes */
gulp.task('watch', function () {
	gulp.start(['build-js', 'build-css']);

	gulp.watch(paths.js, ['build-js']);
	gulp.watch(paths.css, ['build-css']);
});