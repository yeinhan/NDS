/************************************************
 * dialogue.js
 * Created at 2022. 11. 10. 오전 10:14:37.
 *
 * @author USER
 ************************************************/

/*
 * "실행" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	app.getRootAppInstance().openDialog("app/control/guide/Dialog_A", {width: 800, height: 580, autoFocusedTarget: "auto"}, function(dialog) {

	});
}

/*
 * "실행" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn2 = e.control;
		app.getRootAppInstance().openDialog("app/control/guide/Dialog_A", {width: 800, height: 580, autoFocusedTarget: "none"}, function(dialog) {

	});
}

/*
 * "실행" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var btn3 = e.control;
		app.getRootAppInstance().openDialog("app/control/guide/Dialog_A", {width: 800, height: 580, restoreFocus: true}, function(dialog) {

	});
}

/*
 * "실행" 버튼(btn4)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn4Click(e){
	var btn4 = e.control;
		app.getRootAppInstance().openDialog("app/control/guide/Dialog_A", {width: 800, height: 580, restoreFocus: false}, function(dialog) {

	});
}