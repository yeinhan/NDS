/************************************************
 * comGuideLine.js
 * Created at 2023. 10. 6. 오후 17:25:22.
 *
 * @author ksk1908
 ************************************************/
/**
 * 각 컨트롤의 물리명 및 논리명
 */
var util = createCommonUtil();

var moCtrlNm = {
	//	control
	"accordion": "아코디언",
	"audio": "오디오",
	"button": "버튼",
	"calendar": "캘린더",
	"checkbox": "체크박스",
	"checkboxgroup": "체크박스 그룹",
	"combobox": "콤보박스",
	"container": "그룹",
	"dateinput": "데이트인풋",
	"dialog": "다이얼로그",
	"embeddedapp": "임베디드 앱",
	"embeddedpage": "임베디드 페이지",
	"fileinput": "파일인풋",
	"fileupload": "파일업로드",
	"grid": "그리드",
	"htmlobject": "HTML오브젝트",
	"htmlsnippet": "HTML스니펫",
	"image": "이미지",
	"inputbox": "인풋박스",
	"linkedcombobox": "링크드 콤보박스",
	"linkedlistbox": "링크드 리스트박스",
	"listbox": "리스트박스",
	"maskeditor": "마스크에디터",
	"menu": "메뉴",
	"mdifolder": "MDI폴더",
	"navigationbar": "내비게이션바",
	"notifier": "알림",
	"numbereditor": "넘버에디터",
	"output": "아웃풋",
	"pageindexer": "페이지 인덱서",
	"progress": "프로그레스",
	"radiobutton": "라디오버튼",
	"searchinput": "서치 인풋",
	"slider": "슬라이더",
	"tabfolder": "탭 폴더",
	"textarea": "텍스트에리어",
	"tree": "트리",
	"treecell": "트리셀",
	"video": "비디오",
	"sidenavigation": "사이드 내비게이션",
	// cell
	"group": "그리드 그룹",
	"headerCell": "그리드 헤더 셀",
	"detailCell": "그리드 디테일 셀",
	"footerCell": "그리드 푸터 셀"
}

/**************************************************/
function hideEmptyGrid(){
	var vaGrd = app.getContainer().getAllRecursiveChildren().filter(function(each){
		return each instanceof cpr.controls.Grid;
	});
	
	vaGrd.forEach(function(each){
		if(each.getRowCount() < 1){
			each.visible = false;
		}else{
			each.visible = true;
		}
	});
	
}

/**************************************************/
/*
 * 그리드에서 cell-click 이벤트 발생 시 호출.
 * Grid의 Cell 클릭시 발생하는 이벤트.
 */
function onGrdCellClick(e){
	var grd = e.control;
	// 마지막 컬럼 cellIndex
	if(e.cellIndex == grd.columnCount-1){
		var rowIndex = e.rowIndex;
		var cellIndex = grd.getCellIndex("control");
		var vsCtrlName = grd.getCellValue(rowIndex, cellIndex).replaceAll(" ","")
		var vsControlName = Object.keys(moCtrlNm).find(key => moCtrlNm[key].replaceAll(" ","") == vsCtrlName);
		try {
			var voRootAppIns = app.getRootAppInstance();
			var voAllMenu = voRootAppIns.callAppMethod("getAllMenu");
			voAllMenu.findAllRow("MENU_ID == '" + vsControlName + "'").forEach(function(row) {
				voRootAppIns.callAppMethod("openPage", row);
			})
		} catch (error){
			alert("서비스 준비중입니다. (" +  vsControlName + ")");
		}	
	}
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	util.Submit.send(app, "subList", function(){
		// 데이터 뷰 번호에 따라 지침 별 filter를 걸어줍니다.
		app.getAllDataControls().forEach(function(each){
			if(each instanceof cpr.data.DataView){
				// ※ 반드시 데이터 뷰 번호와 지침 항목 번호가 일치해야함
				var guideNum = each.id.substr(2)
				each.setFilter("guideNum == "+guideNum);
			}
		});
		hideEmptyGrid();
	});
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCbx1ValueChange(e){
	var cbx1 = e.control;
	var arr = app.getContainer().getAllRecursiveChildren().filter(function(each){
		return each instanceof cpr.controls.Accordion;
	});
	if(cbx1.value == cbx1.trueValue){
		cbx1.text = "상세지침 모두 펼치기";
		arr.forEach(function(each){
			each.setSelectedSections([]);
		});
	}else{
		cbx1.text = "상세지침 모두 접기";
		arr.forEach(function(each){
			each.setSelectedSections(each.getSectionItems());
		});
	}
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCbx2ValueChange(e){
	var cbx = e.control;
	var arrGrd = app.getContainer().getAllRecursiveChildren().filter(function(each){
		return each instanceof cpr.controls.Grid;
	});
	if(cbx.value == cbx.trueValue){
		arrGrd.forEach(function(each){
			each.setFilter(each.getFilter()+"&&required == \"true\"");
		});
	}else{
		arrGrd.forEach(function(each){
			var guideNum = each.id.split("grd");
			each.setFilter("guideNum == "+guideNum[1]);
		});
	}
	hideEmptyGrid();
}
