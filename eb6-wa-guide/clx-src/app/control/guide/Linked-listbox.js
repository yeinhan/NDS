/************************************************
 * linked-listbox.js
 * Created at 2022. 11. 8. 오후 2:16:01.
 *
 * @author yhpark
 ************************************************/

exports.getType = function(value) {
	var llb = app.lookup("llb3");
	var item = llb.getItemByValue(value);
	var lastSelection = llb.getSelectionLast();
	var resultType = "";
	if (lastSelection == null) {
		return resultType;
	}
	if (item.depth == 0) {
		return "hasChild";
	}
	if (item.depth == lastSelection.depth) {
	if (lastSelection.children.length > 0) {
		resultType = "hasBoth";
	} else {
		resultType = "hasParent";
	}
	} else if (item.depth > lastSelection.depth) {
		resultType = "hasParent";
	} else if (item.depth < lastSelection.depth) {
		resultType = "hasBoth";
	}
	return resultType;
}
