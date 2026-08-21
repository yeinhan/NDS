/************************************************
 * comboBox.js
 * Created at 2022. 11. 8. 오후 2:22:48.
 *
 * @author USER
 ************************************************/

/*
 * 콤보 박스에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onCmb1Keydown(e){
	var cmb1 = e.control;
 /** 
 * @type cpr.controls.ComboBox
 */
 var cmb1 = e.control;
     if (cpr.events.KeyCode.UP == e.keyCode || cpr.events.KeyCode.DOWN == e.keyCode) {
        if (!cmb1.isOpened()) {cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
              cmb1.open();
            });
           e.preventDefault(); // 방향키로 값 변경되는 동작 방지
       }
    }

}
