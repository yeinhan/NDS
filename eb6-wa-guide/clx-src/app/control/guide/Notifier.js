/************************************************
 * Notifier.js
 * Created at 2022. 11. 10. 오후 3:42:08.
 *
 * @author yhpark
 ************************************************/

cpr.events.EventBus.INSTANCE.addFilter("keydown", function( /* cpr.events.CKeyboardEvent*/ e){
	var control = e.control;
	if (control instanceof cpr.controls.Button){
		if (e.keyCode == cpr.events.KeyCode.TAB){
			var vsRelatedNotiId = control.userAttr("relatedNoti");
			/**
			 * @type {cpr.controls.Notifier}
			 */
			var vcNotifier = app.lookup(vsRelatedNotiId);
			if (vcNotifier.getItemCount() > 0){
				e.preventDefault();
				var item = vcNotifier.getItem(vcNotifier.getItemCount() - 1);
				vcNotifier.focusItem(item, control);
			}
		}
	}
});

/*
 * "알림창 생성" 버튼(btnInfoCreate)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnInfoCreateClick(e){
	var btnInfoCreate = e.control;
	var vcNotifier = app.lookup("ntf1");
	vcNotifier.info("알림 컨트롤");
}

/*
 * "알림창 생성" 버튼(btnInfoCreate2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnInfoCreate2Click(e){
	var btnInfoCreate2 = e.control;

	var vcNotifier = app.lookup("ntf2");
	vcNotifier.info("알림 컨트롤");
}
