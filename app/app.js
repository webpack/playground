var $ = require("jquery");
require("mybootstrap");
var webpack = require("webpack");
var fs = require("fs");
var CodeMirror = require("code-mirror");
window.fsData = fs.data;

$(function() {
	$("body").html(require("./body.jade")());
	var currentFileInEditor = "entry.js";
	var editor = CodeMirror($(".editor")[0], {
		value: fs.readFileSync(fs.join("/folder", currentFileInEditor)).toString(),
		mode: "javascript"
	});

	$(".create-new-file").click(function() {
		var filename = prompt("Filename?", "file.js");
		if(!filename) return;
		fs.writeFile(fs.join("/folder", filename), new Buffer("New File", "utf-8"), function(err) {
			if(err) return alert(err.stack);
			loadFile(filename);
			rebuildTabs();
		});
	});
	
	$(".compile").click(compile);

	$(".files").delegate(".file", "click", function() {
		var filename = $(this).data("file");
		$(".files .file.active").removeClass("active");
		$(this).addClass("active");
		loadFile(filename);
		return false;
	});
	
	var compiler = webpack({
		inputFileSystem: fs,
		outputFileSystem: fs,
		context: "/folder",
		entry: "./entry.js",
		module: {
			loaders: [
				{ test: /\.jade$/, loader: "jade-loader" },
				{ test: /\.css$/, loader: "style-loader!css-loader" }
			]
		},
		output: {
			path: "/output",
			filename: "bundle.js"
		},
		optimize: {
			maxChunks: 1
		}
	});
	
	rebuildTabs();
	compile();

	function rebuildTabs() {
		var files = fs.readdirSync("/folder");
		var filesElement = $(".files");
		filesElement.find(".file").remove();
		files.forEach(function(filename) {
			var fileElement = $("<li class='file'>").data("file", filename);
			if(filename === currentFileInEditor) fileElement.addClass("active");
			fileElement.append($("<a href='#'>").text(filename));
			filesElement.prepend(fileElement);
		});
	}
	
	function compile() {
		saveFile(function() {
			compiler.run(function(err, stats) {
				if(err) return $(".stats").text(err.stack);
				$(".stats").text(stats.toString());
				$("iframe")[0].srcdoc = "<html><body><script>" + fs.readFileSync("/output/bundle.js").toString() + "</script></body></html>";
			});
		});
	}

	function loadFile(filename) {
		saveFile(function() {
			var buffer = fs.readFileSync(fs.join("/folder", filename));
			var str = typeof buffer === "string" ? buffer : buffer.toString();
			currentFileInEditor = filename;
			editor.setValue(str);
		});
	}

	function saveFile(callback) {
		var value = editor.getValue();
		fs.writeFile(fs.join("/folder", currentFileInEditor), new Buffer(value, "utf-8"), function(err) {
			if(err) return alert(err);
			callback();
		});
	}
});
