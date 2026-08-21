/************************************************
 * extFunc.js
 * Created at 2023. 9. 15. 오전 11:00:38.
 *
 * @author daye
 ************************************************/

var util = createCommonUtil();

/*
 * 버튼(btnToggle)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnToggleClick(e){
	var btnToggle = e.control;
	
	var vcGrpToggle = app.lookup("grpToggle");
	var voToggleLayout = vcGrpToggle.getLayout();
	
	if(btnToggle.style.hasClass("expand")) {
		btnToggle.style.removeClass("expand");
		voToggleLayout.setRowVisible(1, false);
	} else {
		btnToggle.style.addClass("expand");
		voToggleLayout.setRowVisible(1, true);
	}
}

/*
 * "다이얼로그 오픈" 버튼(btnDialog)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnDialogClick(e){
	var btnDialog = e.control;
	
	util.Dialog.open(app, "app/com/2.common/extSamplePop", 500, 300, function(){}, {}, {
		autoFocusedTarget: "firstChild",
		restoreFocus: true
	});
}

/*
 * 내비게이션 바에서 item-click 이벤트 발생 시 호출.
 * 아이템 클릭시 발생하는 이벤트.
 */
function onNavigationBarItemClick(e){
	var navigationBar = e.control;
	
	console.log("내비게이션바 item-click 이벤트");
	console.log("선택한 label : "  + e.item.label);
	console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@");
}

/*
 * 사이드 내비게이션에서 item-click 이벤트 발생 시 호출.
 * 아이템 클릭시 발생하는 이벤트.
 */
function onSideNavigationItemClick(e){
	var sideNavigation = e.control;
	
	console.log("사이드내비게이션 item-click 이벤트");
	console.log("선택한 label : "  + e.item.label);
	console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@");
}

/*
 * 그리드에서 cell-click 이벤트 발생 시 호출.
 * Grid의 Cell 클릭시 발생하는 이벤트.
 */
function onGrdMst3CellClick(e){
	var grdMst3 = e.control;
	
	var targetObject = e.targetObject;
	console.log("그리드 cell-click 이벤트");
	console.log("rowIndex : "  + targetObject.rowIndex);
	console.log("cellIndex : "  + targetObject.cellIndex);
	console.log("columnName : "  + targetObject.columnName);
	console.log("rowData : "  , targetObject.row.getRowData());
	console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@");
}


/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
	var voLayout = app.getContainer().getLayout();
	var vsRootAppId = app.getRootAppInstance().app.id;
	if(vsRootAppId == "app/main/Main") {
		voLayout.topMargin = 0;
		voLayout.leftMargin = 30;
		voLayout.rightMargin = 30;
		voLayout.bottomMargin = 0;
	} else {
		voLayout.topMargin = 30;
		voLayout.leftMargin = 90;
		voLayout.rightMargin = 90;
		voLayout.bottomMargin = 30;
	}
}

/*
 * "HTML생성" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	makeHtmlFile(app.lookup("ipbFileName").value || "EXB_HTML_FILE");
}
