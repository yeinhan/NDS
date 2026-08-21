/************************************************
 * waGuideSample007.js
 * Created at 2022. 10. 17. 오전 8:19:54.
 *
 * @author ksk1908
 ************************************************/
var util = createCommonUtil();

exports.getToday = getToday;

function getToday(addMonth){
	var date = new Date();
	var month = date.getMonth()+1
	if(addMonth){
		month = month+addMonth
	}
	if(month<10){month = "0"+month}
	var today = date.getFullYear()+""+month+date.getDate()
	
	return today;
}
function getLastDate(addMonth, pbLastDay){
	var date = new Date();
	var month = date.getMonth()+1
	if(addMonth){
		month = month+addMonth
	}
	if(month<10){month = "0"+month}
	var today = date.getFullYear()+""+month+date.getDate();
	
	var firstDay = date.getFullYear()+""+ month + "01";
	var lastDay = date.getFullYear()+""+ month + DateUtil.getMonthLastDay(today);
	
	if(pbLastDay == true){
		return lastDay;
	}else{
		return firstDay;
	}
}



/*
 * "저장" 버튼(btn7)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn7Click(e){
	var btn7 = e.control;
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	app.lookup("btnSearch").click();
	
	app.lookup("dtiDateB").putValue(getToday());
	app.lookup("dtiDateE").putValue(getToday(1)); 
}

/*
 * 그리드에서 selection-change 이벤트 발생 시 호출.
 * detail의 cell 클릭하여 설정된 selectionunit에 해당되는 단위가 선택될 때 발생하는 이벤트.
 */
function onGrdSettleSelectionChange(e){
	var grdSettle = e.control;
	var grdSettleDetail = app.lookup("grdDetail")
	
	var rowIndex = e.newSelection[0];
	var vsPaymenDate = grdSettle.getRow(rowIndex).getValue("Payment Date");
	grdSettleDetail.setFilter("payment_date == '"+vsPaymenDate+"'");
}

/*
 * "오늘" 버튼(btn15)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn15Click(e){
	var btn15 = e.control;
	app.lookup("dtiDateB").putValue(getToday());
	app.lookup("dtiDateE").putValue(getToday()); 
}

/*
 * "전월" 버튼(btn16)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn16Click(e){
	var btn16 = e.control;
	
	app.lookup("dtiDateB").putValue(getLastDate(-1, false));
	app.lookup("dtiDateE").putValue(getLastDate(-1, true));
}

/*
 * "당월" 버튼(btn17)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn17Click(e){
	var btn17 = e.control;
	app.lookup("dtiDateB").putValue(getLastDate(0, false));
	app.lookup("dtiDateE").putValue(getLastDate(0, true));
}

/*
 * "3개월" 버튼(btn18)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn18Click(e){
	var btn18 = e.control;
	app.lookup("dtiDateB").putValue(getToday(-3));
	app.lookup("dtiDateE").putValue(getToday(0));
}

/*
 * "6개월" 버튼(btn19)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn19Click(e){
	var btn19 = e.control;
	app.lookup("dtiDateB").putValue(getToday(-6));
	app.lookup("dtiDateE").putValue(getToday(0));
}

/*
 * "조회" 버튼(btnSearch)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSearchClick(e){
	var btnSearch = e.control;
	
	util.Submit.send(app, "subSettle", function(){
		
	});
}
