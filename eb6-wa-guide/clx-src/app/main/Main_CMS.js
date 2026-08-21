/************************************************
 * Main_CMS.js
 * Created at 2023. 8. 29. 오후 4:36:22.
 *
 * @author daye
 ************************************************/
var util = createCommonUtil();
var waModule = cpr.core.Module.require("module/accessibility/checkAccessibilityProperty");

var isContainMain = true;
var isMainControl = true;
var mbIsAccessTestOn = false;

exports.isAccessTestOn = function(){
	return mbIsAccessTestOn;
}
/************************************************
 * 사용자 정의 함수
 ************************************************/
exports.getAllMenu = function(){
	return app.lookup("dsAllMenu");
}

exports.openPage = openPage;
function openPage (poRow) {
	
	var vsCallPage = ValueUtil.fixNull(poRow.getValue("CALL_PAGE"));
	if (vsCallPage == "") {
		return;
	}
	
	var vcEaCont = app.lookup("eaCn");
	var vsAppId = "";
	if (vsCallPage.indexOf(".clx") != -1) {
		vsAppId = vsCallPage.substring(0, vsCallPage.lastIndexOf(".clx"));
	} else {
		var vsHref = location.href;
		var vsTargetCallPage = vsHref.replace(app.app.id, vsCallPage);
		var postMethod = new cpr.protocols.HttpPostMethod(vsTargetCallPage, "_blank");
		postMethod.submit();
		postMethod.dispose();
		return;
	}
	
	var vcNavMenu = app.lookup("navMn");
	vcNavMenu.selectItemByValue(poRow.getValue("MENU_ID"), false);
	cpr.core.App.load(vsAppId, function(loadedApp){
		vcEaCont.app = loadedApp;
		vcEaCont.ready(function(ea){
			
			if(["LEVEL00-01", "LEVEL01-01"].indexOf(poRow.getValue("UP_MENU_ID").substr(0,10)) != -1 ){
				app.lookup("dsTotalProp").clear();
				collapseAsideArea();
			}
			
			_.delay(function(){
				ea.focus();
			}, 100);
		})
	});
}

/**
 * 페이지를 확대/축소하는 함수입니다.
 * @param {Number} pnZoomRate 줌 비율
 * @param {Object} poMdiItem 화면 신규 오픈시 적용할 mdiItem
 */
function setZoomPage(pnZoomRate, poMdiItem) {
	
	// 최소값, 최대값 지정
	if (pnZoomRate < 20 || pnZoomRate > 270) {
		util.Msg.alertDlg(app, "화면을 더이상 확대 및 축소 할 수 없습니다");
		return;
	}
	
	// 화면에 적용될 scale 비율
	var vnScale = (pnZoomRate / 100).toFixed(1);
	// 실제 화면에 적용될 비율 % 
	var vsScreenRate = ((100 / pnZoomRate) * 100) + "%";
	var voContainer = app.getContainer();
	
	/*
	 * 화면 확대/축소 로직
	 * 루트 레이아웃의 scale은 적용된 scale 비율에 따라 적용
	 * 축소 : 내부 루트 레이아웃의 크기는 고정하고 임베디드 앱 영역의 width,height 확장
	 * 확대 : 임베디드 앱 영역의 크기는 고정하고 내부 루트 컨테이너의 width,height 축소 
	 */
	voContainer.style.css({
		"transform": "scale3d(" + vnScale.toString() + ", " + vnScale.toString() + ", 1)",
		"transform-origin": "0 0"
	});
	
	if (pnZoomRate < 100) {
		voContainer.style.css({
			width: "100%",
			height: "100%"
		});
	} else {
		/*
		 * TODO 화면 확대시 스크롤이 생성되는 scale만 확장(스크롤 생성)시킬지 브라우저 배율기능과 동일하게  적용(스크롤 미생성)할지 프로젝트 별 검토가 필요함
		 * 루트레이아웃이 폼 레이아웃으로 구성된 경우 콘텐트 영역 폼레이아웃에 scrollable false시 스크롤이 생성되지 않음 
		 */			
		voContainer.style.css({
			width: vsScreenRate,
			height: vsScreenRate
		});
	}
	
	app.setAppProperty("_zoomRate", pnZoomRate);
}

/**
 * 탭폴더와 컨트롤을 입력 시 해당 컨트롤이 배치된 탭 아이템을 반환하는 함수입니다.
 * @param {cpr.controls.TabFolder} tabFolder
 * @param {cpr.controls.UIControl} ctrl
 * @return {cpr.controls.TabItem}
 */
function findTabContent(tabFolder, ctrl){
	if(tabFolder.getItemForContent(ctrl) instanceof cpr.controls.TabItem){
		return tabFolder.getItemForContent(ctrl);
	}else{
		if(ctrl.getParent()){
			return findTabContent(tabFolder, ctrl.getParent())
		}else{
			return false;			
		}
	}
}

/**
 * 인자로 받은 컨트롤이 탭폴더에 배치된 컨트롤인지 확인하고 탭폴더를 반환하는 함수입니다.
 * @param {cpr.controls.TabFolder} tabFolder
 * @param {cpr.controls.UIControl} ctrl
 * @return {cpr.controls.TabFolder}
 */
function isTabfolderControl(ctrl){
	if(ctrl instanceof cpr.controls.TabFolder){
		return ctrl;
	}else{
		if(ctrl.getParent()){
			return isTabfolderControl(ctrl.getParent())
		}else{
			return false;			
		}
	}
}

/**
 * 우측 PropView 영역을 펼칩니다
 */
function expandAsideArea() {
	app.lookup("grpProps").visible = true;
	cpr.core.DeferredUpdateManager.INSTANCE.update();
	
	app.lookup("grpProps").style.removeClass("collapsed");
	app.lookup("btnToggle").style.addClass("on")
	//메인 영역
	util.Control.updateConstraint(app, "grpMdiWrapper", null, {
		right: "500px"
	});
	//우측 사이드 영역
	util.Control.updateConstraint(app, "grpProps", null, {
		width: "490px",
	});
	//기존에 선택된 행을 다시 focus하는 경우 selectionChange 일어나지 않음.
	app.lookup("grdProperty").clearSelection()
	app.lookup("grdProperty").focusCell(0, 0);
}

/**
 * 우측 PropView 영역을 접습니다
 */
function collapseAsideArea() {
	
	var vcGrpProps = app.lookup("grpProps");
	var vcGridProps = app.lookup("grdProperty");
	
	vcGrpProps.style.addClass("collapsed");
	app.lookup("btnToggle").style.removeClass("on")
	//메인 영역
	util.Control.updateConstraint(app, "grpMdiWrapper", null, {
		right: "0px"
	});
	//우측 사이드 영역
	util.Control.updateConstraint(app, "grpProps", null, {
		width: "0px"
	});
	vcGrpProps.visible = false;
	
	var vnSelectedRowIndex = vcGridProps.getSelectedRowIndex();
	if(vnSelectedRowIndex > -1) {
		setFocusWaCtrlStyle(vnSelectedRowIndex, true, isMainControl);
	}
}



/**
 *	dsPropView에서 영문 컨트롤 명을 한글 컨트롤 명으로 변경해줍니다.
 * @param {cpr.data.DataSet} vcDsPropView
 */
function parseCtrlName(vcDsPropView){
	for(var i = 0; i < vcDsPropView.getRowCount(); i++){
		var krNm = waModule.getControlKrName(vcDsPropView.getValue(i, "control"));
		vcDsPropView.setValue(i, "control", krNm);
		
	}
	removeDistinctData();
	vcDsPropView.commit();
	app.lookup("grdProperty").redraw();
}

function removeDistinctData () {
	var dsTotalProp = app.lookup("dsTotalProp");
	
	dsTotalProp.getUnfilteredDistinctValues("keyNum").forEach(function(each){
		
		var vaFilterPropNm = dsTotalProp.getUnfilteredDistinctValues("propNm", function(dataRow){
			return dataRow.getValue("keyNum") == each;
		});
		vaFilterPropNm.forEach(function(propNm){
			var vaRows = dsTotalProp.findAllRow("keyNum == '" + each + "' && propNm == '"+propNm + "'");
			if(vaRows.length > 1) {
				var vnIndex = vaRows[vaRows.length-1].getIndex();
				dsTotalProp.deleteRow(vnIndex);
			}
		});
	});
}

/**
 * 
 * @param {Number} rowIndex
 * @param {any} pbRemove
 * @param {Boolean} pbMain 메인 화면의 컨트롤도 목록에 포함할 지 여부.
 */
function setFocusWaCtrlStyle (rowIndex, pbRemove, pbIsMainControl) {
	
	var grdProperty = app.lookup("grdProperty");
	var selectedKey = grdProperty.getRow(rowIndex).getValue("keyNum");
	var vcEmbApp = app.lookup("eaCn");
	var voEmbAppInstance = pbIsMainControl ? vcEmbApp.getAppInstance() : vcEmbApp.getEmbeddedAppInstance();
	
	// 메인화면에 직접 배치된 컨트롤이 아닌 경우 메인 화면에 표시된 컨트롤의 wa-highlight 클래스를 모두 제거해줍니다.
	if(!pbIsMainControl){
		app.getContainer().getAllRecursiveChildren().forEach(function(each){
			var uuid = "uuid-"+each.uuid
			var actCtrl = document.getElementById(uuid)
			if(!ValueUtil.isNull(actCtrl)){
				actCtrl.classList.remove("wa-highlight")
			}
		});
	}
	
	var rootContainer = voEmbAppInstance.getContainer();
	rootContainer.getAllRecursiveChildren().forEach(function(eachCtrl){
		// wa 키 값이 있는 컨트롤 중에서
		if(!ValueUtil.isNull(eachCtrl.userAttr("wa-prop-key"))){
			// 그리드에서 선택한 wa키 값과 컨트롤의 wa키 값이 일치할 때
			if(selectedKey == eachCtrl.userAttr("wa-prop-key") && !pbRemove){
				// 탭폴더에 포함된 컨트롤인 경우 탭폴더 이동
				if(isTabfolderControl(eachCtrl)){
					var tabFolder = isTabfolderControl(eachCtrl);
					var tabItem = findTabContent(tabFolder, eachCtrl)
					tabFolder.setSelectedTabItem(tabItem);
				}
				
				// 바인딩된 클래스가 최종적으로 결정된 후 클래스 조회하여 classList에 add
				var uuid = "uuid-"+eachCtrl.uuid
				var actCtrl = document.getElementById(uuid)
				if(!ValueUtil.isNull(actCtrl)){
					actCtrl.classList.add("wa-highlight")
				}
				
				// 그리드 redraw();
				if(eachCtrl.getParent() instanceof cpr.controls.Grid){
					var grid = voEmbAppInstance.lookup(eachCtrl.getParent()._id)
					grid.redraw();
				}
			}else{
				
				// 바인딩된 클래스가 최종적으로 결정된 후 클래스 조회하여 classList에서 remove
				var uuid = "uuid-"+eachCtrl.uuid
				var actCtrl = document.getElementById(uuid)
				if(!ValueUtil.isNull(actCtrl)){
					actCtrl.classList.remove("wa-highlight")
				}
				
				// 그리드 redraw();
				if(eachCtrl.getParent() instanceof cpr.controls.Grid){
					var grid = voEmbAppInstance.lookup(eachCtrl.getParent()._id)
					grid.redraw();
				}
			}
		}
	});
}


function copyControlId(rowIndex, pbRemove, pbIsMainControl){
	
	var grdProperty = app.lookup("grdProperty");
	var selectedKey = grdProperty.getRow(rowIndex).getValue("keyNum");
	var vcEmbApp = app.lookup("eaCn");
	var voEmbAppInstance = pbIsMainControl ? vcEmbApp.getAppInstance() : vcEmbApp.getEmbeddedAppInstance();
	var rootContainer = voEmbAppInstance.getContainer();
	rootContainer.getAllRecursiveChildren().forEach(function(eachCtrl){
		// wa 키 값이 있는 컨트롤 중에서
		if(!ValueUtil.isNull(eachCtrl.userAttr("wa-prop-key"))){
			// 그리드에서 선택한 wa키 값과 컨트롤의 wa키 값이 일치할 때
			if(selectedKey == eachCtrl.userAttr("wa-prop-key") && !pbRemove){
				
				// 컨트롤에 id값이 있으면 id를 클립보드에 복사하고, id가 지정되어있지 않은 경우 wa-prop-key 값을 복사합니다.
				if(!ValueUtil.isNull(eachCtrl.id)){
					navigator.clipboard.writeText(eachCtrl.id).then(function(){
					  console.log('컨트롤 ID를 클립보드에 복사했습니다.'); /* Resolved - 클립보드에 복사 성공 */
					},function(){
					  console.error('Failed to copy'); /* Rejected - 클립보드에 복사 실패 */
					});
				}else{
					navigator.clipboard.writeText(eachCtrl.userAttr("wa-prop-key")).then(function(){
					  console.log('컨트롤 ID를 클립보드에 복사했습니다.'); /* Resolved - 클립보드에 복사 성공 */
					},function(){
					  console.error('Failed to copy'); /* Rejected - 클립보드에 복사 실패 */
					});
				}
			}
		}
	});
}

/************************************************
 * 이벤트 핸들러
 ************************************************/
/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
	util.Submit.send(app, "subOnLoad", function(pbSuccess) {
		if (pbSuccess) {
//			var vsNowTime = moment().format(app.lookup("optLoginTime").format);
//			util.Control.setValue(app, "optLoginTime", vsNowTime);
//
			app.getContainer().redraw();
		}
	});
	
	collapseAsideArea();
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	// 최초 화면 비율 속성 정의
	app.setAppProperty("_zoomRate", 100);
}

/*
 * 그룹에서 focusin 이벤트 발생 시 호출.
 * 컨트롤 및 컨트롤의 하위 요소가 포커스를 획득하기 직전 발생하는 이벤트.
 */
function onGrpSkipFocusin(e){
	var grpSkip = e.control;
	var vcGrpHeader = app.lookup("grpHeader");
	vcGrpHeader.updateConstraint(grpSkip, {
		height : "30px"
	});
}

/*
 * 그룹에서 focusout 이벤트 발생 시 호출.
 * 컨트롤 밑 컨트롤의 하위 요소가 포커스를 잃기 직전 발생하는 이벤트.
 */
function onGrpSkipFocusout(e){
	var grpSkip = e.control;
	
	var vcGrpHeader = app.lookup("grpHeader");
	vcGrpHeader.updateConstraint(grpSkip, {
		height : "0px"
	});
}

/*
 * "대메뉴 바로가기" 버튼(btnSkipNav)에서 focus 이벤트 발생 시 호출.
 * 컨트롤이 포커스를 획득한 후 발생하는 이벤트.
 */
function onBtnSkipNavFocus(e){
	var btnSkipNav = e.control;
	var vcGrpSkip = app.lookup("grpSkip");
	vcGrpSkip.updateConstraint(app.lookup("btnSkipContent"), {
		height : "0px"
	});
	vcGrpSkip.updateConstraint(btnSkipNav, {
		height : "30px"
	});
}

/*
 * "본문 바로가기" 버튼(btnSkipContent)에서 focus 이벤트 발생 시 호출.
 * 컨트롤이 포커스를 획득한 후 발생하는 이벤트.
 */
function onBtnSkipContentFocus(e){
	var btnSkipContent = e.control;
	var vcGrpSkip = app.lookup("grpSkip");
	vcGrpSkip.updateConstraint(app.lookup("btnSkipNav"), {
		height : "0px"
	});
	vcGrpSkip.updateConstraint(btnSkipContent, {
		height : "30px"
	});
}

/*
 * "대메뉴 바로가기" 버튼(btnSkipNav)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSkipNavClick(e){
	var btnSkipNav = e.control;

	app.lookup("navMn").focus();
}

/*
 * "본문 바로가기" 버튼(btnSkipContent)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSkipContentClick(e){
	var btnSkipContent = e.control;

	app.lookup("eaCn").focus();
}

/*
 * 내비게이션 바에서 item-click 이벤트 발생 시 호출.
 * 아이템 클릭시 발생하는 이벤트.
 */
function onNavigationBarItemClick(e){
	var navigationBar = e.control;
	
	var voRow = e.item.row;
	openPage(voRow);
	
	//대시보드를 조회하는 경우 메인 컨트롤 접근성 가이드도 모아보기에 함께 표시
	if(e.item.value == "dashboard"){
		isContainMain = true;
	}else{
		isContainMain = false;
	};
}

/*
 * "–" 버튼(btnZoomMinus)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnZoomMinusClick(e){
	var btnZoom = e.control;
	
	var vnZoomRate = app.getAppProperty("_zoomRate") || 100;
	
	if (btnZoom.value == "+") {
		vnZoomRate += 10;
	} else {
		vnZoomRate -= 10;
	}
	
	setZoomPage(vnZoomRate);
}

/*
 * "▢" 버튼(btnZoomReset)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnZoomResetClick(e){
	var btnZoomReset = e.control;

	var vnZoomRate = 100;
	setZoomPage(vnZoomRate);
}

/*
 * 이미지에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onImgLogoClick(e){
	var imgLogo = e.control;
	location.reload();
}

/*
 * 이미지에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onImgLogoKeydown(e){
	var imgLogo = e.control;
	
	if(e.keyCode == cpr.events.KeyCode.ENTER || e.keyCode == cpr.events.KeyCode.SPACE) {
		onImgLogoClick(e);
		return false;
	}
}

/*
 * 버튼(btnLogout)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnLogoutClick(e){
	var btnLogout = e.control;
	cpr.core.App.load("app/exam/cms/waCmsSample01", function(loadedApp){
		loadedApp.createNewInstance().run();
		app.dispose();
	});
}

/*
 * 버튼(btnToggle)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnToggleClick(e){
	var btnToggle = e.control;
	var vbCollapsed = app.lookup("grpProps").style.hasClass("collapsed");
	if (vbCollapsed){
		/* 접힘 -> 펼침 */
		expandAsideArea();
	} else {
		/* 펼침 -> 접힘 */
		collapseAsideArea();
	}
}

/*
 * 그리드에서 selection-change 이벤트 발생 시 호출.
 * detail의 cell 클릭하여 설정된 selectionunit에 해당되는 단위가 선택될 때 발생하는 이벤트.
 */
function onGrdPropertySelectionChange(e){
	var grdProperty = e.control;
	
	var rowIndex = e.newSelection[0];
	var vsID = grdProperty.getDataRow(rowIndex).getValue("keyNum");
	// !!!주의!!! : 메인화면 컨트롤 ID랑 dsPropView keyNum 값이 반드시 동일해야합니다.
	isMainControl = ValueUtil.isNull(app.lookup(vsID)) ? false : true;
	setFocusWaCtrlStyle(rowIndex, false, isMainControl);
}

/*
 * 임베디드 앱에서 app-ready 이벤트 발생 시 호출.
 * 임베디드 앱의 인스턴스와 관련 자원이 준비되는 시점에 디스패치되는 이벤트.
 */
function onEaContAppReady(e){
	//접근성 검토모드 해제 
	app.lookup("cbxWaCheck").value = false;
	
	copyDataSet(isContainMain);
}


/**
 * @param {Boolean} pbMain 메인 데이터셋을 포함시킬지 여부.
 */
function copyDataSet(pbMain){
	var mainDataSet = app.lookup("dsTotalProp");
	// 새로운 탭에 생성된 임베디드 앱에 접근하여 데이터셋을 메인 데이터 셋으로 카피
	var embApp = app.lookup("eaCn");
	
	if(ValueUtil.isNull(embApp)) return false;
	
	var embAppInstance = embApp.getEmbeddedAppInstance();
	/** @type cpr.data.DataSet */
	var embDataSet = embAppInstance.lookup("dsPropView");
	
	if(ValueUtil.isNull(embDataSet)) return false;
	
	//데이터셋 초기화
	util.DataSet.clear(app, "dsTotalProp");
	if(pbMain){
		var dsMainPropView = app.lookup("dsPropView");
		var vsAppTitle = app.app.title + "(메인화면)";
		for(var i = 0; i < dsMainPropView.getRowCount(); i++){
			var voRowData = dsMainPropView.getRowData(i);
			mainDataSet.addRowData({
				"keyNum" : voRowData.keyNum,
				"control" : voRowData.control,
				"propNm" : voRowData.propNm,
				"propVal" : voRowData.propVal,
				"relatedWaInst" : voRowData.relatedWaInst,
				"code" : voRowData.code,
				"menuNm" : vsAppTitle
			})
		};
	}
	
	//데이터셋 복사
	var vsEmbTitle = embAppInstance.app.title;
	for(var j = 0; j < embDataSet.getRowCount(); j++){
		var voEmbRowData = embDataSet.getRowData(j);
		mainDataSet.addRowData({
			"keyNum": voEmbRowData.keyNum,
			"control": voEmbRowData.control,
			"propNm": voEmbRowData.propNm,
			"propVal": voEmbRowData.propVal,
			"relatedWaInst": voEmbRowData.relatedWaInst,
			"code": voEmbRowData.code,
			"menuNm": vsEmbTitle
		})
	}
	
	parseCtrlName(mainDataSet);
	
	var vcGrdProperty = app.lookup("grdProperty");
	
	if(vcGrdProperty.isShowing()) {
		vcGrdProperty.clearSelection();
		vcGrdProperty.focusCell(0, 0);
	};
}

/*
 * 그리드에서 row-dblclick 이벤트 발생 시 호출.
 * detail이 row를 더블클릭 한 경우 발생하는 이벤트.
 */
function onGrdPropertyRowDblclick(e){
	var grdProperty = e.control;
	var rowIndex = e.rowIndex;
	var vsID = grdProperty.getDataRow(rowIndex).getValue("keyNum");
	// !!!주의!!! : 메인화면 컨트롤 ID랑 dsPropView keyNum 값이 반드시 동일해야합니다.
	isMainControl = ValueUtil.isNull(app.lookup(vsID)) ? false : true;
	copyControlId(rowIndex, false, isMainControl);
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCbx1ValueChange(e){
	var cbx1 = e.control;
	if(cbx1.value == cbx1.trueValue){
		mbIsAccessTestOn = true;
		app.getContainer().getAllRecursiveChildren().forEach(function(each){
			waModule.checkAccessibility(app, each, false);
			waModule.setWaAreaHandle(each, false);
		});
	}else{
		mbIsAccessTestOn = false;
		app.getContainer().getAllRecursiveChildren().forEach(function(each){
			waModule.checkAccessibility(app, each, true);
			waModule.setWaAreaHandle(each, true);
		});
	}
}
