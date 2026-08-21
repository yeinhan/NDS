/************************************************
 * @FileName keyboard-focus.module.js
 * @Creator 	류다은
 * @CreateDate 	2022. 7. 25. 오전 10:49:50.
 * @Desction    
 ************** 소스 수정 이력 ****************
*  date          	Modifier            Description
 ************************************************
*  2022. 7. 25.     	류다은	        최초 생성 
*  2025. 1.  7.			서다예			스타일시트 우선순위 동작 추가
* 												스타일 시트 정리
* 												accessibilityProperties 변수 값으로 동작할 수 있도록 수정
 ************************************************/

module.depends("module/accessibility/accessibilityProperties");

/************************************************
 * 전역변수
 ************************************************/
var started = false; // 모듈 기능 동작 시작 여부
var active = true; // 스타일 시트 활성 여부

/** @type HTMLLinkElement */
var keyBoardCssLink = null; // 우선순위1) 스타일 시트
/** @type HTMLStyleElement */
var styleElement = null; // 우선순위2) 스타일 노드


/************************************************
 * 이벤트 동작
 ************************************************/
/**
 * 문서에 스타일 시트를 추가합니다.
 */
function installStyle() {
	/*
	 * <우선순위>
	 * 1) keyBoardCssLink : focus.keyboard.css 스타일 시트 활성/비활성 처리
	 * 2) styleElement : document.head 에 직접 스타일 노드 추가후 활성/비활성 처리
	 */
	var focusCssLink = document.querySelector("head link[href*=\"focus.keyboard.css\"]");
	if (focusCssLink) {
		keyBoardCssLink = focusCssLink;
	} else {
		if (styleElement){
			return;
		}
		
		//TODO 실제 현장에서는 동적으로 스타일 노드의 콘텐트를 지정하는 대신 별도 CSS 파일 사용하는 것을 권장합니다.
		styleElement = document.createElement("style");
	
		styleElement.textContent = 
		".cl-control.cl-focus, "
		+ ".cl-control:focus,"
		+ ".cl-linkedcombobox-combo.cl-focus,"
		+ ".cl-linkedcombobox-combo:focus,"
		+ ".cl-grid-cell:focus,"
		+ ".cl-grid-cell .cl-builtin:focus-within,"
		+ ".cl-navigationbar-list.mega-menu-left .cl-navigationbar-listitem:not(.cl-disabled).cl-hover,"
		+ ".cl-tree-item:not(.cl-disabled):focus,"
		+ ".cl-accordion-header:not(.cl-disabled):focus,"
		+ ".cl-menu-item:not(.cl-disabled).cl-hover,"
		+ ".cl-sidenavigation-item:not(.cl-disabled):focus,"
		+ ".cl-combobox-list .cl-combobox-item:not(.cl-disabled).cl-hover,"
		+ ".cl-linkedcombobox-list .cl-linkedcombobox-item:not(.cl-disabled).cl-hover,"
		+ ".cl-calendar:not(.cl-disabled) .cl-calendar-header-before.cl-hover,"
		+ ".cl-calendar:not(.cl-disabled) .cl-calendar-header-before:hover,"
		+ ".cl-calendar:not(.cl-disabled) .cl-calendar-header-after.cl-hover,"
		+ ".cl-calendar:not(.cl-disabled) .cl-calendar-header-after:hover,"
		+ ".cl-calendar:not(.cl-disabled) .cl-calendar-header-prev.cl-hover,"
		+ ".cl-calendar:not(.cl-disabled) .cl-calendar-header-prev:hover,"
		+ ".cl-calendar:not(.cl-disabled) .cl-calendar-header-next.cl-hover,"
		+ ".cl-calendar:not(.cl-disabled) .cl-calendar-header-next:hover,"
		+ ".cl-calendar:not(.cl-disabled) .cl-calendar-header-text.cl-hover,"
		+ ".cl-calendar:not(.cl-disabled) .cl-calendar-header-text:hover,"
		+ ".cl-calendar.cl-popup .cl-calendar-content-day.cl-calendar-current,.cl-calendar-content-month.cl-calendar-current,.cl-calendar-content-year.cl-calendar-current,"
		+ ".cl-pageindexer-index:not(.cl-disabled):focus, .cl-pageindexer-first:not(.cl-disabled):focus, .cl-pageindexer-prev:not(.cl-disabled):focus, .cl-pageindexer-next:not(.cl-disabled):focus, .cl-pageindexer-last:not(.cl-disabled):focus,"
		+ ".cl-fileupload .cl-fileupload-footer .cl-fileupload-buttons .cl-fileupload-button:focus"
		+ "{"
		+ 	"outline : dotted 2px;"
		+ 	"outline-color: invert;"
		+ 	"outline-offset: -2px;"
		+ "}"
		+ ".cl-listbox .cl-listbox-list .cl-listbox-item.cl-selected,"
		+ ".cl-linkedlistbox:not(.cl-disabled) .cl-linkedlistbox-item:not(.cl-disabled):focus"
		+  "{"	
		+ 	"outline : dotted 2px !important;"
		+ 	"outline-color: invert !important;"
		+ 	"outline-offset: -2px !important;"
		+ "}"
		;
				
		 styleElement.disabled = true;
		 document.head.appendChild(styleElement);
	}
}

/**
 * 키보드 포커스 실행
 */
function start() {
	if (started){
		return;
	}
	started = true;
	
	// 문서에 스타일 시트를 추가합니다.
	installStyle();
}

/**
 * 키보드 포커스 스타일 시트를 비활성화 합니다.
 */
function deactivateKeyFocus() {
	if (!active){
		return;
	}
	active = false;
	
	if(keyBoardCssLink) {
		keyBoardCssLink.setAttribute("disabled", true);
	} else {
		if(styleElement){
			styleElement.sheet.disabled = true;
		}
	}
}

/**
 * 키보드 포커스 스타일 시트를 활성화 합니다.
 */
function activateKeyFocus() {
	if (active){
		return;
	}
	active = true;
	
	if(keyBoardCssLink) {
		keyBoardCssLink.removeAttribute("disabled");
	} else {
		styleElement.sheet.disabled = false;
	}
}


/************************************************
 * KEYBOARD-FOCUS.MODULE.JS
 ************************************************/
if(AccessibilityProperties.KEYBOARD_FOCUS) {
	
	cpr.events.EventBus.INSTANCE.addFilter("keydown", function(/* cpr.events.CKeyboardEvent */ e){
		// 탭 키가 눌리면 키보드 포커스 스타일 시트를 활성화 함
		if (e.key == "Tab"){
			activateKeyFocus();
		}
	});
	
	cpr.events.EventBus.INSTANCE.addFilter("mousedown", function(/* cpr.events.CKeyboardEvent */ e){
		// 마우스가 클릭되면 키보드 포커스 스타일 시트를 비활성화 함
		deactivateKeyFocus();
	});
	
	start();
}