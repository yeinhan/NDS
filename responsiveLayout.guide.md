# responsiveLayout 사용 가이드

> eXBuilder6 반응형 레이아웃 모듈. 화면 JS **0줄** — 디자이너에서 UserAttr 선언만으로 동작.
> 문의: **토마토시스템 테크돔(TechDome) 사이트**

---

## 목차

1. [시작하기](#1-시작하기)
2. [빠른 참조 (키 표 · 값 문법)](#2-빠른-참조)
3. [키별 상세 설명](#3-키별-상세-설명)
4. [데이터 폼 생성기 (Responsive.Form)](#4-데이터-폼-생성기-responsiveform)
5. [동작 원리 (경로 독립성 · 원복 · 우선순위)](#5-동작-원리)
6. [설정 (Responsive.setup)](#6-설정-responsivesetup)
7. [함수 API](#7-함수-api)
8. [실수 방지 · 디버깅](#8-실수-방지--디버깅)
9. [자주 하는 실수 (주의)](#9-자주-하는-실수-주의)
10. [실전 패턴 모음](#10-실전-패턴-모음)

---

## 1. 시작하기

공통 루프에 1줄만 넣으면 화면별 JS 코드는 필요 없습니다:

```js
if (each instanceof cpr.controls.Container && Responsive.isTarget(each)) { Responsive.attach(each); }
```

**스크린 개념** — 규칙은 "논리 스크린명"으로 선언하고, 실제 스크린명은 논리명으로 매핑됩니다.

| 논리명 | 실제 스크린명 | 비고 |
|--------|--------------|------|
| `pc` | `default`, `desktop` | **베이스(원복 기준)** |
| `tablet` | `tablet` | |
| `mobile` | `mobile` | |

- 키는 항상 `rl-` + **논리명** + 접미사입니다 (예: `rl-mobile-props`).
- 정의되지 않은 스크린으로 전환되면 **베이스 규칙**(있으면) 또는 **디자인타임 원본**으로 복귀합니다.
- 스크린 구성 변경은 `Responsive.setup()` — [6장](#6-설정-responsivesetup) 참고.

## 2. 빠른 참조

### 키 표

| 대상 | 키 | 값 | 예 |
|------|-----|-----|-----|
| 그룹 | `rl-<screen>-layout` | form \| vertical \| flow \| xy | `rl-mobile-layout` = `vertical` |
| 그룹 | `rl-<screen>-props` | key:value; … | `rl-tablet-props` = `columns:80px@auto\|1fr; margins:8 4` |
| 그룹 | `rl-<screen>-columns` | N (폼 리플로우 + 열 개수) | `rl-tablet-columns` = `2` |
| 그룹 | `rl-<screen>-order` | byIndex / moves / reorderOnly | `rl-mobile-order` = `byIndex:2,0,1` |
| 그룹 | `rl-<screen>-class` | 클래스1 클래스2 (공백 구분) | `rl-mobile-class` = `compact` |
| 그룹 | `rl-<screen>-form` | pairs:N (폼 생성기) | `rl-mobile-form` = `pairs:1` |
| 그룹 | `rl-form` | label:…; field:…; row:… (폼 공통) | `rl-form` = `label:80px@auto; field:1fr` |
| 자식 | `rl-<screen>-constraint` | key:value; … (hidden 포함) | `rl-mobile-constraint` = `hidden:true` |
| 자식 | `rl-<screen>-class` | 클래스1 클래스2 | `rl-mobile-class` = `btn--full` |
| 자식 | `rl-<screen>-cprops` | 간격 관련 화이트리스트만 | `rl-mobile-cprops` = `horizontalSpacing:4` |
| 자식 | `rl-form-item` (+스크린별) | full \| break \| span:N | `rl-mobile-form-item` = `full` |
| 자식 | `rl-auto-row` | auto \| auto@min40 \| 구획식 | 콘텐츠 높이로 (스크린 무관) |

### 값 문법 4종

| 구분자 | 용도 | 예 |
|--------|------|-----|
| `;` + `:` | 속성 나열 | `columns:2; scrollable:false` |
| `\|` | 구획(열/행) 나열 | `80px@auto\|1fr\|80px@auto\|1fr` |
| `@` | 구획 옵션 | `1fr@min120`, `0px@auto`, `@hidden` |
| `,` / `>` | 배열 / 이동 | `byIndex:2,0,1` / `moves:0>2` |

### 값 타입 자동 판별

`true`/`false` → Boolean, 순수 숫자 → Number, 그 외(`0px`, `1fr`, `fill`) → String.

---

## 3. 키별 상세 설명

### 3-1. `rl-<screen>-layout` — 레이아웃 타입 전환

```
rl-mobile-layout = vertical
```
→ 모바일에서 그룹 레이아웃이 vertical로 바뀝니다. 생략하면 **베이스 타입 유지**(전환 순서 무관).

- 지원 타입: `form` | `vertical` | `flow` | `xy` (오타 시 경고 후 베이스 타입 유지)
- 타입 변경 시 기본 속성 주입: flow → `scrollable:false`, vertical → `distribution:fill` (props로 덮어쓰기 가능)
- **크기 이월** (flow↔vertical 전환만): 명시 constraint가 없으면 소스의 width/height를 이월. 단 autoSize 적용 축과 vertical fill의 폭은 제외
- **정렬 매핑** (vertical→flow 방향만): `distribution` leading→left / center→center / trailing→right. flow→vertical은 매핑하지 않고 기본 `distribution=fill`

### 3-2. `rl-<screen>-props` — 레이아웃 속성

```
rl-tablet-props = columns:80px@auto|1fr; rows:28px; horizontalSpacing:8; margins:8 4
```

- `;`로 속성 나열, 각 속성은 `key:value`. **콤마로 나열하면 안 됩니다** (한 값으로 오파싱됨)
- `columns` / `rows`: 구획 폭·높이. `|`로 나열, `@auto`(콘텐츠 자동) `@min<n>`(최소) `@hidden`(숨김) 옵션
- `margins` 단축(CSS 식): 공백/콤마 구분 1~4개 → 상/우/하/좌. `margins:8` = 전체 8, `margins:24 16` = 세로24 가로16. 개별 `topMargin` 등이 단축보다 우선
- 그 외 속성(`spacing`, `distribution`, `scrollable`, `horizontalAlign` 등)은 레이아웃 객체에 그대로 대입
- 미지정 margin/spacing은 **베이스 값 유지** (동일 타입일 때)

**columns/rows 값 개수 규칙** (목표 개수 N = `rl-columns` 값, 없으면 현재/베이스 개수):

| 값 개수 | 동작 |
|---------|------|
| 1개 | 템플릿 — N개로 복제 (`columns:120px` + 3열 → 전부 120px) |
| 2개 이상 | **그 개수가 곧 구획 개수** (`columns:80px\|1fr\|80px\|1fr` → 4열) |
| N과 불일치 | 마지막 값으로 채움 + console.error (에러에 해결 방법 안내 포함) |

columns/rows를 아예 안 주면 그 축은 기존 구조를 유지합니다.

### 3-3. `rl-<screen>-columns` — 폼 자동 리플로우

```
rl-tablet-columns = 2
```
→ 폼의 자식들을 **2열 기준으로 자동 재배치**합니다 (자식 순서대로 왼→오, 넘치면 다음 행).

- 열 개수(N)의 **권위**이자 리플로우 **트리거**. `props.columns`는 열 "폭"만 정의
- 자식의 `colSpan`/`rowSpan`은 존중 (colSpan > N이면 N으로 클램프, 미지정은 1로 리셋)
- 명시 `colIndex`/`rowIndex`는 **무시**됩니다(자동 계산 우선) — 순서를 바꾸려면 `rl-order` 사용
- 행 전체가 hidden이면 그 행을 제거하고 아래 행을 당깁니다 (부분 hidden은 행 유지)
- 행 높이: 컨트롤 `rl-auto-row` 힌트 > `props.rows` > 전역 기본(1fr)
- **타입 전환과 조합**: `rl-mobile-layout=form` + `rl-mobile-columns=2` → 아무 그룹이나 모바일에서 2열 폼으로. columns를 빼면 1열 자동 배치가 되고 다열 폭은 잘림(콘솔 에러로 안내됨)

### 3-4. `rl-<screen>-order` — 자식 순서 변경

인덱스는 **디자인타임(원본) 순서 기준 0부터**이며, 전환 순서와 무관하게 항상 원본 기준으로 계산됩니다.

원본 자식이 `A(0), B(1), C(2)`일 때:

**① byIndex — 전체 순서를 직접 나열**

```
rl-mobile-order = byIndex:2,0,1
```
→ 모바일에서 `C, A, B`. 나열한 원본 인덱스 순서대로 재배열됩니다.

**② moves — 특정 자식만 이동**

```
rl-mobile-order = moves:0>2
```
→ 원본 0번(A)을 2번 위치로 이동 → `B, C, A`. 여러 개는 콤마로: `moves:0>2,1>0`

**③ reorderOnly — 순서만 바꾸고 배치 재계산은 하지 않음**

```
rl-mobile-order = reorderOnly:true; byIndex:2,0,1
```

**동작 참고**
- order 미지정 스크린으로 가면 원본 순서로 복귀합니다.
- `rl-columns` 리플로우와 함께 쓰면 **바뀐 순서대로** 왼→오로 다시 채워집니다. 모바일 배치 순서 변경의 대표 조합: `rl-mobile-columns=1` + `rl-mobile-order=byIndex:…`
- 없는 인덱스는 `[Responsive] order.byIndex: 인덱스 N 에 자식이 없습니다` 경고 후 그 항목만 무시됩니다.

### 3-5. `rl-<screen>-class` — 클래스 토글

```
rl-mobile-class = compact list--dense     (그룹에)
rl-mobile-class = btn--full               (자식에)
```

- 공백 구분으로 여러 개 지정. 그룹과 직계 자식 모두 사용 가능
- **모듈이 붙인 클래스만 관리** — IDE/디자이너에서 지정한 클래스는 건드리지 않음
- 다른 스크린으로 가면 모듈이 붙인 클래스만 해제됨

### 3-6. `rl-<screen>-constraint` — 자식 컨스트레인트

```
rl-mobile-constraint = hidden:true
rl-tablet-constraint = colSpan:2; horizontalAlign:fill
rl-mobile-constraint = left:0px; top:0px; right:0px; height:40px    (xy 용)
```

레이아웃별 사용 키:

| 레이아웃 | 주요 키 |
|----------|---------|
| form | colIndex, rowIndex, colSpan, rowSpan, horizontalAlign, verticalAlign (정렬값 대소문자 무관) |
| vertical | height, autoSize |
| flow | width, height, autoSize |
| xy | left, top, right, bottom, width, height |

- **`hidden:true|false`** — 표시/숨김은 모든 레이아웃 공통으로 여기로 일원화. `hidden:false`는 표시 강제(디자인타임에 숨긴 컨트롤을 특정 스크린에서만 표시)
- hidden 미지정 스크린에서는 **디자인타임 가시성으로 리셋** — 직전 스크린의 숨김이 다음 스크린에 남지 않음(경로 독립)
- rl 속성 없이 디자이너에서 숨긴 컨트롤은 그대로 유지(강제 표시하지 않음)
- 우선순위: **크기 이월 < rl-auto-row autoSize < 명시 rl-constraint (최우선)**

### 3-7. `rl-<screen>-cprops` — 컨트롤 자체 속성 (간격 전용)

```
rl-mobile-cprops = horizontalSpacing:4; verticalSpacing:2
rl-tablet-cprops = barItemWidths:100,80,120
```

- 레이아웃이 아니라 **컨트롤 자신의 속성**을 스크린별로 바꿉니다 (체크박스그룹 간격, 탭 폴더 아이템 폭 등)
- **화이트리스트만 허용** (그 외 키는 경고 후 무시): `horizontalSpacing` `verticalSpacing` `itemSpacing` `itemSizing` `preferredItemWidth` `itemAlign` `barItemWidths` `barItemSpacing` `indent` `pageIndexWidth` `navigationType` `space` — 추가는 `setup({ moCPropAllow })`
- 값에 콤마가 있으면 배열로 파싱: `100,80,120` → `[100,80,120]`, `100,auto` → `[100,"auto"]`
- 미지정 스크린·원복 시 attach 시점의 **베이스 값으로 복원**

### 3-8. `rl-auto-row` — 콘텐츠 높이 (스크린 무관)

```
rl-auto-row = auto            → 콘텐츠 높이
rl-auto-row = auto@min40      → 콘텐츠 높이, 최소 40px
rl-auto-row = 120px           → 직접 구획식
```

자식 컨트롤에 붙이는 **스크린 무관 단일 속성**입니다.

- **폼**: 그 컨트롤이 속한 "행"을 auto(0px@auto) 높이로. 그룹 전체 행은 `props.rows`로, 특정 한 행만 예외 처리할 때 사용. 우선순위: 컨트롤(rl-auto-row) > 그룹(props.rows) > 전역 기본
- **vertical/flow**: constraint `autoSize`에 height 부여 (width 보유 시 both. 단 vertical fill은 폭을 레이아웃이 채우므로 height만)
- 속성명 변경: `setup({ sAutoRowAttr: "..." })`

---

## 4. 데이터 폼 생성기 (Responsive.Form)

라벨+값 쌍으로 구성된 폼을 "쌍 수"만으로 재배치합니다. `rl-columns` 리플로우와 달리 **라벨과 값이 갈라지지 않고**, colSpan 계산이 필요 없습니다.

```
[그룹]  rl-pc-form     = pairs:5        ← PC 5쌍(10열)
        rl-tablet-form = pairs:2        ← 탭릿 2쌍(4열)
        rl-mobile-form = pairs:1        ← 모바일 1쌍(2열)
        rl-form        = label:80px@auto; field:1fr; row:28px@auto   (생략 가능)
[자식]  rl-form-item          = full           ← 이 항목은 항상 전체 폭
        rl-mobile-form-item   = span:2         ← 모바일에서만 값이 2칸
```

- **라벨 판별**: style 클래스 `label` 보유 여부 (변경: `Responsive.setup({ sLabelClass })`, 앱 단위는 `setup(appInstance, { sLabelClass })`)
- 항목 묶음: 라벨 다음에 오는 비라벨 컨트롤이 그 라벨의 "값". 라벨 없는 컨트롤은 단독 항목
- `rl-form`(label/field/row 폭)을 생략하면 **원본 폼에서 자동 추출** (짝수열 최빈값=라벨 폭, 홀수열=값 폭, 첫 행=행 높이)
- 항목 예외 지시 (`rl-form-item`, 스크린별 키가 공통 키를 덮음):
  - `full` — 그 항목이 행 전체 폭 차지
  - `break` — 그 항목 앞에서 줄바꿈
  - `span:N` — 값이 N칸 차지
- 진단: `Responsive.Form.explain(그룹)` — 스크린별 계산 결과(columns/rows/배치) 콘솔 출력

## 5. 동작 원리

**경로 독립성** — 모든 스크린 규칙은 "직전 상태"가 아니라 **attach 시점의 베이스(디자인타임) 스냅샷** 기준으로 계산됩니다. 따라서 `PC→탭릿→모바일`과 `모바일→탭릿` 어느 순서로 전환해도 같은 스크린이면 같은 결과입니다.

**원복** — 베이스 스크린(기본 pc)으로 돌아오면: 레이아웃 객체·구획(0px@auto 포함)·자식 순서·컨스트레인트·가시성·cprops·모듈 클래스가 모두 디자인타임 상태로 복원됩니다.

**미정의 스크린** — 규칙이 없는 스크린(매핑 안 된 실제명 포함)에서는 베이스 규칙(있으면) 또는 원본으로 복귀합니다.

**우선순위 정리**
- 규칙 소스: `configOpt`(JS) > UserAttr
- 자식 constraint: 크기 이월 < rl-auto-row autoSize < 명시 rl-constraint
- 폼 행 높이: 컨트롤 rl-auto-row > 그룹 props.rows > 전역 기본
- 설정: attach 시점 스냅샷 — attach 이후 `setup()` 변경은 기존 그룹에 영향 없음

## 6. 설정 (Responsive.setup)

```js
Responsive.setup(options);                    // 전역
Responsive.setup(appInstance, options);       // 이 앱만 (MDI 간섭 방지)
```

| 옵션 | 설명 |
|------|------|
| `aScreens` | 스크린 정의. 3형식: ① `[{sName, aActual, bBase}, …]` ② `["pc","tablet","mobile"]`(첫 항목이 베이스) ③ `{ "pc": ["default","EXB-FULL"], … }`(첫 키가 베이스) |
| `sBaseScreen` | 원복 기준 **논리** 스크린명 (실제명 지정 시 예외 발생) |
| `sAutoRowAttr` | 콘텐츠 높이 힌트 속성명 (기본 `rl-auto-row`) |
| `sLabelClass` | 폼 생성기 라벨 식별 클래스 (기본 `label`) |
| `oDiv` | `{ sColumn, sRow, sAutoRow }` 리플로우 기본 구획식 (기본 1fr / 1fr / 0px@auto) |
| `moLayoutDefaults` | `{ flow: {...}, vertical: {...} }` 타입 변경 시 기본 속성 |
| `moCPropAllow` | cprops 허용 속성 추가 |

```js
// 예: 실제 스크린 5종을 논리 4개로 묶고, wide/desktop 공통 규칙 사용
Responsive.setup({
    aScreens: [
        { sName: "full",   bBase: true },
        { sName: "wide",   aActual: ["wide", "desktop"] },
        { sName: "tablet" },
        { sName: "mobile" }
    ]
});
```

## 7. 함수 API

| 함수 | 설명 |
|------|------|
| `Responsive.attach(container [, configOpt])` | 컨테이너 등록 + 현재 스크린 즉시 적용. **권장 진입점**. 반환값(LayoutGroup)으로 `.apply(screen)` / `.restore()` 직접 제어 가능 |
| `Responsive.detach(container)` | 등록 해제 + 디자인타임 완전 원복 (attach와 대칭) |
| `Responsive.init(appInstance [, configOpt])` | 루트부터 대상 그룹 스캔 → 일괄 attach |
| `Responsive.dispose(appInstance)` | 앱 단위 리스너 해제 + 정리 (unload 시 자동 호출됨) |
| `Responsive.refresh(appInstance)` | 현재 스크린 재적용 |
| `Responsive.applyScreen(appInstance, name)` | 특정 스크린 강제 적용 (실제명/논리명 모두 허용) |
| `Responsive.isTarget(c)` | rl-* 보유 컨테이너 판별 (공통 루프 filter용) |
| `Responsive.getConfig([appInstance])` | 유효 설정 조회 |
| `Responsive.explain(container)` | 파싱된 규칙·적용 상태 콘솔 출력 (진단) |
| `Responsive.listAllAttrKeys([appInstance])` | 유효 UserAttr 키 전량 (검증·디버깅) |
| `Responsive.Form.explain(container)` | 폼 생성기 계산 결과 출력 |

**configOpt** — UserAttr 대신/보완으로 JS에서 규칙 지정 (UserAttr보다 우선):

```js
Responsive.attach(grpTarget, {
    screens: {
        mobile: {
            layout: "vertical", props: { spacing: 8 }, columns: 1,
            order: { byIndex: [2, 0, 1] },
            children: { "ipbName": { constraint: { height: "40px" } }, "0": { classes: ["full"] } }
        }
    }
});
```

## 8. 실수 방지 · 디버깅

**자동 검출** — attach 시점에 다음이 콘솔에 보고됩니다:

| 실수 | 반응 |
|------|------|
| rl-* 키 오타 (`rl-tabet-props`, 미정의 스크린명) | `알 수 없는 rl-* 속성` 경고 (대상 ID 포함) |
| 값 오류 (columns:abc, layout:grid) | 경고 + 안전 폴백 (리플로우 안 함 / 베이스 타입 유지) |
| 구획 개수 불일치 | console.error + **해결 방법 안내** (`rl-<screen>-columns = N 을 함께 지정하세요` 등) |
| configOpt 자식 ID 오타 | `자식 '...' 을 찾을 수 없습니다` 경고 |

**API 오용은 예외 발생** (조용히 실패하지 않음):
- `attach(비컨테이너)` → `IllegalArgumentException`
- `attach(화면 미부착 컨테이너)` → `IllegalStateException`
- `init()` 인자 없음 / `setup` aScreens 해석 불가 / sBaseScreen에 실제명 → `IllegalArgumentException`

**진단 순서** (규칙이 안 먹을 때):

```js
Responsive.explain(grpTarget);       // 1. 규칙이 파싱됐는지, 현재 무엇이 적용됐는지
Responsive.listAllAttrKeys();        // 2. 유효 키 목록과 대조
Responsive.Form.explain(grpForm);    // 3. 폼 생성기라면 계산 결과 확인
```

**탈출구** — 공통 모듈로 안 되는 케이스: `detach()`로 완전 원복 후 원본 API 직접 사용, 또는 attach 반환값으로 `.apply()/.restore()` 직접 제어. 컨테이너 단위 부분 적용도 가능합니다(all-or-nothing 아님).

## 9. 자주 하는 실수 (주의)

- **props 나열 구분자는 `;`** — 콤마로 나열하면 한 값으로 오파싱됩니다
- 버티컬 `distribution=fill`은 **가로만** 채움 → `rl-auto-row`는 height로만 적용
- flow→vertical 전환은 정렬을 매핑하지 않음 (vertical 기본 `distribution=fill`)
- 자식마다 `colIndex`를 직접 주는 폼에는 `rl-<screen>-columns`(리플로우) 금지 — 자동 위치가 명시값을 덮습니다. 순서 변경은 `rl-order`로
- 타입 전환으로 만든 폼(`rl-<screen>-layout=form`)에서 다열 폭(`columns:1fr|28px`)을 쓰려면 **`rl-<screen>-columns=2`를 함께 지정** — 없으면 1열로 잘림(콘솔 에러로 안내됨)
- 구획 값 개수 ≠ 열 개수(N)이면 마지막 값으로 채워지고 console.error 발생
- `sBaseScreen`에는 실제명이 아니라 **논리명**을 지정 (실제명 지정 시 예외)
- 규칙이 안 먹으면 **콘솔부터 확인** — 키 오타·값 오류·개수 불일치가 attach/전환 시점에 전부 보고됩니다

## 10. 실전 패턴 모음

**① 모바일 1열 폼** — 그룹에:
```
rl-mobile-columns = 1
```

**② 탭릿 2열 폼 (라벨+값 쌍 유지)** — 그룹에:
```
rl-tablet-form = pairs:2
rl-mobile-form = pairs:1
```

**③ 모바일에서 특정 컨트롤 숨김** — 자식에:
```
rl-mobile-constraint = hidden:true
```

**④ 모바일에서 순서 바꿔 세로 나열** — 그룹에:
```
rl-mobile-columns = 1
rl-mobile-order   = byIndex:2,0,1
```

**⑤ 아무 그룹을 모바일에서 2열 폼으로** — 그룹에:
```
rl-mobile-layout  = form
rl-mobile-columns = 2
rl-mobile-props   = columns:1fr|28px; rows:28px
```

**⑥ 메모 행만 콘텐츠 높이** — 그 자식에:
```
rl-auto-row = auto@min80
```

**⑦ 버튼 그룹을 모바일에서 세로로** — 그룹에:
```
rl-mobile-layout = vertical
rl-mobile-props  = spacing:8; margins:16
```

**⑧ 특정 항목만 전체 폭 (폼 생성기)** — 자식에:
```
rl-form-item = full
```

**⑨ 실제 스크린 별칭 묶기** — 화면 JS 또는 공통 초기화에서:
```js
Responsive.setup({ aScreens: { "pc": ["default", "EXB-FULL"], "tablet": ["EXB-DIV"], "mobile": ["EXB-PART"] } });
```

**⑩ 스크린별 CSS 전환** — 그룹/자식에:
```
rl-mobile-class = compact dense
```
