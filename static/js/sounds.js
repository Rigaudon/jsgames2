(function(){
	var path = "/static/sounds/";
	var audio;
	var createAndPlayAudio = function(fileName){
		audio = new Audio(path + fileName + ".ogg");
		try{
			audio.play();
		}catch(err){
			audio = new Audio(path + fileName + ".mp3");
			audio.play();
		}
	}

	window.playSound = function(sounds){
		if(!window.soundsEnabled){
			return;
		}
		if(typeof sounds == "string"){
			createAndPlayAudio(sounds);
		}else if(typeof sounds == "object"){
			createAndPlayAudio(sounds[Math.floor(Math.random() * sounds.length)]);
		}
	}

	window.stopSound = function(){
		try{
			audio.pause();
		}catch(err){
			
		}
	}

	window.soundsEnabled = true;
})();