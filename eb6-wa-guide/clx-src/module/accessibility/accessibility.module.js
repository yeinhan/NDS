/************************************************
 * accessibility.module.js
 * Created at 2023. 7. 3. 오전 10:46:32.
 *
 * @author tomatosystem
 ************************************************
 * 버전				수정일자			수정내용
 * -----------------------------------------------
 * v1.0				2023. 7. 3.			최초 커밋
 * ㄴ1.1.0			2023.10.23.		accessibilityProperties.module.js 도입
 * ㄴ1.1.1			2024. 2. 2.			그리드 layout-change 이벤트 추가
 * ㄴ1.1.2			2024. 5. 29.		페이지 인덱서 tabIndex 기능 추가
 * v1.2				2024. 7.15.			app hook 을 init 이벤트 필터로 변경, makeHtmlFile 추가
 * ㄴ1.2.1			2024. 9.15.			콤보박스 Enter 키 open 에 대한 조건 추가 (readOnly, disabled 미동작)
 * v1.3				2025. 5. 22			cpr.core.DeferredUpdateManager 제거
 * ㄴ1.3.1			2025. 9. 10.		활성 다이얼로그가 2개 이상일 경우에 대한 포커스 처리
 * 												cpr.core.NotificationCenter.INSTANCE.loadmaskMap 으로 변경
 * v1.4				2025.10.14.		그리드 접근성 라벨 정리(getGridCellAriaLabel)
 * ㄴ1.4.1			2025.11.17.		그리드 키보드 포커스 시 편집모드 진입 옵션 추가
 * ㄴ1.4.2			2025.12.08.		조건부컨트롤에 대한 컨트롤 타입
 ************************************************/

/*
 * 웹 접근성 준수 및 사용자 편의성을 확장하기 위한 기능을 설정하는 공통모듈입니다.
 * 
 * 관련 스타일 클래스 및 KEY 정보를 담은 변수는 accessibilityProperties.module.js 을 통해 확인 및 수정 할 수 있습니다.
 * 또한 모듈 내에 "TODO" 라고 작성되어 있는 부분을 확인하시어 각 프로젝트에 맞도록 커스터마이징 하여 사용하시기 바랍니다.
 */
module.depends("module/extension/properties");

/************************************************
 * 멤버변수 (수정 X)
 ************************************************/
/**
 * 포커스 롤링 순서, 현재 포커스 된 영역을 기준으로 롤링합니다.
 * @type {Number}
 */
var mnRollingIdx = 0;
var mbRunAccessbiityAg = false;

/** 
 * 화면 스크린 이름
 * @type {
 *   default: String[] <!-- Default Screen Name -->,
 *   tablet: String[] <!-- Tablet Screen Name -->,
 *   mobile: String[] <!-- Mobile Screen Name -->
 * }
 */
var moScreenNames = {
	"default" : AppProperties.SCREEN_DEFAULT_NM, 
	"tablet" : AppProperties.SCREEN_TABLET_NM,
	"mobile" : AppProperties.SCREEN_MOBILE_NM
}

/************************************************
 * 앱 로드 시 웹접근성 관련 훅 추가
 ************************************************/
cpr.events.EventBus.INSTANCE.addFilter("init", function(e) {
	var voApp = e.control;
	if(voApp instanceof cpr.core.AppInstance) {
		/**
		 * ※ 센스리더 구버전 사용으로 인해 발생하는 문제 패치
		 * 
		 * ■ 현상 : (가상커서, 탭 폴더) 
		 * 			    문서 끝까지 커서 이동 후,  위 방향키(↑) 로 탐색 시, 선택된 탭 아이템의 aria-label 을 읽는 현상
		 * 
		 * ■ 원인 
		 *    - 센스리더 구버전 사용 (8.0.0.0, 2022-08-15 버전에서 재현 확인 / 8.7.0.0 버전 에서는 재현되지 않음)
		 *    - 탭 폴더 내 마지막 배치된 컨트롤이 폼레이아웃이며, separator 가 생성되어 있는 경우
		 *    - useCustomScrollbar=true 로, cl-vscrollbar 가 생성되어 있는 경우
		 * 
		 * ■ 조치
		 *    - 모든 화면의 [.cl-formlayout-vertical-separator, .cl-formlayout-horizontal-separator, .cl-vscrollbar] division 에 대해, aria-hidden=true 설정
		 */
		if(AccessibilityProperties.HIDDEN_TAB_ARIA_LABEL) {
			voApp.addEventListenerOnce("load", function () {
				cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
					
					var embEl = document.querySelector("[data-app='" + voApp.uuid + "']");
					function _setMdiAriaHidden (embEl) {
						var vSeparators = embEl.querySelectorAll(".cl-formlayout-vertical-separator:not([aria-hidden='true'])");
						var hSeparators = embEl.querySelectorAll(".cl-formlayout-horizontal-separator:not([aria-hidden='true'])");
						var vScrollbars= embEl.querySelectorAll(".cl-vscrollbar:not([aria-hidden='true'])");
						
						for(var idx = 0; idx < vSeparators.length; idx++){
							vSeparators.item(idx).setAttribute("aria-hidden", "true");
						}
						for(var idx = 0; idx < hSeparators.length; idx++){
							hSeparators.item(idx).setAttribute("aria-hidden", "true");
						}
						for(var idx = 0; idx < vScrollbars.length; idx++){
							vScrollbars.item(idx).setAttribute("aria-hidden", "true");
						}
					}
					_setMdiAriaHidden(embEl);
					
					voApp.getContainer().getAllRecursiveChildren(false).filter(function(each){
						return each instanceof cpr.controls.TabFolder;
					}).forEach(function(tabfolder){
						tabfolder.addEventListener("selection-change", function(e){
							var selection = e.newSelection;
							if(selection.content && !(selection.content instanceof cpr.controls.EmbeddedApp)) {
								setTimeout(function () {
									_setMdiAriaHidden(embEl);
								}, 100);
							}
						});
					});
				});
			});
		}
		
		var vaPageIndexerArr = []; // 페이지 인덱서 접근성 적용을 위한 Array
		
		var voAllRecursiveChildren = voApp.getContainer().getAllRecursiveChildren(false);
		voAllRecursiveChildren.forEach(function(/* cpr.controls.UIControl */ control) {
			/*
			 * ■ Target Control : 필수입력 컨트롤에 해당하는 라벨
			 * ⇒ "필수입력" 안내 음성 추가 (스크린리더 사용자 확인가능)
			 */
			AccessibilityProperties.CTRL_REQUIRED_CLS.forEach(function(reqClass){
				if(control.style.hasClass(reqClass)) {
					var voFieldLabelExp = control.getBindInfo("fieldLabel");
					if(voFieldLabelExp && voFieldLabelExp.expression) {
						control.bind("fieldLabel").toExpression("'필수입력 ' + (" + voFieldLabelExp.expression + ")");
					} else {
						control.fieldLabel = "필수입력 " + (control.fieldLabel || "");
					}
					control.userAttr("__setRequireAttr__", "true");
				} 
			});
			
			/*
			 * ■ Target Control : 버튼 (click 시 접고, 펼치는 기능이 동작할 경우)
			 * ⇒ 확장/축소 가능 클래스 적용되어 있을 경우 적용 (aria-expanded 속성 추가)
			 */
			if(control instanceof cpr.controls.Button) {
				var eachButton = control;
				AccessibilityProperties.BTN_TOGGLE_CLS.forEach(function(expandCls){
					if(eachButton.style.hasClass(expandCls)) {
						AccessibilityProperties.BTN_TOGGLE_EXPAND_CLS.forEach(function(expandCls2){
							eachButton.accessbility.bind("aria-expanded").toExpression("this.style.hasClass(\"" + expandCls2 + "\")? \"true\" : \"false\"");
						});
					}
				});
			}
			
			else if(control instanceof cpr.controls.Grid) {
				var eachGrid = control;
				
				/*
				 * ■ Target Control : 필수입력에 해당하는 헤더 셀 (그리드)
				 * ⇒ 헤더셀에 필수 스타일 클래스 적용되어 있을 경우 적용
				 */
				var vaHCellIndexs = eachGrid.header.getCellIndices();
				vaHCellIndexs.forEach(function(eachHCellIdx) {
					var voHColumn = eachGrid.header.getColumn(eachHCellIdx);
					AccessibilityProperties.CTRL_REQUIRED_CLS.forEach(function(reqCls) {
						if (voHColumn.style.hasClass(reqCls)) {
							// 2024-12-04 수정 (expression bind도 적용할 수 있도록 수정)
							var voHColFieldLabelExp = voHColumn.getBindInfo("fieldLabel");
							if(voHColFieldLabelExp && voHColFieldLabelExp.expression) {
								voHColumn.bind("fieldLabel").toExpression("'필수입력 ' + (" + voHColFieldLabelExp.expression + ")");
							} else {
								voHColumn.fieldLabel = "필수입력 " + (voHColumn.fieldLabel || "");
							}
						}
					});
				});
				
				/*
				 * ■ Target Control : 그리드 디테일 셀
				 * ⇒ 그리드의 모든 디테일 셀에 fieldLabel 설정
				 */
				cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
					// 컨트롤 접근성 관련 내용이 모두 적용된 후, 그리드 설정할 수 있도록 asnycExec 처리
					setAccessibilityGrid(eachGrid.getAppInstance(), eachGrid.id);
				});
				eachGrid.addEventListener("layout-change", function(e){
					var targetGrid = e.control;
					setAccessibilityGrid(targetGrid.getAppInstance(), targetGrid.id);
				});
			}
			
			/*
			 * ■ Target Control : 콤보박스(enabled && !readOnly)
			 * ⇒ Enter 키를 눌러 리스트를 오픈
			 */
			else if(control instanceof cpr.controls.ComboBox && AccessibilityProperties.COMBO_OPEN_BY_ENTER === true) {
				var eachCombo = control;
					if(!eachCombo.readOnly && eachCombo.enabled) {
						// 콤보박스가 readOnly 상태가 아니고, 활성상태인 경우에만 동작
						eachCombo.addEventListener("keydown", function(evt){
							if(evt.keyCode == cpr.events.KeyCode.ENTER){
								cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
									eachCombo.open();
									
									eachCombo.addEventListenerOnce("item-click", function(){
										cpr.core.DeferredUpdateManager.INSTANCE.update();
									});
								});
							}
						});
					}
				}

			/*
			 * ■ Target Control : 아웃풋(tabIndex=0)
			 * ⇒ 포커스가 가능한 아웃풋은 버튼으로 인식하도록 role 적용 및 click 이벤트 전파
			 */
			else if(control instanceof cpr.controls.Output && AccessibilityProperties.SET_FOCUSABLE_OUPTUT === true) {
				if(!ValueUtil.isNull(control.tabIndex) && control.tabIndex !="none" && control.tabIndex >= 0) {
					var eachOpt = control;
					// 클릭이 가능한 요소로 판단하여, role=button 적용
					eachOpt.accessbility.aria("role", "button");
					eachOpt.style.addClass("cursor-pointer");
					eachOpt.addEventListener("keydown", function(evt){
						if(evt.keyCode == cpr.events.KeyCode.ENTER) {
							var clickEvt = new cpr.events.CMouseEvent("click");
							eachOpt.dispatchEvent(clickEvt);
							
							if(eachOpt.getParent()) {
								eachOpt.getParent().dispatchEvent(clickEvt);
							}
						}
					});
				}
			}
			
			/*
			 * ■ Target Control : 트리
			 * ⇒ 트리 체크박스 타입에 따라 각 아이템 별 체크상태에 대한 레이블 적용
			 */
			else if (control instanceof cpr.controls.Tree && AccessibilityProperties.SET_TREE_CHECKED_LABEL === true) {
				var eachTree = control;
				if (eachTree.showItemCheckbox == true) {
					eachTree.displayExp = "sstr((checked ? \"선택\" : \"해제\")+ \" \", [\"cl-sound-only\"]) + label + \" \" + sstr((depth+"+AccessibilityProperties.SET_START_ITEM_DEPTH+")+ \"단계 트리항목 체크상자\", [\"cl-sound-only\"])";
				} else if (eachTree.showSelectionCheckbox == true) {
					eachTree.displayExp = "sstr((isSelected(getIndexByValue(value)) ? \"선택\" : \"해제\")+ \" \", [\"cl-sound-only\"]) + label + \" \" + sstr((depth+"+AccessibilityProperties.SET_START_ITEM_DEPTH+") + \"단계 트리항목 체크상자\", [\"cl-sound-only\"])";
				}
			}
			
			/*
			 * ■ Target Control : 페이지인덱서
			 * ⇒ 총 페이지가 1페이지인 경우 tabIndex=-1 설정
			 */
			else if(control instanceof cpr.controls.PageIndexer) {
				control.htmlAttr("uuid", control.uuid);
				vaPageIndexerArr.push(control); // 아래 voApp의 load 이벤트에서 처리
			}
			
			/*
			 *  ■ Target Control : 내비게이션
			 * => DOM 처리를 위한 htmlAttr 속성 추가 (AccessibilityUtil.setAccessibleMenuItem 에서 처리)
			 */
			else if (control instanceof cpr.controls.NavigationBar) {
				control.htmlAttr("uuid", control.uuid);
			}
			
			/*
			 *  ■ Target Control : 라디오버튼, 리스트박스
			 * => item-click 이벤트로 구현되어 있는 경우,
			 *      Enter 키를 눌렀을 떄 item-click 이벤트가 발생하도록 설정
			 */
			else if (control instanceof cpr.controls.RadioButton || control instanceof cpr.controls.ListBox) {
				control.addEventListener("keydown", function(e){
					if(e.keyCode == cpr.events.KeyCode.ENTER) {
						var itemClickEvt = new cpr.events.CItemEvent("item-click", {
							item: e.control.getSelectionFirst()
						});
						control.dispatchEvent(itemClickEvt);
					}
				});
			}
			
			/*
			 *  ■ Target Control : 파일인풋
			 * => fieldLabel에 value가 포함되어 있지 않은 경우 일괄 적용할 수 있도록 설정
			 */
			else if (control instanceof cpr.controls.FileInput && AccessibilityProperties.SET_FILEINPUT_LABEL === true) {
				var voFieldLabelBindInfo = control.getBindInfo("fieldLabel");
				if(voFieldLabelBindInfo && voFieldLabelBindInfo.expression) {
					control.bind("fieldLabel").toExpression("("+ voFieldLabelBindInfo.expression + ") + ' '+ value");
				} else {
					control.bind("fieldLabel").toExpression("'" + control.fieldLabel + " ' + value");	
				}
			}
		}); // end of recursiveChlidren forEach
		
		if(vaPageIndexerArr.length > 0) {
			voApp.addEventListenerOnce("load", function() {
				setPageIndexerAccessibility(vaPageIndexerArr);
			});
		}
		
		/*
		 * ■ Target Control : 다이얼로그
		 * ⇒ 스크린리더를 통해 다이얼로그 오픈 정보 피드백
		 */
		if (voApp.getHost() && voApp.getHost() instanceof cpr.controls.Dialog) {
			/** @type cpr.controls.Dialog */
			var dialog = voApp.getHost();
			
			var vcBeforeFocusedCtrl = cpr.core.Platform.INSTANCE.getFocusedControl();
			dialog.ready(function() {
				var vsAriaText = dialog.headerTitle + " 다이얼로그 페이지 열림";
				// TODO 프로젝트 별 커스터마이징 필요
				var vsDlgAppId = dialog.getEmbeddedAppInstance().app.id;
				if (AccessibilityProperties.MSG_DIALOG_APP_ID.indexOf(vsDlgAppId) == -1) {
					/*
					 * 메시지 다이얼로그(alert,confirm) 를 제외한, 일반 다이얼로그 화면일 경우
					 * 다이얼로그 오픈 음성안내 설정
					 */
					AccessibilityUtil.setActiveMsgAccessbility(voApp, vsAriaText, "polite");
				}
				
				/*
				 * 다이얼로그가 닫힌 후, 포커스 영역이 정해져 있지 않은 경우 대한 접근성 처리
				 * 
				 * <동작 우선순위>
				 * 1) 다이얼로그가 여러 개 띄워져 있는 경우, 활성 다이얼로그에 대한 포커스 부여
				 * 2) 다이얼로그가 모두 닫힌 후, 이전 포커스 컨트롤이 없는 경우
				 *     최초 포커스 가능한 컨트롤에게 포커스 부여
				 */
				dialog.addEventListenerOnce("close", function (e) {
					var voDlgAppInstance = dialog.getAppInstance();
					if(!vcBeforeFocusedCtrl) {
						cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
							var vbModalExist = AccessibilityModalUtil.isModalExist(voDlgAppInstance);
							if(vbModalExist) {
								// 활성 다이얼로그 포커스 처리
								AccessibilityModalUtil.setFocusDialog(voDlgAppInstance);
							} else {
								// 최초 영역 포커스
								function _keydown(e) {
									if (!e.shiftKey && e.keyCode == cpr.events.KeyCode.TAB) {
										voDlgAppInstance.getFirstFocusTraversableControl().focus();
										e.preventDefault();
										
										document.body.removeEventListener("keydown", _keydown);
									}
								}
								document.body.addEventListener("keydown", _keydown);
							}
						});
					}
				});
			});
		}
		
		/* 메인화면에 대한 접근성 처리 로직 */
		if (AccessibilityProperties.MAIN_APP_ID.indexOf(voApp.app.id) != -1) {
			/*
			 * ■ Target Control : 다이얼로그
			 * ⇒ window의 focus 이벤트  발생 시, 다이얼로그가 띄워져 있지만 초점이 빠져있는 경우
			 *     최상위 다이얼로그에 focus 설정
			 */
			window.addEventListener("focus", function(e) {
				if(voApp.disposed) return;
				
				_.delay(function() {
					var voDialogManager = voApp.dialogManager;
					var vsActiveDialogName = voDialogManager.getActiveDialogName();
					if (vsActiveDialogName) {
						
						var voActiveDialog = voDialogManager.getDialogByName(vsActiveDialogName);
						var vsActiveDialogAppId = voActiveDialog.getEmbeddedAppInstance().app.id;
						
						if (AccessibilityProperties.MSG_DIALOG_APP_ID.indexOf(vsActiveDialogAppId) != -1) {
							// 메시지 다이얼로그(alert, confirm) 인 경우
							var voDlgEmb = voActiveDialog.getEmbeddedAppInstance();
							
							// 메시지 다이얼로그 내 특정 컨트롤을 포커스 해야 하는 경우 아래 함수 추가
							if (voDlgEmb.hasAppMethod(AccessibilityProperties.CALL_FUNC_DIALOG_FOCUS)) {
								voDlgEmb.callAppMethod(AccessibilityProperties.CALL_FUNC_DIALOG_FOCUS); 
							} else {
								voActiveDialog.focus();
							}
						} else {
							var vcFocusCtrl = cpr.core.Platform.INSTANCE.getFocusedControl();
							if (vcFocusCtrl) {
								var vbActiveDlgFocused = _isActiveDialogApp(voActiveDialog.getEmbeddedAppInstance(), vcFocusCtrl.getAppInstance()); // 현재 최상위 다이얼로그에 포커스되어 있는지 여부
								if (vbActiveDlgFocused) return;
							}
							voActiveDialog.focus();
						}
					}
				}, 100);
			});
			
			// TODO 프로젝트별 커스터마이징 필요
			/* 메인화면 접근성 관련 단축키 설정 */
			
			// TODO 각 화면 별 이동할 컨트롤 ID를 지정하세요
			var voMainKey = {
				"app/main/Main": {
					"top" : "",
					"left" : "sngMn",
					"right" : "mdiCn",
					"bottom" : "btnTabHome"
				},
				"app/main/Main_CMS": {
					"top" : "navMn",
					"left" : "",
					"right" : "eaCn",
					"bottom" : ""
				}
			}
			
			var voTargetMainObj = voMainKey[voApp.app.id];
			document.addEventListener("keydown", function( /* cpr.events.CKeyboardEvent*/ e) {
				if(voTargetMainObj == null) return;
				
				if (e.ctrlKey == AccessibilityProperties.SHORT_KEY_USE_CTRL & e.altKey == AccessibilityProperties.SHORT_KEY_USE_ALT && e.shiftKey == AccessibilityProperties.SHORT_KEY_USE_SHIFT) {
					if (e.key.toUpperCase() ==  AccessibilityProperties.SHORT_KEY_FOCUS_TOP) {
						if (AccessibilityModalUtil.isModalExist(voApp)) return false; // modal dialog 가 띄워져 있는 경우는 단축키 사용 불가
						
						var navMn = voApp.lookup(voTargetMainObj["top"]);
						if(navMn && navMn.isShowing()) {
							mnRollingIdx = 1;
							navMn.focus();
							
							AccessibilityUtil.setActiveMsgAccessbility(voApp, "대메뉴로 이동", "polite");
						}
						
					} else if (e.key.toUpperCase() == AccessibilityProperties.SHORT_KEY_FOCUS_LEFT) {
						if (AccessibilityModalUtil.isModalExist(voApp)) return false; // modal dialog 가 띄워져 있는 경우는 단축키 사용 불가
						
						var snvMn = voApp.lookup(voTargetMainObj["left"]);
						if(snvMn && snvMn.isShowing()) {
							mnRollingIdx = 2;
							snvMn.focus();
							
							AccessibilityUtil.setActiveMsgAccessbility(voApp, "하위 메뉴로 이동", "polite");
						}
						
					} else if (e.key.toUpperCase() == AccessibilityProperties.SHORT_KEY_FOCUS_RIGHT) {
						if (AccessibilityModalUtil.isModalExist(voApp)) return false; // modal dialog 가 띄워져 있는 경우는 단축키 사용 불가
						
						var vcContent = voApp.lookup(voTargetMainObj["right"]);
						if(vcContent && vcContent.isShowing()) {
							if(vcContent instanceof cpr.controls.MDIFolder) {
								var voSelection = vcContent.getSelectedTabItem().content;
								if (voSelection instanceof cpr.controls.EmbeddedApp) {
									var voEmbApp = voSelection.getEmbeddedAppInstance();
									if (AccessibilityModalUtil.setFocusDialog(voEmbApp) == false) {
										mnRollingIdx = 3;
										voSelection.focus();
									}
								} else {
									mnRollingIdx = 3;
									voSelection.focus();
								}
							} else if(vcContent instanceof cpr.controls.EmbeddedApp) {
								mnRollingIdx = 3;
								vcContent.focus();
							}
							AccessibilityUtil.setActiveMsgAccessbility(voApp, "본문으로 이동", "polite");
						}
						
					} else if (e.key.toUpperCase() == AccessibilityProperties.SHORT_KEY_FOCUS_BOTTOM) {
						if (AccessibilityModalUtil.isModalExist(voApp)) return false; // modal dialog 가 띄워져 있는 경우는 단축키 사용 불가
						
						var vcBottomCtrl = voApp.lookup(voTargetMainObj["bottom"]);
						if(vcBottomCtrl && vcBottomCtrl.isShowing()) {
							mnRollingIdx = 4;
							vcBottomCtrl.focus();
							
							AccessibilityUtil.setActiveMsgAccessbility(voApp, "화면 하단 영역으로 이동", "polite");
						}
						
					} else if (e.key.toUpperCase() == AccessibilityProperties.SHORT_KEY_FOCUS_ROLL) {
						if (AccessibilityModalUtil.isModalExist(voApp)) return false; // modal dialog 가 띄워져 있는 경우는 단축키 사용 불가
						mnRollingIdx++;
						if (mnRollingIdx > 4) mnRollingIdx = 1;
						
						// TODO 이동할 컨트롤 focus 처리 (포커스 롤링)
						var navMn = voApp.lookup(voTargetMainObj["top"]);
						var snvMn = voApp.lookup(voTargetMainObj["left"]);
						var vcContent = voApp.lookup(voTargetMainObj["right"]);
						var vcBottomCtrl = voApp.lookup(voTargetMainObj["bottom"]);
						if(mnRollingIdx == 1 && (!navMn || !navMn.isShowing())) mnRollingIdx++;
						if(mnRollingIdx == 2 && (!snvMn || !snvMn.isShowing())) mnRollingIdx++;
						if(mnRollingIdx == 3 && (!vcContent || !vcContent.isShowing())) mnRollingIdx++;
						if(mnRollingIdx == 4 && (!vcBottomCtrl || !vcBottomCtrl.isShowing())) mnRollingIdx++;
						if (mnRollingIdx > 4) mnRollingIdx = 1;
						
						switch(mnRollingIdx){
							case 1:
								if (navMn && navMn.isShowing()) {
									navMn.focus();
									AccessibilityUtil.setActiveMsgAccessbility(voApp, "대메뉴로 이동", "polite");
								}
								break;
							case 2:
								if (snvMn && snvMn.isShowing()) {
									snvMn.focus();
									AccessibilityUtil.setActiveMsgAccessbility(voApp, "하위 메뉴로 이동", "polite");
								}
								break;
							case 3:
								if (vcContent && vcContent.isShowing()) {
									if (vcContent instanceof cpr.controls.MDIFolder) {
										var voSelection = vcContent.getSelectedTabItem().content;
										if (voSelection instanceof cpr.controls.EmbeddedApp) {
											var voEmbApp = voSelection.getEmbeddedAppInstance();
											if (AccessibilityModalUtil.setFocusDialog(voEmbApp) == false) {
												voSelection.focus();
											}
										} else {
											voSelection.focus();
										}
									} else if (vcContent instanceof cpr.controls.EmbeddedApp) {
										vcContent.focus();
									}
									
									AccessibilityUtil.setActiveMsgAccessbility(voApp, "본문으로 이동", "polite");
								}
								break;
							case 4:
								if (vcBottomCtrl && vcBottomCtrl.isShowing()) {
									vcBottomCtrl.focus();
									AccessibilityUtil.setActiveMsgAccessbility(voApp, "화면 하단 영역으로 이동", "polite");
								}
								break;
						}
					}
				}
			});
		} // end of main
		
		
		/* 내비게이션바&사이드내비게이션에 대한 접근성 처리 */
		AccessibilityUtil.setAccessibleMenuItem(voApp);
	} // end of AppInstance
	
	if (voApp instanceof cpr.controls.Dialog && AccessibilityProperties.SET_DIALOG_ARIA_HIDDEN === true) {
		/* 다이얼로그 DOM 처리를 위한 htmlAttr 속성 추가 */
		voApp.htmlAttr("uuid", voApp.uuid);
		voApp.addEventListenerOnce("load", function () {
			/*
			 * ■ Target Control : 다이얼로그(모바일)
			 * ⇒ 다이얼로그를 제외한 나머지 aria-hidden 처리
			 */
			_mobileDialogAccessibility(voApp);
		});
	}
});

/**
 * 현재 포커스되어 있는 컨트롤이 포함된 앱인스턴스가 다이얼로그에 포함되어 있는지 여부 확인
 * @param {cpr.core.AppInstance} poSourceApp 다이얼로그 앱인스턴스
 * @param {cpr.core.AppInstance} poTargetApp 현재 포커스 된 컨트롤이 위치하는 앱인스턴스
 */
function _isActiveDialogApp(poSourceApp, poTargetApp) {
	if (ValueUtil.isNull(poSourceApp) || ValueUtil.isNull(poTargetApp)) return false;
	
	return poSourceApp == poTargetApp ? true : _isActiveDialogApp(poSourceApp, poTargetApp.getHostAppInstance());
}

/**
 * 그리드에 웹 접근성 관련  기능을 적용한다.
 * 그리드의 필드라별에 특정 문구 추가와 셀과 셀 안의 컨트롤에 필드라별을 추가하여
 * 포커스 시 문구를 읽게하여 자세한 설명을 부여한다.
 * 화면이 열리면 최초 1회 자동으로 시작되며 그리드의 정보 변경(visible, delete, add column)시 해당 기능의 호출이 필요하다.
 * @param {cpr.core.AppInstance} poApp  앱 인스턴스
 * @param {#grid} psGridId 그리드 ID
 * @return void
 */
var setAccessibilityGrid = function(poApp, psGridId) {
	
	/**  @type cpr.controls.Grid  */
	var vcGrid = poApp.lookup(psGridId);
	if (vcGrid == null || !(vcGrid instanceof cpr.controls.Grid)) return;
	
	/*
	 * 그리드의 각 디테일셀의 fieldLabel 추가정보 설정
	 *    ㄴ 셀 별 헤더정보를 fieldLabel 에 추가 (스크린리더가 셀에 접근 시 헤더 정보 함께 안내)
	 *    ㄴ 셀에 컨트롤이 배치되어 있을 경우 해당 컨트롤의 fieldLabel을, 없을경우에는 컬럼의 fieldLabel 을 대상으로 한다.
	 *    ㄴ 컨트롤 or 셀에 fieldLabel 이 미작성되어 있을경우, 헤더정보를 추가하며, 작성되어 있는경우에는 작성된 fieldLabel 값을 따른다.
	 */
	var vaCellIndicesByVisible = vcGrid.getColIndicesByVisible();
	var vaDCellIndex = vcGrid.detail.getCellIndices();
	for (var vnIndex = 0; vnIndex < vaDCellIndex.length; vnIndex++) {
		var vnDCellIndex = vaDCellIndex[vnIndex];
		var vcDColumn = vcGrid.detail.getColumn(vnDCellIndex); // fieldLabel 을 설정할 detail Column
		
		// 컬럼 정보가 없거나 visible이 아닌 column은 모두 넘어간다.
		if (!vcDColumn || vaCellIndicesByVisible.indexOf(vcDColumn.colIndex) == -1) {
			continue;
		}
		
		 // fieldLabel을 설정할 타겟 컨트롤
		var vcBindControl = vcDColumn.control ? vcDColumn.control : vcDColumn;

		var vaHCellIndex = vcGrid.getHeaderCellIndices(vnDCellIndex);
		var vsFieldLabel = "";
		
		// 해더가 2줄일 경우 모든 택스트를 조합한다
		vaHCellIndex.forEach(function(pnHCellIndex, checkDup) {
			// 2번째 줄 부터 / 로 내용을 구분한다.
			if (checkDup > 0) {
				vsFieldLabel += "/";
			}
			
			var vcHColumn = vcGrid.header.getColumn(pnHCellIndex);
			var vsCellText = vcHColumn.getText() || "";
			
			if(vcHColumn.columnType == "checkbox" || vcHColumn.control) {
				if(vcHColumn.control) {
					vsCellText = vcHColumn.control.fieldLabel ? vcHColumn.control.fieldLabel : (vcHColumn.fieldLabel || "");
				} else {
					vsCellText = vcHColumn.fieldLabel || "";
				}	
			}
			
			// 헤더셀의 컨트롤이 있는경우 헤더셀의 컨트롤에서 text를 가져온다.
			if (vcHColumn.control) {
				if (vcHColumn.control.text) {
					vsFieldLabel += vcHColumn.control.text;
				} else {
					vsFieldLabel += vsCellText;
				}
			} else {
				vsFieldLabel += vsCellText;
			}
		});
		// 해더셀에 줄바꿈 이 있는경우 해당 부분은 fieldLabel에 필요없으며 해당 저리를 expression으로 모두 제거한다
		vsFieldLabel = vsFieldLabel.replace(/\n/g, " ").replace(/\r/g, "");
		
		// 익스프레션 바인딩에 추가할 선행 표현식
		var vsFirstTextExpr = "''";
		if(AccessibilityProperties.SET_GRID_LAST_CELL_INFO === true) {
			// 마지막 열/셀에 대한 정보 제공
			vsFirstTextExpr = "(isLastCell() ? '마지막 열 ' : '' ) + (isLastRow() ? '마지막 행 ' : '')";
		}
		
		// 익스프레션 바인딩에 추가할 마지막 표현식
		var vsLastTextExpr = "''";
		
		var vbUserSetLabel = vcBindControl.fieldLabel;
		if(("userAttr" in vcBindControl) && vcBindControl.userAttr("__setRequireAttr__") == "true") {
			var voFieldLabelBindInfo = vcBindControl.getBindInfo("fieldLabel");
			if (voFieldLabelBindInfo && voFieldLabelBindInfo.type == "expression") {
				var expr = new cpr.expression.Expression(voFieldLabelBindInfo.expression);
				var result = expr.evaluate();
				if(result.toString().trim() == "필수입력") {
					// 사용자가 직접 fieldLabel 을 입력하지 않았으나, 공통에서 [필수입력] 을 적용한 경우
					vsFirstTextExpr += " + " +  voFieldLabelBindInfo.expression.replace(/\n/g, " ").replace(/\r/g, "").replace(/\'/g, "");
					vbUserSetLabel = false;
				}
			}
		}

		try {
			if (!vbUserSetLabel) {
				// 대상 컨트롤에 fieldLabel이 없는 경우
				vcBindControl.bind("fieldLabel").toExpression("ariaLabel(getGridCellAriaLabel(this.grid, cellIndex, rowIndex, " + vsFirstTextExpr + " + '" + vsFieldLabel + "' + " + vsLastTextExpr + "))");
			} else {
				// 대상 컨트롤에 fieldLabel이 있는 경우
				var voFieldLabelBindInfo = vcBindControl.getBindInfo("fieldLabel");
				
				if (!voFieldLabelBindInfo) {
					// 바인딩이 없는 경우 expression 바인딩을 진행
					vcBindControl.bind("fieldLabel").toExpression("ariaLabel(getGridCellAriaLabel(this.grid, cellIndex, rowIndex, " + vsFirstTextExpr + " + '" + vcBindControl.fieldLabel.replace(/\n/g, " ").replace(/\r/g, "") + "' + " + vsLastTextExpr + "))");
					
				} else {
					if (voFieldLabelBindInfo.type == "expression") {
						// 익스프레션 바인딩 인 경우 → 익스프레션 바인딩 + role 이 나오도록 수정,
						if (voFieldLabelBindInfo.expression.indexOf(vsFirstTextExpr) == -1) {
							vcBindControl.bind("fieldLabel").toExpression("ariaLabel(getGridCellAriaLabel(this.grid, cellIndex, rowIndex, " + vsFirstTextExpr + " + " + voFieldLabelBindInfo.expression.replace(/\n/g, " ").replace(/\r/g, "") + " + " + vsLastTextExpr + "))");
						}
					} else {
						// TODO 데이터 셋, 데이터 맵, 상대컬럼, 앱 속성, 다국어 바인딩에 대한 경우는 추가설정 필요
					}
				}
			}
		} catch (error){
			console.warn(error);
		}
	}
}


cpr.expression.ExpressionEngine.INSTANCE.registerFunction("getGridCellAriaLabel", function(/* cpr.controls.Grid */ grid, cellIndex, rowIndex, fieldLabel) {
	var results = [];
	
	/*
	 * 2024-12-04 수정사항
	 * - 컨트롤 자체에서 제공하는 내용으로, 내용이 중복하여 읽는 경우에 대해 주석처리
	 * - cellText 는 편집모드는 버튼만, 읽기모드는 모든 컨트롤에 대해 적용
	 * - 체크박스 컨트롤의 선택/해제 여부는 읽기모드일 경우에만 적용
	 * - 버튼의 ariaButtonType 은 읽기모드일 경우에만 적용
	 * - 각 컨트롤 별 readOnly=true일 경우 "읽기전용" 텍스트 추가
	 */
	
	try {
		if (!grid || !(grid instanceof cpr.controls.Grid)) return "";
		
		var column = grid.detail.getColumn(cellIndex);
		if (!column) return "";
		
		var control = (column.control) ? column.control : null;
		var controlType = (control) ? control.type : null;
	
		// rowState
		if(AccessibilityProperties.SET_GRID_ROW_STATE_INFO === true) {
			var rowState = grid.getRowState(rowIndex);
			switch(rowState){
				case cpr.data.tabledata.RowState.INSERTED :
					results[results.length] = "신규행";
					break;
				case cpr.data.tabledata.RowState.DELETED :
					results[results.length] = "삭제행";
					break;
				case cpr.data.tabledata.RowState.UPDATED :
					results[results.length] = "수정행";
					break;
			}
		}
		
		// cellPosition
		results[results.length] = (rowIndex+1) + cpr.I18N.INSTANCE.message(cpr.core.PlatformTerms.ROW);
		
		// fieldLabel
		results[results.length] = fieldLabel;
		
		/**
		 * 컨트롤 타입 별 필드라벨 선언
		 */
		function _setControlType (pcCtrl) {
			if(pcCtrl == null) return;
			
			var vsCtrlType = pcCtrl.type;
			if (vsCtrlType == "checkboxgroup" || vsCtrlType == "radiobutton") {
				if (grid.readOnly) results[results.length] = "읽기전용"; // 2024-12-04 읽기전용 텍스트 적용
				pcCtrl.getItems().forEach(function(item) {
					if (pcCtrl.getSelection().indexOf(item) != -1) {
						results[results.length] = "선택";
					} else {
						results[results.length] = "해제";
					}
					results[results.length] = item.label;
//					results[results.length] = vsCtrlType == "checkboxgroup" ? "체크상자" : "라디오버튼"; // 2024-12-04 주석처리
				});
			} else if (vsCtrlType == "checkbox") {
				if (grid.readOnly) results[results.length] = "읽기전용"; // 2024-12-04 읽기전용 텍스트 적용
				if (!grid.isEditing()) results[results.length] = pcCtrl.checked ? "선택" : "해제"; // 2024-12-04 읽기모드일 경우에만 적용
				results[results.length] = pcCtrl.text;
				if (!grid.isEditing()) {
					results[results.length] = "체크상자";
				}
			} else if (pcCtrl instanceof cpr.controls.Image) {
				var voImageAltBindInfo = pcCtrl.getBindInfo("alt"); // 이미지 컨트롤의 alt 속성에 바인딩된 컬럼의 값을 results에 포함하도록 처리.
				if (voImageAltBindInfo && voImageAltBindInfo.type == "datacolumn") {
					results[results.length] = grid.dataSet.getValue(rowIndex, voImageAltBindInfo.columnName);
				} else {
					results[results.length] = pcCtrl.alt;
				}
			} else if (pcCtrl instanceof cpr.controls.UDCBase) {
				results[results.length] = pcCtrl.hasAppMethod("getText") ? pcCtrl.getText() : grid.getCellText(rowIndex, cellIndex);
			} else {
//				results[results.length] = grid.getCellText(rowIndex, cellIndex); // 2024-12-04 주석처리
				
				if (!grid.isEditing()) {
					results[results.length] = grid.getCellText(rowIndex, cellIndex); // 2024-12-04 읽기모드일 경우에만 cellText 추가
					
					var isReadOnly = false;
					if (pcCtrl) {
						var voCtrlEnabledBindInfo2 = pcCtrl.getBindInfo("readOnly");
						if (voCtrlEnabledBindInfo2 && voCtrlEnabledBindInfo2.type == "expression") {
							var expr2 = new cpr.expression.Expression(voCtrlEnabledBindInfo2.expression);
							var row2 = grid.getRow(rowIndex);
							var vsEnabledResult2 = expr2.evaluate(row2);
							if (!vsEnabledResult2) {
								isReadOnly = true;
							}
						} else if (pcCtrl.readOnly) {
							isReadOnly = true;
						}
					}
					
					if (vsCtrlType == "inputbox" ||
						vsCtrlType == "numbereditor" ||
						vsCtrlType == "dateinput" ||
						vsCtrlType == "maskeditor" ||
						vsCtrlType == "searchinput" ||
						vsCtrlType == "textarea") {
						if (isReadOnly) results[results.length] = "읽기전용"; // 2024-12-04 읽기전용 텍스트 적용
						results[results.length] = "편집창";
					} else if (vsCtrlType == "combobox") {
						if (isReadOnly) results[results.length] = "읽기전용"; // 2024-12-04 읽기전용 텍스트 적용
						results[results.length] = "콤보상자";
					} else if (vsCtrlType == "treecell") {
						if (isReadOnly) results[results.length] = "읽기전용"; // 2024-12-04 읽기전용 텍스트 적용
						results[results.length] = "트리셀";
					} else if (vsCtrlType == "fileinput") {
						if (isReadOnly) results[results.length] = "읽기전용"; // 2024-12-04 읽기전용 텍스트 적용
						results[results.length] = "파일 선택";
					}
				} else {
					// 편집모드
					if (vsCtrlType == "button" || (vsCtrlType == "output" && pcCtrl.accessbility.aria("role") == "button")) {
						results[results.length] = grid.getCellText(rowIndex, cellIndex); // 2024-12-04 편집모드일 경우 버튼 컨트롤의 cellText 추가(나머지는 컨트롤 자체에서 제공)
					}
				}
			}
		}
	
		// text(value)
		if (column.columnType == "checkbox") {
//			results[results.length] = grid.getCellText(rowIndex, cellIndex) == "Y" ? "선택" : "해제"; // 2024-12-04 주석처리
		} else if (column.columnType == "radio") {
//			results[results.length] = grid.getCellText(rowIndex, cellIndex) == "Y" ? "선택" : "해제"; // 2024-12-04 주석처리
		} else {
			_setControlType(control);
		}
		
		/**
		 * 컨트롤 타입 별 필드라벨 작성 후, 컨트롤 상태에 대한 내용 작성
		 */
		function _setControlAfterInfo (pcCtrl, pbConditional) {
			if(pcCtrl == null) return;
			var vsCtrlType = pcCtrl.type;
			
			// role(link, button) 정보
			function _fnSetDisabled () {
				var voCtrlEnabledBindInfo = pcCtrl.getBindInfo("enabled");
				if (voCtrlEnabledBindInfo && voCtrlEnabledBindInfo.type == "expression") {
					var expr = new cpr.expression.Expression(voCtrlEnabledBindInfo.expression);
					var row = grid.getRow(rowIndex);
					var vsEnabledResult = expr.evaluate(row);
					if (!vsEnabledResult) {
						results[results.length] = "사용불가";
					}
				} else if (!pcCtrl.enabled) {
					results[results.length] = "사용불가";
				}
			}
			
			function _fnSetBtnInfo () {
				// 2024-12-04 읽기모드일 경우에만 버튼의 ariaButtonType 을 results 에 추가(편집모드는 컨트롤 자체에서 제공함)
				if (pcCtrl.accessbility.aria("role") == "link") {
					results[results.length] = "link";
				} else if (vsCtrlType == "button" || vsCtrlType == "output") {
					if (pcCtrl.accessbility.aria("role") == "link") {
						results[results.length] = "link";
					} else if (pcCtrl.accessbility.aria("role") == "button") {
						results[results.length] = "button";
					}
				}
			}
			
			if(pbConditional == true) {
				/*
				 * 조건부 컨트롤일 경우,
				 * 조건부 컨트롤은 접근성 기능을 미제공하므로, 편집모드 여부와 관계없이 모든 값을 적용한다.
				 */
				_fnSetBtnInfo();
				_fnSetDisabled();
			} else {
				if (grid.isEditing()) {
					_fnSetDisabled();
				} else {
					_fnSetBtnInfo();
				}
			}
		}
		_setControlAfterInfo(control);
		
		// 조건부 컨트롤에 대한 접근성 라벨 적용
		if(AccessibilityProperties.SET_DYNAMIC_CONTROL_LABEL === true) {
			if(ValueUtil.isNull(controlType) && !ValueUtil.isNull(column.cellProp.configuration.factory)) {
				var voCellConfiguration =column.cellProp.configuration; 
				
				var voFactory = voCellConfiguration.factory;
				var factoryKeys = Object.keys(voFactory);
				
				var vsConditionExp = voCellConfiguration.controlConditionExp;
				var exp = new cpr.expression.Expression(vsConditionExp);
				var targetRow = grid.getRow(rowIndex);
				var key = exp.evaluate(targetRow);
				
				if(!ValueUtil.isNull(voFactory[key])) {
					_setControlType(voFactory[key]);
					_setControlAfterInfo(voFactory[key], true);
				}
			}
		}
	} catch (error) {
		console.warn(error);
	}

	return results.join(" ");
});


/************************************************
 * 이벤트 필터 (keydown)
 ************************************************/
function _getHostAppInstance(poApp) {
	if (poApp.isUDCInstance()) {
		return _getHostAppInstance(poApp.getHostAppInstance());
	} else {
		return poApp;
	}
}

cpr.events.EventBus.INSTANCE.addFilter("keydown", function( /* cpr.events.CKeyboardEvent */ e) {
	var control = e.control;
	
	if (ValueUtil.isNull(control) || !(control instanceof cpr.controls.UIControl)) return;
	
	// 로드마스크 동작 시 키보드 동작 방지
	var voHostAppInstance = _getHostAppInstance(e.control.getAppInstance());
	if (cpr.core.NotificationCenter.INSTANCE.loadmaskMap && cpr.core.NotificationCenter.INSTANCE.loadmaskMap[voHostAppInstance.id]) {
		e.preventDefault();
		return false;
	}
	
	/*
	 * FIXME 로드마스크 동작 시 키보드 동작 방지 관련
	 * common.module.js 에서 제공하는 로드마스크가 cpr.core.NotificationCenter.INSTANCE.load 로 관리되는 경우
	 * 위 조건문을 주석처리하고, 아래 주석을 해제하여 사용하십시오.
	 */
	/*
	 * if (cpr.core.NotificationCenter.INSTANCE.loadmask) {
	 * 	e.preventDefault();
	 * 	return false;
	 * }
	 */

	// 그리드에서 Space 키를 눌렀을 경우, cell-click 이벤트 발생 (뷰잉/편집모드와 상관없이 이벤트 발생)
	if (control instanceof cpr.controls.Grid || (control.getParent() && control.getParent() instanceof cpr.controls.Grid)) {
		/** @type cpr.controls.Grid */
		var vcGrid = control.type == "grid" ? control : ((control.getParent() && control.getParent().type == "grid") ? control.getParent() : "");
		if (ValueUtil.isNull(vcGrid)) return;
		
		if (e.keyCode == cpr.events.KeyCode.SPACE) {

			//체크박스,라디오 특수컬럼에서 cell-click 이벤트가 동작하지 않도록 설정
			if (!ValueUtil.isNull(e.targetObject) && !ValueUtil.isNull(e.targetObject.cellIndex)) {
				var voDColumn = vcGrid.detail.getColumn(e.targetObject.cellIndex);
				if (voDColumn.columnType == "checkbox" || voDColumn.columnType == "radio") {
					return;
				}
			}
			
			if (vcGrid.isEditing()) {
				// 편집모드일 경우, space 키에 대한 기본동작이 있는 컨트롤에 대해서는 cell-click 이벤트 동작하지 않도록 설정
				// 인풋박스, 넘버에디터, 데이트인풋, 텍스트에리어, 마스크에디터, 서치인풋, 콤보박스, 버튼, 라디오버튼, 체크박스, 체크박스그룹
				if (control instanceof cpr.controls.InputBox || control instanceof cpr.controls.NumberEditor || control instanceof cpr.controls.DateInput ||
					control instanceof cpr.controls.TextArea || control instanceof cpr.controls.MaskEditor || control instanceof cpr.controls.SearchInput ||
					control instanceof cpr.controls.ComboBox || control instanceof cpr.controls.Button || control instanceof cpr.controls.RadioButton ||
					control instanceof cpr.controls.CheckBoxGroup || control instanceof cpr.controls.CheckBox) {
					e.stopPropagation();
					return;
				}
			}
			
			var voTargetObj = e.targetObject;
			if (ValueUtil.isNull(voTargetObj)) return;
			
			var options = {
				relativeTargetName: "detail",
				row: voTargetObj.row,
				rowIndex: voTargetObj.rowIndex,
				cellIndex: voTargetObj.cellIndex,
				columnName: voTargetObj.columnName,
				cellBoundingRect: vcGrid.getCellBounds("detail", voTargetObj.rowIndex, voTargetObj.cellIndex)
			}
			var cellClickEvt = new cpr.events.CGridMouseEvent(cpr.events.GridEventType.CELL_CLICK, options);
			vcGrid.dispatchEvent(cellClickEvt);
		}
	}
	
	/* 그리드 관련 단축키 설정 */
	if (control instanceof cpr.controls.Grid) {
		var vcGrid = control;
		
		if (e.ctrlKey == AccessibilityProperties.SHORT_KEY_USE_CTRL && 
			e.altKey == AccessibilityProperties.SHORT_KEY_USE_ALT && 
			e.shiftKey == AccessibilityProperties.SHORT_KEY_USE_SHIFT) {
				
			var voTargetObject = e.targetObject;
			
			// 1) 그리드 이전/후 컨트롤으로 포커스 이동
			if (e.key.toUpperCase() == AccessibilityProperties.SHORT_KEY_FOCUS_GRID_PREV) {
				vcGrid.focusPrevious();
				return false;
			} else if (e.key.toUpperCase() == AccessibilityProperties.SHORT_KEY_FOCUS_GRID_NEXT) {
				vcGrid.focusNext();
				return false;
			}
			
			// 2) 현재 포커스된 셀의 위치 정보 음성 안내
			else if (e.key.toUpperCase() == AccessibilityProperties.SHORT_KEY_GRID_CELL_INFO) {
				if (voTargetObject) {
					var vnRowIndex = voTargetObject.rowIndex;
					var vnCellIndex = voTargetObject.cellIndex;
					
					var columnLayout = vcGrid.getColumnLayout(true);
					var vnRealTotalCellIndex = 0; // 숨김처리된 컬럼 제외한 전체 cellindex
					var vnRealcellIndex = -1; // 숨김처리된 컬럼 제외 현재 컬럼의 cellindex
					columnLayout.columnLayout.forEach(function(each, idx) {
						if (each.visible && idx <= vnCellIndex) {
							vnRealcellIndex++;
						}
					});
					vnRealTotalCellIndex = columnLayout.columnLayout.filter(function(each) {
						return each.visible;
					}).length;
					
					var vsCellInfoTxt = cpr.utils.Util.template("셀 영역 총 ${totlRowIndex}행 중 ${rowIndex}행, 총 ${totalCellIndex}열 중 ${cellIndex}열${header} ${value}", {
						totlRowIndex: vcGrid.getRowCount(),
						rowIndex: vnRowIndex + 1,
						totalCellIndex: vnRealTotalCellIndex,
						cellIndex: vnRealcellIndex,
						header: _getColumnText(vcGrid, vnCellIndex, "/"),
						value: vcGrid.getCellText(vnRowIndex, vnCellIndex),
					});
					AccessibilityUtil.setActiveMsgAccessbility(vcGrid.getAppInstance(), vsCellInfoTxt);
				}
			}
			
			// 3) 현재 위치에서 그리드의 첫 행/마지막 행으로 이동 (스크롤이 존재하는 그리드일 경우 가장 처음과 마지막 셀로 이동하기 위함)
			if (e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_PAGEUP) {
				if (voTargetObject) {
					var vnCellIndex = voTargetObject.cellIndex;
					if (vnCellIndex < 0 || vnCellIndex == undefined || vnCellIndex == null) {
						vnCellIndex = 0;
					}
					vcGrid.focusCell(0, vnCellIndex);
					return false;
				}
			} else if (e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_PAGEDOWN) {
				if (voTargetObject) {
					var vnCellIndex = voTargetObject.cellIndex;
					if (vnCellIndex < 0 || vnCellIndex == undefined || vnCellIndex == null) {
						vnCellIndex = 0;
					}
					vcGrid.focusCell(vcGrid.getRowCount()-1, vnCellIndex);
					return false;
				}
			}
			
			// 4) 그리드 셀 이동
			if (e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_HOME ||
				e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_END ||
				e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_CELL_UP ||
				e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_CELL_DOWN ||
				e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_CELL_LEFT ||
				e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_CELL_RIGHT) {
					
				var vnRowIndex = 0;
				var vnCellIndex = 0;
				var vnCellPosition = 0;
				
				var vaDCellIndices = vcGrid.detail.getCellIndices();
				var vaVisibleColIndices = vcGrid.getColIndicesByVisible(true);
				var vaVisibleCells = [];
				
				if (voTargetObject == null || voTargetObject.relativeTargetName == null) {
					vcGrid.focusCell(0, 0);
				} else {
					vnRowIndex = voTargetObject.rowIndex;
					vnCellIndex = voTargetObject.cellIndex;
					
					vaDCellIndices.forEach(function(eachIdx) {
						
						var voDColumn = vcGrid.detail.getColumn(eachIdx);
						var vnColIndex = voDColumn.colIndex;
						
						var vaVisibleTargetCol = vaVisibleColIndices.filter(function(each) {
							return each == vnColIndex;
						});
						
						if (vaVisibleTargetCol != null && vaVisibleTargetCol.length > 0) {
							// 해당 colIndex 가 visible=true 인 경우
							if (vnCellIndex == eachIdx) vnCellPosition = vaVisibleCells.length;
							vaVisibleCells.push(eachIdx);
						}
					});
					
					if (e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_CELL_UP) {
						vnRowIndex--;
					} else if (e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_CELL_DOWN) {
						vnRowIndex++;
					} else if (e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_CELL_LEFT) {
						vnCellPosition--;
					} else if (e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_CELL_RIGHT) {
						vnCellPosition++;
					} 
					
					if (e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_HOME) {
						vcGrid.focusCell(vnRowIndex, vaVisibleCells[0]);
						return false;
					} else if (e.keyCode == AccessibilityProperties.SHORT_KEY_GRID_MOVE_END) {
						vcGrid.focusCell(vnRowIndex, vaVisibleCells[vaVisibleCells.length - 1]);
						return false;
					} else {
						_setFocusCell(vcGrid, vnRowIndex, vnCellPosition, vaVisibleCells);
						return false;
					}
					
				}
			}
		} // end of 특수키(ctrl, alt, shift)
	} // end of Grid 
});

/**
 * 디테일 컬럼에 해당하는 헤더 텍스트 반환<br/>
 * 헤더가 1행 이상일 경우, 구분자로 연결하여 반환한다.
 * @param {cpr.controls.Grid} pcGrid 그리드 컨트롤
 * @param {Number} pnCellIndex 디테일 컬럼 cellindex
 * @param {String} psDelimiter 구분자
 * @return {String} 헤더 텍스트
 */
function _getColumnText(pcGrid, pnCellIndex, psDelimiter) {
	var headerCell = pcGrid.getHeaderCellIndices(pnCellIndex);
	
	var vsResult = "";
	if (headerCell.length > 0) {
		headerCell.forEach(function(each) {
			var colNm = pcGrid.header.getColumn(each);
			vsResult += (colNm.text || "") + psDelimiter;
		});
		
		if (vsResult != "") {
			vsResult = vsResult.substr(0, vsResult.length - psDelimiter.length);
		}
	}
	
	return vsResult;
}

/**
 * 그리드의 셀의 이동 
 * 그리드의 이동 로직 구현 
 * @param {cpr.controls.Grid} pcGrid
 * @param {Number} pnRowIndex rowindex
 * @param {Number} pnCellIndex cellindex
 * @param {Number[]} paVisibleCells visible=true인 셀정보 
 */
function _setFocusCell(pcGrid, pnRowIndex, pnCellIndex, paVisibleCells) {
	
	if (!(pcGrid instanceof cpr.controls.Grid)) return;
	
	var vnCellCount =  paVisibleCells.length;
	var vnRowCount = pcGrid.getRowCount();
	
	var vnRowIndex = pnRowIndex;
	var vnCellIndex = pnCellIndex;
	
	if (vnCellCount <= pnCellIndex) {
		vnCellIndex = 0;
		vnRowIndex = vnRowIndex + 1;
	} else if (vnCellIndex < 0 && vnRowIndex > 0) {
		vnRowIndex = vnRowIndex - 1;
		vnCellIndex = vnCellCount - 1;
	} else if (vnCellIndex < 0) {
		vnCellIndex = 0;
	}
	
	if (pnRowIndex < 0) {
		vnRowIndex = 0;
	} else if (vnRowCount <= pnRowIndex) {
		vnRowIndex = vnRowCount;
	}
	
	pcGrid.focusCell(vnRowIndex, paVisibleCells[vnCellIndex]);
}


/************************************************
 * 이벤트 필터 (그리드 관련)
 ************************************************/
/**
 * 그리드로 초점이 이동한 경우, 음성안내
 */
cpr.events.EventBus.INSTANCE.addFilter("focus", function(e) {
	var version = cpr.core.Platform.INSTANCE.getVersion();
	var minorVersion = Number(version.split(".")[2]);
	if (isNaN(minorVersion)) {
		console.warn("버전을 확인 할 수 없습니다.");
	}
	if (minorVersion <= 4496) return;
	
	/** @type cpr.controls.UIControl */
	var vcFocusCtrl = e.control;
	var voFocusApp = vcFocusCtrl.getAppInstance();
	var voRootApp = voFocusApp.getRootAppInstance();
	
	// 그리드가 포커스 된 경우
	if (vcFocusCtrl instanceof cpr.controls.Grid) {
		
		// 키보드로 그리드 포커스 시 편집모드로 바로 진입할 수 있는 옵션 추가
		if(AccessibilityProperties.SET_FOCUS_GRID_EDIT_MODE === true) {
			var vnSelectedRowIndex = vcFocusCtrl.getSelectedRowIndex();
			if(vnSelectedRowIndex == -1) vnSelectedRowIndex = 0;
			vcFocusCtrl.setEditRowIndex(vnSelectedRowIndex);
		}
		
		var vbEditing = vcFocusCtrl.isEditing();
		var vsGridMode = vbEditing ? "편집모드" : "읽기모드" ;
		AccessibilityUtil.setActiveMsgAccessbility(voRootApp, vcFocusCtrl.fieldLabel  +" 그리드 시작 " + vsGridMode , "polite");
	}
	
	/*
	 * [메인 관련]
	 * 다이얼로그가 오픈되어 있는 상태에서, 스크린리더의 가상커서가 다이얼로그 밖으로 튀는 경우 발생 시
	 * 다이얼로그를 다시 포커스 할 수 있는 포인트 생성
	 */
	if(AccessibilityProperties.CREATE_FOCUS_POINT_TO_DIALOG === true && vcFocusCtrl instanceof cpr.controls.NavigationBar) {
		AccessibilityModalUtil.setFocusDialog(voFocusApp);
	}
});

/**
 * 그리드에서 초점이 밖으로 빠진 경우, 음성안내
 */
cpr.events.EventBus.INSTANCE.addFilter("blur", function(e) {
	/** @type cpr.controls.Grid */
	var vcGrid = e.control;
	if (!(vcGrid instanceof cpr.controls.Grid)) return;
	
	var version = cpr.core.Platform.INSTANCE.getVersion();
	var minorVersion = Number(version.split(".")[2]);
	if (isNaN(minorVersion)) {
		console.warn("버전을 확인 할 수 없습니다.");
	}
	if (minorVersion <= 4496) return;
	
	//그리드에서 포커스가 종료되었을 경우 
	var voRootApp = vcGrid.getAppInstance().getRootAppInstance();
	AccessibilityUtil.setActiveMsgAccessbility(voRootApp, vcGrid.fieldLabel + " 그리드 종료", "polite");
});

/**
 * 그리드에서 뷰잉모드/편집모드 전환에 대한 정보를 음성안내
 */
cpr.events.EventBus.INSTANCE.addFilter("before-editrow-change", function(e) {
	 
	 /** @type cpr.controls.Grid */
	 var vcGrid = e.control;
	 
	 if (!(vcGrid instanceof cpr.controls.Grid)) return;
	 
	 var voApp = vcGrid.getAppInstance();
	 var voNewObj = e.newSelection;
	 var voOldObj = e.oldSelection;
	 
	 if (voNewObj == null && voOldObj != null) {
	 	AccessibilityUtil.setActiveMsgAccessbility(voApp, " 읽기모드", "polite");
	 } else if (voNewObj != null && voOldObj == null) {
	 	AccessibilityUtil.setActiveMsgAccessbility(voApp, " 편집모드", "polite");
	 }
});


/************************************************
 * 이벤트 필터 (메인화면 관련)
 ************************************************/
/**
 * 페이지인덱서가 한 페이지일 경우, tabindex=-1 설정
 * (이미 선택되어 있는 인덱스는 포커스가 가지 않기때문)
 * @param {cpr.controls.PageIndexer[]} paPageIdx
 */
function setPageIndexerAccessibility (paPageIdx) {
	if (!Array.isArray((paPageIdx))) {
		paPageIdx = [paPageIdx];
	}
	
	paPageIdx.forEach(function(pcPageIndexer){
		if (pcPageIndexer.lastPageIndex == 1) {
			pcPageIndexer.tabIndex = -1;
		}
		
		var elPage = document.querySelector("[data-usr-uuid='" + pcPageIndexer.htmlAttr("uuid") + "']");
		if (elPage) {
			var pgiArea = elPage.querySelector(".cl-pageindexer-index-area");
			if (pgiArea) {
				var observer = new MutationObserver(function(mutations) {
					if (pcPageIndexer.lastPageIndex == 1) {
						pcPageIndexer.tabIndex = -1;
					} else {
						pcPageIndexer.tabIndex = 0;
					}
				});
				observer.observe(pgiArea, {
					childList: true
				});
			}
		}
	});
}

/**
 * MDI 폴더에 화면을 오픈 하는 경우
 * 화면을 오픈했다는 음성안내 제공
 */
cpr.events.EventBus.INSTANCE.addFilter("content-init", function(e) {
	/** @type cpr.controls.MDIFolder */
	var control = e.control;
	var voApp = control.getAppInstance();
	
	if (!(control instanceof cpr.controls.MDIFolder)) return;
	
	/** @type cpr.controls.TabItem */
	var voItem = e.content;
	var vsTitle = voItem.text;
	AccessibilityUtil.setActiveMsgAccessbility(voApp, vsTitle + " 화면 열림");
});

/**
 * MDI폴더에서 열린 화면을 전환하는 경우
 * 선택한 화면정보에 대한 음성안내 제공
 */
cpr.events.EventBus.INSTANCE.addFilter("selection-change", function(e) {
	/** @type cpr.controls.MDIFolder */
	var control = e.control;
	var voApp = control.getAppInstance();
	
	if (!(control instanceof cpr.controls.MDIFolder)) return;
	
	var voNewSelect = e.newSelection;
	if (voNewSelect == null || voNewSelect == undefined) return;
	
	/** @type cpr.controls.TabItem */
	var voItem = voNewSelect.content;
	if (voItem == null || voItem == undefined) return;
	
	var vsTitle = voNewSelect.text;
	AccessibilityUtil.setActiveMsgAccessbility(voApp, vsTitle + " 화면 선택");
});

/**
 * MDI폴더에서 화면을 닫는 경우
 * 닫힌 화면에 대한 정보 음성안내 제공
 */
cpr.events.EventBus.INSTANCE.addFilter("close", function(e) {
	/** @type cpr.controls.MDIFolder */
	var control = e.control;
	
	if (!(control instanceof cpr.controls.MDIFolder)) return;
	
	var voApp = control.getAppInstance();
	
	/** @type cpr.controls.TabItem */
	var voItem = e.content;
	var vsTitle = voItem.text;
	AccessibilityUtil.setActiveMsgAccessbility(voApp, vsTitle + " 화면 닫힘");
});


/************************************************
 * 웹접근성 관련 유틸
 ************************************************/
/**
 * 웹 접근성 다이얼로그 관련 유틸
 */
AccessibilityModalUtil = {
	/**
	 * 모달 다이얼로그가 존재하는지 여부를 반환한다.
	 * @param {cpr.core.AppInstance} poApp
	 * @return {Boolean}
	 */
	isModalExist: function(poApp) {
		if (poApp == null) return false;
		
		var voDialogManager = poApp.dialogManager;
		var vaDialogNames = voDialogManager.getDialogNames();
		
		var voDialogModals = vaDialogNames.filter(function(each) {
			var voDialogTemp = voDialogManager.getDialogByName(each);
			return voDialogTemp.modal;
		});
		if (voDialogModals.length > 0) {
			return true;
		}
		return false;
	},
	/**
	 * 모달 다이얼로그 존재할 경우, 활성화 되어있는 다이얼로그를 포커스 한다.
	 * @param {cpr.core.AppInstance} poApp
	 */
	setFocusDialog: function(poApp) {
		if (poApp == null) return false;
		
		var voDialogManager = poApp.dialogManager;
		var vsActiveDialogName = voDialogManager.getActiveDialogName();
		
		if(vsActiveDialogName != null && vsActiveDialogName != "" && vsActiveDialogName !=undefined) {
			var voActiveDialog = voDialogManager.getDialogByName(vsActiveDialogName);
			if (AccessibilityModalUtil.isModalExist(poApp)) {
				cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
					voActiveDialog.focus();
					return true;
				});
			}
		}
		return false;
	}
}

/** 
 * 웹 접근성 관련 유틸
 *    ㄴ aria-live
 *    ㄴ role 관련
 */
AccessibilityUtil = {
	/**
	 * 스크린리더가 실시간으로 메시지를 읽습니다.
	 * @param {cpr.core.AppInstance} poApp 앱 인스턴스
	 * @param {String} psMsg 메시지
	 * @param {"assertive" | "polite"} psAriaLive aria-live 속성값<br/>
	 * - polite : 중요도가 낮은 내용에 사용하여 현재 진행중인 음성 또는 타이핑을 방해하지 않고 뒤늦게 전달합니다. <br/>
	 * - assertive(default) : 중요도가 높은 내용에 사용하여 현재 진행중인 보조기기 작업을 중단하고 내용을 즉시 사용자에게 전달합니다. 
	 */
	setActiveMsgAccessbility: function(poApp, psMsg, psAriaLive) {
		if (poApp == null || poApp == undefined) return;
		var voRootAppIns = poApp.getRootAppInstance();
		
		/** @type cpr.controls.Container */
		var vcGrpAriaLiveMsg = voRootAppIns.lookup("grpMainAriaLiveMessage");
		if (vcGrpAriaLiveMsg == null || vcGrpAriaLiveMsg == undefined) {
			vcGrpAriaLiveMsg = new cpr.controls.Container("grpMainAriaLiveMessage");
			var vcRootContainer = voRootAppIns.getContainer();
			vcRootContainer.floatControl(vcGrpAriaLiveMsg, {
				top: "1px",
				left: "1px",
				width: "1px",
				height: "1px"
			});
		}
		
		var vcOptAriaLive = new cpr.controls.Output();
		var vsAriaType = AccessibilityProperties.ARIA_LIVE_TYPE;
		if(vsAriaType == "auto") {
			vcOptAriaLive.ariaLive = psAriaLive || "assertive";
		} else {
			vcOptAriaLive.ariaLive = vsAriaType;
		}
		vcGrpAriaLiveMsg.floatControl(vcOptAriaLive, {
			width: "1px",
			height: "0px"
		});
		
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
			vcOptAriaLive.value = "";
			_.delay(function() {
				vcOptAriaLive.value = psMsg;
				_.delay(function() {
					vcGrpAriaLiveMsg.removeChild(vcOptAriaLive);
				}, 3000);
			}, 200);
		});
	},
	
	/**
	 * 내비게이션바, 사이드내비게이션에 대한 role을 변경한다. <br/>
	 *    ㄴ role=menubar 삭제 <br/>
	 *    ㄴ Space bar를 눌렀을 경우 item-click event를 발생<br/>
	 *    ㄴ 사이드내비게이션 일경우 확장/축소 정보를 aria-live 를 통해 음성안내를 제공한다.
	 * @param {cpr.core.AppInstance} poApp
	 */
	setAccessibleMenuItem: function(poApp) {

		if (poApp instanceof cpr.core.AppInstance) {
			poApp.getContainer().getAllRecursiveChildren(false).forEach(function(each) {
				// role=menubar 가 설정되어 있을 경우 role 삭제 (가상커서가 해당 위치로 튀는 이상현상 방지)
				if (each.accessbility.aria("role") == "menubar") {
					each.accessbility.aria("role", "");
				} else if (each instanceof cpr.controls.NavigationBar && each.menuType == "megamenu") {
					cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
						var elMenubarCtrl = document.querySelector("[data-usr-uuid='"+each.htmlAttr("uuid")+ "']");
						if (elMenubarCtrl && elMenubarCtrl.hasAttribute("role") && elMenubarCtrl.getAttribute("role") == "menubar") {
							elMenubarCtrl.removeAttribute("role");
						}
					});
				}
				
				if (each instanceof cpr.controls.NavigationBar) {
					
					/* accessiblemegamenu 일 경우, 루트 아이템의  aria-expanded 관련 설정 */
					switch(AccessibilityProperties.NAV_ITEM_ARIA_EXPANDED){
						case "undefined" :
							// 루트 아이템의 aria-expanded=undefiend
							each.accessbility.item.aria("expanded", "undefined");
							break;
						case "none" :
							// 루트 아이템의 aria-expanded 속성 제거
							each.addEventListener("menu-open", function(e){
								var vnItemIndex = -1;
								for(var idx = 0; idx < each.getChildren().length; idx++){
									var child = each.getChildren()[idx];
									if(child.value == e.item.value) {
										vnItemIndex = idx;
										break;
									}
								}
								var targetElement = each.userData("rootElement")[vnItemIndex];
								if(targetElement) {
									// 메뉴 오픈 후, 생성되는 aria-expanded 속성 제거
									cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
										targetElement.removeAttribute("aria-expanded");
									});
								}
							});
							each.addEventListener("menu-close", function(e){
								var vnItemIndex = -1;
								for(var idx = 0; idx < each.getChildren().length; idx++){
									var child = each.getChildren()[idx];
									if(child.value == e.item.value) {
										vnItemIndex = idx;
										break;
									}
								}
								var targetElement = each.userData("rootElement")[vnItemIndex];
								if(targetElement) {
									// 메뉴 클로즈 후, 생성되는 aria-expanded 속성 제거
									targetElement.removeAttribute("aria-expanded");
								}
							});
							poApp.addEventListenerOnce("load", function(){
								cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
									// 최초 내비게이션바가 모두 그려진 후
									var elNavigation = document.querySelector("[data-usr-uuid='"+each.htmlAttr("uuid")+ "']");
									if(elNavigation) {
										// 루트 아이템의 a태그에 설정된 aria-expanded 속성 제거
										var elRootItems = elNavigation.querySelectorAll("a");
										each.userData("rootElement", elRootItems);
										for(var idx = 0; idx < elRootItems.length; idx++){
											var elEachItem = elRootItems.item(idx);
											elEachItem.removeAttribute("aria-expanded");
										}
									}
								});
							});
							break;
					}
					
					/* 자식 아이템이 존재하는 폴더 아이템일 경우, role 적용 (default: link) */
					if(AccessibilityProperties.NAV_FOLDER_ITEM_ROLE != "" && AccessibilityProperties.NAV_FOLDER_ITEM_ROLE != "link") {
						each.accessbility.item.bind("role").toExpression("children.length == 0 ? \"link\" : \""+AccessibilityProperties.NAV_FOLDER_ITEM_ROLE+"\""); // 대메뉴 아이템
						each.accessbility.listitem.bind("role").toExpression("children.length == 0 ? \"link\" : \""+AccessibilityProperties.NAV_FOLDER_ITEM_ROLE+"\""); // 리스트 내 아이템
					}
					
					/* displayExp에 설정되는 depth 의 시작 깊이 설정 (default:0 ) */
					if(AccessibilityProperties.SET_START_ITEM_DEPTH > 0) {
						each.displayExp = each.displayExp.replace("depth", "(depth+"+AccessibilityProperties.SET_START_ITEM_DEPTH+")");
					}

					/* Space 키를 눌렀을 때 item-click 이벤트 발생 (Enter, Space 키 동작 일치시키기  위함) */
					each.addEventListener("keydown", function(e) {
						if (e.keyCode == cpr.events.KeyCode.SPACE) { 
							var voItem = null;
							var voTargetObject = e.targetObject;
							if(voTargetObject) {
								voItem = voTargetObject.item;
							} else {
								if (!ValueUtil.isNull(e.target.getAttribute("data-itemid"))) {
									voItem = each.getItemByValue(e.target.getAttribute("data-itemid"));
								}
							}
							if(voItem == null) return false;

							var options = {
								item: voItem
							}
							var clickEvt = new cpr.events.CItemEvent(cpr.events.ItemEventType.ITEMCLICK, options);
							each.dispatchEvent(clickEvt);
						}
					});
					
				} else if (each instanceof cpr.controls.SideNavigation) {
					
					/* 자식 아이템이 존재하는 폴더 아이템일 경우, role 적용 (default: link) */
					if(AccessibilityProperties.SNV_FOLDER_ITEM_ROLE != "" && AccessibilityProperties.SNV_FOLDER_ITEM_ROLE != "link") {
						each.accessbility.item.bind("role").toExpression("children.length == 0 ? \"link\" : \""+AccessibilityProperties.SNV_FOLDER_ITEM_ROLE+"\"");
					}
					
					/* Space 키를 눌렀을 때 item-click 이벤트 발생 (Enter, Space 키 동작 일치시키기 위함) */
					each.addEventListener("keydown", function(e) {
						if (e.keyCode == cpr.events.KeyCode.SPACE) {
							var options = {
								item: each.getItemByValue(e.target.getAttribute("data-itemid"))
							}
							
							if (options.item.children.length > 0) {
								each.toggle(options.item);
							}
							
							var clickEvt = new cpr.events.CItemEvent(cpr.events.ItemEventType.ITEMCLICK, options);
							each.dispatchEvent(clickEvt);
							
							e.preventDefault();
						}
					});
				}
			});
		}
	}
}

/************************************************
 * 빌더 & 크롬 버전 확인
 ************************************************/
/**
 * 최신 버전을 사용 못하고 패치가 필요할때 특정 버전까지 임시로 코드를 사용합니다.
 * @param {minVersion:Number,maxVersion:Number} option
 * @param {()=>void} callback
 * @param {string} errorMessage
 */
function tempPatch(option, callback, errorMessage) {
	if (mbRunAccessbiityAg) return;
	
	var version = cpr.core.Platform.INSTANCE.getVersion();
	var minorVersion = Number(version.split(".")[2]);
	if (isNaN(minorVersion)) {
		console.warn("버전을 확인할 수 없습니다.");
	}
	_.defaults(option, {
		minVersion: minorVersion,
		maxVersion: minorVersion
	});
	if (option.maxVersion < minorVersion || option.minVersion > minorVersion) {
		console.warn(errorMessage || "현재 버전에서 사용할 수 없는 코드가 있습니다.")
	} else {
		callback();
	}
	
	mbRunAccessbiityAg = true;
	if(AccessibilityProperties.SHOW_SENSE_READER_SETTING_MSG === true) {
		console.log("sense reader setting end-------------------------------------------");
	}
}

// 공통 패치는 이곳에서 작성합니다.
tempPatch({
	minVersion: 4326
}, function() {
	var browserInfo = cpr.core.Platform.INSTANCE.browserInfo;
	var isSenseReaderOff = browserInfo.name == "chrome" && browserInfo.versionNumber >= 114;
	
	if (browserInfo.mobile || browserInfo.isAndroid || browserInfo.isIOS || isSenseReaderOff) {
		var appConfig = cpr.core.AppConfig.INSTANCE.getEnvConfig();
		cpr.core.AppConfig.INSTANCE.getEnvConfig().setValue("__senseReaderSupport__", false);
	}
	
}, "현재 버전에서 사용할 수 없는 패치가 있습니다. module/accessibility/accessibility.module.js 을 확인하시기 바랍니다.");




/************************************************
 * HTML 파일 생성 함수
 ************************************************/
/**
 * HTML 파일 생성 함수<br/>
 * 웹접근성 진단 또는 웹표준 검사를 위해 현재 화면을 HTML 파일로 다운로드 받습니다.<br/>
 * @param {String} psFileName 파일명
 */
globals.makeHtmlFile = function(psFileName) {
	var htmlContent  = new Array("<!DOCTYPE html>\n", document.documentElement.outerHTML);
	var blob = new Blob(htmlContent, {type:"text/html"});
	
	var a = document.createElement("a");
	var url = URL.createObjectURL(blob);
	a.href = url;
	a.download = psFileName + ".html";
	a.hidden = true;
	document.body.appendChild(a);
	a.click();
	
	_.delay(function(){
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, 100);
}


/************************************************
 * 모바일 관련 접근성
 ************************************************/
/*
 * [모바일] 동적으로 생성되는 컨트롤(체크박스, 라디오버튼)에 대해 접근성 관련 설정
 */
if(AccessibilityProperties.SHOW_TOOLTIP_CHECK_ICON === true) {
	cpr.events.EventBus.INSTANCE.addFilter("before-draw", function(e){
		/** @type cpr.controls.UIControl */
		var control = e.control;
		
		if(control.userAttr("_accessible_check_") != "Y") {
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
				_getRecursiveChildForAblty(control);
				control.userAttr("_accessible_check_", "Y"); // 동일한 컨트롤 중복 방지 위한 userAttr 설정
			});	
		}
	});
}

/**
 * 모바일 환경에서 접근성 관련 속성 설정
 * @param {cpr.controls.UIControl} pcCtrl
 */
function _getRecursiveChildForAblty(pcCtrl) {
	var voApp = pcCtrl.getAppInstance();
	if(ValueUtil.isNull(voApp) || ValueUtil.isNull(voApp.targetScreen)){
		return;
	}
	
	if(moScreenNames["default"].indexOf(voApp.targetScreen.name) != -1) {
		if(pcCtrl instanceof cpr.controls.CheckBox || pcCtrl instanceof cpr.controls.RadioButton) {
			if(pcCtrl.htmlAttr("uuid") == "") pcCtrl.htmlAttr("uuid", pcCtrl.uuid);
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
				_setAccessibilityRadioCheckbox(pcCtrl);
			});
		}
	} 
}

/**
 * [모바일] 접근성 관련 설정 진행<br/>
 * - 라디오버튼 : 아이콘 영역이 width=0일 경우 hideIcon=true 설정<br/>
 * - 체크박스 : aria-checked 속성에 따라 title(선택됨/선택안됨) 속성 설정
 * @param {cpr.controls.CheckBox || cpr.controls.RadioButton} pcCtrl 체크박스 또는 라디오버튼 컨트롤
 */
function _setAccessibilityRadioCheckbox(pcCtrl) {
	/*
	 * 체크박스 컨크롤의 .cl-checkbox-icon 요소에 html title 속성을 추가하는 로직
	 * 체크박스에서 title 속성으로 체크여부를 제공해야 한다는 평가원 WA 전문가 심사 담당자의 피드백을 충족하기 위해 작성된 기능입니다.
	 */
	if(pcCtrl instanceof cpr.controls.CheckBox) {
		var voCheckBoxElement = document.querySelector("[data-usr-uuid='"+pcCtrl.uuid+ "']");
		if(voCheckBoxElement != null) {
			var vaCheckBoxIconElement = voCheckBoxElement.getElementsByClassName("cl-checkbox-icon");
			if(vaCheckBoxIconElement.length > 0) {
				if(pcCtrl.checked == true) {
					vaCheckBoxIconElement[0].setAttribute("title", "선택됨");
				} else {
					vaCheckBoxIconElement[0].setAttribute("title", "선택안됨");
				}
			}
		}
	} 
//	else if (pcCtrl instanceof cpr.controls.RadioButton) {}
}

/**
 * [모바일] 다이얼로그 접근성 설정<br/>
 * 최상위 container 에 접근이 불가하도록 aria-hidden=true 설정(다이얼로그 제외)
 * @param {cpr.controls.Dialog} pcDialog
 */
function _mobileDialogAccessibility(pcDialog) {
	// default 사이즈가 아닐 경우
	if(moScreenNames["default"].indexOf(pcDialog.getAppInstance().targetScreen.name) == -1) {
		
		var vaTargetCtrls = [];
		var floatingNodes = [];
		
		// modal Dialog 일 경우에만 적용
		if(pcDialog.modal !== true) return;
		
		var elBodyTarget = document.querySelector(".cl-container > .cl-layout");
		if(!elBodyTarget.hasAttribute("aria-hidden")) {
			// Root Body 의 aria-hidden 처리
			elBodyTarget.setAttribute("aria-hidden", "true");
			vaTargetCtrls.push(elBodyTarget);
		}
		
		var elDlgNode = document.querySelector("[data-usr-uuid='"+pcDialog.htmlAttr("uuid")+ "']");
		var floatingElements = document.querySelectorAll(".cl-aside>div");
		
		for(var idx = 0; idx < floatingElements.length; idx++){
			var elNode = floatingElements.item(idx);
			floatingNodes.push(elNode);
			
			if(elDlgNode && elNode.contains(elDlgNode)) {
				// 다이얼로그를 포함하는 노드일 경우 제외
				floatingNodes.pop().removeAttribute("aria-hidden");
				continue;
			}
			
			if(!elNode.hasAttribute("aria-hidden")) {
				elNode.setAttribute("aria-hidden", "true");
				vaTargetCtrls.push(elNode);
			}
		}
		
		pcDialog.addEventListenerOnce("close", function(evt) {
			// 최상위 container 의 aria-hidden 제거
			elBodyTarget.removeAttribute("aria-hidden");
			
			_.delay(function(){
				vaTargetCtrls.forEach(function(each){
					var overlay = document.querySelector(".cl-overlay");
					if(ValueUtil.isNull(overlay)) {
						each.removeAttribute("aria-hidden");
					} else {
						var popNode = floatingNodes.pop();
						if(popNode) popNode.removeAttribute("aria-hidden");
					}
				});
			}, 500);
		});
	}
}
