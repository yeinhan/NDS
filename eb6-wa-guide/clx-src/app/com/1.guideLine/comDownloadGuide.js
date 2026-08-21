/************************************************
 * comDownloadGuide.js
 * Created at 2023. 11. 3. 오전 9:53:59.
 *
 * @author daye
 ************************************************/

var util = createCommonUtil();

function downloadFile (psAction) {
	var a = document.createElement("a");
	a.setAttribute("href", psAction);
	a.setAttribute("target", "_blank");
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

/*
 * "다운로드" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	downloadFile("docs/eXBuilder6_웹접근성_컨트롤가이드_v1.1.pdf");
}

/*
 * "다운로드" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn2 = e.control;
	
	downloadFile("docs/eXBuilder6_웹접근성_퍼블리싱가이드_v1.0.pdf");
}

/*
 * "다운로드" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var btn3 = e.control;
	
	downloadFile("docs/eXBuilder6_웹접근성_공통설정가이드_v1.0.pdf");
}

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
}

/*
 * "다운로드" 버튼(btn4)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn4Click(e){
	var btn4 = e.control;
	
	downloadFile("docs/eXBuilder6_웹접근성_개발가이드_v1.0.pdf");
}
