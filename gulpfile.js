var gulp = require('gulp');
var fs = require('fs');
var uglify = require('uglify-js');
var concat = require('gulp-concat');

var files = [
	"source/gl-matrix.js",
	"source/Dispatcher.js",
	"source/Graphics.js",
	"source/Actor.js",
	"source/ActorComponent.js",
	"source/ActorEvent.js",
	"source/ActorNode.js",
	"source/ActorBone.js",
	"source/ActorImage.js",
	"source/ActorRootBone.js",
	"source/ActorIKTarget.js",
	"source/Animation.js",
	"source/BezierAnimationCurve.js",
	"source/BinaryReader.js",
	"source/ActorLoader.js",
	"source/CustomProperty.js"
];

gulp.task('default', function(cb)
{
	return gulp.src(files)
		.pipe(concat('Nima.all.js'))
		.pipe(gulp.dest('./'));
});

gulp.task('minify', function(cb)
{
	var lib = uglify.minify(files, {
		compress: {
			screw_ie8: true,
			sequences: true,
			//properties: true,
			dead_code: false,
			drop_debugger: true,
			comparisons: true,
			conditionals: true,
			evaluate: true,
			booleans: true,
			loops: true,
			unused: true,
			hoist_funs: true,
			if_return: true,
			join_vars: true,
			cascade: true,
			//negate_iife: true,
			drop_console: true
		},
		outSourceMap: './Nima.min.js.map'
	});


	fs.writeFileSync('./Nima.min.js', lib.code);
	cb();
});

gulp.task('c2', function(cb)
{
	return gulp.src(files.concat("nima-c2-plugin/runtime_source.js"))
		.pipe(concat('runtime.js'))
		.pipe(gulp.dest('./nima-c2-plugin'));
});