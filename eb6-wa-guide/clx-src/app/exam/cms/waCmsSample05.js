/************************************************
 * 게시판.js
 * Created at 2023. 8. 28. 오전 11:31:58.
 *
 * @author ksk19
 ************************************************/
var util = createCommonUtil();

/**
 * @param {cpr.events.CMouseEvent} e
 */
function setCategoryFilter(e){
	var btn = e.control;
}

function gridPaging() {
	var vcGrid = app.lookup("grdMain");	
	var vcPageIndexer = app.lookup("pix1");
	var currentPageIndex = vcPageIndexer.currentPageIndex;
	
	vcPageIndexer.redraw();
	/* 페이징의 첫번째 행 번호와 마지막 행 번호를 지정합니다. */
	var startRowIndex = (currentPageIndex - 1) * vcPageIndexer.pageRowCount;
	var endRowIndex = currentPageIndex * vcPageIndexer.pageRowCount;
	
	/* 페이징이 될 때마다 그리드의 첫번째 행의 번호를 지정해줍니다. */
	vcGrid.rowIndexerStartNum = (startRowIndex + 1);
	
	/* filter 조건을 통해 그리드를 페이징합니다. */
	//index -> uid로 수정
	vcGrid.setFilter(startRowIndex + " < index && index <= " + endRowIndex);
}

/*
 * 페이지 인덱서에서 selection-change 이벤트 발생 시 호출.
 * Page index를 선택하여 선택된 페이지가 변경된 후에 발생하는 이벤트.
 */
function onPix1SelectionChange(e){
	var pix1 = e.control;
	gridPaging();
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	util.Submit.send(app, "subList", function(){
	});
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

/*
 * 서브미션에서 submit-done 이벤트 발생 시 호출.
 * 응답처리가 모두 종료되면 발생합니다.
 */
function onSubListSubmitDone(e){
	var subList = e.control;
	var pageIndexer = app.lookup("pix1");	
	pageIndexer.totalRowCount = app.lookup("dsPostList").getRowCount();
	gridPaging();
}

/*
 * "글쓰기" 버튼(btnRowCnt2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnRowCnt2Click(e){
	var btnRowCnt2 = e.control;
	var vsMainUri = "app/exam/cms/waCmsSample07"
	cpr.core.App.load(vsMainUri,function(loadedApp){
		if(app.isRootAppInstance()) {
			loadedApp.createNewInstance().run();
			app.dispose();
		} else {
			app.getHost().app = loadedApp;
		}
	})
}

