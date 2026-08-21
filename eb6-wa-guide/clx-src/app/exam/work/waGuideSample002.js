/************************************************
 * waGuideSample002.js
 * Created at 2022. 10. 17. 오전 8:19:54.
 *
 * @author ksk1908
 ************************************************/
var util = createCommonUtil();

/*
 * "삭제" 버튼(btn4)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn4Click(e){
	var btn4 = e.control;
	
	util.Grid.deleteRow(app, "grdDocList");
}

/*
 * "저장" 버튼(btn5)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn5Click(e){
	var btn5 = e.control;
	
	if(!util.Grid.isModified(app, "grdDocList", "MSG")) {
		return false;
	}
	
}

/*
 * "조회" 버튼(btnSearch)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSearchClick(e){
	var btnSearch = e.control;
	
	if(util.Grid.isModified(app, "grdDocList", "CRM")) {
		return false;
	}
	
	util.Grid.revertAllData(app, "grdDocList");
	util.Control.redraw(app, "grpFormDetail");
}

/*
 * "추가" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var btn3 = e.control;
	
	util.Grid.insertRow(app, "grdDocList");
	app.lookup("ipb1").focus();
}
