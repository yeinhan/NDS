/************************************************
 * 로그인.js
 * Created at 2022. 3. 16. 오전 10:43:55.
 *
 * @author SeongSoo
 ************************************************/

/*
 * "로그인" 버튼(btnLogin1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnLogin1Click(e){
	var btnLogin1 = e.control;
	
	cpr.core.App.load("app/main/Main_CMS", function(loadedApp){
		loadedApp.createNewInstance().run();
		app.dispose();
	});
}
