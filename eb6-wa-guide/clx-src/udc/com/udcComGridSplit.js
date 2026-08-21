/************************************************
 * gridSplit.js
 * Created at 2022. 4. 22. 오후 1:20:55.
 *
 * @author youwinCha
 ************************************************/
var msUserAttrNm = "cellIndex";

var util = createCommonUtil();

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function() {
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	var ds1 = app.lookup("ds1");
	
	/** @type cpr.controls.Grid */
	var vcGrid = app.getAppProperty("grid");
	var voColumnLayout = vcGrid.getColumnLayout();
	
	for (var i = 0; i < vcGrid.header.cellCount; i++) {
		var voHeader = voColumnLayout.header[i];
		ds1.addRowData({
			headerNm: vcGrid.header.getColumn(voHeader.cellIndex).text,
			column: i + 1
		});
	}
	util.SelectCtl.setValue(app, "cmbLeft", vcGrid.leftSplit);
	
	var vnRightSplit;
	if (vcGrid.rightSplit == 0) {
		vnRightSplit = 0;
	} else {
		vnRightSplit = util.DataSet.getRowCount(app, "ds1") - vcGrid.rightSplit + 1;
	}
	util.SelectCtl.setValue(app, "cmbRight", vnRightSplit);
	util.Control.setValue(app, "nbeTop", vcGrid.topSplit);
	util.Control.setValue(app, "nbeBottom", vcGrid.bottomSplit);
	
	util.Control.redraw(app, ["cmbLeft", "cmbRight", "nbeTop", "nbeBottom"]);
	
	var vnRowCount = vcGrid.getRowCount();
	app.lookup("nbeTop").max = vnRowCount;
	app.lookup("nbeBottom").max = vnRowCount;
}

/*
 * "취소" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e) {
	var btn2 = e.control;
	app.dispatchEvent(new cpr.events.CUIEvent("cnclClick"));
}

/*
 * "확인" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e) {
	var btn1 = e.control;
	
	/** @type cpr.controls.Grid */
	var vcGrid = app.getAppProperty("grid");
	
	var vnRowCount = util.DataSet.getRowCount(app, "ds1");
	
	var vnRightSplit = util.Control.getValue(app, "cmbRight");
	if (vnRightSplit == 0) {
		vcGrid.rightSplit = ValueUtil.fixNumber(vnRightSplit);
	} else {
		vcGrid.rightSplit = ValueUtil.fixNumber(vnRowCount) - ValueUtil.fixNumber(vnRightSplit) + 1;
	}
	
	var vnLeftSplit = util.Control.getValue(app, "cmbLeft");
	vcGrid.leftSplit = ValueUtil.fixNumber(vnLeftSplit);
	
	var vnTopSplit = util.Control.getValue(app, "nbeTop");
	vcGrid.topSplit = ValueUtil.fixNumber(vnTopSplit);
	vcGrid.topSplitHeight = 80;
	
	var vnBottomSplit = util.Control.getValue(app, "nbeBottom");
	vcGrid.bottomSplit = ValueUtil.fixNumber(vnBottomSplit);
	vcGrid.bottomSplitHeight = 80;
	
	vcGrid.redraw();
	
	app.dispatchEvent(new cpr.events.CUIEvent("okClick"));
}

/*
 * 넘버 에디터에서 value-change 이벤트 발생 시 호출.
 * NumberEditor의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onNbe2ValueChange(e) {
	var nbeBottom = e.control;
	
	/** @type cpr.controls.Grid */
	var vcGrid = app.getAppProperty("grid");
	var vnRowCount = vcGrid.getRowCount();
	
	var vcNbeTop = app.lookup("nbeTop");
	if ((vnRowCount - vcNbeTop.numberValue) < nbeBottom.numberValue) {
		nbeBottom.value = "0";
		nbeBottom.redraw();
		return false;
	}
}