		/*
		var active = 0 var leftControl = document.getElementById('left-control')
		var rightControl = document.getElementById('right-control')
		var indicators = document.getElementsByClassName('indicator')
		var numItems = indicators.length
		
		console.log('indicators', indicators)
		console.log('1 indicator', indicators[active])
		for (var i =0 ; i < indicators.length ; i++){
				//console.log('i', i)
				//console.log('* indicator', indicators[i])
		}	
		leftControl.onclick = function () {
			if(active === 0){ 
				console.log('2 indicators', indicators)
				// remove active class from old indicator
				indicators[active].removeAttribute('class', 'active')
			
				console.log('3 indicators', indicators)
				// set new active value
				active = numItems - 1 
				console.log('numItems', numItems)
				console.log('active', active)
				console.log('2 indicators', indicators)
				console.log('AI', indicators[active])
				
				// remove active class from old indicator
				indicators[active].setAttribute('class', 'active')
			}	
			else { 
				// remove active class from old indicator
				indicators[active].removeAttribute('class', 'active')
			
				// set new active value
				active-- 
				
				// remove active class from old indicator
				indicators[active].setAttribute('class', 'active')
			 }
		}
		rightControl.onclick = function () {
			console.log('Aaaaah!!!')
			if(active === numItems - 1){ 
				// remove active class from old indicator
				indicators[active].removeAttribute('class', 'active')
			
				// set new active value
				active = 0 
				
				// remove active class from old indicator
				indicators[active].setAttribute('class', 'active')
			}	
			else { 
				// remove active class from old indicator
				indicators[active].removeAttribute('class', 'active')
			
				// set new active value
				active++
				
				// remove active class from old indicator
				indicators[active].setAttribute('class', 'active')
			 }
		}
		*/
