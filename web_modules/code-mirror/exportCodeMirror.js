module.exports = function(code) {
	this.cacheable();
	return code + ";module.exports = CodeMirror;"
}