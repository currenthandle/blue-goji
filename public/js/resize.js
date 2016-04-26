function resize() {
	var grid = document.getElementById('vid-grid')
	var gridWidth = grid.clientWidth
	
	var gridHeight = gridWidth * (7.1/18)

	grid.setAttribute('style', 'height: ' + gridHeight+'px')
}
window.onload = resize
window.onresize = resize
