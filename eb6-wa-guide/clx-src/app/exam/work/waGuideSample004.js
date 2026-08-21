/************************************************
 * waGuideSample004.js
 * Created at 2022. 10. 17. 오전 8:19:54.
 *
 * @author ksk1908
 ************************************************/
var util = createCommonUtil();




/*****************************************
 * 사용자 정의 함수 
 *****************************************/

function gridPaging() {
	var vcGridSample = app.lookup("grdMain");	
	var vcPageIndexer = app.lookup("pix1");
	var currentPageIndex = vcPageIndexer.currentPageIndex;
	
	vcPageIndexer.redraw();
	/* 페이징의 첫번째 행 번호와 마지막 행 번호를 지정합니다. */
	var startRowIndex = (currentPageIndex - 1) * vcPageIndexer.pageRowCount;
	var endRowIndex = currentPageIndex * vcPageIndexer.pageRowCount;
	
	/* 페이징이 될 때마다 그리드의 첫번째 행의 번호를 지정해줍니다. */
	vcGridSample.rowIndexerStartNum = (startRowIndex + 1);
	
	/* filter 조건을 통해 그리드를 페이징합니다. */
	vcGridSample.setFilter(startRowIndex + " < index && index <= " + endRowIndex);
}


/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	util.Submit.send(app, "subList", function(pbSuccess) {
		if (pbSuccess) {
			var pageIndexer = app.lookup("pix1");
			pageIndexer.totalRowCount = app.lookup("dsEmpList").getRowCount();
			gridPaging();
		}
	});
}

/*
 * 페이지 인덱서에서 selection-change 이벤트 발생 시 호출.
 * Page index를 선택하여 선택된 페이지가 변경된 후에 발생하는 이벤트.
 */
function onPix1SelectionChange(e){
	var pix1 = e.control;
	gridPaging()
}

/*
 * "확인" 버튼(btnRowCnt)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnRowCntClick(e){
	var btnRowCnt = e.control;
	var pageIndexer = app.lookup("pix1");
	pageIndexer.pageRowCount = Number(app.lookup("cmbRowCnt").value);
	 gridPaging()
}
