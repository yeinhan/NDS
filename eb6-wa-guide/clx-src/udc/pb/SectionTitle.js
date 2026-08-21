/************************************************
 * SectionTitle.js
 * Created at 2022. 5. 26. 오후 2:57:11.
 *
 * @author ryu
 ************************************************/


/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e){
	if (e.property == "subTextStyle"){
		var vcOptSubTxt = app.lookup("optSubTxt");
		vcOptSubTxt.style.setClasses(["subtxt"]);
		vcOptSubTxt.style.addClass(e.newValue);
	}
}
