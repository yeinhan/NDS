/************************************************
 * Login.js
 * Created at 2023. 8. 7. 오후 16:46:16.
 *
 * @author ksk1908
 ************************************************/

/*
 * "로그인" 버튼(btnLogin)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnLoginClick(e){
	var btnLogin = e.control;
//	var vsMainUrl = "exb/com/main/Main.clx.html"
//	window.location.replace(vsMainUrl);
	
	var vsMainUri = "app/main/Main"
	cpr.core.App.load(vsMainUri,function(loadedApp){
		loadedApp.createNewInstance().run();
		app.dispose();
	})
}

/*
 * "다크모드" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick2(e){
	var button = e.control;
	var voElBody = document.body;
	var voAttrStyle = voElBody.getAttribute("style");
	var vcRootContainer = app.getContainer();
	var vcImgLogo = app.lookup("imgLogo");
	
	
	//색상 반전 초기화
	if (!ValueUtil.isNull(voAttrStyle) && voAttrStyle.indexOf("filter") != -1){
		voElBody.style.filter = null;
	}
	
	if(vcRootContainer.style.hasClass("is-dark")) {
		vcRootContainer.style.removeClass("is-dark");
		vcImgLogo.src = "theme/images/com/logo.png";
	} else {
		vcRootContainer.style.addClass("is-dark");
		vcImgLogo.src = "theme/images/com/dark/logo.png";
	}
	
}

/*
 * "고대비 모드" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var voElBody = document.body;
	var voAttrStyle = voElBody.getAttribute("style");
	var vcRootContainer = app.getContainer();
	
	
	//색상 반전 초기화
	if (!ValueUtil.isNull(voAttrStyle) && voAttrStyle.indexOf("filter") != -1){
		voElBody.style.filter = null;
	}
	
	if(vcRootContainer.style.hasClass("high-contrast")) {
		vcRootContainer.style.removeClass("high-contrast");
	} else {
		vcRootContainer.style.addClass("high-contrast");
	}
}
