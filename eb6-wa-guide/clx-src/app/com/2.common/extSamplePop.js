/************************************************
 * extSamplePop.js
 * Created at 2023. 9. 15. 오후 3:51:23.
 *
 * @author daye
 ************************************************/

/*
 * "닫기" 버튼(btnClose)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCloseClick(e){
	var btnClose = e.control;
	app.close();
}
