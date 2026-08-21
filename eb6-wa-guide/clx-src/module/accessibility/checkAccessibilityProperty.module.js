/************************************************
 * checkAccessibilityProperty.module.js
 * Created at 2023. 8. 8. 오후 4:04:29.
 *
 * @author daye
 ************************************************/

/************************************************
 * TODO
 * 확인하고자 할 경우 아래 변수(mbUse) 를 true 로 설정하여 확인하십시오.
 * 운영배포시에는 반드시 본 모듈을 제거할 것을 권고드립니다.
 ************************************************/
var mbUse = false;


/************************************************
 * 웹 접근성 확인 모듈(aria-label 체크)
 * 
 * [속성]			[컨트롤]
 * alt				이미지
 * fieldLabel		인풋박스, 넘버에디터, 데이트인풋, 마스크에디터, 파일인풋, 텍스트레이러, 서치인풋, 콤보박스, 그리드, 체크박스
 * tooltip			버튼(텍스트없는경우, 토글 버튼 제외)
 * fieldLabels		링크드 콤보박스
 ************************************************/
if(mbUse) {
	cpr.core.App.addHook({
		onCreate: function(app, exports){
			var waModule = cpr.core.Module.require("module/accessibility/checkAccessibilityProperty");
			
			if(app.isRootAppInstance()) {
				var cbx = new cpr.controls.CheckBox();
				cbx.text = "웹접근성 확인";
				cbx.tabIndex = -1;
				cbx.falseValue = false;
				cbx.addEventListener("value-change", function(e){
					if(cbx.value == cbx.trueValue) {
						app.getContainer().getAllRecursiveChildren().forEach(function(each){
							waModule.checkAccessibility(app, each, false);
						});
					} else {
						app.getContainer().getAllRecursiveChildren().forEach(function(each){
							waModule.checkAccessibility(app, each, true);
						});
					}
				});
				
				// 메인에서 화면전환시 체크박스 값 해제
				/** @type cpr.controls.EmbeddedApp */
				var vcEaCn = app.lookup("eaCn");
				if(vcEaCn) {
					vcEaCn.addEventListener("app-ready", function(e){
						cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
							cbx.value = false;
						});
					});
				}
				
				app.getRootAppInstance().floatControl(cbx, {
					top : "10px",
					right : "10px"
				});
			}
		}
	});
}


/************************************************
 * 컨트롤 종류
 ************************************************/
var moCtrlNm = {
	//	control
	"accordion": "아코디언",
	"audio": "오디오",
	"button": "버튼",
	"calendar": "캘린더",
	"checkbox": "체크박스",
	"checkboxgroup": "체크박스 그룹",
	"combobox": "콤보박스",
	"container": "그룹",
	"dateinput": "데이트인풋",
	"dialog": "다이얼로그",
	"embeddedapp": "임베디드 앱",
	"embeddedpage": "임베디드 페이지",
	"fileinput": "파일인풋",
	"fileupload": "파일업로드",
	"grid": "그리드",
	"htmlobject": "HTML오브젝트",
	"htmlsnippet": "HTML스니펫",
	"image": "이미지",
	"inputbox": "인풋박스",
	"linkedcombobox": "링크드 콤보박스",
	"linkedlistbox": "링크드 리스트박스",
	"listbox": "리스트박스",
	"maskeditor": "마스크에디터",
	"menu": "메뉴",
	"mdifolder": "MDI폴더",
	"navigationbar": "내비게이션바",
	"notifier": "알림",
	"numbereditor": "넘버에디터",
	"output": "아웃풋",
	"pageindexer": "페이지 인덱서",
	"progress": "프로그레스바",
	"radiobutton": "라디오버튼",
	"searchinput": "서치 인풋",
	"slider": "슬라이더",
	"tabfolder": "탭 폴더",
	"textarea": "텍스트에리어",
	"tree": "트리",
	"treecell": "트리셀",
	"video": "비디오",
	"sidenavigation": "사이드 내비게이션",
	// cell
	"group": "그리드 그룹",
	"headerCell": "그리드 헤더 셀",
	"detailCell": "그리드 디테일 셀",
	"footerCell": "그리드 푸터 셀"
}

exports.setStyleWaArea = _setStyleWaArea;

/**
 * 인자로 받은 영문 컨트롤 명이 moCtrlNm 키값과 같으면 한글명 반환
 * @param {String} psCtrlNm
 */
exports.getControlKrName = function(psCtrlNm){
	var vbEqual = false; 
	// 인자로 받은 영문 컨트롤 명이 moCtrlNm 키값과 같으면 한글명 반환
	for(var key in moCtrlNm){
		if(psCtrlNm == key) {
			vbEqual = true;
			return moCtrlNm[key];
		}
	}
	
	//일치하는 key가 없으면 입력한 값 그대로 반환
	if(!vbEqual){
		return psCtrlNm;
	}
}


/************************************************
 * 웹접근성 속성 다이얼로그 확인 팝업창
 * - 스타일 적용
 ************************************************/
cpr.core.App.addHook({
	onCreate: function(app, exports){
		app.addEventListenerOnce("load", function(){
			if(app.app.id == "waTotalCheck") return false;
			
			var vaRecursiveChlid = app.getContainer().getAllRecursiveChildren(false);
			vaRecursiveChlid.forEach(function(each){
				_getRecursiveChild(each, false);
				
				if (each.type == "tabfolder") {
					each.addEventListener("selection-change", function(e) {
						var content = e.newSelection.content;
						cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
							content.getAllRecursiveChildren(false).forEach(function(child) {
								if(child.isShowing()) {
									_getRecursiveChild(child, false);
									// 접근성 검토모드 On인 경우에만 작동
									if(app.getRootAppInstance().hasAppMethod("isAccessTestOn") && app.getRootAppInstance().callAppMethod("isAccessTestOn")){
										checkAccessibility(app.getRootAppInstance(),child,false);
									}
								}
							})
						});
					});
				}
			});
			
			if(app.isRootAppInstance()) {
				app.getContainer().addEventListener("keydown", _fnRootKeyDown);
			}
		})
	}
});

/**
 * 로드된 화면의 모든 컨트롤을 찾는다.
 * @param {cpr.controls.UIControl} pcCtrl
 * @param {Boolean} pbRemove true시 핸들을 삭제합니다.
 */
function _getRecursiveChild(pcCtrl, pbRemove) {
	 
	 if (pcCtrl instanceof cpr.controls.EmbeddedApp) {
	 	pcCtrl.ready(function(){
	 		pcCtrl.getEmbeddedAppInstance().getContainer().getAllRecursiveChildren(false).forEach(function(each){
	 			_getRecursiveChild(each, pbRemove);
	 		});
	 	})
	 } else if (pcCtrl instanceof cpr.controls.UDCBase) {
	 	pcCtrl.getEmbeddedAppInstance().getContainer().getAllRecursiveChildren(false).forEach(function(each){
	 		_getRecursiveChild(each, pbRemove);
	 	});
	 } else {
	 	if(pcCtrl.htmlAttr("uuid") == null || pcCtrl.htmlAttr("uuid") == "") {
		 	pcCtrl.htmlAttr("uuid", pcCtrl.uuid);
		 	cpr.core.DeferredUpdateManager.INSTANCE.update();
	 	}
	 	pbRemove ? _removeStyleWaArea(pcCtrl) : _setStyleWaArea(pcCtrl);
	 }
}


/**
 * 사용자속성(wa-prop-key) 가 작성된 컨트롤을 대상으로 스타일을 적용한다.
 * 적용된 스타일은 오른쪽 상단에 빨간색상으로 표시되며, 해당 영역을 선택하면 웹접근성 속성을 확인할 수 있는 다이얼로그를 오픈한다. 
 * @param {cpr.controls.UIControl} pcCtrl
 */
function _removeStyleWaArea (pcCtrl){
	if(pcCtrl instanceof cpr.controls.UIControl) {
		var vsUstrKey = pcCtrl.userAttr("wa-prop-key");
		if(!ValueUtil.isNull(vsUstrKey)) {
			var tempElSpan = document.getElementById("check-wa-area-" + pcCtrl.uuid);
			if(tempElSpan){
				tempElSpan.remove();
			}
		}
	}
}

/**
 * 사용자속성(wa-prop-key) 가 작성된 컨트롤을 대상으로 스타일을 적용한다.
 * 적용된 스타일은 오른쪽 상단에 빨간색상으로 표시되며, 해당 영역을 선택하면 웹접근성 속성을 확인할 수 있는 다이얼로그를 오픈한다. 
 * @param {cpr.controls.UIControl} pcCtrl
 */
function _setStyleWaArea (pcCtrl) {

	if(pcCtrl instanceof cpr.controls.UIControl) {
		var vsUstrKey = pcCtrl.userAttr("wa-prop-key");
		if(!ValueUtil.isNull(vsUstrKey)) {
			
			var tempElSpan = document.getElementById("check-wa-area-" + pcCtrl.uuid);
			if(tempElSpan) return false;
			
			var elSpan = document.createElement("span");
			elSpan.id = "check-wa-area-" + pcCtrl.uuid;
			elSpan.setAttribute("aria-hidden", "true");
			elSpan.classList.add("wa-area");
			// wa핸들 hover 시 해당 컨트롤 식별 가능토록 경계선 그려주기
			elSpan.addEventListener("mouseover", function(e){
				// 바인딩된 클래스가 최종적으로 결정된 후 클래스 조회하여 classList에 add
				var actCtrl = document.querySelector("div[data-usr-uuid='"+pcCtrl.uuid+ "']");
				if(!actCtrl.classList.contains("cl-control")) {
					actCtrl = actCtrl.querySelector(".cl-control");
				}
				if(!ValueUtil.isNull(actCtrl)){
					actCtrl.classList.add("wa-highlight-hover");
				}
			});
			// wa핸들 leave 시 해당 컨트롤 식별 경계선 지우기
			elSpan.addEventListener("mouseleave", function(e){
				// 바인딩된 클래스가 최종적으로 결정된 후 클래스 조회하여 classList에서 remove
				var actCtrl = document.querySelector("div[data-usr-uuid='"+pcCtrl.uuid+ "']");
				if(!actCtrl.classList.contains("cl-control")) {
					actCtrl = actCtrl.querySelector(".cl-control");
				}
				if(!ValueUtil.isNull(actCtrl)){
					actCtrl.classList.remove("wa-highlight-hover");
				}
			});
			elSpan.addEventListener("click", function (evt) {
				evt.stopPropagation();
				_onClickWaAreaPop(pcCtrl);
				return false;
			});
			_.delay(function(){
				if(elSpan.parentElement) {
					elSpan.parentElement.style.overflow = "visible";
				}
			}, 1)
			
			if(pcCtrl.getParent() instanceof cpr.controls.Grid) {
				/** @type cpr.controls.Grid */
				var vcGrid = pcCtrl.getParent();
				var voTargetConstraint = vcGrid.getConstraint(pcCtrl);
				var elParentCtrl = document.querySelector("div[data-usr-uuid='"+vcGrid.uuid+ "']");
				if(elParentCtrl) {
					if(vcGrid.getRowCount() > 0) {
						if (vcGrid.getSelectedRowIndex() == -1) {
							vcGrid.selectRows(0);
							cpr.core.DeferredUpdateManager.INSTANCE.update();
						}
						if(elParentCtrl.querySelectorAll(".cl-grid-detail .cl-grid-row").length == 0) {
							return;
						}
						var elGridTargetCtrl = elParentCtrl.querySelectorAll(".cl-grid-detail .cl-grid-row")[0].querySelectorAll(".cl-grid-cell[data-cellindex=\"" + voTargetConstraint.cellIndex + "\"]");
						elGridTargetCtrl.forEach(function(gridcell) {
							gridcell.appendChild(elSpan);
						})
					} else {
						vcGrid.dataSet.addEventListenerOnce("load", function() {
							cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
								if (vcGrid.getSelectedRowIndex() == -1) {
									vcGrid.selectRows(0);
									cpr.core.DeferredUpdateManager.INSTANCE.update();
								}
								var elGridTargetCtrl = elParentCtrl.querySelectorAll(".cl-grid-detail .cl-grid-row")[0].querySelectorAll(".cl-grid-cell[data-cellindex=\""+ voTargetConstraint.cellIndex +"\"]");
								elGridTargetCtrl.forEach(function(gridcell) {
									gridcell.appendChild(elSpan);
								})
							});
						})
					}
					
					vcGrid.dataSet.addEventListener("filter", function(e) {
						if (vcGrid.getSelectedRowIndex() == -1) {
							vcGrid.selectRows(0);
							cpr.core.DeferredUpdateManager.INSTANCE.update();
						}
					});
				}
			} else {
				var elTargetCtrl = document.querySelector("div[data-usr-uuid='"+pcCtrl.uuid+ "']");
				if(elTargetCtrl) elTargetCtrl.appendChild(elSpan);
			}
		}
	}
}



/************************************************
 * 웹접근성 속성 다이얼로그 확인 팝업창
 * - 이벤트 영역
 ************************************************/
/**
 * 웹접근성 속성 확인 다이얼로그를 오픈한다.
 * @param {cpr.controls.UIControl} pcCtrl
 */
function _onClickWaAreaPop (pcCtrl) {
	
	var voAppIns = pcCtrl.getAppInstance();
	var vcUstrDataset = pcCtrl.userAttr("wa-prop-dataset");
	var vcWaDataset = voAppIns.lookup(vcUstrDataset);
	
	if(ValueUtil.isNull(vcUstrDataset)) {
		// 앱속성으로 전달받은 데이터셋이 없을 경우, 해당 앱에 dsPropView라는 이름의 데이터셋 사용
		var vcTempDs = voAppIns.lookup("dsPropView");
		if(vcTempDs) {
			vcWaDataset = vcTempDs;
		}
	}
	
	var voInitValue = {
		dataset : vcWaDataset,
		keyNum : pcCtrl.userAttr("wa-prop-key")
	}
	
	var voRootAppIns = voAppIns.getRootAppInstance();
	var voDialogManager= voRootAppIns.dialogManager;
	voDialogManager.openDialog("app/com/0.com/waPropView", "waProp", {
		width : 650,
		height : 500,
		modal: true
	}, function(dialog) {
		dialog.autoFocusedTarget = "auto";
		dialog.restoreFocus = true;
		dialog.initValue = voInitValue;
	});
}




/************************************************
 * 전체확인
 ************************************************/
function _fnRootKeyDown (/* cpr.events.CKeyboardEvent */ e) {
	/** @type cpr.controls.Container */
	var control = e.control;
	var voRootAppIns = control.getAppInstance();

	if(e.ctrlKey && e.altKey && e.shiftKey && e.key.toUpperCase() == "T") {
		
		var vaInitValue = [];
		var vcMainDsPropView = voRootAppIns.lookup("dsPropView");
		if(vcMainDsPropView) vaInitValue.push(vcMainDsPropView);
		
		/** @type cpr.controls.MDIFolder */
		var vcMdiCn = voRootAppIns.lookup("mdiCn");
		if(vcMdiCn) {
			/** @type cpr.controls.EmbeddedApp */
			var voSelectedEmbApp = vcMdiCn.getSelectedTabItem().content;
			var voSelectedEmbAppIns = voSelectedEmbApp.getEmbeddedAppInstance();
			if(voSelectedEmbAppIns) {
				/** @type cpr.data.DataSet */
				var vcDsPropView = voSelectedEmbAppIns.lookup("dsPropView");
				if(vcDsPropView)  vaInitValue.push(vcDsPropView);
			}
		}
		
		// 언제까지 될지 결과를 뭐를 
		var voDlgApp = _createDlgApp();
		voRootAppIns.dialogManager.openDialog(voDlgApp, "", {
			top: 0,
			left: 0
		}, function(dlg){
			dlg.initValue = {
				dataset : vaInitValue
			}
			dlg.ready(function(app){
				dlg.maximize();
			})
		})
	}
}

function _createDlgApp () {
	var voNewApp =  new cpr.core.App("waTotalCheck", {
		onCreate: function(app, exports){
			
			/************************************************
			 * 사용자 이벤트
			 ************************************************/
			function createAccordionItem (paDataset) {
				
				/** @type cpr.controls.TabFolder */
				var vcTabfolder = app.lookup("tf");
				
				paDataset.forEach(function(/* cpr.data.DataSet */ each, idx) {

					var voTabItem = new cpr.controls.TabItem();
					voTabItem.text = each.getAppInstance().app.title || each.getAppInstance().app.id;

					var voTempContainer = new cpr.controls.Container();
					var voVerticalLayout = new cpr.controls.layouts.VerticalLayout();
					voVerticalLayout.topMargin = 10;
					voTempContainer.setLayout(voVerticalLayout);
					voTabItem.content = voTempContainer;
					vcTabfolder.addTabItem(voTabItem);
					
					var vcAccordion = new cpr.controls.Accordion();
					vcAccordion.multiple = true;
					vcAccordion.style.setClasses([]);
					voTempContainer.addChild(vcAccordion, {
						autoSize : "height"
					});
						
					each.getUnfilteredDistinctValues("keyNum").forEach(function(key){

						var voSectionItem = new cpr.controls.SectionItem();
						var vcSectionContainer = new cpr.controls.Container();
						var formlayout = new cpr.controls.layouts.FormLayout();
						formlayout.setRows(["1fr"]);
						formlayout.setColumns(["1fr", "1fr"]);
						formlayout.topMargin = "10px";
						formlayout.leftMargin = "0px";
						formlayout.rightMargin = "0px";
						formlayout.bottomMargin = "10px";
						formlayout.horizontalSpacing = "10px";
						vcSectionContainer.setLayout(formlayout);
						
						var vcImgContainer = new cpr.controls.Container();
						var flowLayout = new cpr.controls.layouts.FlowLayout();
						vcImgContainer.setLayout(flowLayout);
						vcSectionContainer.addChild(vcImgContainer, {
							rowIndex : 0,
							colIndex : 0
						});
						// TODO 수정하기
						var vcImage = new cpr.controls.Image();
						vcImage.alt = "";
						vcImage.src = "resource/img/test_"+key + ".png";
						vcImgContainer.addChild(vcImage, {
							autoSize : "both"
						});
						
						var vcTempDs = new cpr.data.DataView("temp_"+key, each);
						vcTempDs.setFilter("keyNum == \"" + key + "\"");
							
						var vcWAGrid= new cpr.controls.Grid();
						vcWAGrid.readOnly = true;
						vcWAGrid.style.css({
							minHeight : "0px"
						})
						vcWAGrid.init({
							"dataSet": vcTempDs,
							"resizableColumns": "all",
							"viewingMode" : "lite",
							"autoFit" : "2,3",
							"autoRowHeight" : "all",
							"suppressedCellType" : "merged",
							"columns": [
								{"width": "120px"},
								{"width": "150px"},
								{"width": "120px"},
								{"width": "120px"}
							],
							"header": {
								"rows": [{"height": "36px"}],
								"cells": [
									{
										"constraint": {"rowIndex": 0, "colIndex": 1},
										"configurator": function(cell){
											cell.filterable = false;
											cell.sortable = false;
											cell.targetColumnName = "keyNum";
											cell.text = "아이디";
										}
									},
									{
										"constraint": {"rowIndex": 0, "colIndex": 0},
										"configurator": function(cell){
											cell.filterable = false;
											cell.sortable = false;
											cell.targetColumnName = "control";
											cell.text = "컨트롤";
										}
									},
									{
										"constraint": {"rowIndex": 0, "colIndex": 2},
										"configurator": function(cell){
											cell.filterable = false;
											cell.sortable = false;
											cell.targetColumnName = "propNm";
											cell.text = "속성";
										}
									},
									{
										"constraint": {"rowIndex": 0, "colIndex": 3},
										"configurator": function(cell){
											cell.filterable = false;
											cell.sortable = false;
											cell.targetColumnName = "propVal";
											cell.text = "값";
										}
									}
								]
							},
							"detail": {
								"rows": [{"height": "37px"}],
								"cells": [
									{
										"constraint": {"rowIndex": 0, "colIndex": 1},
										"configurator": function(cell){
											cell.columnName = "keyNum";
											cell.suppressible = true;
											cell.control = (function(){
												var output_1 = new cpr.controls.Output();
												output_1.bind("value").toDataColumn("keyNum");
												return output_1;
											})();
										}
									},
									{
										"constraint": {"rowIndex": 0, "colIndex": 0},
										"configurator": function(cell){
											cell.columnName = "control";
											cell.suppressible = true;
											cell.control = (function(){
												var comboBox_1 = new cpr.controls.ComboBox();
												(function(comboBox_1){
													Object.keys(moCtrlNm).forEach(function(key){
														comboBox_1.addItem(new cpr.controls.Item(moCtrlNm[key], key));
													});
												})(comboBox_1);
												comboBox_1.bind("value").toDataColumn("control");
												return comboBox_1;
											})();
											cell.controlConstraint = {
												"topSpacing": 0,
												"rightSpacing": 0,
												"bottomSpacing": 0,
												"leftSpacing": 0
											};
										}
									},
									{
										"constraint": {"rowIndex": 0, "colIndex": 2},
										"configurator": function(cell){
											cell.columnName = "propNm";
											cell.suppressible = true;
											cell.suppressRef = "1";
											cell.control = (function(){
												var output_3 = new cpr.controls.Output();
												output_3.bind("value").toDataColumn("propNm");
												return output_3;
											})();
										}
									},
									{
										"constraint": {"rowIndex": 0, "colIndex": 3},
										"configurator": function(cell){
											cell.columnName = "propVal";
											cell.suppressible = true;
											cell.suppressRef = "2";
											cell.control = (function(){
												var output_3 = new cpr.controls.Output();
												output_3.bind("value").toDataColumn("propVal");
												output_3.bind("tooltip").toDataColumn("propVal");
												return output_3;
											})();
										}
									}
								]
							}
						});
						vcSectionContainer.addChild(vcWAGrid, {
							rowIndex : 0,
							colIndex : 1
						});
						
						voSectionItem.title = moCtrlNm[vcTempDs.getColumnData("control")[0]] +"("+ key + ")";
						voSectionItem.content = vcSectionContainer;
						vcAccordion.addSection(voSectionItem);
					});

					vcAccordion.setSelectedSections(vcAccordion.getSectionItems());
					vcAccordion.redraw();
				});
				
				var vaTabItems = vcTabfolder.getTabItems();
				if(vaTabItems.length > 0) {
					vcTabfolder.setSelectedTabItem(vaTabItems[0]);
				}
			}
			
			/************************************************
			 * 이벤트리스너
			 ************************************************/
			function onBodyLoad () {
				var initValue = app.getHostProperty("initValue");
				if(initValue) {
					createAccordionItem(initValue["dataset"]);
				}
			}
			
			function onBtnExpand () {
				/** @type cpr.controls.TabFolder */
				var vcTabfolder = app.lookup("tf");
				
				vcTabfolder.getSelectedTabItem().content.getChildren().filter(function(each){
					return each instanceof cpr.controls.Accordion;
				}).forEach(function(accordion){
					accordion.setSelectedSections(accordion.getSectionItems());
				});
			}
			function onBtnCollpase () {
				/** @type cpr.controls.TabFolder */
				var vcTabfolder = app.lookup("tf");
				vcTabfolder.getSelectedTabItem().content.getChildren().filter(function(each){
					return each instanceof cpr.controls.Accordion;
				}).forEach(function(accordion){
					accordion.setSelectedSections([]);
				});
			}
			
			/************************************************
			 * 컨트롤 생성
			 ************************************************/
			var container = app.getContainer();
			var xyLayout_1 = new cpr.controls.layouts.XYLayout();
			container.setLayout(xyLayout_1);
			
			var vcTfHdrContainer = new cpr.controls.Container();
			var flowLayout_1 = new cpr.controls.layouts.FlowLayout();
			flowLayout_1.scrollable = false;
			flowLayout_1.horizontalSpacing = 5;
			flowLayout_1.lineWrap = false;
			flowLayout_1.horizontalAlign = "right";
			vcTfHdrContainer.setLayout(flowLayout_1);
			
			var button_1 = new cpr.controls.Button();
			button_1.value = "전체 펼치기";
			button_1.style.setClasses(["btn-outline-primary"]);
			if(typeof onBtnExpand == "function"){
				button_1.addEventListener("click", onBtnExpand);
			}
			vcTfHdrContainer.addChild(button_1, {
				autoSize : "width",
				height : "100%"
			});
			
			var button_2 = new cpr.controls.Button();
			button_2.value = "전체 접기";
			button_2.style.setClasses(["btn-outline-primary"]);
			if(typeof onBtnCollpase == "function"){
				button_2.addEventListener("click", onBtnCollpase);
			}
			vcTfHdrContainer.addChild(button_2, {
				autoSize : "width",
				height : "100%"
			});
			
			var tabfolder = new cpr.controls.TabFolder("tf");
			tabfolder.addHeaderControl(vcTfHdrContainer, {
				position: "right",
				width: 180
			});
			container.addChild(tabfolder, {
				top  : "5px",
				left : "5px",
				right : "5px",
				bottom : "5px"
			});
			
			if(typeof onBodyLoad == "function"){
				app.addEventListener("load", onBodyLoad);
			}
		}
	});
	
	return voNewApp;
}


/*********************************************
 * 
 * 		접근성 검토 모드(web)
 *
 *********************************************/
exports.checkAccessibility = checkAccessibility;
exports.setWaAreaHandle = setWaAreaHandle;

function setWaAreaHandle(pcCtrl, pbRemove){
	_getRecursiveChild(pcCtrl, !pbRemove);
}
/**
 * 로드된 화면의 모든 컨트롤을 찾아서 접근성 검토 후 적용 여부를 표시해준다.
 * 
 * @param {cpr.core.AppInstance} app 앱 인스턴스
 * @param {cpr.controls.UIControl} pcCtrl 컨트롤
 * @param {Boolean} pbRemove true인 경우 화면 내 모든 핸들을 제거합니다.
 */
function checkAccessibility(app, pcCtrl, pbRemove) {
	// 임베디드 앱인 경우
	 if (pcCtrl instanceof cpr.controls.EmbeddedApp) {
	 	pcCtrl.ready(function(){
	 		pcCtrl.getEmbeddedAppInstance().getContainer().getAllRecursiveChildren(false).forEach(function(each){
	 			checkAccessibility(app, each, pbRemove);
	 		});
	 	})
	 //UDC인 경우
	 } else if (pcCtrl instanceof cpr.controls.UDCBase) {
	 	pcCtrl.getEmbeddedAppInstance().getContainer().getAllRecursiveChildren(false).forEach(function(each){
	 		checkAccessibility(app, each, pbRemove);
	 	});
	 // 일반 컨트롤인 경우 
	 } else {
	 	if(pcCtrl.htmlAttr("uuid") == null || pcCtrl.htmlAttr("uuid") == "") {
		 	pcCtrl.htmlAttr("uuid", pcCtrl.uuid);
		 	cpr.core.DeferredUpdateManager.INSTANCE.update();
	 	}
	 	pbRemove ? removeWaCheck(pcCtrl) : checkWaProperties(app, pcCtrl);
	}
}



/**
 * 접근성 속성 적용 여부에 따라 웹접근성 검토모드 핸들을 추가합니다.
 * @param {cpr.core.AppInstance} app 앱 인스턴스
 * @param {cpr.controls.UIControl} pcCtrl
 */
function checkWaProperties (app, pcCtrl){
	
	// 화면에 접근성 검토 핸들이 존재하면 return
	var waCheckHandle = document.getElementById("wa-check-handle-" + pcCtrl.uuid);
	if(waCheckHandle) return false;
	
	//1. 이미지 alt 속성 검사
	if(pcCtrl instanceof cpr.controls.Image){
		setWaCheck(app, pcCtrl, !ValueUtil.isNull(pcCtrl.alt), "alt");
		
	//2. fieldLabel 검사
	}else if(pcCtrl instanceof cpr.controls.InputBox ||
			 pcCtrl instanceof cpr.controls.NumberEditor ||
			 pcCtrl instanceof cpr.controls.DateInput ||
			 pcCtrl instanceof cpr.controls.MaskEditor ||
			 pcCtrl instanceof cpr.controls.FileInput ||
			 pcCtrl instanceof cpr.controls.TextArea ||
			 pcCtrl instanceof cpr.controls.SearchInput ||
			 pcCtrl instanceof cpr.controls.ComboBox ||
			 pcCtrl instanceof cpr.controls.Grid||
//			 pcCtrl instanceof cpr.controls.RadioButton ||
//			 pcCtrl instanceof cpr.controls.CheckBoxGroup ||
		 	 pcCtrl instanceof cpr.controls.CheckBox){
	 	setWaCheck(app, pcCtrl, !ValueUtil.isNull(pcCtrl.fieldLabel), "fieldLabel");
	 	
	//3. 텍스트 없이 아이콘으로 표현되는 버튼의 경우 tooltip 작성 필수
	}else if(pcCtrl instanceof cpr.controls.Button && ValueUtil.isNull(pcCtrl.text)){
		var vbIncludeToggleButto = AccessibilityProperties.BTN_TOGGLE_CLS.filter(function(each){
			return (pcCtrl.style.getClasses().indexOf(each) != -1);
		});
		// 토글형 버튼 : tooltip 확인 제외
		if(vbIncludeToggleButto.length == 0) {
			if(pcCtrl.fieldLabel && !pcCtrl.tooltip) {
				// tooltip은 미설정, fieldLabel 만 설정되어있는 경우
				setWaCheck(app, pcCtrl, !ValueUtil.isNull(pcCtrl.fieldLabel), "fieldLabel");
			} else {
				// fieldLabel, tooltip 모두 없을 경우, tooltip 우선 확인
				setWaCheck(app, pcCtrl, !ValueUtil.isNull(pcCtrl.tooltip), "tooltip");
			}
		}
		
	//4. 링크드 콤보박스 fieldLabels 속성 검사
	}else if(pcCtrl instanceof cpr.controls.LinkedComboBox){
		setWaCheck(app, pcCtrl, !ValueUtil.isNull(pcCtrl.fieldLabels), "fieldLabels");
	}
}


/**
 * 웹접근성 검토모드 핸들을 추가합니다.
 * 
 * @param {cpr.core.AppInstance} app 앱 인스턴스
 * @param {cpr.controls.UIControl} pcCtrl 컨트롤
 * @param {Boolean} pbChecked 접근성 속성 적용되었는지 여부
 * @param {String} psProperty 접근성 property명
 */
function setWaCheck(app, pcCtrl, pbChecked, psProperty){
	
	var elSpan = document.createElement("span");
	elSpan.id = "wa-check-handle-" + pcCtrl.uuid;
	elSpan.setAttribute("aria-hidden", "true");
	
	if(pbChecked){
		// 접근성 속성 설정 O 표시
		elSpan.classList.add("wa-check-handle");
		elSpan.setAttribute("title", psProperty + " : " +pcCtrl[psProperty] );
		if(pcCtrl.getParent() instanceof cpr.controls.Grid){
			if(!ValueUtil.isNull(pcCtrl.style.getClassBindInfo())){
				var actCtrl = document.querySelector("div[data-usr-uuid='"+pcCtrl.uuid+ "']");
				actCtrl.classList.add("wa-checked-grid");
			}else{
				pcCtrl.style.addClass("wa-checked-grid");
			}
			// 그리드 상태가 edit모드가 아닌 경우 첫 행 edit 모드로 선택
			if(!pcCtrl.getParent().isEditing())pcCtrl.getParent().setEditRowIndex(0)
		}else{
			if(!ValueUtil.isNull(pcCtrl.style.getClassBindInfo())){
				var actCtrl = document.querySelector("div[data-usr-uuid='"+pcCtrl.uuid+ "']");
				actCtrl.classList.add("wa-checked");
			}else{
				pcCtrl.style.addClass("wa-checked");
			}
		}
	
	}else{
		// 접근성 속성 적용 X 표시
		elSpan.classList.add("wa-uncheck-handle");
		elSpan.setAttribute("title", psProperty + " 누락");
		if(pcCtrl.getParent() instanceof cpr.controls.Grid){
			if(!ValueUtil.isNull(pcCtrl.style.getClassBindInfo())){
				var actCtrl = document.querySelector("div[data-usr-uuid='"+pcCtrl.uuid+ "']");
				actCtrl.classList.add("wa-unchecked-grid");
			}else{
				pcCtrl.style.addClass("wa-unchecked-grid");
			}
		}else{
			if(!ValueUtil.isNull(pcCtrl.style.getClassBindInfo())){
				var actCtrl = document.querySelector("div[data-usr-uuid='"+pcCtrl.uuid+ "']");
				actCtrl.classList.add("wa-unchecked");
			}else{
				pcCtrl.style.addClass("wa-unchecked");
			}
		}			
	
	}
	
	//hover시 적용 속성 정보 floating
	elSpan.addEventListener("mouseover", function(e){
		var voRect = elSpan.getBoundingClientRect();
		var vcInfo = new cpr.controls.Output();
		if(pbChecked){
			vcInfo.text = psProperty + " : " +pcCtrl[psProperty]; // 접근성 속성명 : 속성 값
		}else{
			vcInfo.text = psProperty + " 누락"; // 접근성 속성명 : 누락
		}
		pbChecked ? vcInfo.style.addClass("wa-info-checked") : vcInfo.style.addClass("wa-info-unchecked");
		app.floatControl(vcInfo, {
			top : voRect.top + "px",
			left : voRect.left + voRect.width - 1 + "px", // elSpan radious 때문에 -1px
		});
	
	});
	
	// mouseleave시 플로팅된 아웃풋 제거
	elSpan.addEventListener("mouseleave", function(e){
		app.getFloatingControls().forEach(function(each){
			if(each.style.hasClass("wa-info-checked") || each.style.hasClass("wa-info-unchecked")){
				app.removeFloatingControl(each);
			}
		});
	})
	
	// 그리드 edit 모드 전환 후 핸들 추가 (delay 없으면 핸들 생성되지 않음)
//	_.delay(function(){
		var elTargetCtrl = document.querySelector("div[data-usr-uuid='"+pcCtrl.uuid+ "']");
		if(elTargetCtrl) elTargetCtrl.appendChild(elSpan);
		
		if(elSpan.parentElement) {
			elSpan.parentElement.style.overflow = "visible";
		}
//	}, 1)
}

/**
 * 웹접근성 검토 모드 핸들을 모두 제거합니다. 
 * @param {cpr.controls.UIControl} pcCtrl
 */
function removeWaCheck(pcCtrl){
	var elSpan = document.getElementById("wa-check-handle-" + pcCtrl.uuid);
	// 핸들 제거
	if(elSpan) {
		elSpan.remove();
	}
	if(!ValueUtil.isNull(pcCtrl.style.getClassBindInfo())){
		var actCtrl = document.querySelector("div[data-usr-uuid='"+pcCtrl.uuid+ "']");
		if(!ValueUtil.isNull(actCtrl)){
			if(actCtrl.classList.contains("wa-checked")){
				actCtrl.classList.remove("wa-checked");
			}else if(actCtrl.classList.contains("wa-unchecked")){
				actCtrl.classList.remove("wa-unchecked");
			}else if(actCtrl.classList.contains("wa-checked-grid")){
				actCtrl.classList.remove("wa-checked-grid");
			}else if(actCtrl.classList.contains("wa-unchecked-grid")){
				actCtrl.classList.remove("wa-unchecked-grid");
			}
		}
	}
	// 클래스 제거
	if(pcCtrl.style.hasClass("wa-checked")){
		pcCtrl.style.removeClass("wa-checked");
	}else if(pcCtrl.style.hasClass("wa-unchecked")){
		pcCtrl.style.removeClass("wa-unchecked");
	}else if(pcCtrl.style.hasClass("wa-checked-grid")){
		pcCtrl.style.removeClass("wa-checked-grid");
	}else if(pcCtrl.style.hasClass("wa-unchecked-grid")){
		pcCtrl.style.removeClass("wa-unchecked-grid");
	}
}

