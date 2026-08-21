/************************************************
 * publishingGuide-arch.js
 * Created at 2023. 10. 16. 오전 11:00:38.
 *
 * @author ksk1908
 ************************************************/

var util = createCommonUtil();

// js파일 스크립트 영역에서 exports 하여 expression 영역에서 호출 가능
exports.getType = function(value) {
	var llb = app.lookup("llb1");
	var item = llb.getItemByValue(value);
	var lastSelection = llb.getSelectionLast();
	var resultType = "";

	if (lastSelection == null) {
		return resultType;
	}

	if (item.depth == 0) {
		return "hasChild";
	}

	if (item.depth == lastSelection.depth) {
		if (lastSelection.children.length > 0) {
			resultType = "hasBoth";
		} else {
			resultType = "hasParent";
		}
		} else if (item.depth > lastSelection.depth) {
			resultType = "hasParent";
		} else if (item.depth < lastSelection.depth) {
			resultType = "hasBoth";
	}

	return resultType;

}


function gridPaging() {
	var vcGridSample = app.lookup("grdPaging");	
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

/**************************************************/

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
 * "테마 설정 바로가기" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	var voRootAppIns = app.getRootAppInstance();
	var voAllMenu = voRootAppIns.callAppMethod("getAllMenu");
	var vsControlName = "theme"
	voAllMenu.findAllRow("MENU_ID == '" + vsControlName + "'").forEach(function(row) {
		voRootAppIns.callAppMethod("openPage", row);
	})
		
}

/*
 * "+" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var dtiExample = app.lookup("dtiExample");
	if(ValueUtil.isNull(dtiExample.value))return false;
	var date = dtiExample.dateValue
	date.setDate(date.getDate()+1)
	dtiExample.dateValue = date;
	
}

/*
 * "-" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var dtiExample = app.lookup("dtiExample");
	if(ValueUtil.isNull(dtiExample.value))return false;
	var date = dtiExample.dateValue
	date.setDate(date.getDate()-1)
	dtiExample.dateValue = date;
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad2(e){
	util.Submit.send(app, "subList", function(){
		var pageIndexer = app.lookup("pix1");
		pageIndexer.totalRowCount = app.lookup("dsEmpList").getRowCount();
		gridPaging()
	});
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
 * "가이드 바로가기" 버튼(btn4)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn4Click(e){
	var btn4 = e.control;
	
	var voAllMenu = app.getRootAppInstance().callAppMethod("getAllMenu");
	voAllMenu.findAllRow("MENU_ID == 'notifier'").forEach(function(row) {
		app.getRootAppInstance().callAppMethod("openPage", row);
	})
}
