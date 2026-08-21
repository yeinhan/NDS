/************************************************
 * Main.js
 * Created at 2022. 10. 17. 오전 8:19:54.
 *
 * @author ryu
 ************************************************/

var waModule = cpr.core.Module.require("module/accessibility/checkAccessibilityProperty");
var util = createCommonUtil();
var moHourTime = null;
var moTimeInterval = null;
var mbIsLogout = false;
var mbIsAccessTestOn = false;
exports.isDark = function (){
	return app.getContainer().style.hasClass("is-dark");	
}
exports.isAccessTestOn = function(){
	return mbIsAccessTestOn;
}

exports.checkRelation = function(paRows,poRow){
	/** @type String */
	var vsRows = paRows;
	var vaRows = vsRows.split(",");
	if(vaRows.indexOf(poRow) != -1) {
		
		return true;
	} else {
		return false;
	}
}

/**
 * btnAlarm 컨트롤의 스타일 조작을 위해 저장된 알림 아이템이 있는지 체크하는 함수.
 * 표현식 내에서 동작합니다.
 */
exports.getAlarmCount = function(){
	var vcGrpNoti = app.lookup("grpAlarmCont");
	
	return vcGrpNoti.getChildrenCount();
}

/**
 * 사용자 정보를 반환한다.
 * @param {String} psUserInfoType (Optional) 사용자 정보 변수(ex: USER_ID)
 * @return {String | cpr.data.DataMap} 사용자 정보
 */
exports.getUserInfo = function(psUserInfoType){
	var dmUserInfo = app.lookup("dmUserInfo");
	if(ValueUtil.isNull(psUserInfoType)){
		return dmUserInfo
	}
	return dmUserInfo.getValue(psUserInfoType);
}

exports.getMenuPath = getMenuPath;
exports.openPage = openPage;
exports.doOpenMenuToMdi = doOpenMenuToMdi;

exports.getAllMenu = function(){
	return app.lookup("dsAllMenu");
}

cpr.core.NotificationCenter.INSTANCE.subscribe(AppProperties.MSG_TOPIC_ID, app, function(poMsgInfo) {
	
	var vcNotiToastr = app.lookup("notiToastr");
	
	if (poMsgInfo["TYPE"] == "SUCCESS") {
		vcNotiToastr.success(poMsgInfo["MSG"]);
	} else if (poMsgInfo["TYPE"] == "INFO") {
		vcNotiToastr.info(poMsgInfo["MSG"]);
	} else if (poMsgInfo["TYPE"] == "WARNING") {
		vcNotiToastr.warning(poMsgInfo["MSG"]);
	} else if (poMsgInfo["TYPE"] == "DANGER") {
		vcNotiToastr.danger(poMsgInfo["MSG"]);
	} else {
		if(!ValueUtil.isNull(poMsgInfo["DELAY"])){
			vcNotiToastr.infoDelay = poMsgInfo["DELAY"];
		}else{
			vcNotiToastr.infoDelay = 2000;
		}
		poMsgInfo["TYPE"] = "INFO";
		vcNotiToastr.info(poMsgInfo["MSG"]);
	}
	
	/* 알림방에 메세지 저장 */
	if (!poMsgInfo["REPLAY"]) {
		createNotificationItem(poMsgInfo);
	}
});

/*
 * 화면이 새로고침 되기전 혹은 
 */
window.addEventListener("beforeunload", function(ev){
	if(!mbIsLogout) {
		var openMenus = [];
		app.lookup("mdiCn").getTabItems().forEach(function(each){
			if(each.userAttr("__menuInfo") != "" && each.checked) {
				
				openMenus.push(each.userAttr("__menuInfo"));
			}
		});
		
		if(openMenus.length > 0 ){
			sessionStorage.setItem("openedMenus", JSON.stringify(openMenus));
		} else {
			sessionStorage.removeItem("openedMenus");
		}
	}
});

/**************************************************
 * 사용자 선언 함수
 **************************************************/




/**
 * 지정한 개수만큼 앞에 자동으로 0을 채워넣습니다.
 * @param {Number} width
 * @param {String} str
 */
function fillZero(width, str){
    return str.length >= width ? str:new Array(width-str.length+1).join('0')+str;
}

/**
 * 로컬 세션 타임을 설정하는 함수입니다.
 * 타임아웃이 발생했을 때에 대한 비즈니스 로직이 수행되어야합니다.
 */
function setLocalSession() {
	var vcOptTime = app.lookup("optTime");
	clearInterval(moTimeInterval);
	
	moTimeInterval = setInterval(function(){
		var vsTime = moment.duration(moHourTime.diff(moment())).asSeconds();
		if(vsTime < 0) {
			clearInterval(moTimeInterval);
			util.Msg.alertDlg(app, "세션이 만료되었습니다.\n로그인이 필요합니다.", null, {
				confirmCallback: function(){
					app.lookup("btnLogout").click();
				}
			});
			return;
		}
		
		var vsFormatedValue = fillZero(2,Math.floor(vsTime/60).toString()) +" : "+  fillZero(2,Math.floor(vsTime%60).toString());
		if(vsFormatedValue == "10 : 00") {
			util.Msg.confirmDlg(app, "로그인 시간을 연장하시겠습니까?", null, {
				confirmCallback: function(){
					moHourTime = moment().add(1, "hour");
				}
			});
		}
		util.Control.setValue(app, "optTime", vsFormatedValue);
	}, 1000);
	
}


/**
 * 화면에 팝업을 플로팅하는 함수입니다. 팝업외의 영역을 클릭하면 팝업이 닫힙니다.
 * @param {cpr.controls.UIControl} pcControl
 * @param {{top:String, right:String, bottom:String, left:String, width:String, height:String}} poConstraint
 * @param {closeCallback : Function, modal : Boolean} poOption? 추가옵션
 */
function floating(pcControl, poConstraint,poOption) {
	var vcFloatingTarget = pcControl;
	
	var vcGrpCont = app.getContainer();
	
	var vcGrpOverlay = new cpr.controls.Container();
	vcGrpOverlay.setLayout(new cpr.controls.layouts.XYLayout());
	
	vcGrpOverlay.userAttr("floated-configuration", "true");
	
	vcGrpOverlay.addEventListenerOnce("click", function(e) {
		unfloating(vcFloatingTarget);
		
		if (hasOption("closeCallback") && _.isFunction(poOption["closeCallback"])) poOption["closeCallback"]();
	});
	
	if(pcControl.getParent()) {
		
		pcControl._originParent = pcControl.getParent();
		pcControl._originIndex = pcControl.getParent().getChildren().indexOf(pcControl);
		pcControl._originConstraint = pcControl.getParent().getConstraint(pcControl);
		pcControl._originVisible = pcControl.visible;
	}
	
	vcGrpCont.addChild(vcGrpOverlay, {
		top: "0px",
		right: "0px",
		bottom: "0px",
		left: "0px"
	});
	if(hasOption("modal")) {
		vcGrpOverlay.style.addClass("cl-overlay");
	} 
	
	util.Control.setVisible(app, true, vcFloatingTarget.id);
	
	vcGrpCont.floatControl(vcFloatingTarget, poConstraint);
	
	if(vcFloatingTarget instanceof cpr.controls.Container) {
		vcFloatingTarget.getAllRecursiveChildren(false).some(function(each){
			if(each.focusable) {
				each.focus();
				return true; // break
			}
		});
	} else {
		vcFloatingTarget.focus();
	}
	
	/**
	 * poOption 옵션 파라미터가 존재하는지 체크하는 함수입니다. 
	 * @param {String} psParamName
	 */
	function hasOption(psParamName) {
		if(ValueUtil.fixNull(poOption) != "" && poOption[psParamName]) {
			return true;
		} else {
			return false;
		}
	}
}


/**
 * 열렸던 팝업을 닫는 함수입니다. 별도의 호출없이, floating된 팝업이 있을 때 팝업 외의 영역을 클릭하면 수행됩니다.
 * @param {cpr.controls.UIControl} pcControl
 */
function unfloating(pcControl) {
	var vcGrpCont = app.getContainer();
	
	vcGrpCont.getChildren().filter(function(each){
		return each.userAttr("floated-configuration") == "true";
	}).forEach(function(each){
		vcGrpCont.removeChild(each, true);
	});
		
/** @type cpr.controls.Container */
	var vcOriginParent = pcControl._originParent;
	if(vcOriginParent) {
		
		vcOriginParent.insertChild(pcControl._originIndex, pcControl,pcControl._originConstraint);
		util.Control.setVisible(app, pcControl._originVisible, pcControl.id);
	} else {
		
		var voActualRect = pcControl.getActualRect();
		vcGrpCont.addChild(pcControl, {
			top : "10px",
			bottom : "10px",
			left : -250 + "px",
			width : voActualRect.width + "px"
		});
	}
	if (pcControl.userAttr("prevent-hide") == "true"){
		util.Control.setVisible(app, true, pcControl.id);
	}
	
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
	
	var vcMdiCn = app.lookup("mdiCn");
	
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
 * 화면을 호출하여 MDI 페이지에 추가하는 함수입니다. 외부에서 호출될 수 있습니다.
 * @param {cpr.data.Row} poRow 선택된 데이터 로우 (데이터셋)
 * @param {Object} poInitParam? 오픈될 메뉴에 전달할 파라미터
 * @param {readyCallback?:(embApp:cpr.controls.EmbeddedApp)=>null} poOptions? 옵션 파라미터
 */
function openPage(poRow, poInitParam, poOptions) {
	var voRow = poRow;
	var vsCallPage = ValueUtil.fixNull(voRow.getValue("CALL_PAGE"));
	
	if (vsCallPage == "") {
		return;
	}
	var vcMdiCn = app.lookup("mdiCn");
	
	var vsAppId = "";
	if (vsCallPage.indexOf(".clx") != -1) {
		vsAppId = vsCallPage.substring(0, vsCallPage.lastIndexOf(".clx"));
	} else {
		var vsHref = location.href;
		
		if (typeof eb6Preview != "undefined") {
			var vsTargetCallPage = vsHref.replace(app.app.id, vsCallPage);
			var postMethod = new cpr.protocols.HttpPostMethod(vsTargetCallPage, "_blank");
			postMethod.submit();
			postMethod.dispose();
		}else{
			if(vsHref.indexOf("goToAppPage") != -1) {
				window.open(vsHref.replace(app.app.id, vsCallPage));	
			} else {
				window.open(vsHref + "main.html?goToAppPage="+vsCallPage);	
			}
		}
		return;
	}
	
	var vcSideNav = app.lookup("sngMn");
	var voItem = vcSideNav.getItemByValue(poRow.getValue("MENU_ID"));
	vcSideNav.selectItem(voItem, false);
	vcSideNav.focusItem(voItem);
	
	var voOpenedTab = vcMdiCn.findItemWithAppID(vsAppId);
	if (voOpenedTab) {
		vcMdiCn.setSelectedTabItem(voOpenedTab);
		return;
	} 
	
	var mdiCn = app.lookup("mdiCn");
	var dmConfig = app.lookup("dmGlobalConfig");
	var vMaxWindowCnt = ValueUtil.fixNumber(dmConfig.getValue("mdiWindowMaxCount"));
	//오픈 창갯수 제한
	if (mdiCn.getTabItems().length > vMaxWindowCnt - 1) {
		//프로그램 탭은 @개를 초과할 수 없습니다. \n열려있는 프로그램을 닫은후 선택해 주세요.
		util.Msg.alertDlg(app, "INF-M012", [vMaxWindowCnt]);
		return false;
	}
	var vsSavedItem = sessionStorage.getItem("openedMenus");
	var vaObjectItem = ValueUtil.fixNull(vsSavedItem) == "" ? [] : JSON.parse(vsSavedItem);
	var vaOpenedMenuID = vaObjectItem.map(function(each) {
		var voMenuInfo = JSON.parse(each)["row"];
		var vsRowPageId = voMenuInfo["MENU_ID"];
		return vsRowPageId;
	});
	
	vcMdiCn.addItemWithApp(vsAppId, true, function( /* cpr.controls.TabItem */ tabItem) {
		tabItem.text = voRow.getValue("MENU_NM");
		var voMenuInfo = {
			"row": voRow.getRowData()
		}
		if (ValueUtil.fixNull(poInitParam) != "") {
			voMenuInfo["initParam"] = poInitParam;
		}
		tabItem.userAttr("__menuInfo", JSON.stringify(voMenuInfo));
		/** @type cpr.controls.EmbeddedApp */
		var vcEmb = tabItem.content;
		//임베디드앱이 준비가 되면 처리할 작업 등록
		if (vaOpenedMenuID.indexOf(voRow.getValue("MENU_ID")) != -1) {
			tabItem.checked = true;
		}
		
		if (!(vcEmb instanceof cpr.controls.EmbeddedApp)) {
			tabItem.content = new cpr.controls.EmbeddedApp();
			vcEmb = tabItem.content;
			cpr.core.App.load("app/com/0.com/comError404", function(loadedApp) {
				vcEmb.app = loadedApp;
				vcEmb.ready(function(embApp){
					_.delay(function(){
						embApp.focus();
					}, 100);
				})
			});
		} else {
			vcEmb.ready(function( /* cpr.controls.EmbeddedApp */ embApp) {
				
				var vnZoomRate = app.getAppProperty("_zoomRate");
				if (vnZoomRate != 100) setZoomPage(vnZoomRate, tabItem);
				
				if (!ValueUtil.isNull(poInitParam)) {
					vcEmb.setAppProperty("initValue", poInitParam);
				}
				
				if (ValueUtil.fixNull(poOptions) != "" && poOptions["readyCallback"]) {
					poOptions["readyCallback"].call(null, embApp);
				}
				
				// 접근성 관련
				_.delay(function(){
					embApp.focus();
				}, 100);
			});
		}
	});
}

/**
 * 메뉴 아이디를 통해 화면을 여는 함수입니다. 메인 화면의 메뉴 데이터셋에서 행을 가져올 수 없을 때 활용합니다.
 * @param {String} psMenuId 메뉴ID
 * @param {Object} poParam? 오픈될 메뉴에 전달할 파라미터
 * @param {readyCallback?:(embApp:cpr.controls.EmbeddedApp)=>null} poOptions? 옵션 파라미터
 */
function doOpenMenuToMdi(psMenuId, poParam,poOptions){
	var dsAllMenu = app.lookup("dsAllMenu");
	var voRow = dsAllMenu.findFirstRow("MENU_ID == '"+psMenuId+"'");
	if(voRow != null){
		// 메뉴 다이렉트 오픈시 전달하고 싶은 파라미터 세팅 (반드시 JSON 형태로 파라미터를 저장할 것!!)
		//app.lookup("dmMenuParam").setValue("strMenuParamVal", JSON.stringify(poParam));
		var appId = voRow.getValue("CALL_PAGE");
		openPage(voRow,poParam,poOptions);
	}else{
		util.Msg.alertDlg(app,"WRN-M030");
	}
}
/**
 * 현재메뉴의 메뉴 path 리턴
 * @param {String} psMenuId
 */
function getMenuPath(psMenuId) {
	/** @type cpr.data.DataSet */
	var vcDsAllMenu = app.lookup("dsAllMenu");
	if (vcDsAllMenu == null) return "";
	
	var vaMenuPathId = [];
	var vaMenuPathNm = [];
	var voMenu = null;

	while (true) {
		voMenu = vcDsAllMenu.findFirstRow("MENU_ID == '" + psMenuId + "'");
		if (voMenu == null) break;
		if (voMenu.getValue("UP_MENU_ID") == "") {
			vaMenuPathId.push(voMenu.getValue("MENU_ID"));
			vaMenuPathNm.push(voMenu.getValue("MENU_NM"));
			break;
		}
		
		vaMenuPathId.push(voMenu.getValue("MENU_ID"));
		vaMenuPathNm.push(voMenu.getValue("MENU_NM"));
		psMenuId = voMenu.getValue("UP_MENU_ID");
	}
	
	var lbxMenuBarItem = null;
	vaMenuPathId.reverse();
	vaMenuPathNm.reverse();
	
	var vaMenuPathInfo = new cpr.utils.ObjectMap();
	vaMenuPathInfo.put("MENU_PATH_ID", vaMenuPathId);
	vaMenuPathInfo.put("MENU_PATH_NM", vaMenuPathNm);
	
	return vaMenuPathInfo;
	
}


/**
 * 알림센터에서 메세지를 구독받았을 떄, 알림 팝업 창에 해당 알림에 대한 아이템을 추가하는 함수입니다.
 * @param {any} poInfo
 */
function createNotificationItem(poInfo){
	var vcGrpNoti = app.lookup("grpAlarmCont");
	
	var vcCont = new cpr.controls.Container();
	var voFormLayout = new cpr.controls.layouts.FormLayout();
	voFormLayout.leftMargin = "5px";
	voFormLayout.rightMargin= "5px",
	voFormLayout.topMargin = "10px";
	voFormLayout.bottomMargin = "10px";
	voFormLayout.horizontalSpacing= "10px",
	voFormLayout.verticalSpacing = "0px";
	voFormLayout.setRows(["20px","20px"]);
	voFormLayout.setColumns(["10px","1fr","20px"]);
	vcCont.setLayout(voFormLayout);
	vcCont.style.setClasses(["border-bottom"]);
	var voInfo = poInfo;
	var vsStatus = voInfo["TYPE"].toString().toLowerCase();
	
	var vcOptStatus = new cpr.controls.Output();
	vcOptStatus.style.setClasses(["rounded-circle"]);
	vcOptStatus.style.addClass("bg-"+vsStatus);
	vcCont.addChild(vcOptStatus, {
		"rowIndex" : 0,
		"colIndex" : 0,
		"rowSpan" : 2,
		"verticalAlign" : "center",
		"height" : 10
	});
	
	var vcOptMsg = new cpr.controls.Output();
	vcOptMsg.value = voInfo["MSG"];
	vcOptMsg.ellipsis = true;
	vcOptMsg.unselectable = true;
	vcCont.addChild(vcOptMsg, {
		"rowIndex" : 0,
		"colIndex" : 1
	});
	
	var vcOptTime = new cpr.controls.Output();
	var vsNowTime = moment().format("YYYY-MM-DD HH:mm:ss");
	vcOptTime.value = vsNowTime;
	vcCont.addChild(vcOptTime, {
		"rowIndex" : 1,
		"colIndex" : 1
	});
	
	var vcBtnClose = new cpr.controls.Button();
	vcBtnClose.style.setClasses(["btn-transparent","btn-noti-close"]);
	vcBtnClose.addEventListener("click", function(ev){
		var control = ev.control;
		if(vcGrpNoti.getLastChild() == control.getParent()) {
			control.focusPrevious();
		}
		control.getParent().dispose();
		util.Control.redraw(app, "btnAlarm");
	});
	vcBtnClose.addEventListener("keydown", function(evt){
		if(!evt.shiftKey && evt.keyCode == cpr.events.KeyCode.TAB) {
			if(vcGrpNoti.getLastChild() == evt.control.getParent()) {
				unfloating(app.lookup("grpAlarm"));
				app.lookup("btnAlarm").focus();
				return false;
			}
		}
	});
	vcCont.addChild(vcBtnClose, {
		"rowIndex" : 0,
		"colIndex" : 2,
		"rowSpan" :2,
		"verticalAlign" : "center",
		"height" : 20
	});	
	
	vcGrpNoti.addChild(vcCont, {
		width : "100px",
		height :"50px",
		autoSize: "height"
	});
	
	util.Control.redraw(app, "btnAlarm");
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
	app.lookup("grdProperty").focusCell(1, 0);
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
		right: "5px"
	});
	//우측 사이드 영역
	util.Control.updateConstraint(app, "grpProps", null, {
		width: "0px"
	});
	vcGrpProps.visible = false;
	
	var vnSelectedRowIndex = vcGridProps.getSelectedRowIndex();
	if(vnSelectedRowIndex > -1) {
		setFocusWaCtrlStyle(vnSelectedRowIndex, true);
	}
}

/**
 *	dsPropView에서 영문 컨트롤 명을 한글 컨트롤 명으로 변경해줍니다.
 * @param {cpr.data.DataSet} vcDsPropView
 * @param {cpr.core.AppInstance} poApp
 */
function parseCtrlName(vcDsPropView, poApp){
	
	var vsAppTitle = poApp.app.title;
	if(poApp.isRootAppInstance()) {
		vsAppTitle += "(메인화면)";
	}
	for(var i = 0; i < vcDsPropView.getRowCount(); i++){
		var krNm = waModule.getControlKrName(vcDsPropView.getValue(i, "control"));
		vcDsPropView.setValue(i, "control", krNm);
		vcDsPropView.setValue(i, "menuNm", vsAppTitle);
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
 */
function setFocusWaCtrlStyle (rowIndex, pbRemove) {
	var vcMdi = app.lookup("mdiCn");
	var grdProperty = app.lookup("grdProperty");

	var selectedKey = grdProperty.getRow(rowIndex).getValue("keyNum");
	var voEmbApp = vcMdi.getSelectedTabItem().itemIndex == 0 ? app.getRootAppInstance() : vcMdi.getSelectedTabItem().content.getEmbeddedAppInstance();
	var rootContainer = voEmbApp.getContainer();
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
				
				// 그리드 redraw()
				if(eachCtrl.getParent() instanceof cpr.controls.Grid){
					var grid = voEmbApp.lookup(eachCtrl.getParent()._id)
					grid.redraw();
				}
			}else{
				
				// 바인딩된 클래스가 최종적으로 결정된 후 클래스 조회하여 classList에서 remove
				var uuid = "uuid-"+eachCtrl.uuid
				var actCtrl = document.getElementById(uuid)
				if(!ValueUtil.isNull(actCtrl)){
					actCtrl.classList.remove("wa-highlight")
				}
				
				// 그리드 redraw()
				if(eachCtrl.getParent() instanceof cpr.controls.Grid){
					var grid = voEmbApp.lookup(eachCtrl.getParent()._id)
					grid.redraw();
				}
			}
		}
	});
}

function copyControlId(rowIndex, pbRemove){
	var vcMdi = app.lookup("mdiCn");
	var grdProperty = app.lookup("grdProperty");

	var selectedKey = grdProperty.getRow(rowIndex).getValue("keyNum");
	var voEmbApp = vcMdi.getSelectedTabItem().itemIndex == 0 ? app.getRootAppInstance() : vcMdi.getSelectedTabItem().content.getEmbeddedAppInstance();
	var rootContainer = voEmbApp.getContainer();
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

/**************************************************
 * 이벤트 리스너 함수
 **************************************************/
/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e) {
	util.Submit.send(app, "subOnLoad", function(pbSuccess) {
		if (pbSuccess) {
			var vsNowTime = moment().format(app.lookup("optLoginTime").format);
			util.Control.setValue(app, "optLoginTime", vsNowTime);

			app.getContainer().redraw();
		}
	});
	
	// 최초 데이터 세팅
	var dsTotalProp = app.lookup("dsTotalProp");
	dsTotalProp.build(app.lookup("dsPropView").getRowDataRanged());
	parseCtrlName(app.lookup("dsTotalProp"), app);
	
	collapseAsideArea();
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	moHourTime = moment().add(1, "hour");
	setLocalSession();
	
	// 최초 화면 비율 속성 정의
	app.setAppProperty("_zoomRate", 100);
	
	var vcBtnAlarm = app.lookup("btnAlarm");
	var vsClassNms = vcBtnAlarm.style.getClasses().join(" ");
	vcBtnAlarm.style.bindClass().toExpression("@getAlarmCount() > 0 ? '"+vsClassNms+" on' : '"+vsClassNms+"'");
}

/*
 * 이미지에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onImageClick(e){
	var image = e.control;
	location.reload();
}

/*
 * 이미지에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onImgLogoKeydown(e){
	var imgLogo = e.control;
	
	if(e.keyCode == cpr.events.KeyCode.ENTER || e.keyCode == cpr.events.KeyCode.SPACE) {
		location.reload();
	}
}

/*
 * 버튼(btnTabHome)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnTabHomeClick(e){
	var btnTabHome = e.control;
	
	var vcMdi = app.lookup("mdiCn");
	var vaTabItems = vcMdi.getTabItems();
	vcMdi.setSelectedTabItem(vaTabItems[0]);
}

/*
 * 서치 인풋에서 search 이벤트 발생 시 호출.
 * Searchinput의 enter키 또는 검색버튼을 클릭하여 인풋의 값이 Search될때 발생하는 이벤트
 */
function onSearchInputSearch(e){
	var searchInput = e.control;
	var vcSideNav = app.lookup("sngMn");
	/** @type cpr.data.DataSet */
	var vcDsNav = vcSideNav.dataSet;
	
	if(ValueUtil.fixNull(vcDsNav) =="") {
		return;
	}
	vcSideNav.clearFilter();
	vcSideNav.collapseAllItems();
	
	var vsNewValue = util.Control.getValue(app, "srchMenu").toLowerCase();
	var vaRows = vcDsNav.findAllRow("(MENU_DESC).toLowerCase() *= '"+vsNewValue+"'");
	var vaTreeItems = vaRows.map(function(each){
		return vcSideNav.getItemByValue(each.getValue("MENU_ID"));
	});
	
	var vaResults = [];
	vaTreeItems.forEach(function(each){
		
		var vaParentItem = each.parentItem;
		while(vaParentItem){
			vaResults.push(vaParentItem);
			vaParentItem = vaParentItem.parentItem;		
		}
	});
	var vaAllValue = vaTreeItems.concat(vaResults).map(function(each){
		return each.value;
	});
	
	if(vaAllValue.length > 0) {
		vcSideNav.setFilter("@checkRelation('"+vaAllValue.join(",")+"',value)");
		vcSideNav.clearSelection();
		vcSideNav.expandAllItems();
	}
}

/*
 * 사이드 내비게이션에서 item-click 이벤트 발생 시 호출.
 * 아이템 클릭시 발생하는 이벤트.
 */
function onSideNav1ItemClick(e){
	var sideNav1 = e.control;
	var voRow = e.item.row;
	var vsCallPage = voRow.getValue("CALL_PAGE");
	if(ValueUtil.fixNull(vsCallPage) != "") {
		openPage(voRow, true);
	}
}

/*
 * 버튼(btnAlarm)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnAlarmClick(e){
	var btnAlarm = e.control;
	
	var vcGrpAlarm = app.lookup("grpAlarm");
	floating(vcGrpAlarm, {
		right : "40px",
		top : "70px",
		width: "320px",
		height:"216px"
	});
}

/*
 * "전체삭제" 버튼(btnNotiDelete)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnNotiDeleteClick(e){
	var btnNotiDelete = e.control;
	var vcGrpAlarm = app.lookup("grpAlarmCont");
	vcGrpAlarm.removeAllChildren();
}


/*
 * "-+" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnZoomPlusMinusClick(e){
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
 * "O" 버튼(btnZoomReset)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnZoomResetClick(e){
	var btnZoomReset = e.control;
	var vnZoomRate = 100;
	
	setZoomPage(vnZoomRate);
}

/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e){
	var button = e.control;
	/** 
	 * @type cpr.controls.Button
	 */
	var btnRefresh = e.control;
	
	/* 현재 선택되어 있는 화면을 새로고침 합니다. */
	var vcMdiCn = app.lookup("mdiCn");
	
	var vcSelectedTabItem = vcMdiCn.getSelectedTabItem();
	var vcItemCn = vcSelectedTabItem.content;
	
	if (vcItemCn instanceof cpr.controls.EmbeddedApp) {
		
		var vsAppId = vcItemCn.app.id;
		vcItemCn.app = null;
		cpr.core.App.load(vsAppId, function(loadedApp) {
			vcItemCn.app = loadedApp;
			vcItemCn.redraw();
		});
	}
}

/*
 * 버튼(btnClose)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCloseClick(e){
	var btnClose = e.control;
	
	util.Msg.confirmDlg(app, "전체 메뉴를 닫으시겠습니까?", null, {
		confirmCallback: function() {
			var vcMdiCn = app.lookup("mdiCn");
			vcMdiCn.getItemByName("default").checked = true;
			var vaOpenedTabs = vcMdiCn.getTabItems();
			vaOpenedTabs.forEach(function(each) {
				if (!each.checked) {
					each.close();
				}
			});
		},
		subMsg: "잠긴 탭은 닫히지 않습니다."
	});
}

/*
 * MDI 폴더에서 close 이벤트 발생 시 호출.
 * 탭 아이템을 닫을 때 발생하는 이벤트이며, 사용자가 취소할 수 있습니다.
 */
function onMdiCnClose(e){
	var mdiCn = e.control;
	
	if(e.content && e.content.content){
		
		var vcItemApp = e.content.content.getEmbeddedAppInstance();
		
		if(vcItemApp && util.isAppModified(vcItemApp, "CRM", vcItemApp.getContainer())){
			e.preventDefault();
			mdiCn.setSelectedTabItem(e.content);
			return false;
		}
		
	}
	
	/* 첫 아이템을 제외한 나머지 탭 아이템이 닫혔을 때 첫 아이템 선택 */
	var vaLastTabItems = _.reject(mdiCn.getTabItems(), function(each) {
		return each == e.content;
	});
	
	if (vaLastTabItems.length > 1){
		return;
	}
	
	mdiCn.setSelectedTabItem(vaLastTabItems[0]);	
}

/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick2(e){
	var button = e.control;
	
	cpr.core.App.load("app/main/Login", function(loadedApp){
		loadedApp.createNewInstance().run();
		app.dispose();
	});
}

/*
 * 루트 컨테이너에서 before-unload 이벤트 발생 시 호출.
 * 앱이 언로드되기 전에 발생하는 이벤트 입니다. 취소할 수 있습니다.
 */
function onBodyBeforeUnload(e){
	clearInterval(moTimeInterval);
}


/*
 * "전체삭제" 버튼(btnNotiDelete)에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onBtnNotiDeleteKeydown(e){
	var btnNotiDelete = e.control;
	
	if(e.shiftKey && e.keyCode == cpr.events.KeyCode.TAB) {
		unfloating(app.lookup("grpAlarm"));
		app.lookup("btnAlarm").focus();
		return false;
	} else if (!e.shiftKey && e.keyCode == cpr.events.KeyCode.TAB) {
		var vnNotiCnt = app.lookup("grpAlarmCont").getChildren().length;
		if(vnNotiCnt == 0) {
			unfloating(app.lookup("grpAlarm"));
			app.lookup("btnAlarm").focus();
			return false;
		}
	}
}

/*
 * 그리드에서 selection-change 이벤트 발생 시 호출.
 * detail의 cell 클릭하여 설정된 selectionunit에 해당되는 단위가 선택될 때 발생하는 이벤트.
 */
function onGrd1SelectionChange(e){
	setFocusWaCtrlStyle(e.newSelection[0]);
}

/*
 * MDI 폴더에서 content-load 이벤트 발생 시 호출.
 * TabItem의 Content가 그려지고 브라우저에 표현되기 직전에 호출됨.
 */
function onMdiCnContentLoad(e){
	var mainDataSet = app.lookup("dsTotalProp");
	// 새로운 탭에 생성된 임베디드 앱에 접근하여 데이터셋을 메인 데이터 셋으로 카피
	var embApp = e.content.itemIndex == 0 ? app : e.content.content.getEmbeddedAppInstance();
	/** @type cpr.data.DataSet */
	var embDataSet = embApp.lookup("dsPropView");
	if(ValueUtil.isNull(embDataSet)) return false;
	//데이터셋 초기화
	util.DataSet.clear(app, "dsTotalProp");
	for(var j = 0; j < embDataSet.getRowCount(); j++){
		var rowData = embDataSet.getRowData(j)
		mainDataSet.addRowData(rowData)
	}
	parseCtrlName(mainDataSet, embApp);
	var vcGrdProperty = app.lookup("grdProperty");
	if(vcGrdProperty.isShowing()) {
		vcGrdProperty.focusCell(0, 0);
	}
}

/*
 * MDI 폴더에서 selection-change 이벤트 발생 시 호출.
 * Tab Item을 선택한 후에 발생하는 이벤트.
 */
function onMdiCnSelectionChange(e){
	//접근성 검토모드 해제 
	app.lookup("cbxWaCheck").value = false;
	
	var mainDataSet = app.lookup("dsTotalProp");
	//데이터셋 초기화
	util.DataSet.clear(app, "dsTotalProp");
	
	var voSelection = e.newSelection;
	if(voSelection.content == null) return false;
	
	// 새로운 탭에 생성된 임베디드 앱에 접근하여 데이터셋을 메인 데이터 셋으로 카피
	var embApp = voSelection.itemIndex == 0 ? app.getRootAppInstance() : voSelection.content.getEmbeddedAppInstance();
	var embDataSet = embApp.lookup("dsPropView");
	if (ValueUtil.isNull(embDataSet)) return false;
	
	for (var j = 0; j < embDataSet.getRowCount(); j++) {
		var rowData = embDataSet.getRowData(j)
		mainDataSet.addRowData(rowData)
	}
	parseCtrlName(mainDataSet, embApp);
	var vcGrdProperty = app.lookup("grdProperty");
	if(vcGrdProperty.isShowing()) {
		vcGrdProperty.focusCell(0, 0);
	}
	
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
 * 사이드 내비게이션에서 before-selection-change 이벤트 발생 시 호출.
 * 선택된 Item 값이 저장되기 전에 발생하는 이벤트. 다음 이벤트로 selection-change가 발생합니다.
 */
function onSideNavMenuBeforeSelectionChange(e){
	var sideNavMenu = e.control;
	
	if(e.newSelection.length > 0) {
		var voRow = e.newSelection[0].row;
		var vsCallPage = voRow.getValue("CALL_PAGE");
		if(ValueUtil.fixNull(vsCallPage) != "") {
			var vnRowIndex = app.lookup("grdProperty").getSelectedRowIndex();
			if(vnRowIndex > -1) {
				setFocusWaCtrlStyle(vnRowIndex, true);
			}
		}
	}
}

/*
 * 그리드에서 row-dblclick 이벤트 발생 시 호출.
 * detail이 row를 더블클릭 한 경우 발생하는 이벤트.
 */
function onGrdPropertyRowDblclick(e){
	var grdProperty = e.control;
	var rowIndex = e.rowIndex;
	var vbRemove = false;
	copyControlId(rowIndex,vbRemove)
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

/*
 * "시간 연장" 버튼(btnTime)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnTimeClick(e){
	var btnTime = e.control;
	moHourTime = moment().add(1, "hour");
}
