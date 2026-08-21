/************************************************
 * audio.js
 * Created at 2022. 11. 10. 오전 9:43:13.
 *
 * @author USER
 ************************************************/

/*
 * 오디오에서 canplay 이벤트 발생 시 호출.
 * 적어도 몇 프레임 동안 미디어를 재생할 수있는 충분한 데이터가있을 때 전송됩니다. 이는 HAVE_ENOUGH_DATA readyState에 해당합니다.
 */
function onAudioCanplay(e){
	var audio = e.control;
	//자막
    var textTrack = new cpr.controls.media.TextTrack("app/control/contents/subtitle.vtt","en");
    audio.addTextTrack(textTrack);

	// 자막 표시 설정
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
		var track = audio.textTracks[0];
		track.mode = "hidden";
		
		var output = app.lookup("out");
		track.addEventListener("cuechange", function(e){
			output.value = "";
			setTimeout(function(){
				output.value = e.target.activeCues[0].text;
			}, 100)
		})
	});
}

/*
 * "재생" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn2 = e.control;
	var audio = app.lookup("audio2");
	audio.play();
}

/*
 * "정지" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var btn3 = e.control;
	var audio = app.lookup("audio2");
	audio.pause();
}

/*
 * "볼륨 +" 버튼(btn6)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn6Click(e){
	var btn6 = e.control;
	var audio = app.lookup("audio2");
	if(audio.volume >= 1){
		audio.volume = 1
	}else{
		audio.volume += 0.05;	
	}
	audio.volume = audio.volume.toFixed(2)
	
}

/*
 * "볼륨 -" 버튼(btn7)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn7Click(e){
	var btn7 = e.control;
	var audio = app.lookup("audio2");
	audio.volume -= 0.05;
	audio.volume = audio.volume.toFixed(2)
}

/*
 * 사용자 정의 컨트롤에서 afterLoad 이벤트 발생 시 호출.
 */
function onUdcexamace1AfterLoad(e){
	var udcexamace1 = e.control;
	udcexamace1.setAppProperty("value", onAudioCanplay);
}
