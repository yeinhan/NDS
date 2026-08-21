/************************************************
 * gridFilter.js
 * Created at 2020. 9. 24. 오후 4:18:41.
 *
 * @author csj
 ************************************************/

var msUserAttrNm = "cellIndex";
var msRowClassNm = "row-bottom";

// 임시 그리드 및 임시 그리드 레이아웃 정보 변수
var vcTmpGrd, voTmpGrdLayout;

/*********************************************
 * 사용자 함수 
 *********************************************/
String.prototype.replaceAll = function(org, dest) {
	return this.split(org).join(dest);
}

function createDragSourceFeedback() {
	var feedback = new cpr.controls.Output();
	feedback.ellipsis = true;
	feedback.style.css({
		"opacity": "0.8",
		"width": "50px",
		"height": "25px",
		"border": "solid 1px red",
		"text-align": "center",
		"color": "black",
		"border-radius": "10px",
		"background": "white",
		"box-shadow": "0px 2px 10px #ddd",
		"cursor": "move"
	});
	return feedback;
}

/**
 * 파라미터의 컨트롤을 드래그 가능하도록 드래그 소스를 지정하는 함수.
 * @param {cpr.controls.Grid} control
 */
function setDragSource(control) {
	var feedback = null;
	var actualRect = null;
	
	new cpr.controls.DragSource(control, {
		options: {
			dataType: "text",
			threadhold: 10
		},
		onDragStart: function(context) {
			if (context.targetObject.relativeTargetName == "detail") {
				context.cursor = "grabbing";
				feedback = createDragSourceFeedback();
				context.data = context.targetObject;
				feedback.value = JSON.stringify(control.getRow(context.targetObject.rowIndex).getRowData());
				
				var voDragStartLoca = context.dragStartLocation;
				actualRect = new cpr.geometry.Rectangle(voDragStartLoca.x, voDragStartLoca.y, control.getActualRect().width, 25);
				app.getRootAppInstance().floatControl(feedback, actualRect);
				context.source = null;
			} else {
				context.cancel();
			}
		},
		onDragMove: function(context) {
			context.cursor = "grabbing";
			var newRect = actualRect.getTranslated(context.dragDelta);
			app.getRootAppInstance().floatControl(feedback, newRect);
		},
		onDragEnd: function(context) {
			context.cursor = "";
			feedback.dispose();
			feedback = null;
		}
	});
}

var voPrevRowElement = null;

/**
 * 파라미터로 받은 컨트롤을 드랍가능한 타겟으로 지정하는 함수.
 * @param {cpr.controls.Grid} control2
 */
function setDropTarget(control2) {
	
	var dropTarget = new cpr.controls.DropTarget(control2, {
		isImportant: function(source) {
			return source.dataType == "text";
		},
		onDragEnter: function(context) {
			
		},
		onDragLeave: function(context) {
			
		},
		onDragMove: function(context) {
			var vaElementsOnMouse = elementsFromPoint(context.pointerLocation.x, context.pointerLocation.y);
			//현재 마우스 포인터가 위치하는 곳의 뒤에 있는 모든 요소를 가져오는 함수로, 그리드 행의 요소를 가져옵니다.
			var vaClGridRowEle = vaElementsOnMouse.filter(function( /*HTMLElement*/ each) {
				if (each.classList.contains("cl-grid-row")) {
					return each;
				}
				//마우스 뒤의 요소중 cl-grid-row클래스를 포함한 요소들만 필터링합니다.
			});
			var voGridRowElement = vaClGridRowEle[0]; //가장 첫번째 요소에 대해서 하단 보더에 스타일을 주어서 드래그드랍을 통해 대강 어디에 행이 위치할지 정보를 표시할 수 있습니다.
			if (voGridRowElement && !voGridRowElement.classList.contains(msRowClassNm)) {
				if (voGridRowElement != voPrevRowElement && voPrevRowElement) {
					
					voPrevRowElement.classList.remove(msRowClassNm);
				}
				voPrevRowElement = voGridRowElement;
				//그리드에 draggrid클래스가 적용되어있는 행에 row-bottom이 적용되어야만 하단에 빨간색 보더가 보여지게됩니다.
				//해당 클래스들에 대한 설정은 UDC내에 html 스니펫을통해 변경할 수 있습니다.
				voGridRowElement.classList.add(msRowClassNm);
			}
		},
		onDrop: function(context) {
			var vnDragIndex = context.data.rowIndex;
			var vnDragHeaderCellIndex = control2.getRow(vnDragIndex).getAttr(msUserAttrNm);
			
			// 드롭 이동 시 임시 그리드에 이동된 컬럼 정보가 적용되며, 팝업 그리드의 행 순서가 변경된다. 
			var vsTargetName = context.targetObject.relativeTargetName;
			if (vsTargetName == "detail") {
				// 디테일 영역에 드롭한 경우 드롭한 행 하단으로 이동
				var vnDropIndex = context.targetObject.rowIndex;
				var vnDropCellIndex = control2.getRow(vnDropIndex).getAttr(msUserAttrNm);
				vcTmpGrd.moveColumn(vnDragHeaderCellIndex, vnDropCellIndex, false);
				//				control2.dataSet.moveRowIndex(vnDragIndex, vnDropIndex);
				
			} else if (vsTargetName == "header") { // 헤더 영역에 드롭한 경우 첫 번째 행으로 이동
				vcTmpGrd.moveColumn(vnDragHeaderCellIndex, control2.getRow(0).getAttr(msUserAttrNm));
				//				control2.dataSet.moveRowIndex(vnDragIndex, 0, false);
				
			} else if (ValueUtil.isNull(vsTargetName)) { // 디테일 하단 빈 영역에 드롭한 경우 마지막 행으로 이동
				var vnDropIndex = control2.getRowCount() - 1;
				var vnDropCellIndex = control2.getRow(vnDropIndex).getAttr(msUserAttrNm);
				vcTmpGrd.moveColumn(vnDragHeaderCellIndex, vnDropCellIndex, false);
				//				control2.dataSet.moveRowIndex(vnDragIndex, vnDropIndex);
			}
			doAddRow();

			// 임시 그리드의 컬럼 레이아웃 반환
			voTmpGrdLayout = vcTmpGrd.getColumnLayout(true);
			
			control2.redraw();
			voPrevRowElement.classList.remove(msRowClassNm);
		}
	});
}

/**
 * 마우스 포인터가 위치한 곳 밑에 있는 모든 요소를 가져오는 함수입니다.
 * @param {Number} x
 * @param {Number} y
 * @return {HTMLElement}
 */
function elementsFromPoint(x, y) {
	if (document["msElementsFromPoint"]) {
		var nodeList = document["msElementsFromPoint"](x, y);
		if (!nodeList) {
			return [];
		} else {
			return Array.prototype.slice.call(nodeList);
		}
	} else {
		return (document["elementsFromPoint"](x, y) || []);
	}
}

function doAddRow() {
	var ds1 = app.lookup("ds1");
	ds1.clear();
	
	var vcGrid = app.lookup("grd1");
	var voColumnLayout = vcTmpGrd.getColumnLayout(true);
	
	var vaAutoFit = [];
	if (vcTmpGrd.autoFit == "all") {
		var vnColCnt = vcTmpGrd.columnCount;
		for (var i = 0; i < vnColCnt; i++) {
			vaAutoFit.push(i);
		}
	} else if (vcTmpGrd.autoFit == "none") {
		vaAutoFit = [];
	} else {
		vaAutoFit = vcTmpGrd.autoFit.replaceAll(" ", "").split(",");
		vaAutoFit = vaAutoFit.map(function(each) {
			return Number(each);
		});
	}
	
	// 헤더가 다중행인 경우 마지막 행의 데이터만 받아오도록 처리 
	for (var i = 0; i < voColumnLayout.header.length; i++) {
		// 헤더 셀이 병합 되었거나 헤더 셀이 병합되지 않았는데 다중행인 경우 마지막 행의 정보 추가
		var voHeader = voColumnLayout.header[i];
		var vnHRowCnt = vcTmpGrd.header.getRowHeights().length;
		if ((voHeader.rowIndex != vnHRowCnt - 1 && voHeader.rowIndex + voHeader.rowSpan == vnHRowCnt) || voHeader.rowIndex == vnHRowCnt - 1) {
			var voHCol = vcTmpGrd.header.getColumn(voHeader.cellIndex);
			var voAddRow = ds1.addRowData({
				headerNm: voHCol.text,
				columnWidth: voColumnLayout.columnLayout[voHCol.colIndex].width,
				autoFitBool: vaAutoFit.indexOf(voHCol.colIndex) != -1 ? "O" : "X"
			});
			voAddRow.setAttr(msUserAttrNm, voHCol.cellIndex)
			voAddRow.setAttr("colIdx", voHCol.colIndex);
			
			// 컬럼 visible이 true인 행 체크
			vcGrid.setCheckRowIndex(voAddRow.getIndex(), voHeader.visible);
			
		}
	}
	vcGrid.commitData();
}

/*********************************************
 * 이벤트 핸들러 함수 
 *********************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad( /* cpr.events.CEvent */ e) {
	var initValue = app.getHostProperty("initValue");
	if (ValueUtil.isNull(initValue.targetGrid)) return;
	
	var ds1 = app.lookup("ds1");
	
	/** @type cpr.controls.Grid */
	//	var grid = app.getAppProperty("grid");
	var grid = initValue.targetGrid;
	
	// 행 이동 시 컬럼 정보 변경을 위한 임시 그리드 생성
	vcTmpGrd = new cpr.controls.Grid("grdTmp");
	vcTmpGrd.init(grid.getInitConfig());
	voTmpGrdLayout = vcTmpGrd.getColumnLayout(true);
	
	doAddRow();
	
	setDragSource(app.lookup("grd1"));
	setDropTarget(app.lookup("grd1"));
}

/*
 * "취소" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick( /* cpr.events.CMouseEvent */ e) {
	// 임시 그리드 객체 제거
	vcTmpGrd.dispose();
	//	app.dispatchEvent(new cpr.events.CUIEvent("cnclClick"));
	app.close();
}

/*
 * "확인" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click( /* cpr.events.CMouseEvent */ e) {
	var initValue = app.getHostProperty("initValue");
	if (ValueUtil.isNull(initValue.targetGrid)) return;
	
	/** @type cpr.controls.Grid */
	var grid = initValue.targetGrid;
	
	// 변경된 컬럼 너비 적용
	var vcGrid = app.lookup("grd1");
	vcGrid.dataSet.getRowStatedIndices(cpr.data.tabledata.RowState.UPDATED).forEach(function(each){
		var vnCellIdx = vcGrid.getRow(each).getAttr(msUserAttrNm)
		vcTmpGrd.resizeColumn(vnCellIdx, vcGrid.getRow(each).getValue("columnWidth") + "px");
	});
	
	// 변경된 컬럼 visible 적용
	var vnRowCount = vcGrid.dataSet.getRowCount();
	for (var i = 0; i < vnRowCount; i++) {
		var voRow = vcGrid.getRow(i);
		var vnColIdx = voRow.getAttr("colIdx");
		var voHColumn = vcTmpGrd.header.getColumn(voRow.getAttr(msUserAttrNm));
		// 컬럼이 병합된 경우 병합된 컬럼 visible 여부 같이 변경
		if (vcTmpGrd.header.getColumn(voRow.getAttr(msUserAttrNm)).colSpan > 1) {
			for (var j = vnColIdx; j < vnColIdx + voHColumn.colSpan; j++) {
				vcTmpGrd.columnVisible(j, voRow.rowChecked, "column-index");
			}
		} else {
			vcTmpGrd.columnVisible(vnColIdx, voRow.rowChecked, "column-index");
		}
	}
	voTmpGrdLayout = vcTmpGrd.getColumnLayout(true);
	
	// 메인 화면 그리드에 임시 그리드의 레이아웃 구조 적용
	grid.setColumnLayout(voTmpGrdLayout);
	grid.redraw();
	
	//	var event = new cpr.events.CUIEvent("okClick");
	//	app.dispatchEvent(event);
}

/*
 * 루트 컨테이너에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBodyClick( /* cpr.events.CMouseEvent */ e) {
	e.stopPropagation();
}

/*
 * 넘버 에디터에서 mousedown 이벤트 발생 시 호출.
 * 사용자가 컨트롤 위에 포인터를 위치한 상태로 마우스 버튼을 누를 때 발생하는 이벤트.
 */
function onNbe1Mousedown( /* cpr.events.CMouseEvent */ e) {
	// 너비 수정 시 드래그 방지
	e.stopPropagation();
}
