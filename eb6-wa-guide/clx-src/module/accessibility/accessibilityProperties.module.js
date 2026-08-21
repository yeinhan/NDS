/************************************************
 * accessibilityProperties.module.js
 * Created at 2023. 10. 20. 오후 5:10:19.
 *
 * @author daye
 ************************************************
 * 2023.10.20					최초 작성
 * 2025.01.03					다양한 기능을 옵션화 하기 위한 변수 생성
 ************************************************/
/*
 * ★★ README ★★ 
 * 본 모듈은 프로젝트 내에 웹 접근성에 관련하여 필요한 상수를 정의한 모듈입니다.
 * 프로젝트 별 커스터마이징 하여 사용하십시오.
 */
function AccessibilityProperties(){
};

/************************************************
 * 메인 관련
 ************************************************/
/**
 * [메인] 메인화면 화면ID.<br>
 * 메인화면 관련 접근성 동작을 지원하며, 프로젝트 별 커스터마이징 필요 <strong>('메인화면 접근성 관련 단축키 설정' 확인)</strong><br>
 * ⇒ 메인화면 단축키 지원, 화면전환 시 최상위 다이얼로그 focus 처리
 */
AccessibilityProperties.prototype.MAIN_APP_ID = ["app/main/Main", "app/main/Main_CMS"];

/**
 * [다이얼로그] 메시지용 다이얼로그 화면ID. (alertDlg, confirmDlg)<br>
 * 다이얼로그 화면이 오픈 될 경우 스크린리더는 "@ 다이얼로그 페이지 열림" 이라는 음성피드백을 제공합니다. <br>
 * 이 때 메시지 다이얼로그는 제외합니다.
 */
AccessibilityProperties.prototype.MSG_DIALOG_APP_ID = ["app/com/0.com/comPMsgDialog"];

/**
 * [다이얼로그] AccessibilityProperties.MSG_DIALOG_APP_ID 에서 출판한 함수명<br>
 * 메시지 다이얼로그 내 특정 컨트롤을 포커스 해야할 경우 호출하는 사용됩니다.
 */
AccessibilityProperties.prototype.CALL_FUNC_DIALOG_FOCUS = "setFocusConfirm";

/**
 * [다이얼로그] 스크린리더의 가상커서가 다이얼로그 밖 내비게이션바로 튄 경우, 다이얼로그로 다시 포커스 처리<br>
 * 기본값으로 false 를 처리하는 것을 권장하며, 이상현상 발생 시 true 로 사용하는 것을 권장<br>
 * (default : false)
 */
AccessibilityProperties.prototype.CREATE_FOCUS_POINT_TO_DIALOG = false;

/**
 * [포커스] keyboard-focus.module.js 기능 동작 여부 설정<br>
 * true 로 설정 시, 마우스 클릭 시 포커스링을 표시하지 않으며, TAB 키를 누를 경우에만 포커스링을 표시<br>
 * (default: false)
 */
AccessibilityProperties.prototype.KEYBOARD_FOCUS = false;


/************************************************
 * 컨트롤 관련
 ************************************************/
/**
 * [공통] 필수입력 스타일 클래스<br>
 * fieldLabel에 '필수입력' 정보 제공
 */
AccessibilityProperties.prototype.CTRL_REQUIRED_CLS = ["required"];

/**
 * [그리드]  마지막 행/열 정보 추가 여부<br>
 * (default : true)
 */
AccessibilityProperties.prototype.SET_GRID_LAST_CELL_INFO = true;

/**
 * [그리드] 행 상태 정보 제공 여부 (신규행/삭제행/수정행)<br>
 * (default : false)
 */
AccessibilityProperties.prototype.SET_GRID_ROW_STATE_INFO = false;

/**
 * [그리드] 그리드 최초 포커스 시, 무조건 편집모드로 동작하게 만들지 여부<br>
 * <br>
 * clickMode와는 별개로, 키보드로 포커스 했을때에는 무조건 뷰잉모드로 접근하게 되며,<br>
 * 본 속성을 true 로 설정 시, 키보드로 포커스 시 편집모드로 진입한다.<br>
 * (default : false)
 */
AccessibilityProperties.prototype.SET_FOCUS_GRID_EDIT_MODE = false;

/**
 * [그리드] 조건부 컨트롤에 접근성 라벨 적용 여부<br/>
 * <br/>
 * 조건부 컨트롤에 설정된 컨트롤 별 타입을 접근성 라벨로 제공한다.<br/>
 * 단, accessibility.module.js 에서 제공하는 다양한 접근성 라벨 정보는 제공하지 않으며, 단순 타입정보에 대해서만 제공한다.<br/>
 * (default : false)
 */
AccessibilityProperties.prototype.SET_DYNAMIC_CONTROL_LABEL  = false;

/**
 * [내비게이션바] aria-expanded 적용 여부<br>
 * (auto: 펼침여부에 따른 true/false 적용, undefiend: 펼침여부에 대한 정보 미제공, none: 속성 완전 제거)<br>
 * (default : auto)
 * @type {"auto" | "undefined" | "none"}
 */
AccessibilityProperties.prototype.NAV_ITEM_ARIA_EXPANDED = "auto";

/**
 * [내비게이션바] 폴더 아이템 role 적용<br>
 * (default : link)
 * @type {"link" | "menuitem" | "button"} 
 */
AccessibilityProperties.prototype.NAV_FOLDER_ITEM_ROLE = "link";

/**
 * [버튼] 하위 영역을 확장/축소 가능한 아코디언 버튼 스타일 클래스<br>
 * ● 적용 기술 : aria-expanded=false 적용
 */
AccessibilityProperties.prototype.BTN_TOGGLE_CLS = ["btn-expanded"];

/**
 * [버튼] AccessibilityProperties.BTN_TOGGLE_CLS 가 적용된 버튼<br>
 * ● 적용 기술 : aria-expanded=true 적용
 */
AccessibilityProperties.prototype.BTN_TOGGLE_EXPAND_CLS = ["expand"];

/**
 * [사이드 내비게이션] 폴더 아이템 role 적용<br>
 * (default : link)
 * @type {"link" | "menuitem"}
 */
AccessibilityProperties.prototype.SNV_FOLDER_ITEM_ROLE = "link";

/**
 * [아웃풋] 버튼 역할 아웃풋(tabIndex>=0)<br>
 * ● 적용 기술 : 포커스 가능한 아웃풋은 버튼으로 인식되도록 role=button 적용 및 Enter 시 클릭 이벤트 전파<br>
 * (default : false)
 */
AccessibilityProperties.prototype.SET_FOCUSABLE_OUPTUT = false;

/**
 * [콤보박스] 콤보박스 단축키<br>
 * ● 적용 기술 : Enter 키를 누르면 리스트 오픈(readOnly=false, enabled=true)<br>
 * 1.0.5243 버전부터는 기본 기능으로 동작이 가능하여, 1.0.5243 이전 버전에서 필요 시 true 로 설정할 것을 권장<br>
 * (default : false)
 */
AccessibilityProperties.prototype.COMBO_OPEN_BY_ENTER = false;

/**
 * [트리] 체크상태에 대한 aria-label 적용<br>
 * showItemCheckbox or showSelectionCheckbox=true 일 경우 각 아이템 별 displayExp 에 체크상태에 대한 레이블 제공<br>
 * (default : false)
 */
AccessibilityProperties.prototype.SET_TREE_CHECKED_LABEL = false;

/**
 * [내비게이션바, 트리]<br>
 * 각 컨트롤 아이템의 시작 depth 를 결정<br>
 * (default: 0, 루트아이템 ⇒0 dpeth)
 */
AccessibilityProperties.prototype.SET_START_ITEM_DEPTH = 0;

/**
 * [파일인풋] fieldLabel 설정<br>
 * 파일인풋의 fieldLabel 에 value 가 바인딩되어 있지 않을 경우 일괄 적용을 위한 속성<br>
 * (default: false)
 */
AccessibilityProperties.prototype.SET_FILEINPUT_LABEL = false;

/************************************************
 * 모바일 접근성 관련
 ************************************************/
/**
 * [체크박스] .cl-checkbox-icon 영역에 html title 속성 적용<br>
 * title 속성에는 체크여부에 대한 내용 설정<br>
 * (default : false)
 */
AccessibilityProperties.prototype.SHOW_TOOLTIP_CHECK_ICON = false;

/**
 * [다이얼로그] Modal 다이얼로그 호출 시, 다이얼로그 밖에 가상커서가 접근하지 못하도록 aria-hidden=true 적용<br>
 * (default : true)
 */
AccessibilityProperties.prototype.SET_DIALOG_ARIA_HIDDEN = true;


/************************************************
 * 기타
 ************************************************/
/**
 * 최초 실행 시, senseReader patch 콘솔로그 확인 여부<br>
 * (default : true)
 */
AccessibilityProperties.prototype.SHOW_SENSE_READER_SETTING_MSG = true;

/**
 * 스크린리더가 값을 읽을 시, aria-live 타입 결정<br>
 * (auto: 모듈 내 지정한 값, assertive: 항상 assertive, polite: 항상 polite)<br>
 * (default : auto)
 * @type {"auto" | "assertive" | "polite"} 
 */
AccessibilityProperties.prototype.ARIA_LIVE_TYPE = "auto";

/**
 * 센스리더 구버전 사용 시, 가상커서 상태에서 탭폴더 마지막 영역에서 탭아이템의 텍스트를 읽는 현상에 대한 조치<br>
 * (default: false)
 */
AccessibilityProperties.prototype.HIDDEN_TAB_ARIA_LABEL = false;


/************************************************
 * 사용자 편의성 - 단축키 모음
 * 모든 단축키는 Ctrl+Shift+Alt+@ 로 조합되며, 특수키(Ctrl, Shift, Alt) 의 사용여부는 아래 변수를 통해 설정할 수 있습니다.
 ************************************************/
AccessibilityProperties.prototype.SHORT_KEY_USE_CTRL = true; 	// Ctrl 키 사용 여부   (default : true)
AccessibilityProperties.prototype.SHORT_KEY_USE_ALT = true; 		// Alt 키 사용 여부	 (default : true)
AccessibilityProperties.prototype.SHORT_KEY_USE_SHIFT = false;  // Shift 키 사용 여부 (default : false)

/************************************************
 * 메인화면 단축키
 ************************************************/
AccessibilityProperties.prototype.SHORT_KEY_FOCUS_TOP = "I"; 			// 상단 내비게이션 메뉴로 포커스 이동
AccessibilityProperties.prototype.SHORT_KEY_FOCUS_LEFT = "J"; 			// 좌측 사이드 메뉴로 포커스 이동
AccessibilityProperties.prototype.SHORT_KEY_FOCUS_RIGHT = "L"; 		// 중앙 임베디드 영역(컨텐츠)으로 포커스 이동
AccessibilityProperties.prototype.SHORT_KEY_FOCUS_BOTTOM = ","; 	// 하단 영역으로 포커스 이동
AccessibilityProperties.prototype.SHORT_KEY_FOCUS_ROLL = "K"; 		// 상단/좌측/중앙/하단 포커스 이동 롤링

/************************************************
 * 그리드 단축키
 ************************************************/
/* 그리드 외부 포커스 */
AccessibilityProperties.prototype.SHORT_KEY_FOCUS_GRID_PREV = "U"; 	// 그리드에서 이전 컨트롤으로 포커스 이동
AccessibilityProperties.prototype.SHORT_KEY_FOCUS_GRID_NEXT = "O"; 	// 그리드에서 다음 컨트롤으로 포커스 이동
/* 그리드 현제 셀 확인 */
AccessibilityProperties.prototype.SHORT_KEY_GRID_CELL_INFO = "T"; 		// 현재 위치한 셀 정보 확인(스크린리더의 음성피드백으로 확인)
/* 그리드 내부 셀 이동 */
AccessibilityProperties.prototype.SHORT_KEY_GRID_MOVE_CELL_UP = cpr.events.KeyCode.UP; 						// 현재 위치한 셀에서 위에 위치한 셀로 포커스 이동
AccessibilityProperties.prototype.SHORT_KEY_GRID_MOVE_CELL_LEFT = cpr.events.KeyCode.LEFT; 					// 현재 위치한 셀에서 좌측에 위치한 셀로 포커스 이동
AccessibilityProperties.prototype.SHORT_KEY_GRID_MOVE_CELL_RIGHT = cpr.events.KeyCode.RIGHT; 				// 현재 위치한 셀에서 우측에 위치한 셀로 포커스 이동
AccessibilityProperties.prototype.SHORT_KEY_GRID_MOVE_CELL_DOWN = cpr.events.KeyCode.DOWN; 			// 현재 위치한 셀에서 아래에 위치한 셀로 포커스 이동
AccessibilityProperties.prototype.SHORT_KEY_GRID_MOVE_PAGEUP = cpr.events.KeyCode.PAGEUP; 				// 현재 위치한 셀에서 첫번째 rowIndex 로 이동
AccessibilityProperties.prototype.SHORT_KEY_GRID_MOVE_PAGEDOWN = cpr.events.KeyCode.PAGEDOWN; 	// 현재 위치한 셀에서 마지막 rowIndex 로 이동
AccessibilityProperties.prototype.SHORT_KEY_GRID_MOVE_HOME = cpr.events.KeyCode.HOME; 					// 현재 위치한 셀에서 첫번째 cellIndex 로 이동
AccessibilityProperties.prototype.SHORT_KEY_GRID_MOVE_END = cpr.events.KeyCode.END; 							// 현재 위치한 셀에서 마지막 cellIndex 로 이동

/************************************************
 * 객체선언
 ************************************************/
globals.AccessibilityProperties = new AccessibilityProperties();