/************************************************
 * publishingGuide.js
 * Created at 2023. 10. 15. 오전 11:00:38.
 *
 * @author ksk1908
 ************************************************/

var util = createCommonUtil();


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
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	util.Submit.send(app, "subList", function(){
		// 접근성검토모드 적용 시, 내부 컨트롤에 아웃라인 표시하기 위함
		app.lookup("grdMain2").selectRows(0, false);		
	});
}

/*
 * 서브미션에서 submit-done 이벤트 발생 시 호출.
 * 응답처리가 모두 종료되면 발생합니다.
 */
function onSubListSubmitDone(e){
	var subList = e.control;
}
