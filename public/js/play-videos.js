var videos = document.getElementById('video-grid').getElementsByClassName('grid-vid')
document.onload = player(0)

function player (i){
	var video = videos[i]
	
	video.play()
	video.onended = function(){
		video.currentTime = 0
		if(i === 4) player(0)
		else player(i+1)	
	}
}
