/************************************************
 * 게시판.js
 * Created at 2023. 8. 28. 오전 11:31:58.
 *
 * @author ksk19
 ************************************************/
var waModule = cpr.core.Module.require("module/accessibility/checkAccessibilityProperty");
var util = createCommonUtil();
/**
 * 폼 레이아웃의 필드라벨용 문자열을 생성 및 반환합니다. (헤더명)
 * @param {Number} pnColIdx colIndex
 */
function getHeaderText(pnColIdx){
	var headerText = app.lookup("grpFormHeader").getLayout().getChildrenByLayoutOrder()[pnColIdx].text;
	headerText = headerText + " ";
	return headerText;
}

/**
 * 호출시 폼레이아웃으로 데이터 행을 생성하여 반환합니다.
 * @param {Array} paColName 생성할 컬럼명 배열
 * @param {Array} pnRowIndex 데이터 행 인덱스
 */
function createFormRow(paColName, pnRowIndex){
	var rowContainer = new cpr.controls.Container("grpFormRow");
	rowContainer.style.setClasses(["form-table-row"]);
	var rowLayout = new cpr.controls.layouts.FormLayout();
	rowLayout.scrollable = false;
	rowLayout.horizontalSpacing = "5px";
	rowLayout.verticalSpacing = "5px";
	rowLayout.setColumns(["50px", "150px", "1fr", "110px", "110px", "68px"]);
	rowLayout.setColumnAutoSizing(3, true);
	rowLayout.setColumnMinWidth(2, 300);
	rowLayout.setRows(["60px"]);
	rowContainer.setLayout(rowLayout);
	var dsPostList = app.lookup("dsPostList")
	var rowCellIndex = 0;
	for(var i = 0; i < paColName.length; i++){
		var voCellContent = null;
		
		// 게시글 제목 영역에 title과 content 담는 그룹 추가
		if(paColName[i] == "TITLE" || paColName[i] == "CONTENT"){
			
			//TITLE 에서 CONTENT까지 일괄 처리
			if(paColName[i] == "CONTENT") continue;
				
			// title과 content가 들어갈 그룹 생성
			var grpTitleContent = new cpr.controls.Container();
			grpTitleContent.style.setClasses(["form-row-title"]);
			var contentLayout = new cpr.controls.layouts.FormLayout();
			contentLayout.scrollable = false;
			contentLayout.horizontalSpacing = "5px";
			contentLayout.verticalSpacing = "5px";
			contentLayout.setColumns(["1fr"]);
			contentLayout.setColumnMinWidth(0, 300);
			contentLayout.setRows(["20px", "1fr"]);
			contentLayout.setRowAutoSizing(0, true);
			grpTitleContent.setLayout(contentLayout);
		
			if(paColName[i] == "TITLE"){
				if(pnRowIndex == 0){
					// 첫 행 컨트롤만 ID 부여합니다.(wa가이드 표시 추가 목적)
					var btnTitle = new cpr.controls.Button("btnPostTitle");
					btnTitle.userAttr("wa-prop-dataset", "dsPropView");
					btnTitle.userAttr("wa-prop-key", "btnPostTitle");
				}else{
					// 게시글 Title 생성 후 타이틀 그룹에 추가
					var btnTitle = new cpr.controls.Button();
				}
				btnTitle.style.setClasses(["post-title"]);
				btnTitle.value = dsPostList.getRowData(pnRowIndex)[paColName[i]];
				btnTitle.fieldLabel = getHeaderText(rowCellIndex) + btnTitle.value;
				btnTitle.tooltip = btnTitle.fieldLabel;
				btnTitle.ariaButtonType = "link";
				grpTitleContent.addChild(btnTitle, {
					"colIndex": 0,
					"rowIndex": 0
				});
				
				// 게시글 CONTENT도 같이 생성 후 타이틀 그룹에 추가
				var optContent = new cpr.controls.Output();
				optContent.value = dsPostList.getRowData(pnRowIndex)[paColName[i+1]]
				grpTitleContent.addChild(optContent, {
					"colIndex": 0,
					"rowIndex": 1
				});
				
				// 타이틀 셀 영역에 그룹 추가
				voCellContent = grpTitleContent;
				rowContainer.addChild(voCellContent, {
					"colIndex": rowCellIndex++,
					"rowIndex": 0
				});
			}
			
		// index 컬럼(getRowIndex)을 행번호(#)로 활용
		}else if(paColName[i] == "index"){
			voCellContent = new cpr.controls.Output();
			voCellContent.value = dsPostList.getRowData(pnRowIndex)[paColName[i]]+1;
			voCellContent.fieldLabel = getHeaderText(rowCellIndex) + voCellContent.value
			rowContainer.addChild(voCellContent, {
				"colIndex": rowCellIndex++,
				"rowIndex": 0
			});
			
		//작성일자 output Date 타입
		}else if(paColName[i] == "WRI_DT"){
			voCellContent = new cpr.controls.Output();
			voCellContent.value = dsPostList.getRowData(pnRowIndex)[paColName[i]];
			voCellContent.dataType = "date";
			voCellContent.dateValueFormat = "YYYYMMDD";
			voCellContent.format = "YYYY-MM-DD";
			voCellContent.fieldLabel = getHeaderText(rowCellIndex) + voCellContent.value
			rowContainer.addChild(voCellContent, {
				"colIndex": rowCellIndex++,
				"rowIndex": 0
			});
			
		// 파일첨부 여부 이미지 컨트롤
		}else if(paColName[i] == "FILE"){
			if(pnRowIndex == 0){
				voCellContent = new cpr.controls.Image("imgFile");
				voCellContent.userAttr("wa-prop-key", "imgFile");
			}else{
				voCellContent = new cpr.controls.Image();
			}
			var isFile = dsPostList.getRowData(pnRowIndex)[paColName[i]];
			voCellContent.alt = isFile == "true"? "파일 첨부됨" : "파일 첨부되지 않음"
			voCellContent.style.bindClass().toExpression(isFile+" == true ? 'ic-img-file' : ''");
			rowContainer.addChild(voCellContent, {
				"colIndex": rowCellIndex++,
				"rowIndex": 0
			});
			
		// 나머지 아웃풋
		}else{
			voCellContent = new cpr.controls.Output();
			voCellContent.value = dsPostList.getRowData(pnRowIndex)[paColName[i]];
			voCellContent.fieldLabel = getHeaderText(rowCellIndex) + voCellContent.value
			rowContainer.addChild(voCellContent, {
				"colIndex": rowCellIndex++,
				"rowIndex": 0
			});
		}
	}
	return rowContainer;
}

/**
 * 호출 시 form 테이블 디테일 영역에 행을 추가합니다.
 * @param {Number} pnRowIndex 
 * @param {Boolean} pbIsFirst 첫 번째 행인경우 true
 */
function addformTableRow(pnRowIndex, pbIsFirst){
	var dsPostList = app.lookup("dsPostList");
	var vaColumns = dsPostList.getColumnNames();
	// 데이터가 담긴 행(row) 그룹 컨테이너
	var voRow = createFormRow(vaColumns, pnRowIndex);
	var grpDetail = app.lookup("grpFormDetail");
	// grpDetail 레이아웃에 행 추가
	var vaRows = grpDetail.getLayout().getRows();
	
	if(!pbIsFirst) vaRows.push("60px");
	
	grpDetail.getLayout().setRows(vaRows);
	grpDetail.getLayout().setRowAutoSizing(0, true);
	
	// 추가된 행에 row그룹 추가
	grpDetail.addChild(voRow, {
		"colIndex": 0,
		"rowIndex": vaRows.length-1,
		"colSpan": 6,
		"rowSpan": 1
	})
	
	if (pbIsFirst) {
		// 첫 번째 행이 추가된 후 해당 컨트롤에 wa 가이드 표식 추가 (2023.10.23 수정)
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
			voRow.getAllRecursiveChildren(false).forEach(function(each) {
				waModule.setStyleWaArea(each);
			});
		});
	}
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	util.Submit.send(app, "subList", function(pbSuccess) {
		if (pbSuccess) {
			var pageIndexer = app.lookup("pix1");
			pageIndexer.totalRowCount = app.lookup("dsPostList").getRowCount();
			app.lookup("optRowCount").redraw();
			
			var vnRowCount = 10
			for (var i = 0; i < vnRowCount; i++) {
				if (i == 0) {
					addformTableRow(i, true);
				} else {
					addformTableRow(i, false);
				}
			}
		}
	});
}

