/************************************************
 * Breadcrumbs.js
 * Created at 2022. 5. 26. 오전 10:25:58.
 *
 * @author ryu
 ************************************************/

/**
 * 내비게이션 구분자
 * @type {String}
 */
var msSeparator = ",";

var util = createCommonUtil();

/**
 * 브래드크럼블 아이템을 동적으로 생성합니다.
 */
function createBreadcrumbItems() {
	var vsNavigation = app.getAppProperty("navigation"); // 내비게이션 값
	
	var vcGrpBc = app.lookup("grpBc");
	
	// 브래드크럼블 아이템 초기화
	vcGrpBc.removeAllChildren(true);
	
	for(var idx = 0; idx < vaNavigation.length; idx++){
		var vsText = vaNavigation[idx];
		
		var vcBc = new cpr.controls.Output();
		vcBc.value = vsText;
		vcBc.style.setClasses(["breadcrumb-item"]);
		
		vcGrpBc.addChild(vcBc, {
			autoSize: "width",
			height: "20px"
		});
	}
}

/**
 * 섹션 네비게이션을 부모의 루트 컨테이너의 섹션 타이틀을 토대로 동적으로 생성합니다.
 */
function createSectionNavigation() {
	var voHostAppIns = app.getHostAppInstance();
	var voRootAppIns = app.getRootAppInstance();
	if (voHostAppIns){
		var vcGrpHostCont = voHostAppIns.getContainer();
		var embApp = voRootAppIns.lookup("eaCn");
		var vcGrpSctNav = app.lookup("grpSctNav");
		vcGrpHostCont.getAllRecursiveChildren(false).filter(function(each){
			return each instanceof udc.pb.SectionTitle;
		}).forEach(function(each){
			var vcSectionNav = new cpr.controls.Button();
			vcSectionNav.value = each.title;
			vcSectionNav.style.setClasses(["btn", "btn-at"]);
			vcSectionNav.addEventListener("click", function(e){
				
				// Main 화면에서 임베디드앱 컨트롤이 그룹 안에 감싸져 있는 경우 
				if(embApp){
					var vcGrpMdiCont = embApp.getParent();
					// actualRect.top-헤더 높이(120)
					var embRectTop = each.getActualRect().top-120
					vcGrpMdiCont.scrollTo(0, embRectTop);
				}else{
					vcGrpHostCont.scrollTo(0, each.getActualRect().top-120);
				}
			});
			vcGrpSctNav.addChild(vcSectionNav, {
				autoSize: "width",
				height: "34px"
			});
			cpr.core.DeferredUpdateManager.INSTANCE.update();
		});
	}
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
		createSectionNavigation();
	});
	
	if(location.host.indexOf("127.0.0.1") == -1) {
		// 실제 빌드 되었을 때, "앱열기" 버튼 보이지 않도록 수정
		app.lookup("grpTitleWrap").getLayout().setColumnVisible(3, false);
	}
}

/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e){
	if (e.property == "bookmark"){
		app.lookup("cbxBkmrk").checked = e.newValue;
	} else if (e.property == "navigation") {
		createBreadcrumbItems();
	}
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 * CheckBox의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onCbxBkmrkValueChange(e){
	var cbxBkmrk = e.control;
	app.setAppProperty("bookmark", cbxBkmrk.checked, false);
}

/*
 * "앱열기" 버튼(btnPrvw)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnPrvwClick(e){
	var btnPrvw = e.control;
	
	util.procEb6Privew(app);
}

/*
 * "PDF다운" 버튼(btnPdfDown)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnPdfDownClick(e){
	var btnPdfDown = e.control;

	var hostAppInst = app.getHostAppInstance();
	var vsGrpIds = app.getAppProperty("exportPdfGrpIds");
	
	if(ValueUtil.isNull(vsGrpIds)){
		hostAppInst.getContainer().htmlAttr("uuid", hostAppInst.getContainer().uuid);
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
			exportPdf(hostAppInst.getContainer());
		});
		
	} else {
		var vaGrpIds = vsGrpIds.split(",");
		vaGrpIds.forEach(function(each, idx){
			if(vaGrpIds.length-1 == idx){
				var pbLastIdx = true;
			}
			hostAppInst.lookup(each.trim()).htmlAttr("uuid", hostAppInst.lookup(each.trim()).uuid);
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
				exportPdf(hostAppInst.lookup(each.trim()), true, pbLastIdx);
			});
		});
		
//		exportPdf2(vaGrpIds);
	}
	
}


/**
 * 앱 컨텐츠를 pdf 내보내기한다.<br>
 * <br>
 * 참고 url
 * https://developer.mozilla.org/ko/docs/Web/HTML/Element/canvas<br>
 * https://github.com/eKoopmans/html2pdf.js/projects/5<br>
 * https://ekoopmans.github.io/html2pdf.js<br>
 * https://rawgit.com/MrRio/jsPDF/master/docs/jspdf.js.html
 * @param {cpr.controls.UIControl} control
 */
function exportPdf(control, isMultiple, isLastIdx){
	var voHostAppIns = app.getHostAppInstance();
	var targetDOM =  document.querySelector("[data-usr-uuid = \""+control.htmlAttr("uuid") + "\"]");
	if(!targetDOM) return;
	
	html2pdf().from(targetDOM).set({
		margin: 10,
		filename: voHostAppIns.app.title + '.pdf',
		image: { type: "jpeg", quality: 1 },
		html2canvas: {
			scale: 3
		},
		jsPDF: {
			orientation: 'landscape',
			unit: 'px',
			format: [1200, 1650],
			compress: true,
		}
	}).save().then(function(){
	});
}

function exportPdf2(/* Array*/paCtrlId){
	var voHostAppIns = app.getHostAppInstance();
	var doc = new jsPDF('p', 'mm');
	paCtrlId.forEach(function(each, idx){
		var targetDOM = document.querySelector("#uuid-" + voHostAppIns.lookup(each.trim()).uuid);
		var workFlow = html2pdf().from(targetDOM).set({
			margin: 10,
			html2canvas: {
				scale: 1
			}
		}).outputImg().then(function(imgData){
			var canvas = workFlow.get().prop.canvas;
			     
		    var imgWidth = 190; // 이미지 가로 길이(mm) / A4 기준 210mm
		    var pageHeight = imgWidth * 1.414;  // 출력 페이지 세로 길이 계산 A4 기준
		    var imgHeight = canvas.height * imgWidth / canvas.width;
		    var heightLeft = imgHeight;
		    var margin = 10; // 출력 페이지 여백설정
		    
		    var position = 20;
		       
		    // 첫 페이지 출력
		    doc.addImage(imgData, 'jpeg', margin, position, imgWidth, imgHeight);
		    heightLeft -= pageHeight;
		         
		    // 한 페이지 이상일 경우 루프 돌면서 출력
		    while (heightLeft >= 20) {
		        position = heightLeft - imgHeight;
		        doc.addPage();
		        doc.addImage(imgData, 'jpeg', margin, position, imgWidth, imgHeight);
		        heightLeft -= (pageHeight + 28);
		    }
		 
		}).then(function(){
			if(paCtrlId.length -1 == idx){
				// 파일 저장
				doc.save(voHostAppIns.app.title + '.pdf');
				util.hideLoadMask(app);
			}
		});
		
	});
	
}

/*
 * "HTML파일 생성" 버튼(btnHtml)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnHtmlClick(e){
	var btnHtml = e.control;
	
	if(app.getHostAppInstance()) {
		var vsFileName = app.getHostAppInstance().app.title;
		makeHtmlFile(vsFileName);
	}
}

/*
 * 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var vsAppId = "";
	if (typeof eb6Preview != "undefined") {
		vsAppId = app.getHostAppInstance().app.id + ".clx.html";
	} else {
		var vsUrl = "https://edu.tomatosystem.co.kr/wa-guide/main.html?goToAppPage=";
		vsAppId = vsUrl + app.getHostAppInstance().app.id;
	}
	if(vsAppId != "") {
		window.open(vsAppId);
	}
}
