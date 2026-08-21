/************************************************
 * video.js
 * Created at 2022. 11. 8. 오후 3:49:57.
 *
 * @author USER
 ************************************************/

/*
 * 비디오에서 canplay 이벤트 발생 시 호출.
 * 적어도 몇 프레임 동안 미디어를 재생할 수있는 충분한 데이터가있을 때 전송됩니다. 이는 HAVE_ENOUGH_DATA readyState에 해당합니다.
 */
function onVideoCanplay(e){
	var video = e.control;
     //자막
    var textTrack = new cpr.controls.media.TextTrack("app/control/contents/subtitle.vtt","en");
    video.addTextTrack(textTrack);

	// 자막 표시 설정
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
		var track = video.textTracks[0];
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
 * "재생" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	var video = app.lookup("video5");
	video.play();
	
}

/*
 * "정지" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn2 = e.control;
	var video = app.lookup("video5");
	video.pause();
}

/*
 * "3초 이전" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var btn3 = e.control;
	var video = app.lookup("video5");
	
	var currentTime = video.currentTime
	currentTime = currentTime - 3;
	video.currentTime = currentTime;
}

/*
 * "3초 이후" 버튼(btn4)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn4Click(e){
	var btn4 = e.control;
	var video = app.lookup("video5");
	
	var currentTime = video.currentTime
	currentTime = currentTime + 3;
	video.currentTime = currentTime;
}

/*
 * "볼륨 +" 버튼(btn5)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn5Click(e){
	var btn5 = e.control;
	var video = app.lookup("video5");
	if(video.volume >= 1){
		video.volume = 1
	}else{
		video.volume += 0.05;	
	}
	video.volume = video.volume.toFixed(2)
}

/*
 * "볼륨 -" 버튼(btn6)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn6Click(e){
	var btn6 = e.control;
	var video = app.lookup("video5");
	video.volume -= 0.05;
	video.volume = video.volume.toFixed(2)
}

/*
 * "전체화면" 버튼(btn7)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn7Click(e){
	var btn7 = e.control;
	var video = app.lookup("video5");
	
	video.requestFullscreen();
}

/*
 * 사용자 정의 컨트롤에서 afterLoad 이벤트 발생 시 호출.
 */
function onUdcexamace1AfterLoad(e){
	var udcexamace1 = e.control;
	udcexamace1.setAppProperty("value", onVideoCanplay);
}
