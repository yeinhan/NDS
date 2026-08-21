/************************************************
 * Dashboard_Re.js
 * Created at 2022. 11. 23. 오전 10:23:53.
 *
 * @author ryu
 ************************************************/
var util = createCommonUtil();

/*
 * "Button" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	try {
		var voRootAppIns = app.getRootAppInstance();
		var voAllMenu = voRootAppIns.callAppMethod("getAllMenu");
		voAllMenu.findAllRow("MENU_ID == 'WAGuideLine'").forEach(function(row) {
			voRootAppIns.callAppMethod("openPage", row);
		})
	} catch (error){
		alert("서비스 준비중입니다. (" +  "접근성 지침 목록" + ")");
	}
}

/*
 * "Button" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn2 = e.control;
	try {
		var voRootAppIns = app.getRootAppInstance();
		var voAllMenu = voRootAppIns.callAppMethod("getAllMenu");
		voAllMenu.findAllRow("MENU_ID == 'guideDoc'").forEach(function(row) {
			voRootAppIns.callAppMethod("openPage", row);
		})
	} catch (error){
		alert("서비스 준비중입니다. (" +  "웹 접근성 가이드 문서" + ")");
	}
}
