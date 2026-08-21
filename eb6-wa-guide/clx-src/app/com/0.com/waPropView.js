/************************************************
 * waPropView.js
 * Created at 2023. 8. 8. 오전 10:31:39.
 *
 * @author daye
 ************************************************/

/************************************************
 * 전역변수
 ************************************************/
/**
 * 각 컨트롤의 물리명 및 논리명
 */
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

/************************************************
 * 사용자 정의 함수
 ************************************************/
/**
 * 로드 시 탭폴더 내 컨텐츠를 생성한다.
 * @param {cpr.controls.TabItem} poTabItem
 * @param {cpr.data.DataView} pcDataset
 * @param {String} psControlNm
 */
function _createTabContent(poTabItem, pcDataset, psControlNm) {
	var vcGroup = new cpr.controls.Container();
	var voFormLayout = new cpr.controls.layouts.FormLayout();
	voFormLayout.setRows(["1fr", "150px", "30px"]);
	voFormLayout.setColumns(["1fr"]);
	voFormLayout.horizontalSpacing = 10;
	voFormLayout.verticalSpacing = 10;
	voFormLayout.topMargin = 10;
	voFormLayout.leftMargin = 10;
	voFormLayout.rightMargin = 10;
	voFormLayout.bottomMargin = 10;
	voFormLayout.userResizingMode = "standard";
	vcGroup.setLayout(voFormLayout);
	
	var vcGrid = new cpr.controls.Grid();
	vcGrid.init({
		"dataSet": pcDataset,
		"columns": [{
				"width": "100px"
			},
			{
				"width": "100px"
			},
			{
				"width": "300px"
			}
		],
		"header": {
			"rows": [{
				"height": "30px"
			}],
			"cells": [{
					"constraint": {
						"rowIndex": 0,
						"colIndex": 0
					},
					"configurator": function(cell) {
						cell.text = "속성";
					}
				},
				{
					"constraint": {
						"rowIndex": 0,
						"colIndex": 1
					},
					"configurator": function(cell) {
						cell.text = "값";
					}
				},
				{
					"constraint": {
						"rowIndex": 0,
						"colIndex": 2
					},
					"configurator": function(cell) {
						cell.text = "지침";
					}
				}
			]
		},
		"detail": {
			"rows": [{
				"height": "30px"
			}],
			"cells": [{
					"constraint": {
						"rowIndex": 0,
						"colIndex": 0
					},
					"configurator": function(cell) {
						cell.columnName = "propNm";
						cell.keepMerged = true;
						cell.suppressible = true;
						cell.control = (function() {
							var output_1 = new cpr.controls.Output();
							output_1.bind("value").toDataColumn("propNm");
							return output_1;
						})();
						cell.controlConstraint = {};
					}
				},
				{
					"constraint": {
						"rowIndex": 0,
						"colIndex": 1
					},
					"configurator": function(cell) {
						cell.columnName = "propVal";
						cell.keepMerged = true;
						cell.suppressible = true;
						cell.suppressRef = "0";
						cell.control = (function() {
							var output_2 = new cpr.controls.Output();
							output_2.bind("value").toDataColumn("propVal");
							return output_2;
						})();
						cell.controlConstraint = {};
					}
				},
				{
					"constraint": {
						"rowIndex": 0,
						"colIndex": 2
					},
					"configurator": function(cell) {
						cell.columnName = "relatedWaInst";
						cell.keepMerged = true;
						cell.suppressible = true;
						cell.suppressRef = "1";
						cell.control = (function() {
							var output_3 = new cpr.controls.Output();
							output_3.bind("value").toDataColumn("relatedWaInst");
							return output_3;
						})();
						cell.controlConstraint = {};
					}
				}
			]
		}
	});
	vcGrid.style.setClasses(["table-prop"]);
	vcGrid.suppressedCellType = "merged";
	vcGrid.clickMode = "edit";
	vcGrid.resizableColumns = "all";
	vcGrid.autoRowHeight = "all";
	vcGroup.addChild(vcGrid, {
		rowIndex : 0,
		colIndex : 0
	});
	
	var vaCode = pcDataset.getColumnData("code");
	if(vaCode.join("").length == 0) {
		voFormLayout.setRowVisible(1, false);
	} else {
		var vcCodeMirror = new udc.exam.udcExamAce();
		vcCodeMirror.value = vaCode.join("\n\n");
		vcGroup.addChild(vcCodeMirror, {
			rowIndex : 1,
			colIndex : 0
		});
	}
	
	var vcGuideButton = new cpr.controls.Button();
	vcGuideButton.style.setClasses(["btn-txt", "btn-i-docs", "text-link"]);
	vcGuideButton.icon = "../icon.png";
	vcGuideButton.ariaButtonType = "link";
	vcGuideButton.value = "컨트롤 가이드 바로가기"; 
	vcGuideButton.addEventListener("click", function(e){
		try {
			var voRootAppIns = app.getRootAppInstance();
			var voAllMenu = voRootAppIns.callAppMethod("getAllMenu");
			voAllMenu.findAllRow("MENU_ID == '" + psControlNm + "'").forEach(function(row) {
				voRootAppIns.callAppMethod("openPage", row);
			})
			app.close();
		} catch (error){
			alert("서비스 준비중입니다. (" +  psControlNm + ")");
		}
		
	});
	vcGroup.addChild(vcGuideButton, {
		rowIndex : 2,
		colIndex : 0
	});
	
	poTabItem.content = vcGroup;
}

/************************************************
 * 이벤트 핸들러
 ************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	
	// 최초 탭폴더의 모든 탭아이템을 삭제한다.
	var vcTabProp = app.lookup("tbfProp");
	vcTabProp.getTabItems().forEach(function(item) {
		vcTabProp.removeTabItem(item);
	});
	
	try {
		var initValue = app.getHostProperty("initValue");
		if (initValue) {
			/** @type cpr.data.DataSet */
			var vcDataset = initValue.dataset;
			if (vcDataset) {
				// key 에 해당하는 데이터만 dsPropView 에 copy한다. (여러개의 컨트롤 존재 가능함)
				var vcDsProp = app.lookup("dsPropView");
				vcDataset.copyToDataSet(vcDsProp, "keyNum == \"" + initValue.keyNum + "\"");
				_.uniq(vcDsProp.getColumnData("control")).forEach(function(controlNm, idx) {
					/*
					 * 각 컨트롤 별 탭아이템, 데이터뷰를 생성한다.
					 * 데이터뷰id : dsPropView_contorl_key
					 */
					var vcDvPropView = new cpr.data.DataView("dsPropView_" + controlNm + "_" + initValue.keyNum, vcDsProp);
					vcDvPropView.parseData({
						"filterCondition": "control == '" + controlNm + "'"
					});
					vcDvPropView.setRowStateAll(cpr.data.tabledata.RowState.UNCHANGED);
					
					var voTabItem = new cpr.controls.TabItem();
					voTabItem.text = moCtrlNm[controlNm] || controlNm;
					vcTabProp.addTabItem(voTabItem);
					if (idx == 0) vcTabProp.setSelectedTabItem(voTabItem);
					
					// 탭아이템 내부 컨텐츠를 생성한다.
					_createTabContent(voTabItem, vcDvPropView, controlNm);
				});
			}
		}
		
	} catch (error) {
		console.warn(error);
	}
}