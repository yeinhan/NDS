/************************************************
 * waGuideSample005.js
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
	util.Submit.send(app, "subList", function(pbSuccess){
		if(pbSuccess) {
			util.Control.redraw(app, ["udccomgridtitle1", "grdEmp", "tre1"]);
		}
	},false);
}

/*
 * 트리에서 selection-change 이벤트 발생 시 호출.
 * 선택된 Item 값이 저장된 후에 발생하는 이벤트.
 */
function onTre1SelectionChange(e){
	var tre1 = e.control;
	var dept = e.newSelection[0].value
	var parentDept = e.newSelection[0].parentValue
	var row = app.lookup("dsDept").findFirstRow("department_name == '"+parentDept+"'");
	var cond = "department_name == '"+dept+"' || department_name == '"+parentDept+"'";
	if(!ValueUtil.isNull(row)){
		var grandDept = app.lookup("dsDept").findFirstRow("department_name == '"+parentDept+"'").getValue("parent-department_name")
		cond = "department_name == '"+dept+"' || department_name == '"+parentDept+"' || department_name == '"+grandDept+"'"
	}
	
	app.lookup("grdEmp").setFilter(cond);
}

/*
 * "행삭제" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e){
	var button = e.control;
	
	util.Grid.deleteRow(app, "grdEmp");
}

/*
 * "행추가" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick2(e){
	var button = e.control;
	
	util.Grid.insertRow(app, "grdEmp");
}

/*
 * "저장" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick3(e){
	var button = e.control;
	
	if(!util.Grid.isModified(app, "grdEmp", "MSG")) {
		return false;
	}
	
	app.lookup("grdEmp").commitData();
}
