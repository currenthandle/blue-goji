var xhr = require('xhr')

//var currentImage = document.getElementById('carousel-image')
var currentState = 0

var leftButton = document.getElementById('left-control')
var rightButton = document.getElementById('right-control')

var indicators = []
var itemImages = []

console.log('here!')
xhr('/carousel-photos', function (err, resp, body) {
	if (err) console.log(err)
	else{ 
		console.log('in else')
		var images = JSON.parse(body)
		images.forEach(function(imageUri, index) {
			var newLi = document.createElement('li')
			//var newContent = document.createTextNode('rawr')
			//newLi.appendChild(newContent)
			newLi.setAttribute('class', 'indicator')
			
			document.getElementById('indicator-ol').appendChild(newLi)
			indicators.push(newLi)
			
			var newItem = document.createElement('div')
			newItem.setAttribute('class', 'item')
			
			var newImage = document.createElement('img')
			newImage.setAttribute('src', "img/carousel-images/"+ images[index])
			console.log('newItem', newItem)	
			newItem.appendChild(newImage)
			document.getElementById('slide-wrapper').appendChild(newItem)
			
			itemImages.push(newItem)
		})
		
			
		//currentImage.setAttribute("src", "img/carousel-images/"+ images[currentState])
		indicators[currentState].setAttribute('class', 'indicator active')
		itemImages[currentState].setAttribute('class', 'item active')	
		
		leftButton.onclick = function () {
			indicators[currentState].setAttribute('class', 'indicators')
			itemImages[currentState].setAttribute('class', 'item')
			
			if (currentState === 0){ currentState = images.length-1 } 
			else { currentState-- }
			
			
			//currentImage.setAttribute("src", "img/carousel-images/"+ images[currentState])
			indicators[currentState].setAttribute('class', 'indicator active')
			itemImages[currentState].setAttribute('class', 'item active')	
		}	
		rightButton.onclick = function () {
			indicators[currentState].setAttribute('class', 'indicators')
			itemImages[currentState].setAttribute('class', 'item')
			
			if (currentState === images.length-1){ currentState = 0 } 
			else { currentState++ }
			
			//currentImage.setAttribute("src", "img/carousel-images/"+ images[currentState])
			indicators[currentState].setAttribute('class', 'indicator active')
			itemImages[currentState].setAttribute('class', 'item active')	
		}	
	}
})

