/************************************************
 * Dialog_B.js
 * Created at 2022. 9. 28. 오후 2:17:44.
 *
 * @author ryu
 ************************************************/

var util = createCommonUtil();

/**
 * 
 * @param {#uicontrol} psCtrlId
 * @param {any} psParamNotNull
 */
function setControlValue(psCtrlId,psParamNotNull){
	if(ValueUtil.fixNull(psParamNotNull) != "") {
		if(app.lookup(psCtrlId)) {
			
			util.Control.setValue(app, psCtrlId, psParamNotNull);
		}
	}
}


/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	var voHost = app.getHost();
	if(!voHost) {
		return;
	}
	/** @type {MessageInterface} */
	var voInitValue = app.getHostProperty("initValue");
		util.Control.setVisible(app, true, "btnPositive");
	if(ValueUtil.fixNull(voInitValue) != "") {
		if(voInitValue["msgType"] == "alert") {
			util.Control.setVisible(app, true, ["imgInfo"]);
		} else {
			util.Control.setVisible(app, true, ["btnNegative","imgInfo"]);
		}
		setControlValue("optMsg", voInitValue["msg"]);
		setControlValue("optSubMsg", voInitValue["subMsg"]);
		setControlValue("btnPositive", voInitValue["okBtnValue"]);
		setControlValue("btnNegative", voInitValue["noBtnValue"]);
		
//		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
			var vcGrpCont = app.lookup("grpMsgContent");
			var vnActuRectHeight = vcGrpCont.getActualRect();
			var vnContentRectHeight = vcGrpCont.getContentPaneRect();
			if(vnActuRectHeight > vnContentRectHeight) {
				return;
			}
			var vnDiff = vnContentRectHeight - vnActuRectHeight;
			var voDiaManage =  app.getRootAppInstance().dialogManager;
			var vsHostId = app.getHostAppInstance().id;
			var vsDialogId = vsHostId +"_"+ app.app.id;
			var voConstraint = voDiaManage.getConstraintByName(vsDialogId);
			voDiaManage.updateConstraintByName(vsDialogId, {
				height: voConstraint.height + vnDiff
			});
//		});	
	}
	
//	app.lookup("btnPositive").focus();
}

/*
 * "확인" 버튼(btnConfirm)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnConfirmClick(e){
	var btnConfirm = e.control;
	app.close("close");
}

/*
 * "취소" 버튼(btnCancel)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCancelClick(e){
	var btnCancel = e.control;
	
	app.close();
}
