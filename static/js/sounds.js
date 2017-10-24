(function(){
	var path = "/static/sounds/";
	var createAndPlayAudio = function(fileName){
		var audio = new Audio(path + fileName + ".ogg");
		try{
			audio.play();
		}catch(err){
			console.log(err);
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

	window.soundsEnabled = true;
})();