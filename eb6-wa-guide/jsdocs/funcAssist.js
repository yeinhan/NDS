
/**
 * 다이얼로그 파라미터 객체 정의 샘플로 사용하는 인터페이스형 객체입니다.
 * @interface
 */
function MessageInterface(){
	
}


/**
 * (Optional)확인 버튼을 눌러 팝업을 닫은 후 수행하는 콜백 함수 
 * @optional
 * @type {Function}
 */
MessageInterface.prototype.closeCallback = "";
/**
 * (Optional)취소 버튼을 눌러 팝업을 닫은 후 수행하는 콜백 함수.<br> alert 팝업에는 사용하지 않습니다.
 * @optional
 * @type {Function}
 */
MessageInterface.prototype.cancelCallback = "";
/**
 * (Optional)확인 버튼의 대체 텍스트 (기본값 : 확인)
 * @optional
 * @type {String}
 */
MessageInterface.prototype.okBtnText = new String();


/**
 * (Optional)취소 버튼의 대체 텍스트(기본값 : 취소).<br>alert 팝업에는 표시되지 않습니다.
 * @optional
 * @type {String}
 */
MessageInterface.prototype.noBtnText = new String();

/**
 * (Optional)메인 메세지 하단에 나오는 서브 메세지 내용입니다.
 * @optional
 * @type {String}
 */
MessageInterface.prototype.subMsg = new String();


