/************************************************
 * waGuideSample006.js
 * Created at 2022. 10. 17. 오전 8:19:54.
 *
 * @author ksk1908
 ************************************************/
var util = createCommonUtil();

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	util.Submit.send(app, "subList", function(){
		
	});
}

/*
 * 그리드에서 selection-change 이벤트 발생 시 호출.
 * detail의 cell 클릭하여 설정된 selectionunit에 해당되는 단위가 선택될 때 발생하는 이벤트.
 */
function onGrdMainSelectionChange(e){
	var grdMain = e.control;
	var rowIndex = e.newSelection[0]
	var grdEmp = app.lookup("grdEmp")
	
	var vsDptName = app.lookup("dsDept").getValue(rowIndex, "department_name");
	var cond = "department_name == '"+vsDptName+"'";	
	grdEmp.setFilter(cond);
}

/*
 * "행추가" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	util.Grid.insertRow(app, "grdEmp");
}

/*
 * "행삭제" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn2 = e.control;
	
	util.Grid.deleteRow(app, "grdEmp");
}

/*
 * "저장" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var btn3 = e.control;
	
	if(!util.Grid.isModified(app, "grdEmp", "MSG")) {
		return false;
	}
	
	app.lookup("grdEmp").commitData();
}
