/************************************************
 * waGuideSample001.js
 * Created at 2022. 10. 17. 오전 8:19:54.
 *
 * @author ksk1908
 ************************************************/
var util = createCommonUtil();


/*
 * "팝업호출" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e){
	var button = e.control;
	var initValue = {
		msgTitle : "삭제하시겠습니까?",
		msgDetail : "저장되지 않은 변경 내역이 있습니다. \n 저장하지 않고 삭제하시겠습니까?"
	}
	
	util.Dialog.open(app, "app/exam/work/waGuideSample009", 300, 200, function(){
		
	},initValue, {restoreFocus: true, autoFocusedTarget: "auto"});
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	util.Submit.send(app, "subDept", function(pbSuccess){
		if(pbSuccess) {
			app.lookup("lcbDept").redraw();
		}
	},false);
}


/*
 * "수정" 버튼(btnUpdate)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnUpdateClick(e){
	var btnUpdate = e.control;
	app.lookup("grpMain").enabled = true;
}

/*
 * "저장" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click2(e){
	var btn3 = e.control;
	app.lookup("grpMain").enabled = false;
} 
