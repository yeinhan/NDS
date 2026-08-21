/************************************************
 * publishingGuide.js
 * Created at 2023. 10. 15. 오전 11:00:38.
 *
 * @author ksk1908
 ************************************************/

var util = createCommonUtil();

/*
 * 루트  컨테이너에서 init 이벤트 발생 시 호출.
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
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
}

/*
 * "[접근성 검토 모드] 사용 방법 바로가기" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	var voRootAppIns = app.getRootAppInstance();
	if(voRootAppIns.hasAppMethod("getAllMenu")) {
		var voAllMenu = voRootAppIns.callAppMethod("getAllMenu");
		voAllMenu.findAllRow("MENU_ID == '" + btn1.userAttr("movePage") + "'").forEach(function(row) {
			if(voRootAppIns.hasAppMethod("openPage")) {
				voRootAppIns.callAppMethod("openPage", row);
			}
		})
	}
}
