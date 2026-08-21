/************************************************
 * Untitled.js
 * Created at 2022. 11. 8. 오후 1:20:28.
 *
 * @author yhpark
 ************************************************/

/*
 * 트리에서 before-selection-change 이벤트 발생 시 호출.
 * 선택된 Item 값이 저장되기 전에 발생하는 이벤트. 다음 이벤트로 selection-change가 발생합니다.
 */
function onTre1BeforeSelectionChange(e){
	var tre1 = e.control;
	var item = e.newSelection[0];
	e.newSelection.forEach(function(each) {
		if (each.children.length>0) {
			// 기본 동작을 방지합니다(자동 확장/축소 방지)
			e.preventDefault();
			return;
		}
	});	
}

/*
 * 트리에서 item-click 이벤트 발생 시 호출.
 * 아이템 클릭시 발생하는 이벤트.
 */
function onTre1ItemClick(e){
	var tre1 = e.control;
	// 해당 아이템의 expand 상태를 전환합니다.
	tre1.toggle(e.item);
}
