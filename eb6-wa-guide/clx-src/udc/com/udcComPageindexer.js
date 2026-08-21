

var util = createCommonUtil();


/*
 * Body에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(/* cpr.events.CEvent */ e){
	
	/**
	 * @type cpr.data.DataMap
	 */
	var voPageInfo = app.getAppProperty("pageInfo");
	
	if(!voPageInfo) return;
	
	voPageInfo.addEventListener("load", function(e){
		var totCnt = voPageInfo.getValue("recordsTotal");
		var rowSize = voPageInfo.getValue("recordCountPerPage");
		var pageIdx = voPageInfo.getValue("pageNo");
		var pageSize = voPageInfo.getValue("pageIndexerCount");
		
		app.lookup("optTot").value = totCnt;
		app.lookup("optRecordCountPerPage").value = rowSize;

		var pageCnt = 0;
		if(totCnt > 0 && rowSize > 0) {
			pageCnt = Math.ceil(totCnt / rowSize);
		}
		app.lookup("optPageCnt").value = pageCnt;
	
		var pageIndex = app.lookup("pageIndex");
	
		var vnFirstPageNoOn = parseInt((pageIdx - 1) / pageSize) * pageSize + 1;
	
		pageIndex.init(totCnt, vnFirstPageNoOn, pageIdx);
		
		pageIndex.currentPageIndex =Number(pageIdx);
		pageIndex.totalRowCount = Number(totCnt);
		pageIndex.pageRowCount = Number(rowSize);
		pageIndex.viewPageCount = Number(pageSize);
		
		var vbGrpPaging = app.lookup("grpPaging");
		
		if(totCnt == 0) {
			vbGrpPaging.visible = false;
		} else {
			vbGrpPaging.visible = true;
		}
		vbGrpPaging.redraw();
	});	
	
	/**
	 * @type cpr.controls.Grid
	 */
	var vcGrid = app.getAppProperty("ctrl");
	var vcDataSet =  vcGrid.dataSet;
	
		//그리드에 바인딩된 데이터셋(Dataset)이 로드될 때 처리
		vcDataSet.addEventListener("load", function(/* cpr.events.CDataEvent */e){
			/** @type cpr.data.DataSet */
			var dataset = e.control;
			if(dataset.getRowCount() <= 0) {
				util.Control.setVisible(app, false, "grpPaging");			
			}else{
				util.Control.setVisible(app, true, "grpPaging");
			}
		});
		
//	if(util.isMobile(app)){
//		app.lookup("pageIndex").style.css("font-size", "17px");
//		app.lookup("grpPaging").addEventListener("touchstart", onGrpPagingTouchstart);
//	}
	
	var vbShowExport = app.getAppProperty("showExportExcel");
	
	if(!vbShowExport){
		var vcExcelExport = app.lookup("btnExcelExport");
		vcExcelExport.visible = false;
	}
}

/**
 * PageIndexing을 위한 기초 데이터 설정
 * @param totCnt    : 총건수
 * @param pageSize	: 보여지는 페이지 수
 * @param rowSize	: 한 페이지에 보여질 행 수
 * @param pageIdx   : 현재페이지
 */
//exports.setPaging = function(totCnt, pageSize, rowSize, pageIdx, psPagingDataMapId) {
////	app.lookup("ipbCurrentIdx").value = pageIdx;
//	app.lookup("optTot").value = totCnt;
//	app.lookup("optRecordCountPerPage").value = rowSize;
//	var pageCnt = 0;
//	if(totCnt > 0 && rowSize > 0) {
//		pageCnt = Math.ceil(totCnt / rowSize);
//	}
//	app.lookup("optPageCnt").value = pageCnt;
//
//	var pageIndex = app.lookup("pageIndex");
//
//	var vnFirstPageNoOn = parseInt((pageIdx - 1) / pageSize) * pageSize + 1;
//	
//	pageIndex.init(totCnt, vnFirstPageNoOn, pageIdx);
//	
//	pageIndex.currentPageIndex = Number(pageIdx);
//	pageIndex.totalRowCount = Number(totCnt);
//	pageIndex.pageRowCount = Number(rowSize);
//	pageIndex.viewPageCount = Number(pageSize);
//	
////	app.lookup("ipbRecordCountPerPage").value = rowSize;
////	app.lookup("ipbCurrentIdx").value = pageIdx;
//
//	var vcExcelExport = app.lookup("btnExcelExport");
//
//	var vbGrpPaging = app.lookup("grpPaging");
//
//	if(totCnt == 0) {
////		pageIndex.visible = false;
//		vbGrpPaging.visible = false;
////		vcExcelExport.visible = false;
//	} else {
////		pageIndex.visible = true;
//		vbGrpPaging.visible = true;
////		vcExcelExport.visible = true;
//	}
//	app.setAppProperty("pagingDataMapId", psPagingDataMapId);
//	app.getContainer().redraw();
//}


exports.setMiniSize = function(){
	app.lookup("grpPaging").getLayout().setColumnVisible(1, false);
	app.lookup("grpPaging").getLayout().setColumnVisible(3, false);
}

exports.setTabSize = function(){
	app.lookup("grpPaging").getLayout().setColumnVisible(3, false);
}


/**
 * 모바일 스크롤 페이징
 * @param {cpr.core.AppInstance} app 앱 인스턴스
 * @param {String} psRootCtrlID 최상위 그룹 ID
 * @param {String} psContentCtrlID 표시되는 영역 ID
 */
exports.setMPaging = function(app, psRootCtrlID){
	/**
	 * @type cpr.controls.Container
	 */
	var vcRootCtrl = app.lookup(psRootCtrlID);
	vcRootCtrl.addEventListener("scroll", function(e){
		var vnScrollTop = vcRootCtrl.getViewPortRect().top;
		doFloatArea(app, vnScrollTop);
	});
}


function doFloatArea(/*cpr.core.AppInstance*/poApp ,pnY){
	/**
	 * @type cpr.controls.Grid
	 */
	var vcCtrl = app.getAppProperty("ctrl");
	var vnStart = vcCtrl.getOffsetRect().top;

	if(vnStart < pnY){
		var floattarget = poApp.lookup("grpSearchArea");
		floattarget.style.css("background-color", "#ffffff");
		floattarget.style.css({
			top: "0px"
		});
		poApp.floatControl(floattarget);
//		poApp.floatControl(floattarget, {
//			top: "0px"
//		});
	}
}




function doCheckLastPage(){
	var pageIndex = app.lookup("pageIndex");
	if(app.getAppProperty("ctrl").getRowCount() == pageIndex.totalRowCount){
		return true;
	}
	return false;
}


/*
 * 페이지 인덱서에서 before-selection-change 이벤트 발생 시 호출.
 * Page index를 선택하여 선택된 페이지가 변경되기 전에 발생하는 이벤트. 다음 이벤트로 selection-change를 발생합니다.
 */
function onPageIndexBeforeSelectionChange(/* cpr.events.CSelectionEvent */ e){
	/**
	 * @type cpr.controls.PageIndexer
	 */
	var pageIndex = e.control;

	var selectionEvent = new cpr.events.CSelectionEvent("before-pagechange", {
		oldSelection: e.oldSelection,
		newSelection: e.newSelection
	});

	app.dispatchEvent(selectionEvent);

	// 기본처리가 중단되었을 때 변경을 취소함.
	if(selectionEvent.defaultPrevented == true) {
		e.preventDefault();
	}
}

/*
 * 페이지 인덱서에서 selection-change 이벤트 발생 시 호출.
 * Page index를 선택하여 선택된 페이지가 변경된 후에 발생하는 이벤트.
 */
function onPageIndexSelectionChange(/* cpr.events.CSelectionEvent */ e, mPageIndex){
	/**
	 * @type cpr.controls.PageIndexer
	 */
	var pageIndex = e.control;

	app.lookup("ipbCurrentIdx").putValue("");
	var selectionEvent = new cpr.events.CSelectionEvent("pagechange", {
		oldSelection: e.oldSelection?e.oldSelection:(mPageIndex-1),
		newSelection: e.newSelection?e.newSelection:mPageIndex
	});
	
	
	/**
	 * @type cpr.data.DataMap
	 */
	var voPageInfo = app.getAppProperty("pageInfo");
	voPageInfo.setValue("pageNo", e.newSelection);
	
	app.dispatchEvent(selectionEvent);

//	app.lookup("ipbCurrentIdx").value = e.newSelection;
}


/*
 * "" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(/* cpr.events.CMouseEvent */ e){
	/**
	 * @type cpr.controls.Button
	 */
	var button = e.control;
	var vcCtrl = app.getAppProperty("ctrl");

	if(vcCtrl.getRowCount() < 1){
		util.Msg.notify(app, "출력할 데이터가 없습니다.");
		return false;
	}
	var exportTitle = !ValueUtil.isNull(app.getAppProperty("exportTitle")) ? app.getAppProperty("exportTitle") : vcCtrl.fieldLabel;
	var _app = vcCtrl.getAppInstance();
	util.Grid.exportData(_app, vcCtrl.id, exportTitle, null, "xlsx");
}


/*
 * 인풋 박스에서 value-change 이벤트 발생 시 호출.
 * 변경된 value가 저장된 후에 발생하는 이벤트.
 */
function onIpbCurrentIdxValueChange(/* cpr.events.CValueChangeEvent */ e){
	/**
	 * @type cpr.controls.InputBox
	 */
	var ipbCurrentIdx = e.control;
	if(ValueUtil.isNull(ipbCurrentIdx.value) || ipbCurrentIdx.value == "0"){
		return false;
	}
	var tot = app.lookup("optPageCnt").value;
	if(tot < ipbCurrentIdx.value){
		return;
	}
	
	
	var vsOldSelection = app.lookup("pageIndex").currentPageIndex;
	
	
	/**
	 * @type cpr.data.DataMap
	 */
	var voPageInfo = app.getAppProperty("pageInfo");
	voPageInfo.setValue("pageNo", ipbCurrentIdx.value);
	
	var selectionEvent = new cpr.events.CSelectionEvent("pagechange", {
		oldSelection: vsOldSelection,
		newSelection: ipbCurrentIdx.value
	});
	
	app.dispatchEvent(selectionEvent);
}


/*
 * 인풋 박스에서 value-change 이벤트 발생 시 호출.
 * 변경된 value가 저장된 후에 발생하는 이벤트.
 */
function onIpbRecordCountPerPageValueChange(/* cpr.events.CValueChangeEvent */ e){
	/**
	 * @type cpr.controls.InputBox
	 */
	var ipbRecordCountPerPage = e.control;

	var vsOldSelection = app.lookup("pageIndex").currentPageIndex;

	app.lookup("pageIndex").pageRowCount = ipbRecordCountPerPage.value;
	
	/**
	 * @type cpr.data.DataMap
	 */
	var voPageInfo = app.getAppProperty("pageInfo");
	voPageInfo.setValue("pageNo", 1);
	voPageInfo.setValue("recordCountPerPage", ipbRecordCountPerPage.value);

	var selectionEvent = new cpr.events.CSelectionEvent("pagechange", {
		oldSelection: vsOldSelection,
		newSelection: 1
	});

//	var voHostApp = app.getHostAppInstance();
//	var vcHostDataMap = voHostApp.lookup(app.getAppProperty("pagingDataMapId"));
//	vcHostDataMap.setValue("recordCountPerPage",ipbRecordCountPerPage.value);
	
	
	app.dispatchEvent(selectionEvent);

}










var mnOldX = null;
var mnOldY = null;

/*
 * 그룹에서 touchstart 이벤트 발생 시 호출.
 * 하나 이상의 터치 포인트가 터치 표면상에 배치될 때 발생하는 이벤트.
 */
function onGrpPagingTouchstart(/* cpr.events.CTouchEvent */ e){
	/**
	 * @type cpr.controls.Container
	 */
	var grpPaging = e.control;
	mnOldX = e.changedTouches.item(0).clientX;
	mnOldY = e.changedTouches.item(0).clientY;
	grpPaging.addEventListenerOnce("touchmove", onGrpPagingTouchmove);
}

var msDir = null;
/*
 * 그룹에서 touchstart 이벤트 발생 시 호출.
 * 하나 이상의 터치 포인트가 터치 표면상에 배치될 때 발생하는 이벤트.
 */
function onGrpPagingTouchmove(/* cpr.events.CTouchEvent */ e){
	/**
	 * @type cpr.controls.Container
	 */
	var grpPaging = e.control;
	var vnMoveX = e.changedTouches.item(0).clientX;
	var vnMoveY = e.changedTouches.item(0).clientY;
	if(Math.abs(mnOldX-vnMoveX) < 12 && Math.abs(mnOldY-vnMoveY)<50){
		return;
	}
	if(mnOldX > vnMoveX){ // right to left
		grpPaging.style.css({
			"transition" : "transform 0.3s ease-out 0s",
			"transform" : "translate3d(-50px, 0px, 0px)"
		});
		msDir = "l";
	}else{//left to right
		grpPaging.style.css({
			"transition" : "transform 0.3s ease-out 0s",
			"transform" : "translate3d(50px, 0px, 0px)"
		});
		msDir = "r";
	}
	if(msDir == "l"){
		if(doCheckLastIndex()){
			grpPaging.style.css({
				"transition" : "transform 0.3s ease-out 0s",
				"transform" : "translate3d(0px, 0px, 0px)"
			});
			return;
		}
	}
	grpPaging.addEventListenerOnce("touchend", onGrpPagingTouchend);
}


/*
 * 그룹에서 touchstart 이벤트 발생 시 호출.
 * 하나 이상의 터치 포인트가 터치 표면상에 배치될 때 발생하는 이벤트.
 */
function onGrpPagingTouchend(/* cpr.events.CTouchEvent */ e){
	/**
	 * @type cpr.controls.Container
	 */
	var grpPaging = e.control;
	grpPaging.style.css({
		"transition" : "transform 0.3s ease-out 0s",
		"transform" : "translate3d(0px, 0px, 0px)"
	});
	var vnCurrent = app.lookup("pageIndex").currentPageIndex;
	vnCurrent = msDir=="r"?(vnCurrent-1==0?1:vnCurrent-1):vnCurrent+1;
	onPageIndexSelectionChange(e, vnCurrent);
	mnOldX, mnOldY = null;
	msDir = null;
}


function doCheckLastIndex(){
	var vnLastIndex = Math.ceil(app.lookup("pageIndex").totalRowCount/app.lookup("pageIndex").pageRowCount);
	if(vnLastIndex == app.lookup("pageIndex").currentPageIndex){
		return true;
	}
	return false;
}






/*
 * 루트 컨테이너에서 screen-change 이벤트 발생 시 호출.
 * 스크린 크기 변경 시 호출되는 이벤트.
 */
function onBodyScreenChange(/* cpr.events.CScreenChangeEvent */ e){
	var vbMbScrn = e.screen.name != "default";
	
		/**
	 * @type cpr.controls.Grid
	 */
	var vcGrid = app.getAppProperty("ctrl");
	
	if (vbMbScrn || (vcGrid && vcGrid.getRowCount() == 0)){
	   app.lookup("grpPaging").getLayout().setColumnVisible(1, false);
	   app.lookup("grpPaging").getLayout().setColumnVisible(3, false);
	   app.lookup("pageIndex").viewPageCount = 3;
	} else {
		 app.lookup("grpPaging").getLayout().setColumnVisible(1, true);
	   app.lookup("grpPaging").getLayout().setColumnVisible(3, true);
	}
}
