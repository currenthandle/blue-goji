function resize() {
	var grid = document.getElementById('vid-grid')
	var gridWidth = grid.clientWidth
	
	console.log('gridWidth', gridWidth)

	var gridHeight = gridWidth * (7/18)

	console.log('gridHeight', gridHeight)
	grid.setAttribute('style', 'height: ' + gridHeight)
	console.log('actual height', grid.clientHeight)
}
window.onload = resize
window.onresize = resize
