/************************************************
 * 사이트맵.js
 * Created at 2023. 8. 29. 오후 2:01:13.
 *
 * @author ksk19
 ************************************************/

var util = createCommonUtil();


function createSitemap () {
	var vcGrpSitemap = app.lookup("grpSitemap");
	vcGrpSitemap.removeAllChildren();
	
	var dsAllMenu = app.lookup("dsAllMenu");
	dsAllMenu.clearData(false);
	
	var dsAllMenuCms = app.lookup("dsAllMenu_Cms");
	var dsAllMenuExam = app.lookup("dsAllMenu_Exam");
	
	var vaTotalData = [];
	var vaMenuId = _.clone(dsAllMenuCms.getColumnData("MENU_ID")).concat(_.clone(dsAllMenuExam.getColumnData("MENU_ID")));
	_.uniq(vaMenuId).forEach(function(menuId){
		var rowDataCmn = dsAllMenuCms.findFirstRow("MENU_ID == '" + menuId + "'");
		if(rowDataCmn) {
			vaTotalData.push(rowDataCmn.getRowData());
		} else {
			var rowDataExam = dsAllMenuExam.findFirstRow("MENU_ID == '" + menuId + "'");
			if(rowDataExam) {
				vaTotalData.push(rowDataExam.getRowData());
			}
		}
	});
	dsAllMenu.build(vaTotalData);

	var voParentRows = dsAllMenu.findAllRow("UP_MENU_ID == ''");
	var voGrpSitemapLayout = vcGrpSitemap.getLayout();
	voGrpSitemapLayout.setColumns(["1fr", "1fr", "1fr", "1fr"]);
	voGrpSitemapLayout.setRows((function(pnItemCnt){
		var result = [];
		var vnTarget = parseInt(pnItemCnt/4) + 1;
		for(var idx = 0; idx < vnTarget; idx++){
			result.push("1fr");
		}
		return result;
	})(voParentRows.length-1));
	
	voParentRows.forEach(function(/* cpr.data.IDataRow*/ row, idx){
		var vcGrpSng = new cpr.controls.Container();
		vcGrpSng.style.setClasses(["card"]);
		var formlayout = new cpr.controls.layouts.FormLayout();
		formlayout.setRows(["1fr"]);
		formlayout.setColumns(["1fr"]);
		vcGrpSng.setLayout(formlayout);
		
		var vcSngSitemap = new cpr.controls.SideNavigation();
		vcSngSitemap.style.setClasses([""]);
		vcSngSitemap.indent = 0;
		vcSngSitemap.addEventListener("node-close", function(e){
			e.preventDefault();
		});
		vcSngSitemap.setItemSet(dsAllMenu, {
			"label": "MENU_NM",
			"value": "MENU_ID",
			"parentValue": "UP_MENU_ID"
		});
		vcSngSitemap.setTreeFilter("hasAncestor('" + row.getValue("MENU_ID") + "')");
		vcGrpSng.addChild(vcSngSitemap, {
			rowIndex : 0,
			colIndex : 0
		});
		vcGrpSitemap.addChild(vcGrpSng, {
			rowIndex : parseInt(idx/4),
			colIndex : parseInt(idx%4)
		});
		vcSngSitemap.expandAllItems();
	});
}


/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	util.Submit.send(app, "subOnLoad_Exam", function(pbSuccess){
		util.Submit.send(app, "subOnLoad_Cms", function(pbSuccess2){
			if(pbSuccess && pbSuccess2) {
				createSitemap();
			}
		});
	});
}
