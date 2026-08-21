/************************************************
 * gridSplit.js
 * Created at 2022. 4. 22. 오후 1:20:55.
 *
 * @author youwinCha
 ************************************************/

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
	var initValue = app.getHostProperty("initValue");
	if(ValueUtil.isNull(initValue.targetGrid)) return;
	
	/** @type cpr.controls.Grid */
//	var vcGrid = app.getAppProperty("grid");
	var vcGrid = initValue.targetGrid;
	var voColumnLayout = vcGrid.getColumnLayout();
	
	var ds1 = app.lookup("ds1");
	for (var i = 0; i < vcGrid.header.cellCount; i++) {
		var voHeader = voColumnLayout.header[i];
		// 헤더 셀이 병합 되었거나 헤더 셀이 병합되지 않았는데 다중행인 경우 제외
		var vaHeaderCellIdx = vcGrid.getHeaderCellIndices(voHeader.colIndex);
		if (vaHeaderCellIdx.length > 1 && voHeader.rowIndex!=vaHeaderCellIdx.length-1) continue;

		// 체크박스, 라디오, 행 인덱스 상태 컬럼인 경우 제외 
		var voHColumn = vcGrid.header.getColumn(voHeader.cellIndex);
		if(voHColumn.columnType != "normal") continue;
		if(voHColumn.text == "No" || voHColumn.text == "F") continue;
		
		// 데이터셋에 그리드 컬럼 정보 추가
		ds1.addRowData({
			headerNm: voHColumn.text,
			column: voHColumn.cellIndex
		});
	}
	
	// 그리드에 설정된 split 정보 입력
	var vnLeftSplit = "";
	if(vcGrid.leftSplit != 0) {
		// 병합된 셀의 마지막 셀이 아닌 경우 셀 정보 재계산
		var voHCol = voColumnLayout.header[vcGrid.leftSplit-1];
		vcGrid.getHeaderCellIndices(voHCol.colIndex).forEach(function(each){
			var voHColumn = vcGrid.header.getColumn(each); 
			if(voHColumn.colSpan > 1 && (voHColumn.colIndex + voHColumn.colSpan - 1) != voHCol.colIndex) {
				voHCol = voColumnLayout.header[vcGrid.leftSplit];
			}
		});
		
		var vnCellIdx = vcGrid.header.getColumn(voHCol.cellIndex).cellIndex;
		vnLeftSplit = util.SelectCtl.findValue(app, "cmbLeft", "column", "column=='"+vnCellIdx+"'");
		util.SelectCtl.setValue(app, "nbeLeftWdt", vcGrid.leftSplitWidth);
	}
	util.SelectCtl.setValue(app, "cmbLeft", vnLeftSplit);
	
	var vnRightSplit = "";
	if (vcGrid.rightSplit != 0) {
		var voHCol = voColumnLayout.header[voColumnLayout.header.length - vcGrid.rightSplit];
		var vaHeaderCellIdx = vcGrid.getHeaderCellIndices(voHCol.colIndex);
		for(var i = 0; i<vaHeaderCellIdx.length; i++) {
			// 마지막셀과 병합된 셀의 중간에 위치한 셀의 경우는 고려 안함
			if(i != 0 || vaHeaderCellIdx.length == 1) continue;
			
			// 병합된 셀의 첫 번째 셀의 경우 셀 정보 재 계산
			var voHColumn = vcGrid.header.getColumn(vaHeaderCellIdx[i]);
			if(voHColumn.colIndex == voHCol.colIndex) {
				voHCol = voColumnLayout.header[voColumnLayout.header.length - vcGrid.rightSplit + 1];
			}
		}
		var vnCellIdx = vcGrid.header.getColumn(voHCol.cellIndex).cellIndex;
		vnRightSplit = util.SelectCtl.findValue(app, "cmbRight", "column", "column=='"+vnCellIdx+"'");;
		util.SelectCtl.setValue(app, "nbeRightWdt", vcGrid.rightSplitWidth);
	}
	util.SelectCtl.setValue(app, "cmbRight", vnRightSplit);
	
	if(vcGrid.topSplit != 0) {
		util.Control.setValue(app, "nbeTop", vcGrid.topSplit);
		util.Control.setValue(app, "nbeTopHgt", vcGrid.topSplitHeight);	
	}
	if(vcGrid.bottomSplit != 0) {
		util.Control.setValue(app, "nbeBottom", vcGrid.bottomSplit);
		util.Control.setValue(app, "nbeBtmHgt", vcGrid.bottomSplitHeight);
	}
	
	util.Control.redraw(app, ["cmbLeft", "cmbRight", "nbeTop", "nbeBottom", "nbeLeftWdt", "nbeRightWidth", "nbeTopHgt", "nbeBtmHgt"]);
	
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
//	app.dispatchEvent(new cpr.events.CUIEvent("cnclClick"));
	app.close();
}

/*
 * "확인" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e) {
	var btn1 = e.control;
	
	var initValue = app.getHostProperty("initValue");
	if(ValueUtil.isNull(initValue.targetGrid)) return;
	
	/** @type cpr.controls.Grid */
//	var vcGrid = app.getAppProperty("grid");
	var vcGrid = initValue.targetGrid;
	var vnGrdWidth = vcGrid.getActualRect().width;
	var vnGrdHeight = vcGrid.getActualRect().height;
	var vnRowCount = util.DataSet.getRowCount(app, "ds1");
	
	// 좌/우 split 설정
	var voLeftColIdx;
	var vnLeftSplit = util.Control.getValue(app, "cmbLeft");
	var vnLeftSplitWidth = ValueUtil.fixNumber(util.Control.getValue(app, "nbeLeftWdt"));
	var voLeftCol = vcGrid.header.getColumn(ValueUtil.fixNumber(vnLeftSplit));
	if(voLeftCol.colSpan == 1) voLeftColIdx = voLeftCol.colIndex;
	else voLeftColIdx = voLeftCol.colIndex + (voLeftCol.colSpan-1);
	
	var vnRightSplit = util.Control.getValue(app, "cmbRight");
	var vnRightColIdx = vcGrid.header.getColumn(ValueUtil.fixNumber(vnRightSplit)).colIndex;
	var vnRightSplitWidth = ValueUtil.fixNumber(util.Control.getValue(app, "nbeRightWdt"));
	if(!ValueUtil.isNull(vnLeftSplit) || !ValueUtil.isNull(vnRightSplit)) {
		if(voLeftColIdx >= vnRightColIdx && vnRightSplit != 0) {
			if(!util.Msg.confirm("우측 틀고정 컬럼은 좌측 틀고정 컬럼이랑 동일하거나 이전 컬럼을 선택할 수 없습니다.")) {
				return;
			}
			
		} else if(vnLeftSplitWidth + vnRightSplitWidth > vnGrdWidth) {
			if(!util.Msg.confirm("그리드 틀 고정의 너비가 그리드 크기보다 큰 경우 데이터가 겹쳐보이거나 보이지 않는 현상이 발생할 수 있습니다.")) {
				return;
			}
			
		} else if(vnLeftSplitWidth == 0 || vnRightSplitWidth == 0) {
			var vnWidth = 0;
			if(!ValueUtil.isNull(vnLeftSplit)) {	// leftSplit 너비 계산
				for(var i=0; i<=voLeftColIdx; i++) {
					vnWidth += vcGrid.getColumnLayout().columnLayout[i].width;
				}
			}
			
			if(!ValueUtil.isNull(vnRightSplit)) {	// rightSplit 너비 계산
				for(var i=vnRightColIdx; i<vcGrid.columnCount; i++) {
					vnWidth += vcGrid.getColumnLayout().columnLayout[i].width;
				}
			}
			
			if(vnWidth > vnGrdWidth) {
				if(!util.Msg.confirm("그리드 틀 고정의 너비가 그리드 크기보다 큰 경우 데이터가 겹쳐보이거나 보이지 않는 현상이 발생할 수 있습니다.")) {
					return;
				}
			}
			
		}
	}
	if(vnLeftSplit == "") {
		vcGrid.leftSplit = 0;
		vcGrid.leftSplitWidth = 0;
	} else {
		vcGrid.setLeftSplitCellIndex(vnLeftSplit);
		if(vnLeftSplitWidth != "") vcGrid.leftSplitWidth = vnLeftSplitWidth;
	}
	if(vnRightSplit == "") {
		vcGrid.rightSplit = 0;
		vcGrid.rightSplitWidth = 0;
	} else {
		vcGrid.setRightSplitCellIndex(vnRightSplit);
		if(vnRightSplitWidth != "") vcGrid.rightSplitWidth = vnRightSplitWidth;
	}

	// 상/하 split 설정
	var vnTopSplit = ValueUtil.fixNumber(util.Control.getValue(app, "nbeTop"));
	var vnTopSplitHeight = ValueUtil.fixNumber(util.Control.getValue(app, "nbeTopHgt"));
	var vnBottomSplit = ValueUtil.fixNumber(util.Control.getValue(app, "nbeBottom"));
	var vnBottomSplitHeight = ValueUtil.fixNumber(util.Control.getValue(app, "nbeBtmHgt"));
	if(vnTopSplit != 0 && vnBottomSplit != 0) {
		var vnViewingIndex = vcGrid.getViewingEndRowIndex() - vcGrid.getViewingStartRowIndex();
		if((vnTopSplit + vnBottomSplit >= vnViewingIndex) || (vnTopSplitHeight + vnBottomSplitHeight > vnGrdHeight)) {
			if(!util.Msg.confirm("그리드 틀 고정의 높이가 그리드 크기보다 큰 경우 데이터가 겹쳐보이거나 보이지 않는 현상이 발생할 수 있습니다.")) {
				return;
			}
			
		} else if(vnTopSplitHeight == 0 || vnBottomSplitHeight == 0) {
			if(vnTopSplitHeight == 0) vnTopSplitHeight = 80;
			if(vnBottomSplitHeight == 0) vnBottomSplitHeight = 80;
			
		}
	}
	vcGrid.topSplit = vnTopSplit;
	vcGrid.bottomSplit = vnBottomSplit;
	vcGrid.topSplitHeight = vnTopSplitHeight;
	vcGrid.bottomSplitHeight = vnBottomSplitHeight;
	
	vcGrid.redraw();
	
//	app.dispatchEvent(new cpr.events.CUIEvent("okClick"));
}
