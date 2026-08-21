/************************************************
 * output.js
 * Created at 2022. 11. 8. 오후 3:29:56.
 *
 * @author USER
 ************************************************/

var arrAssertive = ["1.메세지가 도착했습니다.", "2.메일이 도착했습니다.", "3.금일 오후 8시 10분 서버 점검이 진행됩니다.", "4.자동 저장되었습니다."]
var arrAssertiveIndex = 0;
/*
 * "값 변경" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var output = app.lookup("optAriaLive3");
	if (arrAssertiveIndex>3){
		arrAssertiveIndex = 0;
	}
	output.putValue("");
	setTimeout(function(){
		output.putValue(arrAssertive[arrAssertiveIndex++]);
	}, 100)
}

var arrPolite = ["1.메세지가 도착했습니다.", "2.메일이 도착했습니다.", "3.금일 오후 8시 10분 서버 점검이 진행됩니다.", "4.자동 저장되었습니다."]
var arrPoliteIndex = 0;
/*
 * "값 변경" 버튼(btn4)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn4Click(e){
	var output = app.lookup("optAriaLive4");	
	if (arrAssertiveIndex>3){
		arrAssertiveIndex = 0;
	}
	output.putValue("");
	setTimeout(function(){
		output.putValue(arrAssertive[arrAssertiveIndex++]);
	}, 100)
}
