/************************************************
 * waGuideSample008.js
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
	var vsId = "TESTER001";
	var grd1 = app.lookup("grdReceive")
	var grd2 = app.lookup("grdSend")
	var grd3 = app.lookup("grdAll")
	
	grd1.setFilter("sender == '"+vsId+"'");
	grd2.setFilter("receiver == '"+vsId+"'");
	grd3.setFilter("sender == '"+vsId+"' || " +"receiver == '"+vsId+"'");
}

/** 
 * @param {cpr.controls.Grid} vcGrid
 * @param {cpr.events.CSelectionEvent} e
 */
function setFilter (vcGrid, newSelection, grdOriginFilter) {
	var grid = app.lookup("grdReceive");
	var filterOrgin = grdOriginFilter;
	var cond;
	
	if(newSelection == "imp"){
		cond = "&& state == 'imp'"
	}else if (newSelection == "all"){
		cond = "";
	}else if (newSelection == "unread"){
		cond = "&& read == 'N'"
	}else if (newSelection == "read"){
		cond = "&& read == 'Y'"
	}else if (newSelection == "tome"){
		cond = "&& receiver == sender"
	}
	
	var newCond = filterOrgin+cond
	vcGrid.setFilter(newCond);
	
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmb4SelectionChange(e){
	var cmb4 = e.control;
	var vcGrid = app.lookup("grdReceive")
	setFilter(vcGrid, e.newSelection[0].value , "sender == 'TESTER001'")
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmbFilter2SelectionChange(e){
	var cmbFilter2 = e.control;
	var vcGrid = app.lookup("grdSend")
	setFilter(vcGrid, e.newSelection[0].value , "receiver == 'TESTER001'")
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmbFilter3SelectionChange(e){
	var cmbFilter3 = e.control;
	var vcGrid = app.lookup("grdSend")
	setFilter(vcGrid, e.newSelection[0].value , "sender == 'TESTER001' && receiver == 'TESTER001'")
}


/*
 * 그리드에서 cell-click 이벤트 발생 시 호출.
 * Grid의 Cell 클릭시 발생하는 이벤트.
 */
function onGrdReceiveCellClick(e){
	var grdReceive = e.control;
	if(e.cellIndex == 3) {
		openMsgPop(e.row);
	}
}


/*
 * 그리드에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onGrdReceiveKeydown(e){
	var grdReceive = e.control;
	if(e.targetObject.cellIndex == 3){
		if(e.keyCode == cpr.events.KeyCode.ENTER || e.keyCode == cpr.events.KeyCode.SPACE ){ //ENTER or SPACE
			dispatchCellclick(grdReceive)
		}
	}
}

/*
 * 그리드에서 cell-click 이벤트 발생 시 호출.
 * Grid의 Cell 클릭시 발생하는 이벤트.
 */
function onGrdSendCellClick(e){
	var grdSend = e.control;
	if(e.columnName == "title") {
		openMsgPop(e.row);
	}
}

/*
 * 그리드에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onGrdSendKeydown(e){
	var grdSend = e.control;
	if(e.targetObject.cellIndex == 3){
		if(e.keyCode == cpr.events.KeyCode.ENTER || e.keyCode == cpr.events.KeyCode.SPACE ){ //ENTER or SPACE
			dispatchCellclick(grdSend)
		}
	}
}

/*
 * 그리드에서 cell-click 이벤트 발생 시 호출.
 * Grid의 Cell 클릭시 발생하는 이벤트.
 */
function onGrdAllCellClick(e){
	var grdAll = e.control;
	if(e.cellIndex == 3) {
		openMsgPop(e.row);
	}
}

/*
 * 그리드에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onGrdAllKeydown(e){
	var grdAll = e.control;
	if(e.targetObject.cellIndex == 3){
		if(e.keyCode == cpr.events.KeyCode.ENTER || e.keyCode == cpr.events.KeyCode.SPACE ){ //ENTER or SPACE
			dispatchCellclick(grdAll)
		}
	}
}

/**
 * 쪽지 팝업 오픈
 * @param {cpr.controls.provider.GridRow} poRow
 */
function openMsgPop(poRow){
	util.Dialog.open(app, "app/exam/work/waGuideSample009", 500, 300, function() {}, {
		msgTitle : app.lookup("tabMain").getSelectedTabItem().text,
		msgDetail : poRow.getValue("title")
	},{
		autoFocusTarget: "auto"
	});
}

/**
 * 셀 클릭 이벤트 dispatch
 * @param {cpr.controls.Grid} vcGrid
 */
function dispatchCellclick(vcGrid){
	var event = new cpr.events.CGridMouseEvent("cell-click", {cellIndex: 3 })
	vcGrid.dispatchEvent(event)
}
