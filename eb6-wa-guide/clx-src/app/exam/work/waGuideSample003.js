/************************************************
 * waGuideSample003.js
 * Created at 2022. 10. 17. 오전 8:19:54.
 *
 * @author ksk1908
 ************************************************/
var util = createCommonUtil();

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	util.Submit.send(app, "subList", function(){
		
	});
}
