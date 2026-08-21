/************************************************
 * Slider.js
 * Created at 2022. 11. 10. 오후 4:09:09.
 *
 * @author yhpark
 ************************************************/

/*
 * 슬라이더에서 value-change 이벤트 발생 시 호출.
 * 값이 변경된 후 발생하는 이벤트
 */
function onSld1ValueChange(e){
	var sld1 = e.control;
//	슬라이더와 넘버에디터의 값 맞춰주기
	app.lookup("nbe1").value = app.lookup("sld1").value;
}

/*
 * 넘버 에디터에서 value-change 이벤트 발생 시 호출.
 * NumberEditor의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onNbe1ValueChange(e){
	var nbe1 = e.control;
//	슬라이더와 넘버에디터의 값 맞춰주기
	app.lookup("sld1").value = app.lookup("nbe1").value;
}
