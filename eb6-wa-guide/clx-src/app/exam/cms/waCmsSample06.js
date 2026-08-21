/************************************************
 * Dashboard.js
 * Created at 2021. 2. 17. 오후 4:18:56.
 *
 * @author ryu
 ************************************************/

var slidify = cpr.core.Module.require("module/extension/swiper").slidify;


/**
 * 배너 영역에 표시될 페이지네이션을 작성합니다.
 */
function setPaginationControls(slide) {
	var vcGrpAbleSrvReq = app.lookup("grpBnr");
	
	/* 페이지네이션 불릿 */
	var vcGrpPgBlt = app.lookup("grpPgBlt");
	
	vcGrpPgBlt.removeAllChildren(true);
	
	var vnPgCnt = vcGrpAbleSrvReq.getChildrenCount();
	for(var idx = 0; idx < vnPgCnt; idx++){
		var vcPgBlt = new cpr.controls.Output();
		vcGrpPgBlt.addChild(vcPgBlt, {
			width: "6px",
			height: "6px"
		});
	}
}


/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(/* cpr.events.CEvent */ e){
	var checkBox = app.lookup("cbxPlayPause");
	var vcGrpBnr = app.lookup("grpBnr");
	var vcGrpPgBlt = app.lookup("grpPgBlt");
	var slide = slidify(vcGrpBnr, checkBox);
	slide.showCount = 1;
	slide.showPagination = true;
	slide.adjustPagination = true;
	slide.autoPlayDelay = 3;
	slide.autoPlayDuration = 0;
	slide.useInfiniteScroll = true;
	//slide.navigationButtonStyle = "none";
	slide.onChangePagination = function() {
		var vcLblPgTxt = app.lookup("lblPgTxt");
		var vnPgNum = slide.getActivePage();
		vcLblPgTxt.value = (vnPgNum + 1) + " / " + vcGrpPgBlt.getChildrenCount();
	}
	slide.start();
	
	
	/* 배너 영역 슬라이드에서 자동재생 제어 */
	app.lookup("cbxPlayPause").addEventListener("value-change", function(e){
		var vbChekced = e.control.checked;
		if (vbChekced){
			slide.autoPlay();
		} else {
			slide.stopAutoPlay();
		}
	});
	
	app.lookup("btnPrev").addEventListener("click", function(e){
		slide.showPrev();		
	});
	app.lookup("btnNext").addEventListener("click", function(e){
		slide.showNext();
	});
	
	setPaginationControls(slide);
}


/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(/* cpr.events.CEvent */ e){
}