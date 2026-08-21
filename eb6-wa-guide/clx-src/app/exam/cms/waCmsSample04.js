/************************************************
 * 회원가입_07회원정보입력.js
 * Created at 2022. 3. 17. 오후 4:35:59.
 *
 * @author SeongSoo
 ************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	
	app.lookup("cmbPhone1").selectItem(0);
	app.lookup("cmbEmailDomain").selectItem(0);
}

/*
 * 인풋 박스에서 value-change 이벤트 발생 시 호출.
 * 변경된 value가 저장된 후에 발생하는 이벤트.
 */
function onIpbPwCheckValueChange(e){
	var ipbPwCheck = e.control;
	pwValidation()
}

/*
 * 인풋 박스에서 value-change 이벤트 발생 시 호출.
 * 변경된 value가 저장된 후에 발생하는 이벤트.
 */
function onIpbPwValueChange(e){
	var ipbPw = e.control;
	pwValidation()
}

function pwValidation(){
	var vcPw = app.lookup("ipbPw");
	var vcPwCheck = app.lookup("ipbPwCheck");
	var vcAlert = app.lookup("optAlert");
	if(!ValueUtil.isNull(vcPwCheck.value)){
		if(vcPwCheck.value != vcPw.value){
			vcAlert.visible = true;
			vcAlert.value = " ";
			setTimeout(function(){
				vcAlert.style.addClass("text-red");
				vcAlert.value = "비밀번호가 일치하지 않습니다.";
			}, 100);
			
		}else{
			vcAlert.visible = false
			vcAlert.style.removeClass("text-red");
			vcAlert.value = "";
		}
	}
}