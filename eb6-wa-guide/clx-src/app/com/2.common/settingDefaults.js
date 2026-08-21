/************************************************
 * settingDefaults.js
 * Created at 2023. 10. 23. 오후 5:54:32.
 *
 * @author daye
 ************************************************/

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
