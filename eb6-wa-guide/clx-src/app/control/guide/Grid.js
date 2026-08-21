/************************************************
 * grid.js
 * Created at 2022. 11. 8. 오후 1:13:57.
 *
 * @author USER
 ************************************************/
/*
 * "필터" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var grid = app.lookup("grd2");
	var nbe = app.lookup("nbeFilter")
	if(ValueUtil.isNull(nbe.value)){
		nbe.value = 0;
	}
	grid.filter("column2 >= " + nbe.value);
}

var vbGrdSortCond = "";
/*
 * "정렬" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn = e.control;
	var grid = app.lookup("grd2");
	var cmb = app.lookup("cmbSort");
	if(ValueUtil.isNull(cmb.value)){
		alert("정렬할 column 명을 선택해주세요")
	}else{
		grid.clearSort();
		
		if(vbGrdSortCond == ""){
			grid.sort(cmb.value + " ASC");
			vbGrdSortCond = "ASC";
			btn.value = "정렬 ▲"
		}else if(vbGrdSortCond == "ASC"){	
			grid.sort(cmb.value + " DESC");
			vbGrdSortCond = "DESC";
			btn.value = "정렬 ▼"
		}else{
			vbGrdSortCond = "";
			btn.value = "정렬"
		}
	}
}

/*
 * "정렬취소" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var grid = app.lookup("grd2");
	var btn = app.lookup("btnSort")
	grid.clearSort();
	vbGrdSortCond = "";
	btn.value = "정렬"
}

/*
 * "필터취소" 버튼(btnClearFilter)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnClearFilterClick(e){
	var btnClearFilter = e.control;
	var grid = app.lookup("grd2");
	grid.clearFilter();
}

/*
 * 그리드에서 cell-click 이벤트 발생 시 호출.
 * Grid의 Cell 클릭시 발생하는 이벤트.
 */
function onGridCellClick(e){
	var grid = e.control;
	
	// 마우스로 모든 셀 클릭시 그룹 행 접고/펼치기
	var voTargetObject = e.targetObject;
	var voRowGroup = grid.getGridRowGroup(voTargetObject.rowIndex);
	if(voRowGroup) voRowGroup.expanded = !voRowGroup.expanded;
}

/*
 * 그리드에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onGridKeydown(e){
	var grid = e.control;
	// Enter 키 누를때마다 그룹행 접고/펼치기
	var voTargetObject = e.targetObject;
	if (e.keyCode == cpr.events.KeyCode.ENTER) {
		var voRowGroup = grid.getGridRowGroup(voTargetObject.rowIndex);
		if(voRowGroup) voRowGroup.expanded = !voRowGroup.expanded;
	}
}
