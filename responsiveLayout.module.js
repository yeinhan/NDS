/************************************************
 * responsiveLayout.module.js
 * Created at 2026. 6. 30. 오전 10:18:15.
 *
 * @author ryu
 ************************************************/
/**
 * responsiveLayout.module.js
 * -----------------------------------------------------------------------------
 * eXBuilder6 (TomatoSystem) 반응형 레이아웃 모듈.
 *
 * ■ 빠른 시작 — 여기까지만 읽어도 기본 사용이 가능하다. (상세는 아래 "상세 설명")
 *
 *   1) 공통 루프에 1줄 (화면 JS 는 0줄):
 *        if (each instanceof cpr.controls.Container && Responsive.isTarget(each)) { Responsive.attach(each); }
 *   2) 디자이너에서 UserAttr 선언 (키 = "rl-" + 논리 스크린명 + 접미사):
 *        [그룹]  rl-<screen>-layout     = form|vertical|flow|xy
 *                rl-<screen>-props      = key:value; …            (';' 구분, columns/rows 는 '|')
 *                rl-<screen>-columns    = N                       (폼 자동 리플로우 + 열 개수)
 *                rl-<screen>-order      = byIndex:2,0,1 | moves:0>2 | reorderOnly:true
 *                rl-<screen>-class      = 클래스1 클래스2          (공백 구분)
 *                rl-<screen>-form       = pairs:N                 (데이터 폼 생성기)
 *                rl-form                = label:…; field:…; row:… (폼 공통)
 *        [자식]  rl-<screen>-constraint = key:value; …            (hidden:true|false 포함)
 *                rl-<screen>-class / rl-<screen>-cprops           (cprops 는 간격 화이트리스트만)
 *                rl-form-item / rl-<screen>-form-item = full | break | span:N
 *                rl-auto-row            = auto|auto@min40          (스크린 무관, 콘텐츠 높이)
 *      기본 스크린 : pc(=default·desktop, 베이스) / tablet / mobile — Responsive.setup 으로 변경.
 *
 *   ★ 주의 (자주 하는 실수)
 *      - 버티컬 distribution=fill 은 "가로"만 채운다 → rl-auto-row 는 height 로만 적용된다
 *      - flow→vertical 전환은 정렬을 매핑하지 않는다 (vertical 기본 distribution=fill)
 *      - 자식마다 colIndex 를 직접 주는 폼에는 rl-<screen>-columns(리플로우)를 쓰지 않는다
 *      - 구획 값 개수가 열 개수(N)와 다르면 마지막 값으로 채워지고 console.error 가 남는다
 *      - rl-* 키 오타는 attach 시 콘솔 경고로 검출된다. 규칙이 안 먹으면 콘솔부터 확인
 *      - 잘못된 API 사용(비컨테이너 attach, setup 인자 오류)은 cpr.exceptions 예외를 던진다
 *
 *   진단 : Responsive.explain(container) — 파싱·적용 상태 출력
 *          Responsive.listAllAttrKeys()  — 유효 UserAttr 키 전량
 *   문의 : 토마토시스템 테크돔(TechDome) 사이트
 * -----------------------------------------------------------------------------
 * ■ 상세 설명
 *
 * - util 과 무관한 독립 전역 `Responsive` 로 노출 (ES5 / IE11 호환, 프로토타입 패턴).
 *   파일 자체는 IIFE 로 감싸지 않는다 — eXBuilder6 컴파일러가
 *   cpr.core.Module.define(uri, function(exports, globals, module){ … }) 로 감싸므로
 *   최상위 선언은 이미 모듈 스코프에 있다. 말미의 globals.Responsive 로만 외부에 노출된다.
 * - 그룹(컨테이너)의 레이아웃 타입 전환 / 레이아웃 속성 / 컨트롤 재배치(위치·크기·순서) /
 *   표시·숨김 / 클래스 토글을 appInstance 의 screen-change 에 맞춰 처리한다.
 * - 규칙은 컨트롤의 UserAttr(평문 String) 에 인코딩하거나, init/attach 시 configOpt(JS)로 보완한다.
 *   (우선순위: configOpt > UserAttr)
 * - 원복 기준은 base 스크린(기본 "pc", setup 의 sBaseScreen 또는 정의의 bBase 로 지정). 미정의 스크린에서는
 *   base 규칙 또는 attach 시 스냅샷한 원본으로 복귀한다.
 * - 실제 스크린명 여러 개를 한 논리명으로 묶으려면 스크린 정의의 aActual 에 나열한다.
 *   기본값: pc(default, desktop) / tablet / mobile — DEFAULT_SCREENS 한 곳에서 바꾼다.
 *
 * 지원 레이아웃 : form / vertical / flow / xy
 *   - 반응형 XY 는 별도 클래스(ResponsiveXYLayout) 대신 `xy` + 스크린별 컨스트레인트로 동일 결과를 낸다.
 *
 * UserAttr 인코딩 (키 = ATTR.PREFIX + screen + suffix. 키 추가·변경은 ATTR 블록 한 곳에서.
 *                  rl-* 속성이 하나라도 있으면 대상)
 *   [그룹]  rl-<screen>-layout           = form|vertical|flow|xy     (생략 시 "베이스 타입" 유지 — 전환순서 무관)
 *           rl-<screen>-props            = key:value; ... (구분자 ';'. 구획: columns/rows. margins:상 우 하 좌 단축 지원)
 *           rl-<screen>-class            = 클래스1 클래스2 (그룹에 토글, 공백 구분, 모듈 관리분만)
 *           rl-<screen>-columns          = N (폼 자동 리플로우 트리거 겸 "열 개수 N"의 권위)
 *           rl-<screen>-order            = reorderOnly:true; byIndex:2,0,1  또는  moves:0>2,1>0
 *   [자식]  rl-<screen>-constraint       = key:value; ... (레이아웃별 컨스트레인트. 폼 정렬값 대소문자 무관)
 *                                          표시/숨김은 여기 hidden:true|false 로 일원화(모든 레이아웃 공통)
 *           rl-<screen>-class            = 클래스1 클래스2 (그룹 직계 자식 컨트롤에 토글)
 *           rl-<screen>-cprops           = key:value; ... (컨트롤 "자체 속성" 변경. 간격 관련 화이트리스트만.
 *                                          예 horizontalSpacing/verticalSpacing/itemSpacing/indent/space 등)
 *   [자식·스크린무관] rl-auto-row        = auto|auto@min40|true 등 (그 컨트롤을 "콘텐츠 높이"로)
 *                                          · 폼   → 그 컨트롤이 속한 행을 auto(px@auto) 로 생성
 *                                          · 버티컬/플로우 → constraint autoSize 에 height 부여(width 있으면 both).
 *                                            (버티컬 distribution=fill 은 "가로"만 채우므로 height 는 유효, width 는 both 대신 height)
 *
 * 타입 전환 시 크기/정렬 이월(flow↔vertical): 명시 rl-constraint 가 없으면 소스의 width/height 를 이월(autoSize 적용
 *   축은 제외, 폼/xy 제외). 정렬 매핑은 vertical→flow 방향만: vertical.distribution(leading/center/trailing)
 *   → flow.horizontalAlign(left/center/right). flow→vertical 은 매핑하지 않고 vertical 기본 distribution=fill 사용.
 *   명시 rl-constraint/rl-props 가 있으면 그 값이 우선.
 *
 * 값 해석 : true/false → Boolean, 순수숫자 → Number, 그 외("0px","1fr","FILL"/"fill") → String.
 *
 * 사용 가이드
 *  - rl-<screen>-columns : 폼을 N칸으로 "자동 재배치"할 때 사용(열 개수 N 을 결정). 폭을 안 주면 등분할 그리드.
 *    자식마다 colIndex 를 직접 주는 폼에는 columns 를 쓰지 않는다.
 *  - props 의 columns/rows(폭·높이) 값 개수 규칙(대상 개수 N = rl-columns 값, 없으면 현재 적용된 칸/행 수):
 *      · 값 1개 & N>1 → 템플릿(하나를 N개로 복제)   · 값 N개 → 명시 목록(정확 일치)
 *      · 그 외(불일치, 1 아님) → 마지막 값으로 N개까지 채움 + console.error
 *    columns/rows 를 아예 안 주면 그 축의 구조는 "현재 적용된 구조(=PC/default)"를 그대로 유지한다.
 *  - rl-auto-row : 그 컨트롤을 "콘텐츠 높이"로. 폼에선 그 행을 auto 로(그룹 전체 행은 props.rows 로 일괄, 특정
 *    한 행만 예외 처리에 사용). 버티컬/플로우에선 그 컨트롤 constraint 의 autoSize 로 height 를 부여한다.
 *    폼 행높이 우선순위: 컨트롤(rl-auto-row) > 그룹(props.rows) > 전역 기본.
 *
 * 구성 (프로토타입 패턴, 목적별 클래스)
 *   AttrKey          UserAttr 키 정의 1개(접미사·파서·필드명·기본값) — 키 추가는 ATTR 한 곳에서
 *   ScreenMap        스크린 정의 테이블 → 논리명 목록·실제명 매핑·베이스를 파생·검증
 *   ResponsiveConfig 런타임 설정(전역 기본 → 앱 단위 → attach 스냅샷의 3계층)
 *   DivisionSpec     폼 구획 1개 ("1fr@min120@auto")
 *   DivisionList     한 축(열/행)의 구획 목록 — 파싱·확장·적용·스냅샷
 *   AppContext       appInstance 1개 = 리스너 1쌍 + LayoutGroup 목록
 *   GroupBaseline    디자인타임 스냅샷(원복 기준. 절대 변형하지 않는다)
 *   GroupRule        스크린 1개분 그룹 규칙 / ChildRule 자식 1개의 스크린별 규칙 + 적용 상태
 *   LayoutGroup      컨테이너 1개의 규칙 적용/원복
 *   ApplyPlan        스크린 1개분 계산 결과(cpr 미변경 · 경로 독립성의 근거)
 *
 * 공개 API
 *   Responsive.isTarget(container)                 // rl-* 속성 보유 컨테이너인지 판별(공통 루프 filter용)
 *   Responsive.attach(container [, configOpt])     // 컨테이너 단위 등록 + 현재 스크린 즉시 적용(권장 진입점)
 *                                                  //   반환값은 LayoutGroup — .apply(screen) / .restore() 로 직접 제어 가능
 *   Responsive.init(appInstance [, configOpt])     // 루트부터 대상 그룹 스캔 → 일괄 attach
 *   Responsive.detach(container)                   // 등록 해제 + 디자인타임 원복(attach 와 대칭)
 *   Responsive.dispose(appInstance)                // 앱 단위 리스너 해제 + 정리
 *   Responsive.refresh(appInstance)                // 현재 스크린 재적용
 *   Responsive.applyScreen(appInstance, name)      // 특정 스크린 강제 적용(실제명/논리명 모두 허용)
 *   Responsive.setup([appInstance,] options)       // 설정 지정. appInstance 를 주면 그 앱에만 적용
 *   Responsive.getConfig([appInstance])            // 유효 설정 조회
 *   Responsive.ATTR                                // 동결된 UserAttr 키 스키마 (Object.freeze)
 *   Responsive.listAllAttrKeys([appInstance])      // 생성 가능한 UserAttr 키 전량(검증·디버깅용)
 *   Responsive.explain(container)                  // 파싱된 규칙·적용 상태 콘솔 출력(진단용)
 *
 * setup 옵션
 *   aScreens         스크린 정의. 세 형식 모두 허용
 *                      ① [{ sName, aActual, bBase }, …]        (정식)
 *                      ② ["pc", "tablet", "mobile"]             (실제명 = 논리명, 첫 항목이 베이스)
 *                      ③ { "pc": ["default", "EXB-FULL"], … }   (논리명 → 실제명들, 첫 키가 베이스)
 *   sBaseScreen      원복 기준 "논리" 스크린명 (실제명이 아님)
 *   sAutoRowAttr     콘텐츠 높이 힌트 속성명 (기본 "rl-auto-row")
 *   oDiv             { sColumn, sRow, sAutoRow } 자동 리플로우 기본 구획식
 *   moLayoutDefaults { flow: {...}, vertical: {...} } 타입 변경 시 기본 속성
 *   moCPropAllow     rl-cprops 허용 속성 추가
 *   sLabelClass      폼 생성기(Responsive.Form)의 라벨 식별 클래스 (기본 "label")
 *
 *   예) Responsive.setup({ aScreens: ["full", "wide", "tablet", "mobile"], sBaseScreen: "full" });
 *       Responsive.setup(appInstance, { aScreens: { "wide": ["wide", "desktop"] } });  // 이 앱만
 *   설정은 attach 시점에 스냅샷되므로, 이미 붙인 그룹은 이후 setup 변경에 영향받지 않는다.
 *
 * 기존 공통 루프 교체 예:
 *   if (each instanceof cpr.controls.Container && Responsive.isTarget(each)) { Responsive.attach(each); }
 * -----------------------------------------------------------------------------
 */

/* =========================================================================
 * AttrKey — UserAttr 키 정의 1개
 * -------------------------------------------------------------------------
 * 접미사 · 파싱 방법 · 저장 필드명 · 기본값을 한 곳에 묶는다.
 * 아래 ATTR 선언보다 위에 있어야 한다(ATTR 은 실행문이며 new AttrKey 를 호출한다).
 * ATTR 에 넘기는 파서들은 반드시 "함수 선언문"이어야 한다 — 호이스팅에 의존한다.
 * ========================================================================= */
/**
 * UserAttr 키 정의 1개.
 *
 * @constructor
 * @param {String} sSuffix 키 접미사. 예) "-props"
 * @param {String} sField  파싱 결과가 담길 필드명. 예) "oProps"
 * @param {Function} fParse 원문 → 값 변환기. null 이면 원문 문자열 그대로
 * @param {*} vDefault 규칙이 없을 때의 기본값
 */
function AttrKey(sSuffix, sField, fParse, vDefault) {
	/** @type {String} 키 접미사 */
	this.sSuffix = sSuffix;
	/** @type {String} 저장 필드명 */
	this.sField = sField;
	/** @type {Function} 원문 파서 (없으면 null) */
	this.fParse = fParse || null;
	/** @type {*} 규칙 부재 시 기본값 */
	this.vDefault = vDefault;
}

/**
 * 이 키의 전체 UserAttr 이름을 만든다.
 *
 * @param {String} sScreen 논리 스크린명
 * @returns {String} 예) keyFor("tablet") → "rl-tablet-props"
 */
AttrKey.prototype.keyFor = function (sScreen) {
	return ATTR.PREFIX + sScreen + this.sSuffix;
};

/**
 * 컨트롤에서 이 키의 원문을 읽는다.
 *
 * @param {cpr.controls.Control} c 대상 컨트롤
 * @param {String} sScreen 논리 스크린명
 * @returns {String} 값이 없으면 ""
 */
AttrKey.prototype.read = function (c, sScreen) {
	return getUserAttr(c, this.keyFor(sScreen));
};

/**
 * 원문을 파싱한다.
 *
 * @param {String} sRaw 원문
 * @param {cpr.controls.Control} c 경고 메시지 문맥용 대상 컨트롤
 * @param {ResponsiveConfig} oConfig 유효 설정
 * @returns {*} 파싱 결과
 */
AttrKey.prototype.parse = function (sRaw, c, oConfig) {
	return this.fParse ? this.fParse(sRaw, c, oConfig) : sRaw;
};

/** @returns {*} 이 키의 기본값 (배열·객체는 매번 새 사본) */
AttrKey.prototype.getDefault = function () {
	return copyValue(this.vDefault);
};

/* =========================================================================
 * 상수 : UserAttr 키 스키마 (동결)
 * -------------------------------------------------------------------------
 * 기존 화면(.clx)에 입력된 UserAttr 과 1:1 대응한다. 접미사 문자열은 절대 변경 금지.
 *
 *   전체 키 = PREFIX + <논리 스크린명> + <접미사>
 *   예) "rl-" + "tablet" + "-props"  →  "rl-tablet-props"
 *
 * ★ 키를 추가·변경할 때 손댈 곳은 이 블록뿐이다.
 *   탐지 목록(GROUP_KEYS/CHILD_KEYS) · 파싱 · 기본값 · 키 검증이 모두 여기서 파생된다.
 *   단, "그 값으로 무엇을 하는가"(적용 로직)는 자동화할 수 없다 — ApplyPlan.HANDLED_GROUP_FIELDS 참조.
 * ========================================================================= */
var ATTR = {

	PREFIX: "rl-",

	/* 스크린 무관 단일 키 (전체 문자열) */
	FIXED: {
		/** 이미 attach 된 컨테이너 표식 */
		CONFIGURED: "rl-responsive-configured",
		/** 자식 "콘텐츠 높이" 힌트. setup 의 sAutoRowAttr 로 변경 가능.
		 *  - 폼            : 그 컨트롤이 속한 행을 auto(0px@auto) 높이로 (값에 @min 있으면 반영)
		 *  - 버티컬/플로우 : constraint 에 autoSize="height" 부여
		 *                    (이미 "width" 면 "both"). 버티컬 fill 은 폭만 지배하므로 height 로만 */
		AUTO_ROW:   "rl-auto-row"
	},

	/* 그룹(컨테이너)에 붙는 스크린별 키
	 *                     접미사          저장 필드명   파서                기본값 */
	GROUP: {
		/** form | vertical | flow | xy */
		LAYOUT:  new AttrKey("-layout",  "sLayout",  parseLayoutType,  null),
		/** key:value; …  (구분자 ';') */
		PROPS:   new AttrKey("-props",   "oProps",   parseKeyValues,   {}),
		/** 클래스1 클래스2 (공백 구분) */
		CLASS:   new AttrKey("-class",   "aClasses", parseClassNames,  []),
		/** N — 폼 리플로우 트리거 겸 "열 개수"의 권위 */
		COLUMNS: new AttrKey("-columns", "nColumns", parseColumnCount, null),
		/** reorderOnly:true; byIndex:2,0,1  또는  moves:0>2,1>0 */
		ORDER:   new AttrKey("-order",   "oOrder",   parseOrder,       null)
	},

	/* 데이터 폼 생성기(Responsive.Form) 전용 키.
	 * 값을 좌표로 "계산"해 configOpt 로 넘기는 입력이므로 GROUP_KEYS(규칙 파싱)에는 넣지 않는다. */
	FORM: {
		/** 그룹 스크린별 : rl-<screen>-form = pairs:N */
		GROUP:       "-form",
		/** 그룹 공통 : rl-form = label:…; field:…; row:… */
		GROUP_COMMON: "rl-form",
		/** 자식 스크린별 : rl-<screen>-form-item */
		ITEM:        "-form-item",
		/** 자식 공통 : rl-form-item = full | break | span:N */
		ITEM_COMMON: "rl-form-item"
	},

	/* 자식 컨트롤에 붙는 스크린별 키 */
	CHILD: {
		/** key:value; …  (hidden:true|false 포함. 표시/숨김은 여기로 일원화) */
		CONSTRAINT: new AttrKey("-constraint", "oConstraint", parseKeyValues,  null),
		/** 클래스1 클래스2 (공백 구분) */
		CLASS:      new AttrKey("-class",      "aClasses",    parseClassNames, null),
		/** 컨트롤 "자체 속성" 변경. 간격 관련 화이트리스트만 허용 */
		CPROPS:     new AttrKey("-cprops",     "oCProps",     parseAllowedCProps, null)
	}
};

/* 탐지·파싱 순회용 목록 — ATTR 에서 파생한다. 수기로 나열하지 않는다. */
var GROUP_KEYS = valuesOf(ATTR.GROUP);
var CHILD_KEYS = valuesOf(ATTR.CHILD);

/* 스키마 동결 — Responsive.ATTR 로 외부 노출되므로 변형을 원천 차단한다. */
(function () {
	var i;
	for (i = 0; i < GROUP_KEYS.length; i++) { Object.freeze(GROUP_KEYS[i]); }
	for (i = 0; i < CHILD_KEYS.length; i++) { Object.freeze(CHILD_KEYS[i]); }
	Object.freeze(ATTR.FIXED);
	Object.freeze(ATTR.GROUP);
	Object.freeze(ATTR.FORM);
	Object.freeze(ATTR.CHILD);
	Object.freeze(ATTR);
})();

/* 폼 배치를 새로 계산할 때(columns 리플로우 · 타입변경 기본배치) 베이스 컨스트레인트에서
 * 이어받을 키. 리플로우는 replaceConstraint 로 전량 교체하므로, 위치/스팬과 무관한
 * "배치 옵션"은 여기에 나열해야 유실되지 않는다.
 * 우선순위: 상속값 < 계산된 위치/스팬 < 명시 rl-constraint.
 * 키를 추가하려면 이 배열 한 곳만 고친다. */
var FORM_INHERIT_KEYS = [
	"ignoreLayoutSpacing"      // 레이아웃 간격(spacing) 무시 여부
];

/* 베이스 레이아웃 속성 스냅샷 대상(미지정 시 기존 값 유지를 위해 복사) */
var SNAPSHOT_PROPS = [
	"topMargin", "bottomMargin", "leftMargin", "rightMargin",
	"horizontalSpacing", "verticalSpacing", "spacing",
	"distribution", "verticalAlign", "horizontalAlign", "scrollable",
	/* 폼 구분선(separator) — 동일 타입 전환 시 상속, props 로 width:0 오버라이드 */
	"horizontalSeparatorType", "verticalSeparatorType",
	"horizontalSeparatorWidth", "verticalSeparatorWidth"
];

/* =========================================================================
 * 스크린 정의 (프로젝트별 조정 지점)
 * -------------------------------------------------------------------------
 * ★ 스크린을 바꾸려면 이 배열 하나만 고치면 된다.
 *   논리명 목록 · 실제명→논리명 매핑 · 베이스 스크린이 전부 여기서 파생된다.
 *
 *   sName   : 규칙에 쓰는 논리 스크린명. rl-<sName>-* 로 인코딩된다
 *   aActual : 이 논리명으로 묶을 "실제 스크린명" 목록. 생략하면 sName 과 같다고 본다
 *   bBase   : 원복 기준 스크린. 하나만 지정한다. 아무 데도 없으면 첫 항목이 베이스
 *
 * 런타임에 바꾸려면 Responsive.setup({ aScreens: [...] }) 을 사용한다.
 * ========================================================================= */
var DEFAULT_SCREENS = [
	{ sName: "pc",     aActual: ["default", "desktop"], bBase: true },
	{ sName: "tablet", aActual: ["tablet"] },
	{ sName: "mobile", aActual: ["mobile"] }
];

/**
 * 스크린 정의 테이블로부터 논리명 목록 · 실제명 매핑 · 베이스를 파생한다.
 *
 * @constructor
 * @param {Array<Object>} [aDefs] 스크린 정의 목록. 생략 시 DEFAULT_SCREENS
 */
function ScreenMap(aDefs) {
	/** @type {Array<Object>} 정규화된 정의 목록 */
	this.aDefs = [];
	/** @type {Array<String>} 논리 스크린명 목록 (파생) */
	this.aNames = [];
	/** @type {Object} 실제 스크린명 → 논리 스크린명 (파생) */
	this.moActualToName = {};
	/** @type {String} 원복 기준 논리 스크린명 (파생) */
	this.sBaseName = null;

	this._build((aDefs && aDefs.length) ? aDefs : DEFAULT_SCREENS);
}

/**
 * 정의 목록을 검증하며 파생 자료를 만든다.
 * 잘못된 정의는 경고 후 건너뛴다 — 조용히 무시되어 원인을 못 찾는 상황을 막는다.
 *
 * @private
 * @param {Array<Object>} aDefs 스크린 정의 목록
 */
ScreenMap.prototype._build = function (aDefs) {
	var i, j, oDef, aActual, sActual;
	for (i = 0; i < aDefs.length; i++) {
		oDef = aDefs[i];
		if (!oDef || !oDef.sName) {
			logWarn("스크린 정의 [" + i + "] 에 sName 이 없습니다 — 무시");
			continue;
		}
		if (indexOf(this.aNames, oDef.sName) >= 0) {
			logWarn("스크린 논리명 중복: '" + oDef.sName + "' — 뒤 정의 무시");
			continue;
		}
		this.aNames.push(oDef.sName);
		this.aDefs.push(oDef);

		aActual = (oDef.aActual && oDef.aActual.length) ? oDef.aActual : [oDef.sName];
		for (j = 0; j < aActual.length; j++) {
			sActual = aActual[j];
			if (this.moActualToName.hasOwnProperty(sActual)) {
				logWarn("실제 스크린명 '" + sActual + "' 가 '" + this.moActualToName[sActual] +
					"' 와 '" + oDef.sName + "' 양쪽에 지정됨 — 먼저 선언한 '" +
					this.moActualToName[sActual] + "' 유지");
				continue;
			}
			this.moActualToName[sActual] = oDef.sName;
		}

		if (oDef.bBase) {
			if (this.sBaseName) {
				logWarn("베이스 스크린 중복 지정('" + this.sBaseName + "', '" + oDef.sName +
					"') — 먼저 선언한 '" + this.sBaseName + "' 유지");
			} else {
				this.sBaseName = oDef.sName;
			}
		}
	}

	if (!this.aNames.length) {
		logWarn("유효한 스크린 정의가 없습니다 — 내장 기본값을 사용합니다.");
		if (aDefs !== DEFAULT_SCREENS) { this._build(DEFAULT_SCREENS); }
		return;
	}
	if (!this.sBaseName) { this.sBaseName = this.aNames[0]; }   /* 미지정 시 첫 항목 */
};

/**
 * 실제 스크린명을 논리 스크린명으로 해석한다.
 *
 * @param {String} sActualName 실제 스크린명 (null 이면 베이스)
 * @returns {String} 논리 스크린명 (매핑에 없으면 입력값 그대로)
 */
ScreenMap.prototype.resolve = function (sActualName) {
	if (sActualName == null) { return this.sBaseName; }
	return this.moActualToName.hasOwnProperty(sActualName)
		? this.moActualToName[sActualName]
		: sActualName;
};

/**
 * @param {String} sName 논리 스크린명
 * @returns {Boolean} 정의된 논리 스크린명인지 여부
 */
ScreenMap.prototype.has = function (sName) { return indexOf(this.aNames, sName) >= 0; };

/** @returns {Array<String>} 논리 스크린명 목록 */
ScreenMap.prototype.getNames = function () { return this.aNames; };

/** @returns {String} 원복 기준 논리 스크린명 */
ScreenMap.prototype.getBase = function () { return this.sBaseName; };

/**
 * 베이스 스크린을 바꾼다. 정의되지 않은 논리명이면 예외를 던진다(개발자 실수).
 *
 * @param {String} sName 논리 스크린명 (실제명이 아님)
 */
ScreenMap.prototype.setBase = function (sName) {
	if (!this.has(sName)) {
		throw new cpr.exceptions.IllegalArgumentException(
			"[Responsive] setup: 베이스로 지정한 '" + sName + "' 은 정의된 논리 스크린명이 아닙니다(유효: " +
			this.aNames.join(", ") + "). 실제 스크린명이 아니라 논리명을 지정해야 합니다.");
	}
	this.sBaseName = sName;
};

/** @returns {ScreenMap} 같은 정의를 갖는 새 인스턴스 */
ScreenMap.prototype.clone = function () {
	var oCopy = new ScreenMap(this.aDefs);
	oCopy.sBaseName = this.sBaseName;   /* setBase 로 바뀐 값까지 승계 */
	return oCopy;
};

/**
 * 스크린 지정 입력을 정식 정의 목록으로 정규화한다.
 *
 * @param {*} v 아래 세 형식 중 하나
 *   ① 정식 : [{ sName, aActual, bBase }, …]
 *   ② 배열 : ["pc", "tablet", "mobile"]              (실제명 = 논리명, 첫 항목이 베이스)
 *   ③ 객체 : { "pc": ["default", "EXB-FULL"], … }    (논리명 → 실제명들, 첫 키가 베이스)
 * @returns {Array<Object>} 정식 정의 목록 (해석 불가면 null)
 */
ScreenMap.normalize = function (v) {
	if (!v) { return null; }
	var aDefs = [], i, sKey, aActual;
	if (Object.prototype.toString.call(v) === "[object Array]") {
		if (!v.length) { return null; }
		if (typeof v[0] === "string") {
			for (i = 0; i < v.length; i++) { aDefs.push({ sName: v[i] }); }
			return aDefs;
		}
		return v;   /* 이미 정식 형식 */
	}
	for (sKey in v) {
		if (!v.hasOwnProperty(sKey)) { continue; }
		aActual = v[sKey];
		aDefs.push({ sName: sKey, aActual: (aActual && aActual.length) ? aActual : null });
	}
	return aDefs.length ? aDefs : null;
};

/* =========================================================================
 * ResponsiveConfig — 런타임 설정 (전역 기본 → 앱 단위 → attach 스냅샷)
 * ========================================================================= */
/**
 * 반응형 설정값.
 *
 * @constructor
 * @param {ResponsiveConfig} [oParent] 상속할 상위 설정. 생략 시 내장 기본값
 */
function ResponsiveConfig(oParent) {
	/** @type {ScreenMap} 스크린 정의 */
	this.oScreens = oParent ? oParent.oScreens.clone() : new ScreenMap(DEFAULT_SCREENS);

	/** @type {String} 콘텐츠 높이 힌트 속성명 */
	this.sAutoRowAttr = oParent ? oParent.sAutoRowAttr : ATTR.FIXED.AUTO_ROW;

	/** @type {String} 폼 생성기(Responsive.Form)의 라벨 식별 클래스 */
	this.sLabelClass = oParent ? oParent.sLabelClass : "label";

	/** @type {Object} 자동 리플로우 기본 구획식
	 *  sColumn  : 자동 컬럼 기본 폭
	 *  sRow     : 힌트 없는 자동 행 기본 높이
	 *  sAutoRow : rl-auto-row 행의 높이(콘텐츠 자동) */
	this.oDiv = oParent ? cloneObj(oParent.oDiv)
		: { sColumn: "1fr", sRow: "1fr", sAutoRow: "0px@auto" };

	/** @type {Object} 타입 변경 시 주입할 레이아웃 기본 속성 (사용자 props 가 덮어씀) */
	this.moLayoutDefaults = oParent ? copyDeep2(oParent.moLayoutDefaults)
		: { flow: { scrollable: false }, vertical: { distribution: "fill" } };

	/** @type {Object} rl-cprops 허용 속성 화이트리스트 */
	this.moCPropAllow = oParent ? cloneObj(oParent.moCPropAllow) : {
		horizontalSpacing: 1, verticalSpacing: 1,                       // 체크박스그룹, 라디오버튼
		itemSpacing: 1, itemSizing: 1, preferredItemWidth: 1, itemAlign: 1, // 탭 폴더, MDI 폴더
		barItemWidths: 1, barItemSpacing: 1,                            // 내비게이션바
		indent: 1,                                                      // 트리, 사이드 내비게이션
		pageIndexWidth: 1, navigationType: 1,                           // 페이지인덱서
		space: 1                                                        // 링크드 리스트박스/콤보박스
	};
}

/**
 * 부분 옵션을 병합한다. 미지정 키는 기존 값을 유지한다.
 *
 * @param {Object} oOptions { aScreens, sBaseScreen, sAutoRowAttr, sLabelClass, oDiv, moLayoutDefaults, moCPropAllow }
 * @returns {ResponsiveConfig} 메서드 체이닝용 자기 자신
 */
ResponsiveConfig.prototype.merge = function (oOptions) {
	if (!oOptions) { return this; }
	var sType, aDefs;

	if (oOptions.aScreens) {
		aDefs = ScreenMap.normalize(oOptions.aScreens);
		if (!aDefs) {
			throw new cpr.exceptions.IllegalArgumentException(
				"[Responsive] setup: aScreens 형식을 해석할 수 없습니다 — 정식 정의 목록/문자열 배열/객체 중 하나여야 합니다.");
		}
		this.oScreens = new ScreenMap(aDefs);
	}
	if (oOptions.sBaseScreen) { this.oScreens.setBase(oOptions.sBaseScreen); }
	if (oOptions.sAutoRowAttr) { this.sAutoRowAttr = oOptions.sAutoRowAttr; }
	if (oOptions.sLabelClass) { this.sLabelClass = oOptions.sLabelClass; }
	if (oOptions.oDiv) { mergeInto(this.oDiv, oOptions.oDiv); }
	if (oOptions.moCPropAllow) { mergeInto(this.moCPropAllow, oOptions.moCPropAllow); }
	if (oOptions.moLayoutDefaults) {
		for (sType in oOptions.moLayoutDefaults) {
			if (!oOptions.moLayoutDefaults.hasOwnProperty(sType)) { continue; }
			this.moLayoutDefaults[sType] = mergeObj(this.moLayoutDefaults[sType] || {},
				oOptions.moLayoutDefaults[sType]);
		}
	}
	return this;
};

/** @returns {ResponsiveConfig} 이 설정을 상위로 삼는 새 사본 */
ResponsiveConfig.prototype.derive = function () { return new ResponsiveConfig(this); };

/**
 * rl-cprops 로 대입이 허용된 컨트롤 속성인지 판별한다.
 *
 * @param {String} sPropName 속성명
 * @returns {Boolean}
 */
ResponsiveConfig.prototype.isAllowedCProp = function (sPropName) {
	return this.moCPropAllow.hasOwnProperty(sPropName);
};

/**
 * 이 설정에서 생성될 수 있는 UserAttr 키 전체를 열거한다.
 *
 * @returns {Array<String>} 중복 제거·정렬된 키 목록
 */
ResponsiveConfig.prototype.listAllAttrKeys = function () {
	var oSeen = {}, aKeys = [], aAll = GROUP_KEYS.concat(CHILD_KEYS);
	var aNames = this.oScreens.getNames(), i, j;
	function add(s) { if (!oSeen.hasOwnProperty(s)) { oSeen[s] = 1; aKeys.push(s); } }
	add(ATTR.FIXED.CONFIGURED);
	add(this.sAutoRowAttr);
	add(ATTR.FORM.GROUP_COMMON);
	add(ATTR.FORM.ITEM_COMMON);
	for (i = 0; i < aNames.length; i++) {
		add(ATTR.PREFIX + aNames[i] + ATTR.FORM.GROUP);
		add(ATTR.PREFIX + aNames[i] + ATTR.FORM.ITEM);
		for (j = 0; j < aAll.length; j++) { add(aAll[j].keyFor(aNames[i])); }
	}
	aKeys.sort();
	return aKeys;
};

/* 전역 기본 설정 + 앱 단위 오버라이드 레지스트리 */
var moGlobalConfig = new ResponsiveConfig();
var maAppConfigs = [];   // [{ appInstance, oConfig }]

/**
 * 해당 앱에 유효한 설정을 돌려준다. 앱 지정이 없으면 전역 기본.
 *
 * @param {cpr.core.AppInstance} [appInstance] 대상 앱
 * @returns {ResponsiveConfig}
 */
function resolveConfig(appInstance) {
	if (appInstance) {
		for (var i = 0; i < maAppConfigs.length; i++) {
			if (maAppConfigs[i].appInstance === appInstance) { return maAppConfigs[i].oConfig; }
		}
	}
	return moGlobalConfig;
}

/**
 * 해당 앱 전용 설정을 만들거나 가져온다(없으면 전역에서 파생).
 *
 * @param {cpr.core.AppInstance} appInstance 대상 앱
 * @returns {ResponsiveConfig}
 */
function getOrCreateAppConfig(appInstance) {
	for (var i = 0; i < maAppConfigs.length; i++) {
		if (maAppConfigs[i].appInstance === appInstance) { return maAppConfigs[i].oConfig; }
	}
	var oConfig = moGlobalConfig.derive();
	maAppConfigs.push({ appInstance: appInstance, oConfig: oConfig });
	/* attach 없이 setup(appInstance) 만 하고 화면이 닫히는 경우의 잔존 방지.
	 * removeAppConfig 는 멱등이라 dispose/detach 경로와 중복 실행돼도 무해하다. */
	try { appInstance.addEventListener("unload", function () { removeAppConfig(appInstance); }); }
	catch (e) { logWarn("unload 등록 실패(앱 설정 자동 정리 불가): " + e); }
	return oConfig;
}

/**
 * 앱 전용 설정을 제거한다. (dispose 시 정리)
 *
 * @param {cpr.core.AppInstance} appInstance 대상 앱
 */
function removeAppConfig(appInstance) {
	for (var i = 0; i < maAppConfigs.length; i++) {
		if (maAppConfigs[i].appInstance === appInstance) { maAppConfigs.splice(i, 1); return; }
	}
}

/**
 * 컨트롤이 속한 앱 인스턴스를 얻는다.
 *
 * @param {cpr.controls.Control} c 대상 컨트롤
 * @returns {cpr.core.AppInstance} (없으면 null)
 */
function appOf(c) {
	return (c && typeof c.getAppInstance === "function") ? c.getAppInstance() : null;
}

/* appInstance 단위 컨텍스트 레지스트리 (컨트롤 오염 없는 저비용 보관) */
var maContexts = []; // [AppContext]

/* =========================================================================
 * 공통 유틸
 * ========================================================================= */
function trim(s) { return String(s).replace(/^\s+|\s+$/g, ""); }

/**
 * 순수 숫자 문자열인지 판별한다.
 *
 * @param {String} s 대상 문자열
 * @returns {Boolean}
 */
function isNumeric(s) { return /^-?\d+(\.\d+)?$/.test(s); }

/**
 * UserAttr 평문 값을 타입 판별해 변환한다.
 * "true"/"false" → Boolean, 순수 숫자 → Number, 그 외("0px","1fr","FILL") → String.
 *
 * @param {*} v 원본 값
 * @returns {*} 변환된 값
 */
function coerce(v) {
	if (v === null || v === undefined) { return v; }
	var s = trim(String(v));
	if (s === "true") { return true; }
	if (s === "false") { return false; }
	if (s !== "" && isNumeric(s)) { return Number(s); }
	return s;
}

/**
 * 객체의 값들을 배열로 반환한다. (Object.values 는 ES5 가 아니므로 직접 구현)
 *
 * @param {Object} oMap 대상 객체
 * @returns {Array} 값 배열
 */
function valuesOf(oMap) {
	var aList = [], sKey;
	for (sKey in oMap) { if (oMap.hasOwnProperty(sKey)) { aList.push(oMap[sKey]); } }
	return aList;
}

/**
 * 기본값 복제. 배열/객체는 공유되면 안 되므로 얕은 사본을 돌려준다.
 *
 * @param {*} v 원본 값
 * @returns {*} 원시값은 그대로, 배열/객체는 얕은 사본
 */
function copyValue(v) {
	if (v === null || typeof v !== "object") { return v; }
	if (Object.prototype.toString.call(v) === "[object Array]") { return v.slice(); }
	return cloneObj(v);
}

/**
 * 배열에서 값의 인덱스를 찾는다. (IE 구버전 대비 자체 구현)
 *
 * @param {Array} aList 대상 배열
 * @param {*} v 찾을 값
 * @returns {Number} 인덱스 (없으면 -1)
 */
function indexOf(aList, v) {
	for (var i = 0; i < aList.length; i++) { if (aList[i] === v) { return i; } }
	return -1;
}

/**
 * 경고를 남긴다. (모듈 접두어 부착)
 *
 * @param {String} sMsg 메시지
 */
function logWarn(sMsg) {
	console.warn("[Responsive] " + sMsg);
}

/**
 * 오류를 남긴다. 동작은 계속되며, 설정 실수를 알리는 용도다.
 *
 * @param {String} sMsg 메시지
 */
function logError(sMsg) {
	console.error("[Responsive] " + sMsg);
}

/**
 * 두 객체를 병합한 새 객체를 만든다. 같은 키는 b 가 이긴다.
 *
 * @param {Object} a 기본 객체
 * @param {Object} b 덮어쓸 객체
 * @returns {Object} 새 객체
 */
function mergeObj(a, b) {
	var o = {}, k;
	for (k in a) { if (a.hasOwnProperty(k)) { o[k] = a[k]; } }
	for (k in b) { if (b.hasOwnProperty(k)) { o[k] = b[k]; } }
	return o;
}

/**
 * 자기 소유 키가 하나라도 있는지 판별한다.
 *
 * @param {Object} o 대상 객체
 * @returns {Boolean}
 */
function hasKeys(o) {
	var k;
	for (k in o) { if (o.hasOwnProperty(k)) { return true; } }
	return false;
}

/**
 * oTarget 에 oSource 의 값을 덮어쓴다(제자리 병합).
 *
 * @param {Object} oTarget 대상
 * @param {Object} oSource 원본
 * @returns {Object} oTarget
 */
function mergeInto(oTarget, oSource) {
	for (var k in oSource) { if (oSource.hasOwnProperty(k)) { oTarget[k] = oSource[k]; } }
	return oTarget;
}

/**
 * 2단계 깊이 객체를 복제한다. ( { flow: {...}, vertical: {...} } 형태용 )
 *
 * @param {Object} o 원본
 * @returns {Object} 사본
 */
function copyDeep2(o) {
	var r = {}, k;
	for (k in o) { if (o.hasOwnProperty(k)) { r[k] = cloneObj(o[k]); } }
	return r;
}

/**
 * UserAttr 값을 읽는다. 값이 없으면 "" 로 정규화한다.
 *
 * @param {cpr.controls.Control} c 대상 컨트롤
 * @param {String} sKey UserAttr 키
 * @returns {String} 값 (없으면 "")
 */
function getUserAttr(c, sKey) {
	if (!c) { return ""; }
	var v = c.userAttr(sKey);
	return (v === null || v === undefined) ? "" : v;
}

/* =========================================================================
 * 값 파서
 * ========================================================================= */
/**
 * "k:v; k:v" 형태를 객체로 파싱한다. 구분자는 ';' 이며 값은 coerce 로 타입 판별한다.
 *
 * @param {String} sRaw 원문
 * @returns {Object} { k: coerce(v) }
 */
function parseKeyValues(sRaw) {
	var oResult = {};
	if (!sRaw) { return oResult; }
	var aPairs = String(sRaw).split(";");
	for (var i = 0; i < aPairs.length; i++) {
		var sPair = aPairs[i];
		if (!sPair) { continue; }
		var nSep = sPair.indexOf(":");
		if (nSep < 0) { continue; }
		var sKey = trim(sPair.substring(0, nSep));
		if (sKey === "") { continue; }
		oResult[sKey] = coerce(trim(sPair.substring(nSep + 1)));
	}
	return oResult;
}

/**
 * "클래스1 클래스2" 를 클래스명 배열로 파싱한다.
 *
 * @param {String} sRaw 공백 구분 클래스명
 * @returns {Array<String>} 클래스명 배열
 */
function parseClassNames(sRaw) {
	var aResult = [];
	if (!sRaw) { return aResult; }
	var aTokens = String(sRaw).split(/\s+/);
	for (var i = 0; i < aTokens.length; i++) { if (aTokens[i]) { aResult.push(aTokens[i]); } }
	return aResult;
}

/**
 * rl-<screen>-columns 값을 열 개수로 파싱한다.
 * 양의 정수가 아니면 경고 후 null 을 돌려주어 리플로우를 일으키지 않는다.
 *
 * @param {String} sRaw 원문
 * @param {cpr.controls.Control} c 경고 문맥용 대상 컨트롤
 * @returns {Number} 열 개수 (유효하지 않으면 null)
 */
function parseColumnCount(sRaw, c) {
	var nCount = parseInt(trim(String(sRaw)), 10);
	if (isNaN(nCount) || nCount < 1) {
		logWarn("columns 값이 올바르지 않습니다: '" + sRaw + "'" + idOf(c) + " → 리플로우하지 않음");
		return null;
	}
	return nCount;
}

/**
 * 경고 메시지에 붙일 컨트롤 식별 문자열.
 *
 * @param {cpr.controls.Control} c 대상 컨트롤
 * @returns {String} " (id=xxx)" 또는 ""
 */
function idOf(c) {
	if (c && c.id) { return " (id=" + c.id + ")"; }
	return "";
}

/**
 * "reorderOnly:true; byIndex:2,0,1; moves:0>2,1>0" 를 순서 규칙으로 파싱한다.
 *
 * @param {String} sRaw 원문
 * @returns {Object} { reorderOnly, byIndex[], moves[] } (원문이 비면 null)
 */
function parseOrder(sRaw) {
	if (!sRaw) { return null; }
	var oKV = parseKeyValues(sRaw);
	var oOrder = {};
	if (oKV.reorderOnly !== undefined) { oOrder.reorderOnly = (oKV.reorderOnly === true); }
	if (oKV.byIndex !== undefined) { oOrder.byIndex = splitNums(String(oKV.byIndex)); }
	if (oKV.moves !== undefined) { oOrder.moves = parseMoves(String(oKV.moves)); }
	return oOrder;
}

/**
 * "2,0,1" 을 정수 배열로 파싱한다. 숫자가 아닌 토큰은 건너뛴다.
 *
 * @param {String} sRaw 콤마 구분 문자열
 * @returns {Array<Number>}
 */
function splitNums(sRaw) {
	var aTokens = sRaw.split(","), aResult = [];
	for (var i = 0; i < aTokens.length; i++) {
		var n = parseInt(trim(aTokens[i]), 10);
		if (!isNaN(n)) { aResult.push(n); }
	}
	return aResult;
}

/**
 * "0>2,1>0" 을 이동 지시 배열로 파싱한다.
 *
 * @param {String} sRaw 콤마 구분 "from>to" 목록
 * @returns {Array<Object>} [{ from, to }, …]
 */
function parseMoves(sRaw) {
	var aTokens = sRaw.split(","), aResult = [];
	for (var i = 0; i < aTokens.length; i++) {
		var aPair = aTokens[i].split(">");
		if (aPair.length === 2) {
			var nFrom = parseInt(trim(aPair[0]), 10), nTo = parseInt(trim(aPair[1]), 10);
			if (!isNaN(nFrom) && !isNaN(nTo)) { aResult.push({ from: nFrom, to: nTo }); }
		}
	}
	return aResult;
}

/* 열/행 축별 CPR 레이아웃 API 이름. 축 분기를 이 한 곳에서만 관리한다. */
var DIV_API = {
	column: {
		sLabel: "열(columns)",
		sSetDivisions: "setColumnDivisions", sGetDivisions: "getColumnDivisions",
		sSetArray: "setColumns",             sGetArray: "getColumns",
		sSetAuto: "setColumnAutoSizing",     sGetAuto: "getColumnAutoSizing",
		sSetMin: "setColumnMinSize",         sGetMin: "getColumnMinSize"
	},
	row: {
		sLabel: "행(rows)",
		sSetDivisions: "setRowDivisions",    sGetDivisions: "getRowDivisions",
		sSetArray: "setRows",                sGetArray: "getRows",
		sSetAuto: "setRowAutoSizing",        sGetAuto: "getRowAutoSizing",
		sSetMin: "setRowMinSize",            sGetMin: "getRowMinSize"
	}
};

/**
 * 축 구분자로 CPR API 이름 묶음을 얻는다.
 *
 * @param {Boolean} bIsColumn true=열, false=행
 * @returns {Object} DIV_API 항목
 */
function divApiOf(bIsColumn) { return bIsColumn ? DIV_API.column : DIV_API.row; }

/* =========================================================================
 * DivisionSpec / DivisionList — 폼 구획
 * ========================================================================= */
/**
 * 폼 구획 하나의 스펙.
 * 표현식 형식: "<길이>[@auto][@min<n>][@hidden]"   예) "1fr@min120", "0px@auto"
 * 길이를 생략하면("@auto@min24" 등) "0px" 로 본다.
 *
 * @constructor
 * @param {String} sExpr 구획 표현식
 */
function DivisionSpec(sExpr) {
	/** @type {String} 길이 표현식 */
	this.sLength = trim(String(sExpr)).split("@")[0];
	/** @type {Boolean} 콘텐츠 자동 크기 여부 */
	this.bAuto = false;
	/** @type {Number} 최소 길이 (미지정 null) */
	this.nMin = null;
	/** @type {Boolean} 구획 숨김 여부 */
	this.bHidden = false;

	this.sLength = trim(this.sLength);
	if (this.sLength === "") { this.sLength = "0px"; }

	var aParts = trim(String(sExpr)).split("@");
	for (var i = 1; i < aParts.length; i++) { this._applyOption(trim(aParts[i])); }
}

/**
 * "@" 뒤 옵션 하나를 반영한다.
 *
 * @private
 * @param {String} sOption "auto" | "hidden" | "min<n>"
 */
DivisionSpec.prototype._applyOption = function (sOption) {
	if (sOption === "auto")   { this.bAuto = true; return; }
	if (sOption === "hidden") { this.bHidden = true; return; }
	if (sOption.indexOf("min") === 0) {
		var nMin = parseInt(sOption.substring(3), 10);
		if (!isNaN(nMin)) { this.nMin = nMin; }
	}
};

/** @returns {cpr.controls.layouts.FormDivision} CPR 구획 객체 */
DivisionSpec.prototype.toFormDivision = function () {
	var oDivision = new cpr.controls.layouts.FormDivision(this.sLength);
	if (this.bAuto)        { oDivision.autoSizing = true; }
	if (this.nMin != null) { oDivision.minLength = this.nMin; }
	if (this.bHidden)      { oDivision.hidden = true; }
	return oDivision;
};

/**
 * 이 스펙을 구획 표현식 문자열로 되돌린다. (자동 추출 결과를 props 로 넘길 때 사용)
 *
 * @returns {String} 예) "80px@auto@min80"
 */
DivisionSpec.prototype.toExpr = function () {
	var s = this.sLength;
	if (this.bAuto) { s += "@auto"; }
	if (this.nMin != null && this.nMin !== 0) { s += "@min" + this.nMin; }
	if (this.bHidden) { s += "@hidden"; }
	return s;
};

/** @returns {DivisionSpec} 얕은 복제 */
DivisionSpec.prototype.clone = function () {
	var oCopy = new DivisionSpec(this.sLength);
	oCopy.bAuto = this.bAuto;
	oCopy.nMin = this.nMin;
	oCopy.bHidden = this.bHidden;
	return oCopy;
};

/**
 * CPR FormDivision 객체에서 스펙을 만든다.
 *
 * @param {cpr.controls.layouts.FormDivision} oDivision 원본
 * @returns {DivisionSpec}
 */
DivisionSpec.fromFormDivision = function (oDivision) {
	var oSpec = new DivisionSpec(oDivision.lengthExpression);
	oSpec.bAuto = !!oDivision.autoSizing;
	oSpec.nMin = (oDivision.minLength != null) ? oDivision.minLength : null;
	oSpec.bHidden = !!oDivision.hidden;
	return oSpec;
};

/* ------------------------------------------------------------------------- */

/**
 * 한 축(열 또는 행)의 구획 목록.
 *
 * @constructor
 * @param {Array<DivisionSpec>} [aSpecs] 초기 스펙 목록
 */
function DivisionList(aSpecs) {
	/** @type {Array<DivisionSpec>} */
	this.aSpecs = aSpecs || [];
}

/**
 * "1fr@min120|2fr|120px@auto" 형태 문자열을 목록으로 해석한다.
 *
 * @param {String} sRaw 구분자 '|' 로 나열된 구획 표현식
 * @returns {DivisionList}
 */
DivisionList.parse = function (sRaw) {
	var aSpecs = [];
	if (sRaw) {
		var aTokens = String(sRaw).split("|");
		for (var i = 0; i < aTokens.length; i++) {
			if (trim(aTokens[i])) { aSpecs.push(new DivisionSpec(aTokens[i])); }
		}
	}
	return new DivisionList(aSpecs);
};

/**
 * 같은 표현식을 nCount 개 복제한 목록을 만든다.
 *
 * @param {String} sExpr 구획 표현식
 * @param {Number} nCount 개수
 * @returns {DivisionList}
 */
DivisionList.repeat = function (sExpr, nCount) {
	var aSpecs = [];
	for (var i = 0; i < nCount; i++) { aSpecs.push(new DivisionSpec(sExpr)); }
	return new DivisionList(aSpecs);
};

/**
 * 표현식 배열을 목록으로 만든다.
 *
 * @param {Array<String>} aExprs 구획 표현식 배열
 * @returns {DivisionList}
 */
DivisionList.fromExprs = function (aExprs) {
	var aSpecs = [];
	for (var i = 0; i < aExprs.length; i++) { aSpecs.push(new DivisionSpec(aExprs[i])); }
	return new DivisionList(aSpecs);
};

/**
 * 레이아웃의 현재 구획을 읽어 목록으로 만든다.
 * autoSizing/minLength/hidden 은 FormDivision(getColumnDivisions/getRowDivisions)이 권위 있는
 * 출처이므로 그쪽을 우선 읽는다. (getColumns/getRows 계열은 환경에 따라 auto 플래그를 담지 못해
 * "0px@auto" 가 "0px" 로 유실된다.)
 *
 * @param {cpr.controls.layouts.FormLayout} oLayout 대상 레이아웃
 * @param {Boolean} bIsColumn true=열, false=행
 * @returns {DivisionList} 읽지 못하면 빈 목록
 */
DivisionList.snapshot = function (oLayout, bIsColumn) {
	if (!oLayout) { return new DivisionList(); }
	var oApi = divApiOf(bIsColumn), aSpecs = [], i, oSpec;

	if (typeof oLayout[oApi.sGetDivisions] === "function") {
		var aDivisions = oLayout[oApi.sGetDivisions]();
		if (aDivisions && aDivisions.length) {
			for (i = 0; i < aDivisions.length; i++) { aSpecs.push(DivisionSpec.fromFormDivision(aDivisions[i])); }
			return new DivisionList(aSpecs);
		}
	}
	if (typeof oLayout[oApi.sGetArray] === "function") {
		var aLengths = oLayout[oApi.sGetArray]() || [];
		for (i = 0; i < aLengths.length; i++) {
			oSpec = new DivisionSpec(aLengths[i]);
			if (typeof oLayout[oApi.sGetAuto] === "function") {
				try { oSpec.bAuto = !!oLayout[oApi.sGetAuto](i); } catch (e) { /* noop */ }
			}
			if (typeof oLayout[oApi.sGetMin] === "function") {
				try {
					var nMin = oLayout[oApi.sGetMin](i);
					if (nMin != null) { oSpec.nMin = nMin; }
				} catch (e2) { /* noop */ }
			}
			aSpecs.push(oSpec);
		}
	}
	return new DivisionList(aSpecs);
};

/** @returns {Number} 구획 수 */
DivisionList.prototype.getCount = function () { return this.aSpecs.length; };

/** @returns {Boolean} 비었는지 여부 */
DivisionList.prototype.isEmpty = function () { return this.aSpecs.length === 0; };

/**
 * 목록을 목표 개수에 맞춘다.
 *  - 1개 & 목표 > 1 → 템플릿: 하나를 목표 개수만큼 복제
 *  - 개수 일치      → 그대로
 *  - 그 외          → 마지막 값으로 채움(초과분 절단) + console.error
 * 목표를 모르면(null / 1 미만) 입력한 그대로 둔다.
 *
 * @param {Number} nTarget 목표 구획 수
 * @param {String} sAxisLabel 오류 메시지에 쓸 축 이름
 * @param {String} [sHint] 오류 메시지 뒤에 붙일 원인·해결 안내 (호출부가 문맥을 알 때 전달)
 * @returns {DivisionList} 자기 자신
 */
DivisionList.prototype.expandTo = function (nTarget, sAxisLabel, sHint) {
	var nCount = this.aSpecs.length, aOut = [], i;
	if (!nCount || nTarget == null || nTarget < 1 || nCount === nTarget) { return this; }

	if (nCount > 1) {
		logError((sAxisLabel || "구획") + " 개수(" + nTarget + ")와 값 개수(" + nCount +
			") 불일치 → 마지막 값으로 채워 " + nTarget + "개 적용" + (sHint || ""));
	}
	for (i = 0; i < nTarget; i++) { aOut.push(this.aSpecs[i < nCount ? i : nCount - 1].clone()); }
	this.aSpecs = aOut;
	return this;
};

/**
 * 레이아웃에 구획을 적용한다.
 * setColumnDivisions/setRowDivisions(+FormDivision) 우선, setColumns/setRows(+AutoSizing/MinSize) 폴백.
 *
 * @param {cpr.controls.layouts.FormLayout} oLayout 대상 레이아웃
 * @param {Boolean} bIsColumn true=열, false=행
 */
DivisionList.prototype.applyTo = function (oLayout, bIsColumn) {
	if (!oLayout || this.isEmpty()) { return; }
	var oApi = divApiOf(bIsColumn), i, oSpec;

	if (cpr.controls.layouts.FormDivision && typeof oLayout[oApi.sSetDivisions] === "function") {
		var aDivisions = [];
		for (i = 0; i < this.aSpecs.length; i++) { aDivisions.push(this.aSpecs[i].toFormDivision()); }
		oLayout[oApi.sSetDivisions](aDivisions);
		return;
	}
	if (typeof oLayout[oApi.sSetArray] === "function") {
		var aLengths = [];
		for (i = 0; i < this.aSpecs.length; i++) { aLengths.push(this.aSpecs[i].sLength); }
		oLayout[oApi.sSetArray](aLengths);
		for (i = 0; i < this.aSpecs.length; i++) {
			oSpec = this.aSpecs[i];
			if (oSpec.bAuto && typeof oLayout[oApi.sSetAuto] === "function") { oLayout[oApi.sSetAuto](i, true); }
			if (oSpec.nMin != null && typeof oLayout[oApi.sSetMin] === "function") { oLayout[oApi.sSetMin](i, oSpec.nMin); }
		}
		return;
	}
	logWarn(oApi.sLabel + " 구획 적용 API(" + oApi.sSetDivisions + "/" + oApi.sSetArray + ")를 찾지 못했습니다.");
};

/* =========================================================================
 * cpr 레이아웃 헬퍼
 * ========================================================================= */
function isContainer(c) {
	return !!(c && (c instanceof cpr.controls.Container));
}

/**
 * 레이아웃 타입 → CPR 클래스명. 클래스가 아니라 "이름"을 담는다 —
 * 모듈 로드 시점에 cpr 이 아직 준비되지 않았을 수 있으므로 호출 시점에 해석한다.
 */
var LAYOUT_TYPES = {
	form:     "FormLayout",
	vertical: "VerticalLayout",
	flow:     "FlowLayout",
	xy:       "XYLayout"
};

/**
 * rl-<screen>-layout 값을 검증한다. 지원하지 않는 타입이면 경고 후 null 을 돌려주어
 * 베이스 타입이 유지되게 한다(조용히 무시되어 원인을 못 찾는 상황 방지).
 *
 * @param {String} sRaw 원문
 * @param {cpr.controls.Control} c 경고 문맥용 대상 컨트롤
 * @returns {String} 레이아웃 타입 (유효하지 않으면 null)
 */
function parseLayoutType(sRaw, c) {
	var sType = trim(String(sRaw)).toLowerCase();
	if (LAYOUT_TYPES.hasOwnProperty(sType)) { return sType; }
	logWarn("지원하지 않는 레이아웃 타입입니다: '" + sRaw + "'" + idOf(c) +
		" → 무시(form|vertical|flow|xy 중 하나여야 합니다)");
	return null;
}

/**
 * 레이아웃 타입에 해당하는 CPR 레이아웃 인스턴스를 만든다.
 *
 * @param {String} sType form | vertical | flow | xy
 * @returns {cpr.controls.layouts.Layout} (알 수 없는 타입이면 null)
 */
function createLayout(sType) {
	var sClass = LAYOUT_TYPES[sType];
	return sClass ? new cpr.controls.layouts[sClass]() : null;
}

/* 얕은 복제(컨스트레인트 스냅샷이 참조로 변형되는 것을 방지) */
function cloneObj(o) {
	if (!o || typeof o !== "object") { return o; }
	var r = {}, k;
	for (k in o) { if (o.hasOwnProperty(k)) { r[k] = o[k]; } }
	return r;
}

/* 레이아웃 속성 스냅샷/주입 (미지정 margin/spacing 등을 베이스 값으로 유지하기 위함) */
function snapshotLayoutProps(layout) {
	var o = {};
	if (!layout) { return o; }
	for (var i = 0; i < SNAPSHOT_PROPS.length; i++) {
		var p = SNAPSHOT_PROPS[i];
		try { var v = layout[p]; if (v !== undefined && v !== null) { o[p] = v; } } catch (e) { /* noop */ }
	}
	return o;
}

/**
 * 스냅샷한 레이아웃 속성을 주입한다(사용자 props 로 덮어쓰기 전 기본값 역할).
 *
 * @param {cpr.controls.layouts.Layout} layout 대상 레이아웃
 * @param {Object} oSnap 속성 스냅샷
 */
function seedLayoutProps(layout, oSnap) {
	if (!layout || !oSnap) { return; }
	for (var p in oSnap) { if (oSnap.hasOwnProperty(p)) { try { layout[p] = oSnap[p]; } catch (e) { /* noop */ } } }
}

/**
 * 행 높이 스펙 해석 : auto/true → 자동(min 지원), fill/1fr → 채움, 그 외 → 구획식 직접.
 * min-height 는 auto@min40 (또는 설정 oDiv.sAutoRow 의 @min) 형태로 처리한다.
 *
 * @param {*} v 행 높이 표현
 * @param {ResponsiveConfig} oConfig 유효 설정
 * @returns {String} 구획 표현식 (해석 불가면 null)
 */
function resolveRowSpec(v, oConfig) {
	if (v == null) { return null; }
	var raw = trim(String(v));
	if (raw === "") { return null; }
	var low = raw.toLowerCase();
	if (low === "fill" || low === "1fr") { return "1fr"; }
	if (low === "auto" || low === "true") { return oConfig.oDiv.sAutoRow; }
	if (low.indexOf("auto@") === 0) { return oConfig.oDiv.sAutoRow + raw.substring(4); } /* auto@min40 → 0px@auto@min40 */
	return raw; /* 직접 구획식 (예: 120px@auto@min40) */
}

/**
 * 폼 자동 리플로우 계산 : colSpan 을 고려해 행/열을 채우고(오버플로 시 줄바꿈),
 * 각 행의 높이를 (행 내 컨트롤 rl-auto-row 힌트 → props.rows → 전역 기본) 순으로 결정한다.
 * cpr 상태를 변경하지 않는 순수 계산이다.
 *
 * @param {LayoutGroup} oGroup 대상 그룹
 * @param {String} sScreen 논리 스크린명
 * @param {Array<cpr.controls.Control>} aChildren 배치 대상 자식 목록
 * @param {Number} nCols 열 개수
 * @param {Array<String>} aRowsTokens props.rows 토큰 목록
 * @param {Boolean} bExplicitWins true 면 명시 constraint 가 계산값보다 우선(타입변경 기본배치)
 * @returns {Object} { aAssign: [{ch, oc, row}], aRowExpr: [구획식], nRows }
 */
function computeReflow(oGroup, sScreen, aChildren, nCols, aRowsTokens, bExplicitWins) {
	var oConfig = oGroup.oConfig, col = 0, row = 0, i;
	var aAssign = [], aRowHint = [], aRowVisible = [];
	for (i = 0; i < aChildren.length; i++) {
		var ch = aChildren[i];
		var exp = oGroup.getChildConstraint(ch, sScreen) || {};
		var bHidden = (exp.hidden === true);
		var span = (exp.colSpan != null) ? exp.colSpan : 1;
		if (span > nCols) { span = nCols; }
		if (span < 1) { span = 1; }
		var rspan = (exp.rowSpan != null) ? exp.rowSpan : 1;
		if (col + span > nCols) { col = 0; row++; }
		/* 리플로우가 위치/스팬을 결정. bExplicitWins=true(타입변경 기본배치)면 명시 constraint 우선,
		 * false(columns 리플로우)면 자동 위치 우선. 스팬 미지정은 1로 리셋되어 사라짐 방지.
		 * 베이스에서 이어받는 배치 옵션(FORM_INHERIT_KEYS)은 항상 최하위 우선순위로 깔아 둔다. */
		var oInherited = oGroup.oBaseline.inheritedFormKeys(ch);
		var oComputed = { colIndex: col, rowIndex: row, colSpan: span, rowSpan: rspan };
		var oc = bExplicitWins
			? mergeObj(mergeObj(oInherited, oComputed), exp)
			: mergeObj(mergeObj(oInherited, exp), oComputed);
		aAssign.push({ ch: ch, oc: oc, row: row });
		/* hidden 이 아닌(보이는) 컨트롤만 그 행을 "살아있는 행"으로 표시하고, 행 힌트도 그쪽에서만 취함 */
		if (!bHidden) {
			aRowVisible[row] = true;
			if (aRowHint[row] === undefined) {
				var h = trim(String(getUserAttr(ch, oConfig.sAutoRowAttr)));
				if (h !== "") { aRowHint[row] = h; }
			}
		}
		col += span;
	}
	var nRowsRaw = row + 1, nRows, aRowExpr = [], spec, ri;
	/* 행 높이식(원래 행 인덱스 기준): 컨트롤 rl-auto-row 힌트 > props.rows > 전역 기본 */
	function rowSpecAt(idx) {
		var sp = resolveRowSpec(aRowHint[idx], oConfig);
		if (!sp && aRowsTokens && aRowsTokens.length) {
			sp = resolveRowSpec(aRowsTokens[idx < aRowsTokens.length ? idx : aRowsTokens.length - 1], oConfig);
		}
		return sp || oConfig.oDiv.sRow;
	}
	if (bExplicitWins) {
		/* 타입변경 기본배치: 명시 constraint(위치)가 우선이므로 행 제거/재매핑을 하지 않는다(기존 동작 유지). */
		nRows = nRowsRaw;
		for (ri = 0; ri < nRowsRaw; ri++) { aRowExpr.push(rowSpecAt(ri)); }
	} else {
		/* columns 리플로우: 전체가 hidden(보이는 컨트롤 없음)인 행을 제거하고 살아남는 행에 새 인덱스를 부여. */
		var rowMap = [], newRow = 0;
		for (ri = 0; ri < nRowsRaw; ri++) { rowMap[ri] = aRowVisible[ri] ? newRow++ : -1; }
		nRows = newRow;
		for (ri = 0; ri < aAssign.length; ri++) {
			var nr = rowMap[aAssign[ri].row];
			aAssign[ri].oc.rowIndex = (nr < 0) ? 0 : nr; /* 제거된 행의 hidden 컨트롤은 0 — 어차피 visible=false */
		}
		for (ri = 0; ri < nRowsRaw; ri++) {
			if (rowMap[ri] < 0) { continue; }
			aRowExpr.push(rowSpecAt(ri));
		}
	}
	return { aAssign: aAssign, aRowExpr: aRowExpr, nRows: nRows };
}

/**
 * 컨테이너에 적용된 레이아웃의 타입을 알아낸다.
 *
 * @param {cpr.controls.Container} c 대상 컨테이너
 * @returns {String} form | vertical | flow | xy (알 수 없으면 null)
 */
function detectType(c) {
	if (!c) { return null; }
	var oLayout = c.getLayout();
	var oLayouts = cpr.controls.layouts;
	for (var sType in LAYOUT_TYPES) {
		if (!LAYOUT_TYPES.hasOwnProperty(sType)) { continue; }
		if (oLayout instanceof oLayouts[LAYOUT_TYPES[sType]]) { return sType; }
	}
	return null;
}

/* margins 단축(CSS 식) → top/right/bottom/leftMargin. 값은 공백 또는 콤마로 구분.
 *  1개: 전체 / 2개: 세로 가로 / 3개: 상 좌우 하 / 4개: 상 우 하 좌 */
function applyMarginShorthand(oLayout, v) {
	var parts = trim(String(v)).split(/[\s,]+/), nums = [], i;
	for (i = 0; i < parts.length; i++) { if (parts[i] !== "") { nums.push(coerce(parts[i])); } }
	if (!nums.length) { return; }
	var t = nums[0], r = nums[0], b = nums[0], l = nums[0];
	if (nums.length === 2) { r = l = nums[1]; }
	else if (nums.length === 3) { r = l = nums[1]; b = nums[2]; }
	else if (nums.length >= 4) { r = nums[1]; b = nums[2]; l = nums[3]; }
	oLayout.topMargin = t; oLayout.rightMargin = r; oLayout.bottomMargin = b; oLayout.leftMargin = l;
}

/* 레이아웃 속성 일괄 대입. columns/rows(구획)는 applyScreenRule 에서 개수 규칙(DivisionList.expandTo)으로,
 * margins(단축)는 4개 마진으로 별도 처리한다. 나머지 속성만 직접 대입. */
function applyLayoutProps(oLayout, oProps) {
	if (!oLayout || !oProps) { return; }
	/* 먼저 단축 확장(뒤 루프에서 개별 topMargin 등이 있으면 그 값이 우선) */
	if (oProps.margins != null) { applyMarginShorthand(oLayout, oProps.margins); }
	for (var k in oProps) {
		if (!oProps.hasOwnProperty(k)) { continue; }
		if (k === "columns" || k === "rows" || k === "margins") { continue; }
		oLayout[k] = oProps[k];
	}
}

/**
 * 컨트롤 가시성을 설정한다.
 * CPR 은 setVisible() API 를 제공하지 않는다 — visible 은 Object.defineProperty 로 정의된
 * 접근자 속성이다(런타임 확인: 접근자 12건, setVisible 계열은 그리드 전용 무관 메서드).
 *
 * @param {cpr.controls.Control} c 대상 컨트롤
 * @param {Boolean} bVisible 표시 여부
 */
function setControlVisible(c, bVisible) {
	if (c) { c.visible = bVisible; }
}

/**
 * 컨트롤 가시성을 읽는다(디자인타임 스냅샷·리셋용).
 * 명시적으로 false 가 아니면 표시로 간주한다 — 일부 컨트롤의 visible getter 는 null/undefined 를 돌려준다.
 *
 * @param {cpr.controls.Control} c 대상 컨트롤
 * @returns {Boolean}
 */
function isControlVisible(c) {
	return c ? (c.visible !== false) : true;
}

/**
 * 컨트롤 트리에서의 깊이. 부모 그룹을 자식 그룹보다 먼저 적용하기 위한 정렬 키다.
 *
 * @param {cpr.controls.Control} c 대상 컨트롤
 * @returns {Number} 루트로부터의 깊이
 */
function depthOf(c) {
	var nDepth = 0, cParent = c ? c.getParent() : null;
	while (cParent) {
		nDepth++;
		cParent = cParent.getParent();
	}
	return nDepth;
}

/* =========================================================================
 * 마커/탐지
 * ========================================================================= */
/**
 * 지정한 키군의 rl-* 속성을 하나라도 가졌는지 판별한다.
 *
 * @param {cpr.controls.Control} c 대상 컨트롤
 * @param {Array<AttrKey>} aKeys GROUP_KEYS 또는 CHILD_KEYS
 * @returns {Boolean}
 */
function hasResponsiveAttr(c, aKeys, oConfig) {
	if (!c) { return false; }
	var aNames = oConfig.oScreens.getNames();
	for (var i = 0; i < aNames.length; i++) {
		for (var j = 0; j < aKeys.length; j++) {
			if (aKeys[j].read(c, aNames[i]) !== "") { return true; }
		}
	}
	return false;
}

/**
 * rl 관련 속성이 하나라도 있으면 대상 컨테이너로 본다.
 *
 * @param {cpr.controls.Container} c 대상 컨테이너
 * @returns {Boolean}
 */
function isTargetContainer(c, oConfig) {
	if (!c) { return false; }
	if (!oConfig) { oConfig = resolveConfig(appOf(c)); }
	if (hasResponsiveAttr(c, GROUP_KEYS, oConfig)) { return true; }
	if (hasFormAttr(c, oConfig)) { return true; }        /* rl-<screen>-form 만 있는 폼 그룹 */
	/* 그룹엔 없고 자식에만 rl 속성이 있는 경우도 인정 */
	var aChildren = c.getChildren();
	for (var i = 0; i < aChildren.length; i++) {
		if (hasResponsiveAttr(aChildren[i], CHILD_KEYS, oConfig)) { return true; }
		if (aChildren[i] && getUserAttr(aChildren[i], oConfig.sAutoRowAttr) !== "") { return true; }
	}
	return false;
}

/**
 * 유효 UserAttr 키 목록을 O(1) 대조용 맵으로 만든다.
 *
 * @param {ResponsiveConfig} oConfig 유효 설정
 * @returns {Object} { <키>: 1 }
 */
function knownKeysOf(oConfig) {
	var aKeys = oConfig.listAllAttrKeys(), oKnown = {};
	for (var i = 0; i < aKeys.length; i++) { oKnown[aKeys[i]] = 1; }
	return oKnown;
}

/**
 * 컨트롤의 rl-* UserAttr 키를 유효 키 목록과 대조해 오타를 경고한다.
 * 값 오류는 각 파서가 잡지만, 키 오류(접미사·스크린명 오타)는 "규칙 없음" 으로
 * 조용히 무시되므로 여기서 잡는다.
 * Control.userAttr() 무인자 호출은 적용된 사용자 속성 전체를 { 키: 값(String) } 으로 돌려준다.
 *
 * @param {cpr.controls.Control} c 대상 컨트롤
 * @param {Object} oKnown knownKeysOf() 결과
 */
function validateAttrKeys(c, oKnown) {
	if (!c) { return; }
	var oAll = null;
	try { oAll = c.userAttr(); } catch (e) { return; }   /* 전체 조회 미지원 환경이면 검증 생략 */
	if (!oAll) { return; }
	for (var sKey in oAll) {
		if (!oAll.hasOwnProperty(sKey)) { continue; }
		if (sKey.indexOf(ATTR.PREFIX) !== 0) { continue; }
		if (!oKnown.hasOwnProperty(sKey)) {
			logWarn("알 수 없는 rl-* 속성 '" + sKey + "'" + idOf(c) +
				" — 키 오타 또는 미정의 스크린명입니다. Responsive.listAllAttrKeys() 로 유효 키를 확인하세요.");
		}
	}
}

/* =========================================================================
 * 컨텍스트(appInstance 단위) 관리
 * ========================================================================= */
/**
 * appInstance 1개 단위의 컨텍스트. 리스너 1쌍과 LayoutGroup 목록을 보유한다.
 *
 * @constructor
 * @param {cpr.core.AppInstance} appInstance 대상 앱 인스턴스
 * @param {ResponsiveConfig} [oConfig] 이 앱에 적용할 설정
 */
function AppContext(appInstance, oConfig) {
	/** @type {cpr.core.AppInstance} */
	this.appInstance = appInstance;
	/** @type {ResponsiveConfig} */
	this.oConfig = oConfig || resolveConfig(appInstance);
	/** @type {Array<LayoutGroup>} 깊이 오름차순(부모 우선) 정렬 유지 */
	this.aGroups = [];

	/* 프로토타입 메서드를 리스너로 쓰기 위한 바인딩.
	 * 해제 시 동일 참조가 필요하므로 반드시 필드에 보관한다. */
	this._fOnScreenChange = null;
	this._fOnUnload = null;
}

/** 앱 이벤트 리스너를 1회만 등록한다. */
AppContext.prototype.ensureListeners = function () {
	if (this._fOnScreenChange) { return; }
	var that = this;
	this._fOnScreenChange = function (e) {
		var sName = (e && e.screen && e.screen.name)
			? that.oConfig.oScreens.resolve(e.screen.name) : currentScreen(that.appInstance);
		that.applyAll(sName);
	};
	this._fOnUnload = function () { Responsive.dispose(that.appInstance); };
	try { this.appInstance.addEventListener("screen-change", this._fOnScreenChange); }
	catch (e1) { logWarn("screen-change 등록 실패: " + e1); }
	try { this.appInstance.addEventListener("unload", this._fOnUnload); }
	catch (e2) { logWarn("unload 등록 실패: " + e2); }
};

/** 등록된 리스너를 해제한다. */
AppContext.prototype.removeListeners = function () {
	if (this._fOnScreenChange) {
		try { this.appInstance.removeEventListener("screen-change", this._fOnScreenChange); } catch (e) { /* noop */ }
		this._fOnScreenChange = null;
	}
	if (this._fOnUnload) {
		try { this.appInstance.removeEventListener("unload", this._fOnUnload); } catch (e2) { /* noop */ }
		this._fOnUnload = null;
	}
};

/**
 * 그룹을 등록하고 부모→자식 순서(깊이 오름차순)를 유지한다.
 *
 * @param {LayoutGroup} oGroup 등록할 그룹
 */
AppContext.prototype.addGroup = function (oGroup) {
	this.aGroups.push(oGroup);
	this.aGroups.sort(function (a, b) { return a.nDepth - b.nDepth; });
};

/**
 * 컨테이너로 등록된 그룹을 찾는다.
 *
 * @param {cpr.controls.Container} cGroup 대상 컨테이너
 * @returns {LayoutGroup} (없으면 null)
 */
AppContext.prototype.findGroup = function (cGroup) {
	for (var i = 0; i < this.aGroups.length; i++) {
		if (this.aGroups[i].cGroup === cGroup) { return this.aGroups[i]; }
	}
	return null;
};

/**
 * 등록된 모든 그룹에 스크린을 적용한다. 한 그룹의 실패가 나머지를 막지 않는다.
 *
 * @param {String} sScreen 논리 스크린명
 */
AppContext.prototype.applyAll = function (sScreen) {
	for (var i = 0; i < this.aGroups.length; i++) {
		try { this.aGroups[i].apply(sScreen); }
		catch (e) { logWarn("그룹 적용 실패" + idOf(this.aGroups[i].cGroup) + ": " + e); }
	}
};

/**
 * 앱 인스턴스로 컨텍스트를 찾는다.
 *
 * @param {cpr.core.AppInstance} appInstance 대상 앱
 * @returns {AppContext} (없으면 null)
 */
function findCtx(appInstance) {
	for (var i = 0; i < maContexts.length; i++) {
		if (maContexts[i].appInstance === appInstance) { return maContexts[i]; }
	}
	return null;
}

/**
 * 앱 컨텍스트를 가져오거나 새로 만든다.
 *
 * @param {cpr.core.AppInstance} appInstance 대상 앱
 * @param {ResponsiveConfig} [oConfig] 이 앱에 적용할 설정
 * @returns {AppContext}
 */
function getOrCreateCtx(appInstance, oConfig) {
	var ctx = findCtx(appInstance);
	if (ctx) { return ctx; }
	ctx = new AppContext(appInstance, oConfig);
	maContexts.push(ctx);
	return ctx;
}

/**
 * 컨텍스트를 레지스트리에서 제거한다.
 *
 * @param {AppContext} ctx 대상 컨텍스트
 */
function removeCtx(ctx) {
	for (var i = 0; i < maContexts.length; i++) {
		if (maContexts[i] === ctx) { maContexts.splice(i, 1); return; }
	}
}

/**
 * 앱의 현재 스크린을 논리 스크린명으로 얻는다.
 *
 * @param {cpr.core.AppInstance} appInstance 대상 앱
 * @returns {String} 논리 스크린명
 */
function currentScreen(appInstance) {
	var sName = (appInstance && appInstance.targetScreen && appInstance.targetScreen.name)
		? appInstance.targetScreen.name : null;
	return resolveConfig(appInstance).oScreens.resolve(sName);
}

/* =========================================================================
 * 엔트리 빌드 (UserAttr + configOpt 파싱/정규화)
 * ========================================================================= */
/* =========================================================================
 * GroupBaseline — 디자인타임 스냅샷 (원복 기준. 절대 변형하지 않는다)
 * ========================================================================= */
/**
 * 그룹의 디자인타임 상태를 스냅샷한다.
 *
 * @constructor
 * @param {cpr.controls.Container} cGroup 대상 컨테이너
 */
function GroupBaseline(cGroup) {
	/** @type {Array<cpr.controls.Control>} attach 시점의 직계 자식 (순서 포함) */
	this.aChildren = cGroup.getChildren().slice();
	/** @type {Array<Object>} aChildren 과 같은 인덱스의 컨스트레인트 사본 */
	this.aConstraints = [];
	/** @type {Array<Boolean>} aChildren 과 같은 인덱스의 디자인타임 가시성 */
	this.abVisible = [];
	/** @type {cpr.controls.layouts.Layout} 원복용 레이아웃 객체. 변형하지 않고 보존한다 */
	this.oLayout = cGroup.getLayout();
	/** @type {Object} 레이아웃 속성 스냅샷 (미지정 margin/spacing 유지용) */
	this.oProps = snapshotLayoutProps(this.oLayout);
	/** @type {String} 베이스 레이아웃 타입 */
	this.sType = detectType(cGroup);
	/* 폼 구획 스냅샷 — 동일 타입에서 props.columns/rows 만 준 경우 베이스 레이아웃 객체가
	 * 직접 변형되므로, 원복 시 이 스냅샷으로 되돌린다.
	 * DivisionList 는 autoSizing/minLength/hidden 을 함께 담으므로 "0px@auto" 도 유실되지 않는다. */
	/** @type {DivisionList} 베이스 열 구획 */
	this.oColumns = DivisionList.snapshot(this.oLayout, true);
	/** @type {DivisionList} 베이스 행 구획 */
	this.oRows = DivisionList.snapshot(this.oLayout, false);

	/* 컨스트레인트는 반드시 복제한다 — getConstraint 가 내부 객체를 참조로 돌려주면
	 * 이후 updateConstraint 가 스냅샷까지 변형해 복귀가 깨진다. */
	for (var i = 0; i < this.aChildren.length; i++) {
		var oCons = null;
		try { oCons = cGroup.getConstraint(this.aChildren[i]); } catch (e) { oCons = null; }
		this.aConstraints.push(oCons ? cloneObj(oCons) : null);
		this.abVisible.push(isControlVisible(this.aChildren[i]));
	}
}

/**
 * 해당 자식의 디자인타임 가시성을 돌려준다. 베이스에 없던 자식은 표시로 본다.
 *
 * @param {cpr.controls.Control} ch 대상 자식
 * @returns {Boolean}
 */
GroupBaseline.prototype.visibleOf = function (ch) {
	var n = indexOf(this.aChildren, ch);
	return (n < 0) ? true : (this.abVisible[n] !== false);
};

/**
 * 해당 자식의 디자인타임 컨스트레인트를 돌려준다(사본 아님 — 읽기 전용으로만 쓸 것).
 *
 * @param {cpr.controls.Control} ch 대상 자식
 * @returns {Object} 컨스트레인트 (베이스에 없던 자식이면 null)
 */
GroupBaseline.prototype.constraintOf = function (ch) {
	var n = indexOf(this.aChildren, ch);
	return (n < 0) ? null : this.aConstraints[n];
};

/**
 * 폼 배치 재계산 시 이어받을 키만 베이스 컨스트레인트에서 뽑아낸다.
 *
 * @param {cpr.controls.Control} ch 대상 자식
 * @returns {Object} 상속할 키만 담은 객체 (없으면 빈 객체)
 */
GroupBaseline.prototype.inheritedFormKeys = function (ch) {
	var oBase = this.constraintOf(ch), oResult = {}, sKey;
	if (!oBase) { return oResult; }
	for (var i = 0; i < FORM_INHERIT_KEYS.length; i++) {
		sKey = FORM_INHERIT_KEYS[i];
		if (oBase[sKey] !== undefined) { oResult[sKey] = oBase[sKey]; }
	}
	return oResult;
};

/**
 * 레이아웃 · 자식 순서 · 컨스트레인트 · 가시성을 디자인타임 상태로 되돌린다.
 * 구획은 스냅샷으로 재적용하지 않는다 — 재적용은 autoSizing 등 FormDivision 정보를 유실시킬 수 있다.
 *
 * @param {cpr.controls.Container} cGroup 대상 컨테이너
 */
GroupBaseline.prototype.restoreTo = function (cGroup) {
	var i, ch, oCons, bVisible;

	if (this.oLayout) {
		/* 폼 구획을 스냅샷으로 되돌린 뒤 레이아웃을 적용한다(동일 타입 경로에서의 변형 복구). */
		this.oColumns.applyTo(this.oLayout, true);
		this.oRows.applyTo(this.oLayout, false);
		try { cGroup.setLayout(this.oLayout); } catch (e) { logWarn("setLayout(baseline) 실패" + idOf(cGroup) + ": " + e); }
	}
	for (i = 0; i < this.aChildren.length; i++) {
		ch = this.aChildren[i];
		if (ch) { try { cGroup.reorderChild(ch, i); } catch (e2) { /* 분리된 자식은 무시 */ } }
	}
	for (i = 0; i < this.aChildren.length; i++) {
		ch = this.aChildren[i];
		if (!ch) { continue; }
		oCons = this.aConstraints[i];
		if (oCons) {
			try { cGroup.replaceConstraint(ch, cloneObj(oCons)); }
			catch (e3) { logWarn("restore: replaceConstraint 실패" + idOf(ch) + ": " + e3); }
		}
		bVisible = this.abVisible[i] !== false;
		if (isControlVisible(ch) !== bVisible) { setControlVisible(ch, bVisible); }
	}
};

/* =========================================================================
 * GroupRule / ChildRule — 스크린 1개분 규칙
 * ========================================================================= */
/**
 * 스크린 1개분 그룹 규칙.
 * 필드 구성은 ATTR.GROUP 정의를 따른다 — 필드를 추가하려면 ATTR.GROUP 에 AttrKey 를 추가한다.
 *
 * @constructor
 * @param {Object} [oValues] parseRuleOf 결과 (미지정 필드는 AttrKey 기본값)
 */
function GroupRule(oValues) {
	for (var i = 0; i < GROUP_KEYS.length; i++) {
		var oKey = GROUP_KEYS[i];
		this[oKey.sField] = (oValues && oValues[oKey.sField] !== undefined)
			? oValues[oKey.sField]
			: oKey.getDefault();
	}
	/** @type {Object} configOpt 전용 구조 변경 지시 (UserAttr 로는 표현하지 않음) */
	this.oStructure = (oValues && oValues.oStructure) || null;
}

/**
 * 자식 컨트롤 1개의 스크린별 규칙과 적용 상태.
 *
 * @constructor
 * @param {cpr.controls.Control} cChild 대상 자식
 */
function ChildRule(cChild) {
	/** @type {cpr.controls.Control} */
	this.cChild = cChild;
	/** @type {Object} { <논리스크린명>: { oConstraint, aClasses, oCProps } } */
	this.moByScreen = {};
	/** @type {Array<String>} 이 모듈이 붙여 둔 클래스 */
	this.aAppliedClasses = [];
	/** @type {Object} cprops 로 건드리는 속성들의 베이스 값 (원복용) */
	this.oCPropBaseline = null;
}

/**
 * 해당 스크린의 규칙을 돌려준다.
 *
 * @param {String} sScreen 논리 스크린명
 * @returns {Object} 규칙 (없으면 null)
 */
ChildRule.prototype.getRule = function (sScreen) {
	return this.moByScreen[sScreen] || null;
};

/**
 * 규칙에 등장하는 cprops 키들의 현재(=베이스) 값을 스냅샷한다.
 * UserAttr 과 configOpt 를 모두 반영한 뒤에 호출해야 한다.
 */
ChildRule.prototype.snapshotCProps = function () {
	var oKeys = {}, sScreen, sKey, oCProps;
	for (sScreen in this.moByScreen) {
		if (!this.moByScreen.hasOwnProperty(sScreen)) { continue; }
		oCProps = this.moByScreen[sScreen].oCProps;
		if (oCProps) { for (sKey in oCProps) { if (oCProps.hasOwnProperty(sKey)) { oKeys[sKey] = 1; } } }
	}
	var oBaseline = null, ch = this.cChild;
	for (sKey in oKeys) {
		if (!oKeys.hasOwnProperty(sKey)) { continue; }
		try { (oBaseline || (oBaseline = {}))[sKey] = ch ? ch[sKey] : undefined; }
		catch (e) { logWarn("cprops 베이스 스냅샷 실패: '" + sKey + "'" + idOf(ch) + ": " + e); }
	}
	this.oCPropBaseline = oBaseline;
};

/**
 * 컨트롤 자체 속성(cprops)을 적용한다.
 * 스크린에 값이 있으면 그 값, 없으면 베이스로 복원한다(경로 독립).
 *
 * @param {Object} oRule 이 스크린의 규칙 (없으면 null → 전량 베이스 복원)
 */
ChildRule.prototype.applyCProps = function (oRule) {
	if (!this.oCPropBaseline) { return; }
	var ch = this.cChild, oCProps = (oRule && oRule.oCProps) ? oRule.oCProps : null, sKey, v;
	for (sKey in this.oCPropBaseline) {
		if (!this.oCPropBaseline.hasOwnProperty(sKey)) { continue; }
		v = (oCProps && oCProps[sKey] !== undefined) ? oCProps[sKey] : this.oCPropBaseline[sKey];
		try { ch[sKey] = v; }
		catch (e) { logWarn("cprops 적용 실패: '" + sKey + "'" + idOf(ch) + ": " + e); }
	}
};

/**
 * 이 모듈이 관리하는 클래스만 교체한다.
 *
 * @param {Array<String>} aClasses 적용할 클래스 (없으면 전량 해제)
 */
ChildRule.prototype.applyClasses = function (aClasses) {
	this.aAppliedClasses = setClasses(this.cChild, this.aAppliedClasses, aClasses || []);
};

/* ------------------------------------------------------------------------- */

/* =========================================================================
 * LayoutGroup — 반응형 규칙이 적용되는 컨테이너 1개
 * ========================================================================= */
/**
 * 컨테이너 1개의 베이스라인 스냅샷과 스크린별 규칙을 보유하고, 적용/원복을 수행한다.
 *
 * @constructor
 * @param {cpr.controls.Container} cGroup 대상 컨테이너
 * @param {ResponsiveConfig} oConfig attach 시점에 고정된 설정
 * @param {Object} [oConfigOpt] UserAttr 규칙을 보완할 JS 설정 (UserAttr 보다 우선)
 */
function LayoutGroup(cGroup, oConfig, oConfigOpt) {
	/** @type {cpr.controls.Container} */
	this.cGroup = cGroup;
	/** @type {ResponsiveConfig} attach 시점 스냅샷 */
	this.oConfig = oConfig || resolveConfig(appOf(cGroup));
	/** @type {GroupBaseline} 디자인타임 스냅샷 (원복 기준) */
	this.oBaseline = new GroupBaseline(cGroup);
	/** @type {String} 현재 적용된 레이아웃 타입 */
	this.sAppliedType = this.oBaseline.sType;
	/** @type {Object} { <논리스크린명>: GroupRule } */
	this.oGroup = {};
	/** @type {Array<ChildRule>} */
	this.aChildRules = [];
	/** @type {Array<String>} 규칙이 정의된 논리 스크린명 목록 */
	this.aScreens = [];
	/** @type {Array<String>} 이 모듈이 그룹에 붙여 둔 클래스 */
	this.aAppliedClasses = [];
	/** @type {Number} 부모→자식 적용 순서를 위한 트리 깊이 */
	this.nDepth = depthOf(cGroup);

	this._parseGroupRules();
	this._parseChildRules();
	if (oConfigOpt) { this._mergeConfigOpt(oConfigOpt); }
	/* UserAttr + configOpt 의 cprops 를 모두 반영한 뒤 베이스 스냅샷 */
	for (var i = 0; i < this.aChildRules.length; i++) { this.aChildRules[i].snapshotCProps(); }
	this._computeScreens();
}

/**
 * 컨트롤에서 스크린 1개분 규칙 원문을 읽어 파싱한다.
 * 관련 UserAttr 이 하나도 없으면 null 을 돌려준다(= 그 스크린에 규칙 없음).
 * 있으면 미지정 키까지 AttrKey 기본값으로 채운 완전한 규칙 객체를 만든다.
 *
 * @param {cpr.controls.Control} c 대상 컨트롤
 * @param {Array<AttrKey>} aKeys GROUP_KEYS 또는 CHILD_KEYS
 * @param {String} sScreen 논리 스크린명
 * @param {ResponsiveConfig} oConfig 유효 설정
 * @returns {Object} 규칙 객체 (없으면 null)
 */
function parseRuleOf(c, aKeys, sScreen, oConfig) {
	var oRaw = null, i, oKey, sRaw;
	for (i = 0; i < aKeys.length; i++) {
		sRaw = aKeys[i].read(c, sScreen);
		if (sRaw === "") { continue; }
		if (!oRaw) { oRaw = {}; }
		oRaw[aKeys[i].sField] = sRaw;
	}
	if (!oRaw) { return null; }

	var oRule = {};
	for (i = 0; i < aKeys.length; i++) {
		oKey = aKeys[i];
		oRule[oKey.sField] = oRaw.hasOwnProperty(oKey.sField)
			? oKey.parse(oRaw[oKey.sField], c, oConfig)
			: oKey.getDefault();
	}
	return oRule;
}

/**
 * 미지정 키를 기본값으로만 채운 빈 규칙 객체를 만든다. (configOpt 단독 지정용)
 *
 * @param {Array<AttrKey>} aKeys GROUP_KEYS 또는 CHILD_KEYS
 * @returns {Object} 기본값 규칙 객체
 */
function emptyRuleOf(aKeys) {
	var oRule = {};
	for (var i = 0; i < aKeys.length; i++) { oRule[aKeys[i].sField] = aKeys[i].getDefault(); }
	return oRule;
}

/**
 * 그룹의 스크린별 규칙을 UserAttr 에서 읽어들인다.
 */
LayoutGroup.prototype._parseGroupRules = function () {
	var aNames = this.oConfig.oScreens.getNames();
	for (var i = 0; i < aNames.length; i++) {
		var oValues = parseRuleOf(this.cGroup, GROUP_KEYS, aNames[i], this.oConfig);
		if (oValues) { this.oGroup[aNames[i]] = new GroupRule(oValues); }
	}};


/**
 * cprops 값 파서: ';' 로 키:값 나열. 값에 ',' 가 있으면 배열(요소별 coerce), 단일 값은 coerce.
 *  - 단일:  8 → 8(Number), center → "center"(String), true → Boolean
 *  - 배열:  100,80,120 → [100,80,120] / 100,auto → [100,"auto"] (요소별 Number/String 자동판별)
 *
 * @param {String} sRaw 원문
 * @returns {Object} { k: 값 또는 값 배열 }
 */
function parseCProps(sRaw) {
	var oResult = {}, aPairs = String(sRaw || "").split(";"), i, j, sPair, nSep, sKey, sValue;
	for (i = 0; i < aPairs.length; i++) {
		sPair = aPairs[i];
		if (!sPair) { continue; }
		nSep = sPair.indexOf(":");
		if (nSep < 0) { continue; }
		sKey = trim(sPair.substring(0, nSep));
		if (sKey === "") { continue; }
		sValue = trim(sPair.substring(nSep + 1));
		if (sValue.indexOf(",") >= 0) {
			var aTokens = sValue.split(","), aValues = [];
			for (j = 0; j < aTokens.length; j++) {
				if (trim(aTokens[j]) !== "") { aValues.push(coerce(trim(aTokens[j]))); }
			}
			oResult[sKey] = aValues;
		} else {
			oResult[sKey] = coerce(sValue);
		}
	}
	return oResult;
}

/**
 * cprops 값에서 허용 목록(간격 관련)만 남긴다. 그 외 키는 경고 후 무시.
 *
 * @param {Object} oCProps 파싱된 cprops
 * @param {ResponsiveConfig} oConfig 유효 설정
 * @returns {Object} 허용된 키만 남긴 객체 (없으면 null)
 */
function filterCProps(oCProps, oConfig) {
	var oResult = null, sKey;
	for (sKey in oCProps) {
		if (!oCProps.hasOwnProperty(sKey)) { continue; }
		if (oConfig.isAllowedCProp(sKey)) { (oResult || (oResult = {}))[sKey] = oCProps[sKey]; }
		else { logWarn("cprops: 허용되지 않은 속성 '" + sKey + "' 무시(간격 관련 속성만 허용)"); }
	}
	return oResult;
}

/**
 * rl-<screen>-cprops 전용 파서. 파싱 후 화이트리스트로 거른다. (ATTR.CHILD.CPROPS 에서 사용)
 *
 * @param {String} sRaw 원문
 * @param {cpr.controls.Control} c 대상 컨트롤(미사용, AttrKey 파서 시그니처)
 * @param {ResponsiveConfig} oConfig 유효 설정
 * @returns {Object} 허용된 키만 남긴 객체 (없으면 null)
 */
function parseAllowedCProps(sRaw, c, oConfig) {
	return filterCProps(parseCProps(sRaw), oConfig);
}

/**
 * 그룹 직계 자식들의 스크린별 규칙을 UserAttr 에서 읽어들인다.
 */
LayoutGroup.prototype._parseChildRules = function () {
	var aNames = this.oConfig.oScreens.getNames();
	var aBaseline = this.oBaseline.aChildren;
	for (var i = 0; i < aBaseline.length; i++) {
		var ch = aBaseline[i];
		if (!ch) { continue; }
		var cr = new ChildRule(ch), bAny = false;
		for (var j = 0; j < aNames.length; j++) {
			var oValues = parseRuleOf(ch, CHILD_KEYS, aNames[j], this.oConfig);
			if (oValues) { cr.moByScreen[aNames[j]] = oValues; bAny = true; }
		}
		if (bAny) { this.aChildRules.push(cr); }
	}};


/**
 * configOpt(JS 설정)를 파싱된 규칙 위에 덮어쓴다. UserAttr 보다 우선한다.
 *
 * configOpt = { screens: { <screen>: { layout, props, classes, columns, order, structure,
 *                                      children: { <idOrIndex>: { constraint, classes, cprops } } } } }
 * 외부 표기(layout/props/…)는 사용자 편의를 위해 유지하고, 내부 필드명(sLayout/oProps/…)으로 옮긴다.
 *
 * @param {Object} opt configOpt
 */
LayoutGroup.prototype._mergeConfigOpt = function (opt) {
	if (!opt || !opt.screens) { return; }
	for (var s in opt.screens) {
		if (!opt.screens.hasOwnProperty(s)) { continue; }
		var oScreenOpt = opt.screens[s];
		var oRule = this.oGroup[s] || new GroupRule();
		if (oScreenOpt.layout    !== undefined) { oRule.sLayout  = oScreenOpt.layout; }
		if (oScreenOpt.props     !== undefined) { oRule.oProps   = mergeObj(oRule.oProps || {}, oScreenOpt.props); }
		if (oScreenOpt.classes   !== undefined) { oRule.aClasses = oScreenOpt.classes; }
		if (oScreenOpt.columns   !== undefined) { oRule.nColumns = oScreenOpt.columns; }
		if (oScreenOpt.order     !== undefined) { oRule.oOrder   = oScreenOpt.order; }
		if (oScreenOpt.structure !== undefined) { oRule.oStructure = oScreenOpt.structure; }
		this.oGroup[s] = oRule;

		if (oScreenOpt.children) {
			for (var sChildKey in oScreenOpt.children) {
				if (!oScreenOpt.children.hasOwnProperty(sChildKey)) { continue; }
				var cChild = this._resolveChildKey(sChildKey);
				if (!cChild) {
					logWarn("configOpt: 자식 '" + sChildKey + "' 을 찾을 수 없습니다" + idOf(this.cGroup) + " — 무시");
					continue;
				}
				var cr = this.findChildRule(cChild);
				if (!cr) { cr = new ChildRule(cChild); this.aChildRules.push(cr); }
				var oChildRule = cr.moByScreen[s] || emptyRuleOf(CHILD_KEYS);
				var oChildOpt = oScreenOpt.children[sChildKey];
				if (oChildOpt.constraint !== undefined) { oChildRule.oConstraint = oChildOpt.constraint; }
				if (oChildOpt.classes    !== undefined) { oChildRule.aClasses    = oChildOpt.classes; }
				if (oChildOpt.cprops     !== undefined) { oChildRule.oCProps     = filterCProps(oChildOpt.cprops, this.oConfig); }
				cr.moByScreen[s] = oChildRule;
			}
		}
	}};


/**
 * 규칙이 하나라도 정의된 논리 스크린명 목록을 계산한다.
 * 여기에 없는 스크린은 "미정의 스크린"으로 보고 베이스 규칙 또는 원본으로 복귀한다.
 *
 * @private
 */
LayoutGroup.prototype._computeScreens = function () {
	var set = {}, k;
	for (k in this.oGroup) { if (this.oGroup.hasOwnProperty(k)) { set[k] = true; } }
	for (var i = 0; i < this.aChildRules.length; i++) {
		var bs = this.aChildRules[i].moByScreen;
		for (k in bs) { if (bs.hasOwnProperty(k)) { set[k] = true; } }
	}
	var arr = [];
	for (k in set) { if (set.hasOwnProperty(k)) { arr.push(k); } }
	this.aScreens = arr;};


/**
 * 자식 컨트롤에 대응하는 규칙을 찾는다.
 *
 * @param {cpr.controls.Control} cChild 대상 자식
 * @returns {ChildRule} (없으면 null)
 */
LayoutGroup.prototype.findChildRule = function (cChild) {
	for (var i = 0; i < this.aChildRules.length; i++) {
		if (this.aChildRules[i].cChild === cChild) { return this.aChildRules[i]; }
	}
	return null;};


/**
 * 특정 스크린에서 자식에 명시된 컨스트레인트를 얻는다. (리플로우 계산에 사용)
 *
 * @param {cpr.controls.Control} ch 대상 자식
 * @param {String} s 논리 스크린명
 * @returns {Object} 컨스트레인트 (없으면 null)
 */
LayoutGroup.prototype.getChildConstraint = function (ch, s) {
	var cr = this.findChildRule(ch);
	if (!cr) { return null; }
	var bs = cr.moByScreen[s];
	return bs ? bs.oConstraint : null;};


/**
 * 자식의 "콘텐츠 높이" 힌트 값(rl-auto-row).
 *
 * @param {cpr.controls.Control} ch 대상 자식
 * @param {ResponsiveConfig} oConfig 유효 설정
 * @returns {String} 힌트 값 (없으면 "")
 */
function autoRowValue(ch, oConfig) {
	return trim(String(getUserAttr(ch, oConfig.sAutoRowAttr)));
}

/* 폼에서 rl-auto-row 를 가진 자식의 "그 행"을 auto 높이로 설정한다.
 * 리플로우는 행을 새로 만들 때 이미 반영하므로, 여기서는 "리플로우가 아닌 폼"과 "원복" 경로를 위해
 * 현재 행 구획 중 해당 rowIndex 만 auto 로 덮어쓴다(스크린 무관 힌트이므로 폼이면 항상 적용). */
function applyFormAutoRows(cGroup, layout, aChildren, oConfig) {
	if (!layout || !aChildren) { return; }
	var oRows = null, bChanged = false, i, ch, sHint, oCons, nRowIndex;
	for (i = 0; i < aChildren.length; i++) {
		ch = aChildren[i];
		if (!ch) { continue; }
		sHint = autoRowValue(ch, oConfig);
		if (sHint === "") { continue; }
		if (oRows === null) {                    /* 첫 auto-row 자식에서만 행 스냅샷(없으면 비용 0) */
			oRows = DivisionList.snapshot(layout, false);
			if (oRows.isEmpty()) { return; }
		}
		oCons = null;
		try { oCons = cGroup.getConstraint(ch); } catch (e) { oCons = null; }
		nRowIndex = (oCons && oCons.rowIndex != null) ? oCons.rowIndex : null;
		if (nRowIndex != null && nRowIndex >= 0 && nRowIndex < oRows.getCount()) {
			oRows.aSpecs[nRowIndex] = new DivisionSpec(resolveRowSpec(sHint, oConfig));
			bChanged = true;
		}
	}
	if (bChanged) { oRows.applyTo(layout, false); }
}

/* autoSize 에 height 능력 추가: width 보유면 both, 그 외엔 height.
 * bDropWidth=true(버티컬 distribution=fill: 폭은 레이아웃이 채움)면 width 보유라도 height 로만. */
function mergeAutoSizeHeight(sCur, bDropWidth) {
	var bHasW = (sCur === "width" || sCur === "both");
	if (bHasW && !bDropWidth) { return "both"; }
	return "height";
}

/* 타입 전환 시 크기값(width/height) 이월 대상 쌍: flow↔vertical 만(폼/xy 제외). */
function isSizePair(sFrom, sTo) {
	return (sFrom === "flow" || sFrom === "vertical") && (sTo === "flow" || sTo === "vertical");
}

/* vertical→flow 전환 시 distribution 을 flow.horizontalAlign 으로 매핑.
 * vertical: fill|leading|center|trailing → flow: (fill 대응 없음) left|center|right */
function distToHAlign(sVal) {
	if (sVal == null) { return null; }
	var v = String(sVal).toLowerCase();
	if (v === "leading")  { return "left"; }
	if (v === "center")   { return "center"; }
	if (v === "trailing") { return "right"; }
	return null; /* fill 등 → 대응 없음 */
}

/* 폼 컨스트레인트의 정렬값은 대문자 enum(FILL/LEFT/CENTER...) → 소문자 입력도 허용 */
function normalizeAlignEnum(oc) {
	if (!oc) { return oc; }
	if (typeof oc.horizontalAlign === "string") { oc.horizontalAlign = oc.horizontalAlign.toUpperCase(); }
	if (typeof oc.verticalAlign === "string") { oc.verticalAlign = oc.verticalAlign.toUpperCase(); }
	return oc;
}

/* 클래스 토글(모듈 관리분만): 이전 것 제거 후 새 것 추가, 적용 목록 반환 */
function setClasses(control, aPrev, aNew) {
	var i;
	if (control && control.style) {
		for (i = 0; i < aPrev.length; i++) {
			try { control.style.removeClass(aPrev[i]); }
			catch (e) { logWarn("removeClass 실패: '" + aPrev[i] + "'" + idOf(control) + ": " + e); }
		}
		for (i = 0; i < aNew.length; i++) {
			try { control.style.addClass(aNew[i]); }
			catch (e2) { logWarn("addClass 실패: '" + aNew[i] + "'" + idOf(control) + ": " + e2); }
		}
	}
	return aNew.slice();
}

/* 자식 주소 해석 : 숫자 → baseline 인덱스, 그 외 → id(lookup) */
LayoutGroup.prototype._resolveChildKey = function (sKey) {
	if (/^\d+$/.test(sKey)) { return this.oBaseline.aChildren[parseInt(sKey, 10)] || null; }
	var appInstance = this.cGroup.getAppInstance();
	if (appInstance) {
		var c = appInstance.lookup(sKey);
		if (c) { return c; }
	}
	for (var i = 0; i < this.oBaseline.aChildren.length; i++) {
		var b = this.oBaseline.aChildren[i];
		if (b && b.id === sKey) { return b; }
	}
	return null;
};


/* =========================================================================
 * 적용
 * ========================================================================= */
LayoutGroup.prototype.apply = function (sScreen) {
	var bDefined = false;
	for (var i = 0; i < this.aScreens.length; i++) {
		if (this.aScreens[i] === sScreen) { bDefined = true; break; }
	}
	if (!bDefined) {
		/* 미정의 스크린 → 베이스 규칙(있으면) 또는 원본 스냅샷으로 복귀 */
		var sBase = this.oConfig.oScreens.getBase();
		if (this.oGroup[sBase]) { this._applyScreenRule(sBase); }
		else { this.restore(); }
		return;
	}
	this._applyScreenRule(sScreen);};


/* =========================================================================
 * ApplyPlan — 스크린 1개분 적용 계획 (순수 계산)
 * ========================================================================= */
/**
 * 한 스크린을 적용하기 위한 결정들을 계산해 담는다.
 * 생성자는 cpr 상태를 "읽기만" 하고 변경하지 않는다.
 *
 * 계산 기준은 언제나 "직전 적용 상태"가 아니라 "베이스라인" 이다.
 * 각 스크린을 베이스 기준으로 계산해야 전환 순서에 무관(경로 독립)해진다.
 *
 * @constructor
 * @param {LayoutGroup} oGroup 대상 그룹
 * @param {String} sScreen 논리 스크린명
 */
function ApplyPlan(oGroup, sScreen) {
	var cGroup = oGroup.cGroup;

	/** @type {LayoutGroup} */
	this.oGroup = oGroup;
	/** @type {String} 적용 대상 논리 스크린명 */
	this.sScreen = sScreen;
	/** @type {GroupRule} 이 스크린의 그룹 규칙 */
	this.oRule = oGroup.oGroup[sScreen] || new GroupRule();
	/** @type {Object} 레이아웃 속성 (구획/margins 제외분은 그대로 대입) */
	this.oProps = this.oRule.oProps || {};

	/* 타입 미지정 시 "베이스 타입"을 기준으로 한다(직전 적용 타입 아님). */
	/** @type {String} 적용할 레이아웃 타입 */
	this.sTargetType = this.oRule.sLayout || oGroup.oBaseline.sType || oGroup.sAppliedType;
	/** @type {Boolean} 직전 적용 타입과 달라지는지 */
	this.bTypeChanged = (this.sTargetType !== oGroup.sAppliedType);
	/** @type {Boolean} 베이스 타입과 같은지 (같으면 베이스 속성을 seed) */
	this.bSameAsBaseline = (this.sTargetType === oGroup.oBaseline.sType);

	/* 열 개수(N)의 권위 = rl-<screen>-columns. props 의 columns/rows 는 "폭/높이"만 정의하고
	 * DivisionList.expandTo 로 N 개에 맞춘다. 리플로우(자식 재배치) 트리거도 rl-columns 존재 여부다. */
	/** @type {Number} 리플로우 열 개수 (0이면 리플로우 없음) */
	this.nReflowCols = (this.oRule.nColumns > 0) ? this.oRule.nColumns : 0;
	/** @type {Boolean} 타입 변경으로 인한 폼 기본 배치(1열)인지 */
	this.bAutoPlaceToForm = false;
	if (this.nReflowCols === 0 && this.sTargetType === "form" && this.bTypeChanged) {
		this.nReflowCols = 1;
		this.bAutoPlaceToForm = true;
	}
	/** @type {Boolean} 폼 리플로우 수행 여부 */
	this.bReflow = (this.sTargetType === "form" && this.nReflowCols > 0);

	/* props.rows 토큰(단일=템플릿, 다중=행별). computeReflow 가 hint > rows > 전역 순으로 해석. */
	/** @type {String} props.rows 원문 */
	this.sRowsRaw = (this.oProps.rows != null) ? String(this.oProps.rows) : "";
	/** @type {Boolean} rows 지정 여부 */
	this.bHasRows = (trim(this.sRowsRaw) !== "");
	/** @type {Array<String>} rows 토큰 목록 */
	this.aRowTokens = this.bHasRows ? this.sRowsRaw.split("|") : [];

	/* 새 레이아웃을 만들지(=기존 재사용 안 함) 판단.
	 *  - 타입 변경 : 새로 생성(당연)
	 *  - 리플로우   : 새로 생성해야 베이스 레이아웃 객체를 변형하지 않는다(원복 오염 방지).
	 *                리플로우는 모든 자식 constraint 를 새로 배치하므로 새 레이아웃이어도 안전
	 *  - 그 외      : 기존 레이아웃 재사용(구조/자식 constraint 보존) */
	/** @type {Boolean} 새 레이아웃 생성 여부 */
	this.bFresh = this.bTypeChanged || this.bReflow;

	/** @type {Array<cpr.controls.Control>} 현재 자식 목록 (구조/순서 적용 이후 기준) */
	this.aChildren = cGroup.getChildren();
	/** @type {cpr.controls.layouts.Layout} 현재 적용돼 있는 레이아웃 */
	this.oCurLayout = cGroup.getLayout();

	/* 소스(전환 직전) 자식 constraint 스냅샷 — flow↔vertical 전환의 width/height 이월용.
	 * setLayout 전에 확보해야 한다. 이월이 일어나는 경우에만 복제한다. */
	/** @type {Boolean} flow↔vertical 크기 이월 여부 */
	this.bSizeTransfer = this.bTypeChanged && isSizePair(oGroup.sAppliedType, this.sTargetType);
	/** @type {Array<Object>} 전환 직전 자식 컨스트레인트 사본 */
	this.aSrcConstraints = [];
	if (this.bSizeTransfer) {
		for (var i = 0; i < this.aChildren.length; i++) {
			var oSrc = cGroup.getConstraint(this.aChildren[i]);
			this.aSrcConstraints.push(oSrc ? cloneObj(oSrc) : null);
		}
	}

	/** @type {Object} 리플로우 계산 결과 { aAssign, aRowExpr, nRows } */
	this.oReflow = this.bReflow
		? computeReflow(oGroup, sScreen, this.aChildren, this.nReflowCols, this.aRowTokens, this.bAutoPlaceToForm)
		: null;

	/* 아래 셋은 레이아웃을 실제로 만든 뒤(_applyGroupLayout) 확정된다. */
	/** @type {cpr.controls.layouts.Layout} 이번에 적용할 레이아웃 */
	this.oLayout = null;
	/** @type {Boolean} 버티컬 distribution=fill 인지 (폭 autoSize 무의미) */
	this.bVertFill = false;
	/** @type {Boolean} rl-auto-row 를 autoSize 로 주입할 대상 타입인지 */
	this.bInjectAutoH = (this.sTargetType === "vertical" || this.sTargetType === "flow");
}

/** 적용 로직이 실제로 읽는 그룹 규칙 필드. assertHandledKeys() 가 이 목록으로 누락을 검출한다. */
ApplyPlan.HANDLED_GROUP_FIELDS = ["sLayout", "oProps", "aClasses", "nColumns", "oOrder", "oStructure"];

/* ------------------------------------------------------------------------- */

/**
 * 스크린 1개분 적용 계획을 계산한다. cpr 상태를 변경하지 않는다.
 *
 * @param {String} sScreen 논리 스크린명
 * @returns {ApplyPlan}
 */
LayoutGroup.prototype.buildPlan = function (sScreen) {
	return new ApplyPlan(this, sScreen);
};

/**
 * 스크린 규칙을 적용한다. 구조/순서 → 계산 → 레이아웃 → 자식 → 클래스 순.
 *
 * @private
 * @param {String} sEff 적용할 논리 스크린명
 */
LayoutGroup.prototype._applyScreenRule = function (sEff) {
	var oRule = this.oGroup[sEff] || new GroupRule();

	/* 1) 구조/순서 먼저 — 리플로우 자동배치는 "현재 자식 순서"를 기준으로 하므로
	 *    계획 계산(ApplyPlan)보다 앞서야 한다. */
	if (oRule.oStructure) { this._applyStructure(oRule.oStructure); }
	if (oRule.oOrder) { this._applyOrder(oRule.oOrder); }

	var oPlan = this.buildPlan(sEff);   /* 2) 계산 (cpr 미변경) */

	this._applyGroupLayout(oPlan);      /* 3) 레이아웃 + 속성 + 구획 */
	this._applyChildPlans(oPlan);       /* 4) 컨스트레인트 + 표시/숨김 + 클래스 + cprops */
	this._applyGroupClasses(oRule.aClasses || []);   /* 5) 그룹 클래스 */

	this.sAppliedType = oPlan.sTargetType;
};

/**
 * 레이아웃을 만들거나 재사용하고 속성·구획을 적용한다.
 *  - 동일 타입이면 기존 레이아웃을 재사용해 구조/컨스트레인트를 보존한다(props 만 바꿔도 안 깨짐)
 *  - 미지정 margin/spacing 은 베이스 값으로 seed 후 사용자 props 로 덮어쓴다
 *  - columns/rows 는 지정된 축만 재설정하고, 미지정 축은 기존 구조를 유지한다
 *
 * @private
 * @param {ApplyPlan} oPlan 적용 계획
 */
LayoutGroup.prototype._applyGroupLayout = function (oPlan) {
	var cGroup = this.cGroup;
	var oLayout = oPlan.bFresh ? createLayout(oPlan.sTargetType) : oPlan.oCurLayout;
	oPlan.oLayout = oLayout;
	if (!oLayout) { return; }

	if (oPlan.bSameAsBaseline) { seedLayoutProps(oLayout, this.oBaseline.oProps); }
	else { seedLayoutProps(oLayout, this.oConfig.moLayoutDefaults[oPlan.sTargetType]); }
	applyLayoutProps(oLayout, oPlan.oProps);

	/* 정렬 이월: vertical → flow 전환에서 사용자가 horizontalAlign 을 명시하지 않았으면
	 * 소스 vertical.distribution 을 flow.horizontalAlign 으로 매핑한다.
	 * (flow → vertical 은 매핑하지 않고 vertical 기본 distribution=fill 을 쓴다) */
	if (oPlan.bTypeChanged && oPlan.oCurLayout && oPlan.sTargetType === "flow"
		&& this.sAppliedType === "vertical" && oPlan.oProps.horizontalAlign == null) {
		var sAlign = distToHAlign(oPlan.oCurLayout.distribution);
		if (sAlign != null) { oLayout.horizontalAlign = sAlign; }
	}

	if (oPlan.sTargetType === "form") { this._applyFormDivisions(oPlan); }

	cGroup.setLayout(oLayout);

	/* 버티컬 fill 은 폭을 레이아웃이 채우므로 폭 autoSize/이월이 무의미하다. */
	oPlan.bVertFill = (oPlan.sTargetType === "vertical" && oLayout.distribution != null
		&& String(oLayout.distribution).toLowerCase() === "fill");
};

/**
 * props 의 columns/rows 를 적용할 때 "목표 구획 개수"를 정한다.
 *
 *  - 리플로우      : rl-<screen>-columns 값이 개수의 권위다
 *  - 값이 2개 이상 : 그 개수를 그대로 목표로 삼는다.
 *                   "columns:80px@auto|1fr|80px@auto|1fr" 라고 4개를 적었으면 4열을 원하는 것이지,
 *                   현재가 10열이라고 6개를 덧붙여 달라는 뜻이 아니다
 *  - 값이 1개      : 템플릿. "베이스라인" 개수만큼 복제한다
 *
 * 템플릿의 기준을 현재 레이아웃이 아니라 베이스라인으로 삼는 이유:
 * 현재 개수를 쓰면 직전 스크린이 개수를 바꿔 놓은 상태가 다음 스크린에 새어 들어가
 * 전환 순서에 따라 결과가 달라진다(경로 독립성 위반).
 *
 * @param {ApplyPlan} oPlan 적용 계획
 * @param {DivisionList} oList 파싱된 구획 목록
 * @param {Boolean} bIsColumn true=열, false=행
 * @returns {Number} 목표 구획 개수
 */
function divisionTarget(oPlan, oList, bIsColumn) {
	if (oPlan.bReflow) { return oPlan.nReflowCols; }
	if (oList.getCount() > 1) { return oList.getCount(); }
	var oBaseline = bIsColumn ? oPlan.oGroup.oBaseline.oColumns : oPlan.oGroup.oBaseline.oRows;
	if (oBaseline.getCount()) { return oBaseline.getCount(); }
	return DivisionList.snapshot(oPlan.oCurLayout, bIsColumn).getCount() || 1;
}

/**
 * 폼 열/행 구획을 적용한다. 지정되지 않은 축은 기존 구조를 유지한다.
 *
 * @private
 * @param {ApplyPlan} oPlan 적용 계획
 */
LayoutGroup.prototype._applyFormDivisions = function (oPlan) {
	var oLayout = oPlan.oLayout;

	/* 열 폭 : 목표 개수는 divisionTarget() 규칙을 따른다 */
	if (oPlan.oProps.columns != null) {
		var oCols = DivisionList.parse(oPlan.oProps.columns);
		/* 개수 불일치 시 원인을 바로 알 수 있게 상황별 안내를 붙인다(불일치가 없으면 출력되지 않음) */
		var sColHint = "";
		if (oPlan.bAutoPlaceToForm && oCols.getCount() > 1) {
			sColHint = idOf(this.cGroup) + ". 타입 전환으로 만든 폼은 rl-<screen>-columns 미지정 시 1열로 자동 배치됩니다" +
				" — rl-" + oPlan.sScreen + "-columns = " + oCols.getCount() + " 을 함께 지정하세요";
		} else if (oPlan.bReflow) {
			sColHint = idOf(this.cGroup) + ". rl-" + oPlan.sScreen + "-columns 값(현재 " + oPlan.nReflowCols +
				")과 props columns 폭 개수를 일치시키세요";
		}
		oCols.expandTo(divisionTarget(oPlan, oCols, true), DIV_API.column.sLabel, sColHint).applyTo(oLayout, true);
	} else if (oPlan.bReflow) {
		DivisionList.repeat(this.oConfig.oDiv.sColumn, oPlan.nReflowCols).applyTo(oLayout, true);
	} /* else: 동일 타입 & columns 미지정 → 기존 열 구조 유지 */

	/* 행 높이 */
	if (oPlan.bReflow) {
		/* 다중 토큰인데 계산된 행 수와 다르면 알린다(computeReflow 가 마지막 값으로 채움) */
		if (oPlan.bHasRows && oPlan.aRowTokens.length > 1 && oPlan.aRowTokens.length !== oPlan.oReflow.nRows) {
			logError(DIV_API.row.sLabel + " 개수(" + oPlan.oReflow.nRows + ")와 값 개수(" +
				oPlan.aRowTokens.length + ") 불일치 → 마지막 값으로 채워 적용");
		}
		DivisionList.fromExprs(oPlan.oReflow.aRowExpr).applyTo(oLayout, false);
	} else if (oPlan.bHasRows) {
		var oRows = DivisionList.parse(oPlan.sRowsRaw);
		oRows.expandTo(divisionTarget(oPlan, oRows, false), DIV_API.row.sLabel).applyTo(oLayout, false);
	} /* else: 동일 타입 & rows 미지정 → 기존 행 구조 유지 */
};

/**
 * 자식별 컨스트레인트 · 표시/숨김 · 클래스 · 컨트롤 속성을 적용한다.
 *
 * @private
 * @param {ApplyPlan} oPlan 적용 계획
 */
LayoutGroup.prototype._applyChildPlans = function (oPlan) {
	var cGroup = this.cGroup, aChildren = oPlan.aChildren, i;

	for (i = 0; i < aChildren.length; i++) {
		var ch = aChildren[i];
		var cr = this.findChildRule(ch);
		var oChildRule = cr ? cr.getRule(oPlan.sScreen) : null;
		var oCons = this._buildChildConstraint(oPlan, i, ch, oChildRule);

		/* 표시/숨김은 constraint 의 hidden 으로 일원화(모든 레이아웃 공통).
		 * hidden 명시가 없으면 디자인타임(베이스) 가시성으로 리셋해 경로 독립을 보장한다
		 * (직전 스크린의 hidden 이 다음 스크린까지 남는 sticky 방지). */
		var bVisible;
		if (oCons && oCons.hidden !== undefined) { bVisible = !oCons.hidden; delete oCons.hidden; }
		else { bVisible = this.oBaseline.visibleOf(ch); }

		if (oCons) {
			normalizeAlignEnum(oCons);
			if (hasKeys(oCons)) {
				/* 새 레이아웃(타입변경·리플로우)이면 전량 교체, 기존 재사용이면 병합 */
				if (oPlan.bFresh) { cGroup.replaceConstraint(ch, oCons); }
				else { cGroup.updateConstraint(ch, oCons); }
			}
		}

		if (isControlVisible(ch) !== bVisible) { setControlVisible(ch, bVisible); }

		if (cr) {
			cr.applyClasses((oChildRule && oChildRule.aClasses) ? oChildRule.aClasses : []);
			cr.applyCProps(oChildRule);
		}
	}

	/* 폼이지만 리플로우가 아닌 경우: rl-auto-row 를 가진 자식의 행을 auto 로(리플로우는 이미 반영) */
	if (oPlan.oLayout && oPlan.sTargetType === "form" && !oPlan.bReflow) {
		applyFormAutoRows(cGroup, oPlan.oLayout, aChildren, this.oConfig);
	}
};

/**
 * 자식 1개의 컨스트레인트를 계산한다.
 * 우선순위(낮→높) : (a) 크기 이월 → (b) rl-auto-row autoSize → (c) 명시 rl-constraint(최우선).
 * 폼 리플로우인 경우에는 계산된 위치/스팬만 사용한다.
 *
 * @private
 * @param {ApplyPlan} oPlan 적용 계획
 * @param {Number} nIndex 자식 인덱스
 * @param {cpr.controls.Control} ch 대상 자식
 * @param {Object} oChildRule 이 스크린의 자식 규칙 (없으면 null)
 * @returns {Object} 컨스트레인트 (없으면 null)
 */
LayoutGroup.prototype._buildChildConstraint = function (oPlan, nIndex, ch, oChildRule) {
	if (oPlan.bReflow) {
		return oPlan.oReflow.aAssign[nIndex].oc;   /* 위치/스팬 계산값(크기 이월·autoSize 제외) */
	}

	var cGroup = this.cGroup, oCons = null;
	var oSrc = oPlan.aSrcConstraints[nIndex] || null;

	/* (a) 크기 이월 : flow↔vertical 타입 변경 시 소스 width/height 를 이월한다 */
	if (oPlan.bSizeTransfer && oSrc) {
		oCons = {};
		if (oSrc.height != null) { oCons.height = oSrc.height; }
		/* 버티컬 fill 은 폭을 채우므로 이월 제외 */
		if (oSrc.width != null && !oPlan.bVertFill) { oCons.width = oSrc.width; }
	}

	/* (b) rl-auto-row → autoSize(버티컬/플로우). autoSize 를 적용한 축의 고정 크기는 제거한다 */
	if (oPlan.bInjectAutoH && autoRowValue(ch, this.oConfig) !== "") {
		var sSrcAuto = (oSrc && oSrc.autoSize != null) ? String(oSrc.autoSize) : null;
		if (sSrcAuto === null) {
			var oCurCons = cGroup.getConstraint(ch);
			if (oCurCons && oCurCons.autoSize != null) { sSrcAuto = String(oCurCons.autoSize); }
		}
		if (!oCons) { oCons = {}; }
		oCons.autoSize = mergeAutoSizeHeight(sSrcAuto, oPlan.bVertFill);
		if (oCons.autoSize === "both" || oCons.autoSize === "height") { delete oCons.height; }
		if (oCons.autoSize === "both" || oCons.autoSize === "width")  { delete oCons.width; }
	}

	/* (c) 명시 constraint 최우선 오버레이 */
	if (oChildRule && oChildRule.oConstraint) {
		oCons = mergeObj(oCons || {}, cloneObj(oChildRule.oConstraint));
	}
	return oCons;
};


/**
 * configOpt 의 구조 변경 지시(자식 추가/제거)를 수행한다.
 *
 * @private
 * @param {Object} struct { removeAll, remove: [{child, dispose}], add: [{child, index, constraint}] }
 */
LayoutGroup.prototype._applyStructure = function (struct) {
	var cGroup = this.cGroup, i;
	if (struct.removeAll) { cGroup.removeAllChildren(); }
	if (struct.remove) {
		for (i = 0; i < struct.remove.length; i++) {
			var it = struct.remove[i];
			var c = this._resolveChildKey(String(it.child));
			if (!c) {
				logWarn("structure.remove: 자식 '" + it.child + "' 을 찾을 수 없습니다" + idOf(cGroup) + " — 무시");
				continue;
			}
			cGroup.removeChild(c, it.dispose === true);
		}
	}
	if (struct.add) {
		for (i = 0; i < struct.add.length; i++) {
			var ad = struct.add[i];
			var ca = this._resolveChildKey(String(ad.child));
			if (!ca) {
				logWarn("structure.add: 자식 '" + ad.child + "' 을 찾을 수 없습니다" + idOf(cGroup) + " — 무시");
				continue;
			}
			if (ad.index !== undefined && ad.index !== null) {
				cGroup.insertChild(ad.index, ca, ad.constraint || {});
			} else {
				cGroup.addChild(ca, ad.constraint || {});
			}
		}
	}};


/**
 * 자식 순서를 변경한다. reorder(함수) / byIndex(배열) / moves(이동 목록) 중 하나를 쓴다.
 * 기준은 언제나 베이스라인 순서이므로 전환 순서에 무관하다.
 *
 * @private
 * @param {Object} order 순서 규칙
 */
LayoutGroup.prototype._applyOrder = function (order) {
	var cGroup = this.cGroup, target = null, k;

	if (order.reorder && typeof order.reorder === "function") {
		target = order.reorder(this.oBaseline.aChildren.slice());
	} else if (order.byIndex) {
		target = [];
		for (k = 0; k < order.byIndex.length; k++) {
			var cAt = this.oBaseline.aChildren[order.byIndex[k]];
			if (!cAt) {
				logWarn("order.byIndex: 인덱스 " + order.byIndex[k] + " 에 자식이 없습니다" + idOf(cGroup) + " — 무시");
				continue;
			}
			target.push(cAt);
		}
	} else if (order.moves) {
		for (k = 0; k < order.moves.length; k++) {
			var mv = order.moves[k];
			var c = this.oBaseline.aChildren[mv.from];
			if (!c) {
				logWarn("order.moves: 인덱스 " + mv.from + " 에 자식이 없습니다" + idOf(cGroup) + " — 무시");
				continue;
			}
			try { cGroup.reorderChild(c, mv.to); } catch (e) { logWarn("reorderChild 실패" + idOf(c) + ": " + e); }
		}
		return;
	}

	if (target) {
		for (k = 0; k < target.length; k++) {
			if (target[k]) { try { cGroup.reorderChild(target[k], k); } catch (e2) { logWarn("reorderChild 실패: " + e2); } }
		}
	}};


/**
 * 그룹에 이 모듈이 관리하는 클래스만 교체한다.
 *
 * @param {Array<String>} aClasses 적용할 클래스
 */
LayoutGroup.prototype._applyGroupClasses = function (aClasses) {
	this.aAppliedClasses = setClasses(this.cGroup, this.aAppliedClasses, aClasses || []);
};

/** 그룹과 자식에 붙인 클래스를 모두 해제한다. */
LayoutGroup.prototype._clearAllClasses = function () {
	this._applyGroupClasses([]);
	for (var i = 0; i < this.aChildRules.length; i++) { this.aChildRules[i].applyClasses([]); }
};

/**
 * 디자인타임 상태로 복귀한다.
 * 베이스 레이아웃 객체를 그대로 되돌린다(리플로우는 새 레이아웃을 쓰므로 이 객체는 pristine 유지).
 */
LayoutGroup.prototype.restore = function () {
	var cGroup = this.cGroup, oBaseline = this.oBaseline, i;

	oBaseline.restoreTo(cGroup);

	/* 폼 베이스: rl-auto-row 자식의 행을 auto 로(스크린 무관 힌트이므로 원복 시에도 유지) */
	if (oBaseline.sType === "form") {
		applyFormAutoRows(cGroup, oBaseline.oLayout, oBaseline.aChildren, this.oConfig);
	}
	/* 자식 컨트롤 속성(cprops) 베이스 값 복원 */
	for (i = 0; i < this.aChildRules.length; i++) { this.aChildRules[i].applyCProps(null); }
	this._clearAllClasses();
	this.sAppliedType = oBaseline.sType;};


/* =========================================================================
 * init 보조 (루트 스캔)
 * ========================================================================= */
function getRoot(appInstance) {
	return appInstance ? appInstance.getContainer() : null;
}

/**
 * 컨트롤 트리를 훑어 대상 컨테이너를 모은다. (Responsive.init 용)
 *
 * @param {cpr.controls.Control} c 탐색 시작 컨트롤
 * @param {Array<cpr.controls.Container>} acc 결과 누적 배열
 */
function collectGroups(c, acc) {
	if (!isContainer(c)) { return; }
	if (isTargetContainer(c, resolveConfig(appOf(c)))) { acc.push(c); }
	var a = c.getChildren();
	for (var i = 0; i < a.length; i++) { collectGroups(a[i], acc); }
}

/**
 * init 의 configOpt 에서 해당 그룹(id)용 설정을 고른다.
 *
 * @param {Object} opt { groups: { <id>: configOpt } }
 * @param {cpr.controls.Container} c 대상 컨테이너
 * @returns {Object} 그룹용 configOpt (없으면 null)
 */
function pickConfigForGroup(opt, c) {
	if (!opt || !opt.groups) { return null; }
	var id = c.id || null;
	return (id && opt.groups[id]) ? opt.groups[id] : null;
}

/* =========================================================================
 * 공개 API
 * ========================================================================= */
var Responsive = {};

/**
 * 설정을 지정한다. 첫 인자가 appInstance 면 그 앱에만, 아니면 전역 기본에 적용된다.
 * 미지정 키는 기존 값을 유지한다. attach 시점에 스냅샷되므로, 이미 attach 된 그룹은
 * 이후 setup 에 영향받지 않는다(호출 순서에 따른 비결정성 방지).
 *
 * 옵션
 *   aScreens         : 스크린 정의. 아래 세 형식 모두 허용
 *                      ① [{ sName, aActual, bBase }, …]      (정식)
 *                      ② ["pc", "tablet", "mobile"]           (실제명 = 논리명, 첫 항목이 베이스)
 *                      ③ { "pc": ["default", "EXB-FULL"], … } (논리명 → 실제명들, 첫 키가 베이스)
 *   sBaseScreen      : 원복 기준 "논리" 스크린명 (실제명 아님)
 *   sAutoRowAttr     : 콘텐츠 높이 힌트 속성명 (기본 "rl-auto-row")
 *   oDiv             : { sColumn, sRow, sAutoRow } 자동 리플로우 기본 구획식
 *   moLayoutDefaults : { flow: {...}, vertical: {...} } 타입 변경 시 기본 속성
 *   moCPropAllow     : rl-cprops 허용 속성 추가
 *   sLabelClass      : 폼 생성기(Responsive.Form)의 라벨 식별 클래스 (기본 "label")
 *
 * 잘못된 인자(aScreens 해석 불가, 미정의 sBaseScreen)는 cpr.exceptions.IllegalArgumentException 을 던진다.
 *
 * 예) Responsive.setup({ aScreens: ["full", "wide", "tablet", "mobile"], sBaseScreen: "full" });
 *     Responsive.setup(appInstance, { aScreens: { "wide": ["wide", "desktop"] } });
 *
 * @param {cpr.core.AppInstance|Object} vTargetOrOptions appInstance 또는 옵션 객체
 * @param {Object} [oOptions] appInstance 를 넘긴 경우의 옵션
 * @returns {ResponsiveConfig} 갱신된 설정
 */
Responsive.setup = function (vTargetOrOptions, oOptions) {
	if (vTargetOrOptions && typeof vTargetOrOptions.getContainer === "function") {
		return getOrCreateAppConfig(vTargetOrOptions).merge(oOptions);
	}
	return moGlobalConfig.merge(vTargetOrOptions);
};

/**
 * 유효 설정을 조회한다.
 *
 * @param {cpr.core.AppInstance} [appInstance] 대상 앱 (생략 시 전역 기본)
 * @returns {ResponsiveConfig}
 */
Responsive.getConfig = function (appInstance) {
	return resolveConfig(appInstance);
};

/**
 * rl-* 속성 보유 컨테이너인지 판별한다. (공통 루프 filter 용)
 *
 * @param {cpr.controls.Control} c 대상 컨트롤
 * @returns {Boolean}
 */
Responsive.isTarget = function (c) {
	return isContainer(c) && isTargetContainer(c, resolveConfig(appOf(c)));
};

/* 컨테이너 단위 등록 (기존 공통 루프 진입점) */
Responsive.attach = function (cContainer, oConfigOpt) {
	if (!isContainer(cContainer)) {
		throw new cpr.exceptions.IllegalArgumentException(
			"[Responsive] attach: cpr.controls.Container 만 등록할 수 있습니다" + idOf(cContainer));
	}

	var appInstance = appOf(cContainer);
	if (!appInstance) {
		throw new cpr.exceptions.IllegalStateException(
			"[Responsive] attach: appInstance 를 찾을 수 없습니다" + idOf(cContainer) +
			" — 컨테이너가 화면에 부착된 뒤 호출해야 합니다.");
	}

	/* 이 앱에 유효한 설정을 attach 시점에 고정한다(이후 전역 setup 변경에 영향받지 않음). */
	var oConfig = resolveConfig(appInstance).derive();
	if (!isTargetContainer(cContainer, oConfig) && !oConfigOpt) { return null; }

	/* configOpt 를 직접 주지 않았다면 폼 생성기에게 물어본다.
	 * 폼 속성(rl-<screen>-form)이 없으면 null 이 돌아오고 기존 동작 그대로다.
	 * → 공통 루프(event.module.js)는 수정할 필요가 없다. */
	if (!oConfigOpt) { oConfigOpt = Responsive.Form.buildConfig(cContainer, oConfig); }

	var ctx = getOrCreateCtx(appInstance, oConfig);

	/* 멱등 : 등록 여부의 단일 권위는 "컨텍스트에 그룹이 있는가" 이다.
	 * userAttr 표식은 보조 수단일 뿐이며, 그 쓰기가 실패해도 중복 등록되지 않아야 한다. */
	var oExist = ctx.findGroup(cContainer);
	if (oExist) { return oExist; }

	var oGroup = new LayoutGroup(cContainer, oConfig, oConfigOpt);
	ctx.addGroup(oGroup);
	try { cContainer.userAttr(ATTR.FIXED.CONFIGURED, "true"); } catch (e) { /* noop */ }

	/* rl-* 키 오타 검증 — 값 오류는 각 파서가, 키 오류(접미사·스크린명)는 여기서 잡는다 */
	var oKnown = knownKeysOf(oConfig);
	validateAttrKeys(cContainer, oKnown);
	for (var i = 0; i < oGroup.oBaseline.aChildren.length; i++) {
		validateAttrKeys(oGroup.oBaseline.aChildren[i], oKnown);
	}

	ctx.ensureListeners();
	oGroup.apply(currentScreen(appInstance));
	return oGroup;
};

/* 앱 전체 스캔 → 마커 그룹 일괄 attach
 * (프레임워크 공통 루프가 컨트롤을 순회하는 경우, 그 루프에서 attach 를 쓰는 편을 권장한다.) */
Responsive.init = function (appInstance, oConfigOpt) {
	if (!appInstance) {
		throw new cpr.exceptions.IllegalArgumentException("[Responsive] init: appInstance 가 없습니다.");
	}
	var root = getRoot(appInstance);
	if (!root) {
		logWarn("init: 루트 컨테이너 조회 불가. 공통 루프에서 Responsive.attach(container) 를 사용하세요.");
		return;
	}
	var aGroups = [];
	collectGroups(root, aGroups);
	for (var i = 0; i < aGroups.length; i++) {
		Responsive.attach(aGroups[i], pickConfigForGroup(oConfigOpt, aGroups[i]));
	}
};

/**
 * 앱 단위로 리스너를 해제하고 등록 정보를 정리한다.
 *
 * @param {cpr.core.AppInstance} appInstance 대상 앱
 */
Responsive.dispose = function (appInstance) {
	var ctx = findCtx(appInstance);
	if (!ctx) { return; }
	ctx.removeListeners();
	for (var i = 0; i < ctx.aGroups.length; i++) {
		try { ctx.aGroups[i].cGroup.userAttr(ATTR.FIXED.CONFIGURED, ""); } catch (e) { /* noop */ }
	}
	removeCtx(ctx);
	removeAppConfig(appInstance);
};

/**
 * 현재 스크린을 다시 적용한다.
 *
 * @param {cpr.core.AppInstance} appInstance 대상 앱
 */
Responsive.refresh = function (appInstance) {
	var ctx = findCtx(appInstance);
	if (ctx) { ctx.applyAll(currentScreen(appInstance)); }
};

/**
 * 특정 스크린을 강제 적용한다. 실제 스크린명(별칭)·논리명 모두 허용한다.
 *
 * @param {cpr.core.AppInstance} appInstance 대상 앱
 * @param {String} [sName] 스크린명 (생략 시 현재 스크린)
 */
Responsive.applyScreen = function (appInstance, sName) {
	var ctx = findCtx(appInstance);
	if (ctx) { ctx.applyAll(sName ? ctx.oConfig.oScreens.resolve(sName) : currentScreen(appInstance)); }
};

/**
 * 컨테이너 1개의 등록을 해제한다. attach 와 대칭으로 디자인타임 상태까지 원복한다.
 * 마지막 그룹이 빠지면 앱 리스너도 해제하고 컨텍스트를 정리한다.
 *
 * @param {cpr.controls.Container} cContainer 대상 컨테이너
 */
Responsive.detach = function (cContainer) {
	if (!cContainer) { return; }
	var appInstance = appOf(cContainer);
	var ctx = appInstance ? findCtx(appInstance) : null;
	if (!ctx) { return; }

	for (var i = 0; i < ctx.aGroups.length; i++) {
		if (ctx.aGroups[i].cGroup === cContainer) {
			ctx.aGroups[i].restore();          /* 레이아웃·컨스트레인트·가시성·cprops·클래스 원복 */
			ctx.aGroups.splice(i, 1);
			break;
		}
	}
	try { cContainer.userAttr(ATTR.FIXED.CONFIGURED, ""); } catch (e) { /* noop */ }

	/* 남은 그룹이 없으면 리스너를 남겨 둘 이유가 없다 */
	if (!ctx.aGroups.length) {
		ctx.removeListeners();
		removeCtx(ctx);
		removeAppConfig(appInstance);
	}
};

/** @type {Object} UserAttr 키 스키마 (동결). 외부에서 키 참조가 필요할 때 사용 */
Responsive.ATTR = ATTR;

/**
 * 해당 설정에서 생성될 수 있는 UserAttr 키 전체를 열거한다. 키 검증·디버깅용.
 *
 * @param {cpr.core.AppInstance} [appInstance] 대상 앱 (생략 시 전역 기본 설정)
 * @returns {Array<String>} 중복 제거·정렬된 키 목록
 */
Responsive.listAllAttrKeys = function (appInstance) {
	return resolveConfig(appInstance).listAllAttrKeys();
};

/**
 * 컨테이너에 파싱·적용된 반응형 규칙을 콘솔로 출력한다(진단용).
 * 모듈 내부를 열지 않고 "규칙이 인식됐는지 · 무엇이 적용됐는지" 확인할 때 사용한다.
 *
 * @param {cpr.controls.Container} cContainer 대상 컨테이너
 */
Responsive.explain = function (cContainer) {
	var sId = idOf(cContainer) || " (id=?)";
	var appInstance = appOf(cContainer);
	var ctx = appInstance ? findCtx(appInstance) : null;
	var oGroup = ctx ? ctx.findGroup(cContainer) : null;
	if (!oGroup) {
		console.log("[Responsive]" + sId + " : attach 되지 않은 컨테이너입니다. (isTarget=" +
			(isContainer(cContainer) && isTargetContainer(cContainer, resolveConfig(appInstance))) + ")");
		return;
	}
	console.log("[Responsive]" + sId +
		" — 베이스 타입=" + oGroup.oBaseline.sType +
		" / 현재 적용 타입=" + oGroup.sAppliedType +
		" / 현재 스크린=" + currentScreen(appInstance) +
		" / 베이스 스크린=" + oGroup.oConfig.oScreens.getBase() +
		" / 자식 " + oGroup.oBaseline.aChildren.length + "개");
	for (var i = 0; i < oGroup.aScreens.length; i++) {
		var sScreen = oGroup.aScreens[i];
		var oRule = oGroup.oGroup[sScreen];
		var nChildRules = 0;
		for (var j = 0; j < oGroup.aChildRules.length; j++) {
			if (oGroup.aChildRules[j].moByScreen[sScreen]) { nChildRules++; }
		}
		console.log("  " + sScreen +
			" : layout=" + ((oRule && oRule.sLayout) || "(베이스 유지)") +
			" / props=" + JSON.stringify((oRule && oRule.oProps) || {}) +
			" / columns=" + ((oRule && oRule.nColumns) || "-") +
			" / order=" + ((oRule && oRule.oOrder) ? "있음" : "-") +
			" / 자식 규칙 " + nChildRules + "개");
	}
};


/* =========================================================================
 * 데이터 폼 생성기 (Responsive.Form)
 * -------------------------------------------------------------------------
 * 새 레이아웃 엔진이 아니라 "쌍 수 → 좌표/구획" 을 계산하는 규칙 생성기다.
 * 결과를 attach 의 configOpt 로 흘려보내므로 적용 엔진(ApplyPlan/LayoutGroup)은
 * 한 줄도 관여하지 않는다. 아래 세 클래스는 cpr 상태를 읽기만 하는 순수 계산이다.
 *
 *   rl-pc-form = pairs:5  /  rl-tablet-form = pairs:2  /  rl-mobile-form = pairs:1
 *      ↓
 *   { screens: { pc: { props:{columns,rows}, children:{ "0":{constraint:{…}}, … } }, … } }
 *
 * rl-<screen>-columns(리플로우 트리거)를 만들지 않으므로 computeReflow 가 개입하지 않는다.
 * 따라서 항목(라벨+값)이 갈라질 수 없고, 개발자가 colSpan 을 계산할 일이 없다.
 *
 * UserAttr
 *   [그룹·스크린별] rl-<screen>-form      = pairs:N
 *   [그룹·공통]     rl-form               = label:80px@auto; field:1fr; row:28px@auto
 *   [자식·공통]     rl-form-item          = full | break | span:N
 *   [자식·스크린별] rl-<screen>-form-item = (공통값을 덮음)
 * ========================================================================= */

/* 라벨 식별 클래스는 ResponsiveConfig.sLabelClass 로 관리한다(기본 "label").
 *   전역   : Responsive.setup({ sLabelClass }) 또는 Responsive.Form.setup({ sLabelClass })
 *   앱 단위: Responsive.setup(appInstance, { sLabelClass })  — MDI 화면 간 간섭 방지 */

/**
 * 폼 항목 예외 지시를 파싱한다. 값 없는 토큰(full, break)과 span:N 을 함께 받는다.
 *
 * @param {String} sRaw 원문. 예) "full" · "break;span:2"
 * @returns {Object} { bFull, bBreak, nSpan }
 */
function parseFormDirective(sRaw) {
	var oResult = { bFull: false, bBreak: false, nSpan: 0 };
	if (!sRaw) { return oResult; }
	var aTokens = String(sRaw).split(";"), i, sToken, nSep, sKey, nSpan;
	for (i = 0; i < aTokens.length; i++) {
		sToken = trim(aTokens[i]);
		if (sToken === "") { continue; }
		nSep = sToken.indexOf(":");
		if (nSep < 0) {
			if (sToken === "full")  { oResult.bFull = true; }
			else if (sToken === "break") { oResult.bBreak = true; }
			else { logWarn("알 수 없는 폼 항목 지시: '" + sToken + "' (full|break|span:N)"); }
			continue;
		}
		sKey = trim(sToken.substring(0, nSep));
		if (sKey === "span") {
			nSpan = parseInt(trim(sToken.substring(nSep + 1)), 10);
			if (!isNaN(nSpan) && nSpan > 0) { oResult.nSpan = nSpan; }
			else { logWarn("span 값이 올바르지 않습니다: '" + sToken + "'"); }
		} else if (sKey === "full")  { oResult.bFull = (trim(sToken.substring(nSep + 1)) === "true"); }
		else if (sKey === "break")   { oResult.bBreak = (trim(sToken.substring(nSep + 1)) === "true"); }
		else { logWarn("알 수 없는 폼 항목 지시: '" + sToken + "' (full|break|span:N)"); }
	}
	return oResult;
}

/**
 * 컨트롤이 대상 클래스를 가졌는지 판별한다.
 * CPR 의 hasClass 는 토큰 단위 매칭이라 class="label required" 도 true 다.
 *
 * @param {cpr.controls.Control} c 대상 컨트롤
 * @param {String} sClass 클래스명
 * @returns {Boolean}
 */
function hasControlClass(c, sClass) {
	return !!(c && c.style && c.style.hasClass(sClass));
}

/**
 * 폼 생성기 대상 속성을 가졌는지 판별한다.
 *
 * @param {cpr.controls.Container} c 대상 컨테이너
 * @param {ResponsiveConfig} oConfig 유효 설정
 * @returns {Boolean}
 */
function hasFormAttr(c, oConfig) {
	if (!c) { return false; }
	var aNames = oConfig.oScreens.getNames();
	for (var i = 0; i < aNames.length; i++) {
		if (getUserAttr(c, ATTR.PREFIX + aNames[i] + ATTR.FORM.GROUP) !== "") { return true; }
	}
	return false;
}

/**
 * 배열의 최빈값. 동률이면 먼저 나온 값.
 *
 * @param {Array<String>} aList 대상 배열
 * @returns {String} (비었으면 null)
 */
function mostCommon(aList) {
	var oCount = {}, sBest = null, nBest = 0, i, v;
	for (i = 0; i < aList.length; i++) {
		v = aList[i];
		oCount[v] = (oCount[v] || 0) + 1;
		if (oCount[v] > nBest) { nBest = oCount[v]; sBest = v; }
	}
	return sBest;
}

/**
 * 같은 표현식을 n 개 이어붙인다. "1fr" × 3 → "1fr|1fr|1fr"
 *
 * @param {String} sExpr 구획 표현식
 * @param {Number} n 개수
 * @returns {String}
 */
function repeatExpr(sExpr, n) {
	var a = [];
	for (var i = 0; i < n; i++) { a.push(sExpr); }
	return a.join("|");
}

/* ------------------------------------------------------------------------- */

/**
 * 폼 항목 하나. 라벨과 값 중 하나는 없을 수 있다.
 *
 * @constructor
 */
function FormItem() {
	/** @type {cpr.controls.Control} 라벨 컨트롤 (없으면 null) */
	this.cLabel = null;
	/** @type {Number} 라벨의 자식 인덱스 */
	this.nLabelIndex = -1;
	/** @type {cpr.controls.Control} 값 컨트롤 (없으면 null) */
	this.cValue = null;
	/** @type {Number} 값의 자식 인덱스 */
	this.nValueIndex = -1;
}

/** @returns {Boolean} 라벨과 값이 모두 있는지 */
FormItem.prototype.isPair = function () { return !!(this.cLabel && this.cValue); };

/** @returns {Boolean} 값을 받을 수 있는 상태인지 */
FormItem.prototype.needsValue = function () { return !!this.cLabel && !this.cValue; };

/**
 * 이 항목의 예외 지시를 읽는다. 스크린별 키가 공통 키를 덮으며,
 * 라벨·값 어느 쪽에 붙어 있어도 인식하고 양쪽에 있으면 라벨을 쓴다.
 *
 * @param {String} sScreen 논리 스크린명
 * @returns {Object} { bFull, bBreak, nSpan }
 */
FormItem.prototype.getDirective = function (sScreen) {
	var sRaw = this._readDirective(this.cLabel, sScreen);
	if (sRaw === "") { sRaw = this._readDirective(this.cValue, sScreen); }
	return parseFormDirective(sRaw);
};

/**
 * 한 컨트롤에서 지시 원문을 읽는다(스크린별 우선, 없으면 공통).
 *
 * @private
 * @param {cpr.controls.Control} c 대상 컨트롤
 * @param {String} sScreen 논리 스크린명
 * @returns {String}
 */
FormItem.prototype._readDirective = function (c, sScreen) {
	if (!c) { return ""; }
	var s = getUserAttr(c, ATTR.PREFIX + sScreen + ATTR.FORM.ITEM);
	return (s !== "") ? s : getUserAttr(c, ATTR.FORM.ITEM_COMMON);
};

/* ------------------------------------------------------------------------- */

/**
 * 폼 그룹의 UserAttr 을 읽어 규칙을 만든다.
 *
 * @constructor
 * @param {cpr.controls.Container} cGroup 대상 컨테이너
 * @param {Array<String>} aScreens 논리 스크린명 목록
 */
function FormRule(cGroup, aScreens) {
	/** @type {Object} { <논리스크린명>: 쌍 수 } */
	this.moPairs = {};
	/** @type {String} 라벨 열 구획식 (명시분. 없으면 null) */
	this.sLabel = null;
	/** @type {String} 값 열 구획식 (명시분) */
	this.sField = null;
	/** @type {String} 행 높이 구획식 (명시분) */
	this.sRow = null;

	this._readCommon(cGroup);
	this._readPerScreen(cGroup, aScreens);
}

/**
 * @private
 * @param {cpr.controls.Container} cGroup 대상 컨테이너
 */
FormRule.prototype._readCommon = function (cGroup) {
	var o = parseKeyValues(getUserAttr(cGroup, ATTR.FORM.GROUP_COMMON));
	if (o.label != null) { this.sLabel = String(o.label); }
	if (o.field != null) { this.sField = String(o.field); }
	if (o.row != null)   { this.sRow   = String(o.row); }
};

/**
 * @private
 * @param {cpr.controls.Container} cGroup 대상 컨테이너
 * @param {Array<String>} aScreens 논리 스크린명 목록
 */
FormRule.prototype._readPerScreen = function (cGroup, aScreens) {
	for (var i = 0; i < aScreens.length; i++) {
		var sRaw = getUserAttr(cGroup, ATTR.PREFIX + aScreens[i] + ATTR.FORM.GROUP);
		if (sRaw === "") { continue; }
		var o = parseKeyValues(sRaw);
		if (o.label != null && this.sLabel === null) { this.sLabel = String(o.label); }
		if (o.field != null && this.sField === null) { this.sField = String(o.field); }
		if (o.row != null && this.sRow === null)     { this.sRow   = String(o.row); }

		var nPairs = parseInt(o.pairs, 10);
		if (isNaN(nPairs) || nPairs < 1) {
			logWarn("pairs 값이 올바르지 않습니다: '" + sRaw + "'" + idOf(cGroup) + " → 이 스크린은 건너뜁니다");
			continue;
		}
		this.moPairs[aScreens[i]] = nPairs;
	}
};

/** @returns {Boolean} 쌍 수가 하나라도 지정됐는지 */
FormRule.prototype.hasAny = function () {
	for (var k in this.moPairs) { if (this.moPairs.hasOwnProperty(k)) { return true; } }
	return false;
};

/* ------------------------------------------------------------------------- */

/**
 * 한 스크린 분량의 배치를 계산한다. 항목 단위로만 전진하므로 라벨과 값이 갈라질 수 없다.
 *
 * @constructor
 * @param {Array<FormItem>} aItems 항목 목록
 * @param {Number} nPairs 쌍 수
 * @param {String} sScreen 논리 스크린명
 */
function FormArranger(aItems, nPairs, sScreen) {
	/** @type {Number} 열 개수 */
	this.nCols = nPairs * 2;
	/** @type {Number} 계산된 행 개수 */
	this.nRows = 0;
	/** @type {Object} { <자식인덱스>: { colIndex, rowIndex, colSpan } } */
	this.moPlacement = {};

	this._arrange(aItems, sScreen);
}

/**
 * @private
 * @param {Array<FormItem>} aItems 항목 목록
 * @param {String} sScreen 논리 스크린명
 */
FormArranger.prototype._arrange = function (aItems, sScreen) {
	var N = this.nCols, nCol = 0, nRow = 0, i;

	for (i = 0; i < aItems.length; i++) {
		var oItem = aItems[i];
		var oDir = oItem.getDirective(sScreen);
		var nCells = this._cellsOf(oDir, N);

		if ((oDir.bBreak && nCol > 0) || nCol + nCells > N) { nCol = 0; nRow++; }

		if (oItem.isPair()) {
			this._put(oItem.nLabelIndex, nCol, nRow, 1);
			this._put(oItem.nValueIndex, nCol + 1, nRow, nCells - 1);
		} else if (oItem.cLabel) {
			this._put(oItem.nLabelIndex, nCol, nRow, nCells);
		} else if (oItem.cValue) {
			this._put(oItem.nValueIndex, nCol, nRow, nCells);
		}
		nCol += nCells;
	}
	this.nRows = aItems.length ? (nRow + 1) : 0;
};

/**
 * 항목이 차지할 칸 수. 기본 2칸(1쌍)이며 예외 지시를 준 항목만 벗어난다.
 *
 * @private
 * @param {Object} oDir 지시 { bFull, nSpan }
 * @param {Number} N 열 개수
 * @returns {Number}
 */
FormArranger.prototype._cellsOf = function (oDir, N) {
	var nCells = oDir.bFull ? N : (oDir.nSpan ? (1 + oDir.nSpan) : 2);
	if (nCells > N) { nCells = N; }
	if (nCells < 1) { nCells = 1; }
	return nCells;
};

/**
 * colSpan 은 매 스크린 빠짐없이 내보낸다 — 코어는 updateConstraint 병합이라
 * 생략하면 직전 스크린 값이 남아 전환 순서에 따라 결과가 달라진다.
 *
 * @private
 * @param {Number} nIndex 자식 인덱스
 * @param {Number} nCol 열
 * @param {Number} nRow 행
 * @param {Number} nSpan 열 병합 수
 */
FormArranger.prototype._put = function (nIndex, nCol, nRow, nSpan) {
	if (nIndex < 0) { return; }
	this.moPlacement[String(nIndex)] = {
		colIndex: nCol, rowIndex: nRow, colSpan: (nSpan < 1) ? 1 : nSpan
	};
};

/* ------------------------------------------------------------------------- */

/**
 * 그룹의 직계 자식을 항목 목록으로 묶는다.
 * 폼은 한 구획에 한 컨트롤만 배치되므로 직계 자식은 "라벨 1개 또는 값 1개" 다.
 *
 * @param {cpr.controls.Container} cGroup 대상 컨테이너
 * @param {ResponsiveConfig} oConfig 유효 설정 (라벨 식별 클래스)
 * @returns {Array<FormItem>}
 */
function buildFormItems(cGroup, oConfig) {
	var aChildren = cGroup.getChildren();
	var aItems = [], oCurrent = null, i;

	for (i = 0; i < aChildren.length; i++) {
		var ch = aChildren[i];
		if (!ch) { continue; }

		if (hasControlClass(ch, oConfig.sLabelClass)) {
			oCurrent = new FormItem();
			oCurrent.cLabel = ch;
			oCurrent.nLabelIndex = i;
			aItems.push(oCurrent);
		} else if (oCurrent && oCurrent.needsValue()) {
			oCurrent.cValue = ch;
			oCurrent.nValueIndex = i;
		} else {
			oCurrent = new FormItem();
			oCurrent.cValue = ch;
			oCurrent.nValueIndex = i;
			aItems.push(oCurrent);
		}
	}
	return aItems;
}

/**
 * 원본 레이아웃에서 라벨/값 열 폭과 행 높이를 추출한다.
 * 짝수 인덱스를 라벨 후보, 홀수 인덱스를 값 후보로 보고 각각 최빈값을 쓴다.
 * 패턴이 부분적으로 어긋나도 실패로 보지 않는다 — 라벨 폭이 "최소 폭 + 내용 자동" 형태라
 * 정확히 맞지 않아도 결과가 어긋나지 않기 때문이다.
 *
 * @param {cpr.controls.Container} cGroup 대상 컨테이너
 * @returns {Object} { sLabel, sField, sRow } (구조적으로 불가하면 null)
 */
function extractFormDivisions(cGroup) {
	var oLayout = cGroup.getLayout();
	var oCols = DivisionList.snapshot(oLayout, true);
	if (oCols.getCount() < 2) {
		logWarn("폼 열이 2개 미만이라 라벨/값 폭을 추출할 수 없습니다" + idOf(cGroup) + " → 폼 규칙 미적용");
		return null;
	}
	var oRows = DivisionList.snapshot(oLayout, false);
	var aLabel = [], aField = [], i;
	for (i = 0; i < oCols.aSpecs.length; i++) {
		((i % 2 === 0) ? aLabel : aField).push(oCols.aSpecs[i].toExpr());
	}
	return {
		sLabel: mostCommon(aLabel),
		sField: mostCommon(aField),
		sRow:   oRows.getCount() ? oRows.aSpecs[0].toExpr() : "1fr"
	};
}

/* ------------------------------------------------------------------------- */

/** @type {Object} 데이터 폼 규칙 생성기 */
Responsive.Form = {};

/**
 * 폼 생성기 설정(전역). 앱 단위 지정은 Responsive.setup(appInstance, { sLabelClass }) 을 사용한다.
 *
 * @param {Object} oOptions { sLabelClass }
 */
Responsive.Form.setup = function (oOptions) {
	if (!oOptions) { return; }
	if (oOptions.sLabelClass) { moGlobalConfig.sLabelClass = oOptions.sLabelClass; }
};

/**
 * 폼 생성기 대상인지 판별한다. (rl-<screen>-form 을 하나라도 가졌는지)
 *
 * @param {cpr.controls.Container} cGroup 대상 컨테이너
 * @returns {Boolean}
 */
Responsive.Form.isFormGroup = function (cGroup) {
	return hasFormAttr(cGroup, resolveConfig(appOf(cGroup)));
};

/**
 * 폼 규칙을 attach 용 configOpt 로 변환한다. cpr 상태를 읽기만 한다.
 *
 * @param {cpr.controls.Container} cGroup 대상 컨테이너
 * @param {ResponsiveConfig} [oConfig] 유효 설정 (생략 시 조회)
 * @returns {Object} configOpt (폼이 아니거나 추출 실패면 null)
 */
Responsive.Form.buildConfig = function (cGroup, oConfig) {
	if (!oConfig) { oConfig = resolveConfig(appOf(cGroup)); }
	if (!hasFormAttr(cGroup, oConfig)) { return null; }

	var aScreens = oConfig.oScreens.getNames();
	var oRule = new FormRule(cGroup, aScreens);
	if (!oRule.hasAny()) { return null; }

	var oExtract = extractFormDivisions(cGroup);
	if (!oExtract) { return null; }

	var sLabel = oRule.sLabel || oExtract.sLabel;
	var sField = oRule.sField || oExtract.sField;
	var sRow   = oRule.sRow   || oExtract.sRow;

	var aItems = buildFormItems(cGroup, oConfig);
	var oScreens = {}, sScreen, oArranged, sIndex, oChildren;

	for (sScreen in oRule.moPairs) {
		if (!oRule.moPairs.hasOwnProperty(sScreen)) { continue; }
		oArranged = new FormArranger(aItems, oRule.moPairs[sScreen], sScreen);

		oChildren = {};
		for (sIndex in oArranged.moPlacement) {
			if (!oArranged.moPlacement.hasOwnProperty(sIndex)) { continue; }
			oChildren[sIndex] = { constraint: oArranged.moPlacement[sIndex] };
		}
		oScreens[sScreen] = {
			props: {
				columns: repeatExpr(sLabel + "|" + sField, oRule.moPairs[sScreen]),
				rows:    repeatExpr(sRow, oArranged.nRows || 1)
			},
			children: oChildren
		};
	}
	return { screens: oScreens };
};

/**
 * 스크린별 계산 결과를 콘솔로 출력한다(진단용).
 *
 * @param {cpr.controls.Container} cGroup 대상 컨테이너
 */
Responsive.Form.explain = function (cGroup) {
	var sId = idOf(cGroup) || " (id=?)";
	var oConfigOpt = Responsive.Form.buildConfig(cGroup);
	if (!oConfigOpt) { console.log("[Responsive.Form]" + sId + " : 폼 대상 아님"); return; }

	console.log("[Responsive.Form]" + sId + " — 항목 " +
		buildFormItems(cGroup, resolveConfig(appOf(cGroup))).length + "개");
	for (var s in oConfigOpt.screens) {
		if (!oConfigOpt.screens.hasOwnProperty(s)) { continue; }
		var o = oConfigOpt.screens[s], n = 0, k;
		for (k in o.children) { if (o.children.hasOwnProperty(k)) { n++; } }
		console.log("  " + s + " : columns=" + o.props.columns + " / rows=" + o.props.rows + " / 배치 " + n + "개");
	}
};

/**
 * ATTR 에 선언됐지만 적용 로직이 처리하지 않는 키를 개발 중에 알린다.
 * 키만 추가하고 적용을 빠뜨리는 무증상 누락을 방지한다.
 */
function assertHandledKeys() {
	for (var i = 0; i < GROUP_KEYS.length; i++) {
		if (indexOf(ApplyPlan.HANDLED_GROUP_FIELDS, GROUP_KEYS[i].sField) < 0) {
			logWarn("ATTR.GROUP 에 '" + GROUP_KEYS[i].sSuffix +
				"' 가 선언됐지만 적용 로직이 없습니다(ApplyPlan.HANDLED_GROUP_FIELDS 확인).");
		}
	}
}
assertHandledKeys();

globals.Responsive = Responsive;
