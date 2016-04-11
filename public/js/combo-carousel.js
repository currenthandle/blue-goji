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
			
			indicators[currentState].setAttribute('class', 'indicator active')
			itemImages[currentState].setAttribute('class', 'item active')	
		}	
		rightButton.onclick = function () {
			indicators[currentState].setAttribute('class', 'indicators')
			itemImages[currentState].setAttribute('class', 'item')
			
			if (currentState === images.length-1){ currentState = 0 } 
			else { currentState++ }
			
			indicators[currentState].setAttribute('class', 'indicator active')
			itemImages[currentState].setAttribute('class', 'item active')	
		}	
		document.addEventListener('touchstart', handleTouchStart, false);
		document.addEventListener('touchmove', handleTouchMove, false);
		var xDown = null
		var yDown = null 

		function handleTouchStart(evt) {                                         
			xDown = evt.touches[0].clientX;                                      
			yDown = evt.touches[0].clientY;                                      
		};                                                

		function handleTouchMove(evt) {
			if ( ! xDown || ! yDown ) {
				return;
			}

			var xUp = evt.touches[0].clientX;                                    
			var yUp = evt.touches[0].clientY;

			var xDiff = xDown - xUp;
			var yDiff = yDown - yUp;

			if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
				if ( xDiff > 0 ) {
					indicators[currentState].setAttribute('class', 'indicators')
					itemImages[currentState].setAttribute('class', 'item')
					
					if (currentState === 0){ currentState = images.length-1 } 
					else { currentState-- }
					
					indicators[currentState].setAttribute('class', 'indicator active')
					itemImages[currentState].setAttribute('class', 'item active')	
				} else {
					indicators[currentState].setAttribute('class', 'indicators')
					itemImages[currentState].setAttribute('class', 'item')
					
					if (currentState === images.length-1){ currentState = 0 } 
					else { currentState++ }
					
					indicators[currentState].setAttribute('class', 'indicator active')
					itemImages[currentState].setAttribute('class', 'item active')	
				}                       
			} else {
				if ( yDiff > 0 ) {
					/* up swipe */ 
				} else { 
					/* down swipe */
				}                                                                 
			}
			/* reset values */
			xDown = null;
			yDown = null;                                             
		};	

	}
})

