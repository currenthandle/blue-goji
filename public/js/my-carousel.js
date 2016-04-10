var xhr = require('xhr')

var currentState = document.getElementById('carousel-image')
var currentImage = 0

var leftButton = document.getElementById('left')
var rightButton = document.getElementById('right')

xhr('/carousel-photos', function (err, resp, body) {
	if (err) console.log(err)
	else{ 
		var images = JSON.parse(body)
		images.forEach(function(imageUri) {
			console.log(imageUri)
		})
	}
})

leftButton.onclick = function () {
	
}	
