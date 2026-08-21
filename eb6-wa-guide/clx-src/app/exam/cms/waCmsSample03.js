/************************************************
 * 회원가입_약관동의.js
 * Created at 2022. 3. 17. 오후 2:42:26.
 *
 * @author SeongSoo
 ************************************************/

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCbxAgreeAllValueChange(e){
	var cbxAgreeAll = e.control;
	var vcRadio1 = app.lookup("rdb1")
	var vcRadio2 = app.lookup("rdb2")
	var vcRadio3 = app.lookup("rdb3")
	
	if(e.newValue == cbxAgreeAll.trueValue){
		vcRadio1.value = "agree"; 
		vcRadio2.value = "agree";
		vcRadio3.value = "agree";
	}else{
		vcRadio1.value = "disagree"; 
		vcRadio2.value = "disagree";
		vcRadio3.value = "disagree";
	}
}
