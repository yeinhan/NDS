/************************************************
 * comMain.js
 * @프로그램설명 : 대시보드(경륜/경정 경주일) — TV 1920x1080 전체화면, 스크롤 없음
 *
 * @작성일자 :  2026. 10. 24..
 * @작성자 : yein
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/

/* 경주 단추·표 최대 경주 수 (13~17경주) */
var RACE_MAX = 17;

/* 경주진행현황 표 헤더 행 수 (2단 헤더) */
var RACE_GRID_HEAD_ROWS = 2;

/************************************************
 ** 글로벌 함수
 ************************************************/


/************************************************
 ** 파일내 로컬변수 선언
 ************************************************/

/* 그리드 크기 감시 — 화면 종료 시 해제 */
var moResizeObserver = null;

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술
 ************************************************/

/**
 * 경주 수만큼 경주 단추 열만 보이게 한다. 숨긴 열은 1fr 계산에서 빠져 남은 단추가 폭을 나눠 갖는다.
 * @param {Number} pnRaceCnt 경주 수
 */
function setRaceBtnCount(pnRaceCnt) {
	var voLayout = app.lookup("grpRaceBtns").getLayout();
	for (var i = 0; i < RACE_MAX; i++) {
		voLayout.setColumnVisible(i, i < pnRaceCnt);
	}
}

/**
 * 경주진행현황 표 행 높이를 (표 높이 - 헤더 높이) / 행 수로 맞춰 스크롤 없이 채운다.
 * 데이터 조회 후, 화면 크기 변경 시 호출한다.
 * @param {Number} pnGridH? 그리드 높이(px). 생략하면 getActualRect() 높이를 쓴다.
 */
function fitRaceGridRows(pnGridH) {
	var vcGrid = app.lookup("grdRace");
	var vnRowCnt = vcGrid.getDataRowCount();
	if (vnRowCnt == 0) return;

	var vnHeadH = 0;
	for (var i = 0; i < RACE_GRID_HEAD_ROWS; i++) {
		vnHeadH += vcGrid.header.getRowHeight(i);
	}

	/* 위·아래 보더 2px 제외, 소수점 높이는 버려 마지막 행이 넘치지 않게 한다 */
	var vnGridH = pnGridH != null ? pnGridH : vcGrid.getActualRect().height;
	var vnBodyH = Math.floor(vnGridH - vnHeadH - 2);
	var vnRowH = Math.floor(vnBodyH / vnRowCnt);

	/* 숨겨진 탭 등 크기가 없을 때는 건너뛰고, 보이는 순간 다시 계산한다 */
	if (vnRowH < 1) return;

	/* 나누고 남은 픽셀은 앞쪽 행부터 1px씩 더해 마지막 행 아래 보더가 표 끝에 닿게 한다 */
	var vnRemain = vnBodyH - vnRowH * vnRowCnt;
	for (var j = 0; j < vnRowCnt; j++) {
		vcGrid.setRowHeight(j, [vnRowH + (j < vnRemain ? 1 : 0)]);
	}
}

/**
 * 경주 수에 맞춰 단추 줄과 표를 다시 맞춘다. 경주진행현황 조회 후 호출한다.
 */
function doRaceLayout() {
	var vcGrid = app.lookup("grdRace");
	setRaceBtnCount(vcGrid.getDataRowCount());

	/* 렌더링 후 실제 크기 기준으로 계산 */
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
		if (!app.disposed) fitRaceGridRows();
	});
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시)
 ************************************************/

/*
 * Body에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	doRaceLayout();

	/* 창 크기뿐 아니라 메인의 MDI 확장(btnUtilZoom)·사이드 메뉴 접기·숨김 탭 표시처럼
	 * 창은 그대로이고 화면 영역만 바뀌는 경우도 잡도록 그리드 요소 크기를 감시한다.
	 * (eXBuilder6 컨트롤은 이 경우 resize 이벤트를 주지 않음) */
	if (window.ResizeObserver) {
		/* getActualRect()는 이 시점에 이전 크기를 줄 때가 있어, 실제 DOM 높이로 계산한다.
		 * 행 높이 변경은 그리드 크기를 바꾸지 않으므로 다시 콜백이 돌지 않는다.
		 * (대시보드는 한 화면에 하나만 뜬다는 전제로 ._dashboard 그리드를 찾는다) */
		moResizeObserver = new ResizeObserver(function(paEntries) {
			if (app.disposed) return;
			var voTarget = paEntries[paEntries.length - 1].target;
			fitRaceGridRows(voTarget.getBoundingClientRect().height);
		});
		var vaGridEl = document.querySelectorAll("._dashboard .cl-grid");
		for (var i = 0; i < vaGridEl.length; i++) {
			moResizeObserver.observe(vaGridEl[i]);
		}
	}
}

/*
 * Body에서 unload 이벤트 발생 시 호출.
 * 앱이 언로드된 후 발생하는 이벤트입니다.
 */
function onBodyUnload(e) {
	if (moResizeObserver) moResizeObserver.disconnect();
}
