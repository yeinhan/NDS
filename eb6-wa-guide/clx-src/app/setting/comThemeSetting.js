/************************************************
 * comThemeSetting.js
 * Created at 2023. 8. 29. 오후 3:34:26.
 *
 * @author daye
 ************************************************/

/*
 * "확인" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	
	var voElBody = document.body;
	var voAttrStyle = voElBody.getAttribute("style");
	/* 다크 테마 스타일 적용 시 */
	var vcRootAppIns = app.getRootAppInstance();
	var vcRootContainer = vcRootAppIns.getContainer();
	var vcImgLogo = vcRootAppIns.lookup("imgLogo");
	var vcImgLogoFooter = vcRootAppIns.lookup("imgLogoFooter");
						
	var vcRdbTheme = app.lookup("rdbTheme");
	var vsTheme = vcRdbTheme.value;
	if(!ValueUtil.isNull(vsTheme)){
		
		// 다크테마 초기화
		if(vcRootContainer.style.hasClass("is-dark")) {
			vcRootContainer.style.removeClass("is-dark");
			document.querySelector(".cl-global-aside").classList.remove("is-dark");
		}
		// 고대비 모드 초기화
		if(vcRootContainer.style.hasClass("high-contrast")) {
			vcRootContainer.style.removeClass("high-contrast");
			document.querySelector(".cl-global-aside").classList.remove("high-contrast");
		}
		
		
		switch(vsTheme){
			case "basic" : // 기본테마
				if(vcImgLogo) vcImgLogo.src = "theme/images/com/logo.png";
				if(vcImgLogoFooter) vcImgLogoFooter.src = "theme/images/com/logo.png";
				break;
			case "dark" : // 다크테마
				vcRootContainer.style.addClass("is-dark");
				document.querySelector(".cl-global-aside").classList.add("is-dark");
				
				if(vcImgLogo) vcImgLogo.src = "theme/images/com/dark/logo.png";
				if(vcImgLogoFooter) vcImgLogoFooter.src = "theme/images/com/dark/logo.png";
				break;
			case "contrast" : // 고대비테마
				vcRootContainer.style.addClass("high-contrast");
				document.querySelector(".cl-global-aside").classList.add("high-contrast");
				
				if(vcImgLogo) vcImgLogo.src = "theme/images/com/logo.png";
				if(vcImgLogoFooter) vcImgLogoFooter.src = "theme/images/com/logo.png";
				break;
		}
	}
	
	// 색상반전
	var vcCbxInvert = app.lookup("cbxInvert");
	if(vcCbxInvert.checked) {
		if (ValueUtil.isNull(voAttrStyle) || voAttrStyle.indexOf("filter") == -1){
			voElBody.style.filter = "invert(1)";
		}
	} else {
		if (!ValueUtil.isNull(voAttrStyle) && voAttrStyle.indexOf("filter") != -1){
			voElBody.style.filter = null;
		}
	}
	
	cpr.core.NotificationCenter.INSTANCE.post(AppProperties.MSG_TOPIC_ID, {
		"TYPE" : "SUCCESS",
		"MSG" : "테마가 성공적으로 변경되었습니다"
	});
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	
	var vcRdbTheme = app.lookup("rdbTheme");
	var vcCbxInvert = app.lookup("cbxInvert");
	
	var voElBody = document.body;
	var voAttrStyle = voElBody.getAttribute("style");
	
	var vcRootContainer = app.getRootAppInstance().getContainer();
	if(vcRootContainer.style.hasClass("is-dark")) {
		// 다크테마
		vcRdbTheme.selectItemByValue("dark");
	} else if(vcRootContainer.style.hasClass("high-contrast")) {
		// 고대비
		vcRdbTheme.selectItemByValue("contrast");
	}  else {
		// 기본테마
		vcRdbTheme.selectItemByValue("basic");
	}
	
	if (!ValueUtil.isNull(voAttrStyle) && voAttrStyle.indexOf("filter") != -1){
		// 색상반전
		vcCbxInvert.checked = true;
	}
}

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
	var voLayout = app.getContainer().getLayout();
	var vsRootAppId = app.getRootAppInstance().app.id;
	if(vsRootAppId == "app/main/Main") {
		voLayout.topMargin = 30;
		voLayout.leftMargin = 30;
		voLayout.rightMargin = 30;
		voLayout.bottomMargin = 30;
	} else {
		voLayout.topMargin = 90;
		voLayout.leftMargin = 90;
		voLayout.rightMargin = 90;
		voLayout.bottomMargin = 90;
	}
}
