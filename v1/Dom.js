function IsEmpty(elem) {
    if (elem == undefined || elem == null || elem.length == 0) return true;
    if (elem instanceof HTMLElement) {
        return elem.innerHTML == "";
    }
    return true;
}

if (window.check == undefined){
    window.check = function(param){
	return param != undefined && param != null
	    }
	}

if ((window.WS == undefined || window.WS == null) && (window.DOM == undefined || window.DOM == null || window.DOM.JaspVersion < 3.15)) {
    
    WS = {};
    
    DOM = dom = function(path){
	return document.querySelector(path);
    };
    
    DOM.JaspVersion = 3.15;
    
    DOM.Div = DOM.div = function (classes, value) {
	var div = document.createElement("div");
	if (classes) {
	    div._add(classes);
	}
	if (value) {
	    div._set(value);
	}
	var result = WS.CallEvent(this, "onAddElem", div);
	if (this != DOM && result) {
	    this.appendChild(div);
	}
	return div;
    };
    
    DOM.Get = DOM.get = function (path) {
	if (path.start("@")) {
	    path = path.substr(1, path.length - 1);
	    var attr = this.attributes.getNamedItem(path);
	    if (attr == null) return null;
	    return attr.value;
	}
	if (path.length > 0 && path[0] == "^") {
	    path = path.substr(1, path.length - 1);
	    var parent = this.parentNode;
	    while (parent != null) {
		if (parent.is(path)) return parent;
		parent = parent.parentNode;
	    }
	    return null;
	}
	if (this == DOM) {
	    return document.querySelector(path);
	}
	else {
	    return this.querySelector(path);
	}
    };
    
    /* Для совместимости со старым DOM */
    
    DOM.AGet = DOM.aget = function (path, value, selector) {
	var owner = this;
	if (owner == DOM) owner = WS.Body;
	if (selector != null && selector != undefined){
	    selector = "";
	}
	return owner.get(selector + "[" + path + "='" + value + "']");
    };
    
    DOM.Attr = DOM.attr = function (attr, value) {
	var owner = this;
	if (owner == DOM) owner = WS.Body;
	if (value != null && value != undefined){
	    return owner.set("@" + attr, value);
	}
	return owner.get("@" + attr);
    };
    
    
    DOM.Cls = DOM.cls = DOM.addc = DOM.adc = function (cls) {
	var owner = this;
	if (owner == DOM) owner = WS.Body;
	cls = cls.replace(" ", ".");
	cls = "." + cls;
	return owner.add(cls);
    };
    
    DOM.Rcs = DOM.rcs = DOM.delc = DOM.dlc = function (cls) {
	var owner = this;
	if (owner == DOM) owner = WS.Body;
	cls = cls.replace(" ", ".");
	cls = "." + cls;
	return owner.del(cls);
    };
    
    
    DOM.html = function (html) {
	var owner = this;
	if (owner == DOM) owner = WS.Body;
	owner.innerHTML = html;
    };
    
    
    // Конец совместимости
    
    DOM.Set = DOM.set = function (path, value) {
	if (!check(path)) {
	    if (WS.CallEvent(this, "onSetContent", value)){
		this.innerHTML = value;
	    }    
	    return this.firstChild;
	}
	if (path instanceof HTMLElement) {
	    if (WS.CallEvent(this, "onDelContent", path)){
		this.innerHTML = "";
		this._add(path, value);
	    }
	    return path;
	}
	if (!check(value)) {
	    if (WS.CallEvent(this, "onSetContent", path)){
		this.innerHTML = path;
	    };
	    return this.firstChild;
	}
	if (typeof path == 'string'){
	    if (path.start('.')) {
		return WS.SetClass(this, path, value);
	    }
	    if (path.start('@')) {
		return WS.AddAttribute(this, path, value);
	    }	    
	}
	return this.firstChild;
    };
    
    DOM.Clone = DOM.clone = function () {
	var temp = DOM.Div();
	if (this.outerHTML != undefined) {
	    temp.innerHTML = this.outerHTML;
	}
	else {
	    var serializer = new XMLSerializer();
	    var serialized = serializer.serializeToString(this);
	    serialized = serialized.replace('xmlns="http://www.w3.org/1999/xhtml"', "");
	    temp.innerHTML = serialized;
	}
	return temp.firstChild;
    };
    
    DOM.Has = DOM.has = function (path) {
	if (typeof (path) == "string") {
	    if (path.start("@")) {
		path = path.substr(1, path.length - 1);
		var attr = this.attributes.getNamedItem(path);
		return attr != null && attr.value != "";
	    }
	    if (this == DOM) {
		return document.querySelector(path) != null;
	    }
	    else {
		return this.querySelector(path) != null;
	    }
	}
	if (path instanceof HTMLElement) {
	    return path.parentNode == this;
	}
	return false;
    };
    
    DOM.Is = DOM.is = function (selector) {
	if (this == DOM) {
	    return document.documentElement.Is(selector);
	}
	else {
	    //Mozilla
	    if (this.mozMatchesSelector) {
		return this.mozMatchesSelector(selector);
	    }
	    //Webkit
	    if (this.webkitMatchesSelector) {
		return this.webkitMatchesSelector(selector);
	    }
	    //IE
	    if (this.msMatchesSelector) {
		return this.msMatchesSelector(selector);
	    }
	    //Opera
	    if (this.oMatchesSelector) {
		return this.oMatchesSelector(selector);
	    }
	    //W3 Standart & И для каких-то странных браузеров, которые осмелились реализовать стандарт ))))
	    if (this.matchesSelector) {
		return this.matchesSelector(selector);
	    }
	    //No match support
	    var nodeList = node.parentNode.querySelectorAll(selector);
	    for (var i = 0; i < nodeList.length; i++) {
		if (nodeList[i] == node) {
		    return true;
		}
	    }
	    return false;
	}
    };
    
    DOM.All = DOM.all = function (path) {
	var array = [];
	if (this == DOM) {
	    array = document.querySelectorAll(path);
	}
	else {
	    array = this.querySelectorAll(path);
	}
	return WS.WrapArray(array);
    };
    
    DOM.Last = DOM.last = function (path) {
	if (this == DOM) {
	    var array = document.querySelectorAll(path);
	    for (var i = array.length - 1; i >= 0; i--) {
		if (array[i].parentNode == document.documentElement) return array[i];
	    }
	}
	else {
	    var array = this.querySelectorAll(path);
	    for (var i = array.length - 1; i >= 0; i--) {
		if (array[i].parentNode == this) return array[i];
	    }
	}
	return null;
    };
    
    DOM.Wrap = DOM.wrap = function (html) {
	var wrapper = DOM.div();
	wrapper.innerHTML = html;
	/*if (wrapper.childNodes.length == 1) 
return wrapper.firstChild;*/
	return wrapper.childNodes;
    };
    
    DOM.Ins = DOM.ins = function (entity, value) {
	if (entity == undefined || entity == null || entity.length == 0) return null;
	if (!check(this.firstChild)) return this.add(entity, value);
	if (entity.length || entity.IsElementArray) {
	    for (var j = 0; j < entity.length; j++) {
		var last = this._Ins(entity[j]);
	    }
	    return last;
	}
	if (entity instanceof HTMLElement) {
	    if (WS.CallEvent(this, "onAddElem", entity)){
		this.insertBefore(entity, this.firstChild);
	    }
	    return entity;
	}
	if ((entity)instanceof Object){
	    var div = WS.ToDiv(entity, value);
	    if (WS.CallEvent(this, "onAddElem", div)){		
		this.insertBefore(div, this.firstChild);
	    }
	}
	return this;
    };
    
    DOM.Add = DOM.add = function (entity, value) {
	var elem = this;
	if (elem == DOM) elem = Body;
	if (entity == undefined || entity == null || entity.length == 0) return null;
	if (typeof (entity) == "string") {
	    if (entity.start('.')) {
		return WS.SetClass(elem, entity);
	    }
	    if (entity.start('@')) {
		return WS.AddAttribute(elem, entity, value);
	    }
	    if (entity.start('$')) {
		entity = entity.substr(1);
	    }
	    if (WS.CallEvent(elem, "onAddElem", entity)){
		elem.innerHTML += entity;
	    }
	    return elem.lastChild;
	}
	if (entity instanceof Node) {
	    if (WS.CallEvent(elem, "onAddElem", entity)){
		elem.appendChild(entity);
	    }
	    return entity;
	}
	if (entity.length || entity.IsElementArray) {
	    for (var j = 0; j < entity.length; j++) {
		var last = elem._Add(entity[j]);
	    }
	    return last;
	}	
	if ((entity)instanceof Object){
	    var div = WS.ToDiv(entity, value);
	    if (WS.CallEvent(elem, "onAddElem", div)){		
		elem.appendChild(div);
	    }
	}
	return elem;
    };
    
    
    DOM.Del = DOM.del = function (entity) {
	if (entity == undefined || entity == null || entity.length == 0) {
	    if (WS.CallEvent(this, "onDelElem")){
		this.parentNode.removeChild(this);
		return null;		
	    }
	    return this;
	}
	if (typeof (entity) == "string" && entity.start('.')) {
	    return WS.ResetClass(this, entity);
	}
	if (typeof (entity) == "string" && entity.start('@')) {
	    return WS.DelAttribute(this, entity);
	}
	return this;
    };
    
    DOM.Show = DOM.show = function (element) {
	this._Del(".invisible");
    };
    
    DOM.Hide = DOM.hide = function (element) {
	this._Add(".invisible");
    };
    
    
    DOM.Clear = DOM.empty = DOM.Empty = DOM.clear = function (element) {
	this.innerHTML = "";
    };
    
    DOM.SetCoord = DOM.setCoord = function(x, y){
	this.style.top = y + "px";
	this.style.left = x + "px";	
    };
    
    WS.DOMload = function(func){
	if (document.body){
	    func();
	    return;
		}
	if (document.addEventListener){
	    document.addEventListener("DOMContentLoaded", func, false);
	}
	else{
	    if (window.addEventListener){
		window.addEventListener("load", func, false);
	    }
	    else{
		if (window.attachEvent){
		    window.attachEvent( "onload", func);
		    return true;
		}
		
		window.onload = func;
	    }
	}
    };
    
    WS.InitW = function () {
	if (navigator.appName != "Microsoft Internet Explorer"){
	    WS.ExtendBrowser(HTMLElement.prototype);
	    WS.DOMload(WS.InitDOM);	
	}
	else{
	    var ver = navigator.appVersion.get(/MSIE (\d+.\d+);/);
	    ver = parseFloat(ver);
	    if (ver >= 8.0){
		WS.ExtendBrowser(HTMLElement.prototype);/*
__IEcreateElement = document.createElement;
document.createElement = function (tagName) {
var element = __IEcreateElement(tagName);
for (func in DOM){
element["_" + func] = DOM[func];
//element["" + func] = DOM[func];
}
return element;
};*/
		WS.DOMload(WS.InitDOM);
	    }
	    else{
		WS.DOMload(BROWSER_ShowWarning);
		//WS = null;
		//DOM = null;
	    }
	    
	}
    };
    
    function SetStyleIE(elem, style) {
	elem.removeAttribute("style");
	elem.setAttribute("style", style);
	elem.style.cssText = style;
    }
    
    function BROWSER_ShowWarning(event) {
	var lightbox = document.createElement("div");
	document.body.appendChild(lightbox);
	var elem = document.createElement("div");
	lightbox.appendChild(elem);
	SetStyleIE(lightbox, "background-color: black; height: 100%; left: 0; position: absolute; top: 0; width: 100%; z-index: 1000;");
	lightbox.setAttribute("id", "BROWSER_WarningPanel");
	SetStyleIE(elem, "position: absolute; background-color: white; border: 2px solid orange; border-radius: 15px 15px 15px 15px; height: 50%; top: 20%; left: 25%; width: 50%; padding: 20px; font-family: tahoma;");
	var title = elem.appendChild(document.createElement("div"));
	SetStyleIE(title, "color: red; font-size: 30px; text-align: center;");
	title.innerHTML = "Warning!";
	elem.innerHTML += "<br/></br>";
	var text = elem.appendChild(document.createElement("div"));
	SetStyleIE(text, "text-align: justify; font-size: 16px; color: black;");
	text.innerHTML = "Ваш <b>браузер устарел</b>. Он имеет уязвимости в безопасности и может не показывать все возможности на этом и других сайтах. Кроме того, возможны серъезные ошибки в работе сервиса.";
	text.innerHTML += "<br/>Подробнее узнать об обновлении браузера, или установить более современный браузер, вы сможете перейдя по ссылке: </br><a style='color:red; text-decoration: underline;'		href='http://www.browser-update.org/update.html'>http://www.browser-update.org</a>";
	text.innerHTML += "<br/></br>Your browser is <b>out of date</b>. It has known security flaws and may not display all features of this and other websites.";
	text.innerHTML += "</br>To learn more about updating of the browser or upgrade it, you can click here: </br><a style='color:red; text-decoration: underline;' href='http://www.browser-update.org/update.html'>http://www.browser-update.org</a>";
	
	var btnStyle = "border: solid 1px orange; border-radius: 5px; cursor: pointer; float: right; font-size: 14px; padding: 5px 10px; text-align: center; margin: 10px; color: white;";
	
	var controls = elem.appendChild(document.createElement("div"));
	SetStyleIE(controls, "left: 20px; position: absolute; bottom: 20px;");
	var btnOk = controls.appendChild(document.createElement("div"));
	SetStyleIE(btnOk, btnStyle + "font-weight: bold; background: green;");
	btnOk.innerHTML = "Update your browser / Обновить браузер";
	btnOk.onclick = function() {
	    window.location = "http://www.google.com/chromeframe?quickenable=true";
	    this.innerHTML = "Please wait...";
	    this.onclick = null;
	};
	var btnCancel = controls.appendChild(document.createElement("div"));
	btnCancel.innerHTML = "I understand the risk / Я понимаю риск";
	SetStyleIE(btnCancel, btnStyle + "font-weight: bold; border: solid 1px red; color: black;");
	btnCancel.panel = lightbox;
	btnCancel.onclick = function() {
	    document.body.removeChild(this.panel);
	};
	return false;
	return false;
    }
    
    WS.ExtendBrowser = function(proto){
	if (window.W){
	    for (var func in DOM) {
		proto["_" + func] = DOM[func];
	    }
	}
	else{
	    for (var func in DOM) {
		proto["_" + func] = DOM[func];
		proto[func] = DOM[func];
	    }
	}
	if (proto.__defineGetter__){
	    if ( !HTMLElement.outerHTML && window.Node && window.XMLSerializer){
		proto.__defineGetter__("outerHTML", WS.GetOuterHTML);
	    }
	    proto.__defineGetter__("dom", WS.SetOutWrapper);
	    proto.__defineSetter__("dom", WS.SetInWrapper);
	}
    }
	
	WS.InitDOM = function(){
	    WS.Body = document.body;
	    window.Body = document.body;
	    WS.Header = document.head;
	    
	    if (window.W){
		for (var func in DOM) {
		    WS.Header["_" + func] = DOM[func];
		}
	    }
	    else{
		for (var func in DOM) {
		    WS.Header["_" + func] = DOM[func];
		    WS.Header[func] = DOM[func];
		}
	    }
	    
	    if (window.ev){
		/*ev.CreateEvent("onAddElem", WS);
ev.CreateEvent("onDelElem", WS);
ev.CreateEvent("onAddClass", WS);
ev.CreateEvent("onDelClass", WS);
ev.CreateEvent("onSetAttr", WS);
ev.CreateEvent("onDelAttr", WS);
ev.CreateEvent("onSetContent", WS);
ev.CreateEvent("onDelContent", WS);*/
	    }	
	    if (WS.onload){
		WS.onload();
	    }
	};
    
    WS.ToDiv = function(obj, param1, param2, param3){
	var div = W.Div();
	var isdefault = false;
	for (var prop in obj){
	    if (["default", 'innerHTML', 'innerText', 'innerValue', 'defaultValue'].contains(prop))
		isdefault = true;
	    div[prop] = obj[prop];
	    if ((obj[prop])instanceof Object)
	    {
		if (isdefault && (obj[prop] instanceof HTMLElement)){
		    div.add(obj.prop);
		}
	    }
	    else{
		if (isdefault){				    
		    div.innerHTML = prop;
		}
		else{
		    WS.AddAttribute(div, prop, obj[prop]);
		}
	    }
	}
	for (var i = 1; i < arguments.length; i++){
	    div.add(arguments[i]);
	}
	return div;
    }
	
	WS.SetOutWrapper = function(){
	    return "$";
	};
    
    WS.SetInWrapper = function(value){
	if (value.start("$")){
	    this.add(value.substr(1));
	}
	else{
	    this.set(value.substr(1));
	}
    };
    
    WS.GetOuterHTML = function () {
	var serialized = new XMLSerializer().serializeToString(this);
	return serialized.replace('xmlns="http://www.w3.org/1999/xhtml"', "");
    };
    
    WS.WrapArray = function (array) {
	for (var func in DOM) {
	    array[func] = WS.BindFunction(func);
	}
	array.IsElementArray = true;
	if (array.__defineGetter__){
	    array.__defineGetter__("last", WS.GetLastElem);
	    array.__defineGetter__("first", WS.GetFirstElem);
	}
	return array;
    };
    
    WS.GetLastElem = function () {
	if (this.length > 0) {
	    return this[this.length - 1];
	}
	return null;
    };
    
    WS.GetFirstElem = function () {
	if (this.length > 0) {
	    return this[0];
	}
	return null;
    };
    
    WS.BindFunction = function (funcName) {
	return function (param1, param2, param3) {
	    for (var i = 0; i < this.length; i++) {
		this[i][funcName](param1, param2, param3);
	    }
	};
    };
    
    WS.CallEvent = function (element, eventName, param1, param2, param3){
	var result = true;
	if (typeof WS[eventName]  == 'function'){
	    var res = WS[eventName](element, param1, param2, param3);
	    if (res != undefined){
		result &= res;
	    }
	}
	if (typeof element[eventName]  == 'function'){
	    var res = element[eventName](element, param1, param2, param3);
	    if (res != undefined){
		result &= res;
	    }
	}
	return result;
    };    
    
    
    WS.AddAttribute = function(elem, attrName, value){
	if (attrName.start("@")){
	    attrName = attrName.substr(1, attrName.length - 1);
	}
	var attr = elem.attributes.getNamedItem(attrName);
	if (attr != null) {
	    if (WS.CallEvent(elem, "onSetAttr"), attr, value){
		attr.value = value;
	    };		
	}
	else {
	    if (WS.CallEvent(elem, "onSetAttr"), attr, value){			
		attr = document.createAttribute(attrName);
		attr.value = value;
		elem.attributes.setNamedItem(attr);
	    }
	}
	return elem;
    };
    
    WS.DelAttribute = function(elem, attrName){
	if (attrName.start("@")){
	    attrName = attrName.substr(1, attrName.length - 1);
	}
	var attr = this.attributes.getNamedItem(attrName);
	if (attr != null) {
	    if (WS.CallEvent(elem, "onDelAttr"), attr, attr.value){	
		elem.attributes.removeNamedItem(attr);
	    }
	}
	return elem;
    };
    
    WS.SetClass = function(elem, value){
	var classes = value.split('.');
	for (var i = 0; i < classes.length; i++) {
	    if (classes[i].length > 0) {
		if (elem.classList == undefined) {
		    if (elem.className.indexOf(classes[i]) < 0) {
			if (WS.CallEvent(elem, "onAddClass"), classes[i]){
			    elem.className += " " + classes[i] + " ";
			}
		    }
		}
		else {
		    if (WS.CallEvent(elem, "onAddClass"), classes[i]){
			elem.classList.add(classes[i]);
		    }
		}
	    }
	}
	return elem;
    };
    
    WS.ResetClass = function(elem, value){
	var classes = value.split('.');
	for (var i = 0; i < classes.length; i++) {
	    if (classes[i].length > 0) {	
		if (elem.classList != undefined) {
		    
		    if (WS.CallEvent(this, "onDelClass"), classes[i]){
			elem.classList.remove(classes[i]);
		    }
		}
		else{
		    var regex = new RegExp('(?:\\s|^)' + classes[i] + '(?:\\s|$)');
		    elem.className = elem.className.replace(regex, ' ');
		};
	    }
	}
	
	return elem.classList;
    };
    
    WS.ParseParams = function(){
	var obj = {
	    other : [],
	    parents : [],
	    attributes : [],
	    classes : [],
	    id : null,
	    inner: null,
	    elements: [],
	    functions: [],
	    tree: [],
	    count : 0,
	    empty : true
	};
	for(var i=0; i<arguments.length; i++)
	{
	    var entity = arguments[i];
	    WS.ParseParam(entity, obj);
	}
	return obj;
    };
    
    
    WS.ParseParam = function(entity, obj){
	
	if (entity == undefined || entity == null || entity.length == 0) {
	    return;
		}
	obj.count++;
	obj.empty = false;
	if (typeof (entity) == "string") {
	    if (entity.start('.')) {
		obj.classes.push(WS.GetParamValue(".", entity));
		return obj;
	    }
	    if (entity.start('@')) {
		obj.attributes.push(WS.GetParamValue("@", entity));
		return obj;
	    }
	    if (entity.start('$')) {
		obj.inner = WS.GetParamValue("$", entity);
		return obj;
	    }
	    if (entity.start('#')) {
		obj.id = WS.GetParamValue("#", entity);
		return obj;
	    }
	    if (entity.start('^')) {
		obj.parents.push(WS.GetParamValue("^", entity));
		return obj;
	    }
	    obj.other.push(entity);
	    return obj;
	}
	if (entity.length || entity.IsElementArray) {
	    for (var j = 0; j < entity.length; j++) {
		WS.ParseParam(entity[j], obj);
	    }
	    return obj;
	}
	if (entity instanceof HTMLElement) {
	    obj.elements.push(entity);
	    return obj;
	}
	if (typeof(entity) == 'function'){
	    obj.functions.push(entity);
	    return obj;
	}
	if (typeof(entity) == 'object'){
	    obj.tree.push(entity);
	    return obj;
	}
	return obj;
    };
    
    WS.GetParamValue = function(separator, value){
	return value.split(separator)[1];
    };
    
    WS.InitW();
}
else{
    
}

