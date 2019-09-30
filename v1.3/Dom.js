function IsEmpty(elem) {
	if (elem == undefined || elem == null || elem.length == 0) return true;
	if (elem instanceof HTMLElement) {
		return elem.innerHTML == "";
	}
	return true;
}

if (window.check == undefined) {
	window.check = function(param) {
		return param != undefined && param != null
	}
}

if ((window.WS == undefined || window.WS == null) && (window.DOM == undefined || window.DOM == null || window.DOM.JaspVersion < 3.15)) {
	
	WS = {};
	
	DOM = dom = function(path) {
		return document.querySelector(path);
	};
	
	DOM.JaspVersion = DOM.version = 1.41;
	
	DOM.Div = DOM.div = DOM._div = function(classes, value) {
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
	
	DOM.Tag = DOM.tag = DOM._tag = function(tagName, classes, value) {
		var div = document.createElement(tagName);
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
	
	DOM.Func = DOM.func = DOM._func = DOM.each = DOM._each = function(path, callback) {
		var elems = this._all(path);
		for (var i = 0; i < elems.length; i++) {
			var node = elems[i];
			var res = callback.call(this, node);
		}
	};
	
	
	DOM.Aggregate = function(func) {
		var arr = [];
		this.each(function(){
			var res = func.call(arr, this);
			if (res){
				arr.push(res);
			};
		});
		return arr;
	};
	
	DOM.Get = DOM.get = DOM._get = function(path) {
		if (path && path.length > 0 && path.start) {
			if (path.start("@")) {
				path = path.substr(1, path.length - 1);
				var attr = this.attributes.getNamedItem(path);
				if (attr == null) return null;
				return attr.value;
			}
			if (path.start(">")) {
				path = path.substr(1, path.length - 1);
				for (var i = 0; i < this.childNodes.length; i++) {
					var node = this.childNodes[i];
					if (node && node.nodeType == 1 && node._is(path))
						return node;
				}
				return null;
			}
			if (path[0] == "^") {
				path = path.substr(1, path.length - 1);
				var parent = this.parentNode;
				while (parent != null && parent._is) {
					if (parent._is(path)) return parent;
					parent = parent.parentNode;
				}
				return null;
			}
		}
		else {
			if (this == DOM) {
				return document.documentElement.innerHTML;
			}
			else {
				return this.innerHTML;
			}
		}
		if (this == DOM) {
			return document.querySelector(path);
		}
		else {
			return this.querySelector(path);
		}
	};
	
	DOM.Set = DOM.set = DOM._set = function(path, value) {
		if (!check(path)) {
			if (WS.CallEvent(this, "onSetContent", value)) {
				this.innerHTML = value;
			}
			return this.firstChild;
		}
		if (path instanceof HTMLElement) {
			if (WS.CallEvent(this, "onDelContent", path)) {
				this.innerHTML = "";
				this._add(path, value);
			}
			return path;
		}
		if (typeof path == 'string') {
			if (path.start('.')) {
				return WS.SetAttribute(this, 'class', path.replace(/\./g, ' '));
			}
			if (path.start('@')) {
				return WS.SetAttribute(this, path, value);
			}
			if (path.start('#')) {
				path = path.substr(1);
				if (this == DOM) {
					WS.Body.id = path;
					return WS.Body;
				}
				else {
					this.id = path;
					return this;
				}
				
			}
		}
		if (!check(value)) {
			if (WS.CallEvent(this, "onSetContent", path)) {
				this.innerHTML = path;
			};
			return this.firstChild;
		}
		return this.firstChild;
	};
	
	DOM.Clone = DOM.clone = DOM._clone = function() {
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
		if (temp.firstChild){
			temp.firstChild._del(".prototype");
			if (typeof(this.onclone) == "function") this.onclone(temp.firstChild);
		}
		if (window.Contexts){
			Contexts.Process(temp, "ui-clone", this);
		}
		return temp.firstChild;
	};
	
	DOM.Has = DOM.has = DOM._has = function(path) {
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
	
	DOM.Is = DOM.is = DOM._is = function(selector) {
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
	
	DOM.All = DOM.all = DOM._all = function(path) {
		var array = [];
		if (path.start(">")) {
			path = path.substr(1, path.length - 1);
			var elem = this;
			if (this == DOM) {
				elem = document.documentElement;
			}
			for (var i = 0; i < elem.childNodes.length; i++) {
				var node = elem.childNodes[i];
				if (node && node.nodeType == 1 && (path == "" || node._is(path)))
					array.push(node);
			}
		}
		else {
			if (this == DOM) {
				array = document.querySelectorAll(path);
			}
			else {
				array = this.querySelectorAll(path);
			}
		}
		return WS.WrapArray(array);
	};
	
	DOM.Last = DOM.last = DOM._last = function(path) {
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
	
	DOM.Wrap = DOM.wrap = function(html) {
		var wrapper = DOM.div();
		wrapper.innerHTML = html;
		/*if (wrapper.childNodes.length == 1) 
return wrapper.firstChild;*/
		return wrapper.childNodes;
	};
	
	DOM.Ins = DOM.ins = DOM._ins = function(entity, value) {
		if (entity == undefined || entity == null || entity.length == 0) return null;
		if (!check(this.firstChild)) return this._add(entity, value);
		if (entity.length || entity.IsElementArray) {
			for (var j = 0; j < entity.length; j++) {
				var last = this._Ins(entity[j]);
			}
			return last;
		}
		if (entity instanceof HTMLElement) {
			if (WS.CallEvent(this, "onAddElem", entity)) {
				this.insertBefore(entity, this.firstChild);
			}
			return entity;
		}
		if ((entity) instanceof Object) {
			var div = WS.ToDiv(entity, value);
			if (WS.CallEvent(this, "onAddElem", div)) {
				this.insertBefore(div, this.firstChild);
			}
		}
		return this;
	};
	
	DOM.Add = DOM.add = DOM._add = function(entity, value) {
		var elem = this;
		if (elem == DOM) elem = WS.Body; //document.documentElement;
		if (entity == undefined || entity == null || entity.length == 0) {
			if (value) {
				if (WS.CallEvent(elem, "onAddElem", value)) {
					elem.innerHTML += value;
					return elem.lastChild;
				}
			}
			return null;
		};
		if (typeof (entity) == "string") {
			if (entity.start('.')) {
				return WS.SetClass(elem, entity);
			}
			if (entity.start('@')) {
				return WS.AddAttribute(elem, entity, value);
			}
			if (entity.start('#')) {
				entity = entity.substr(1);
				elem.id = entity;
				return elem;
			}
			if (entity.start('$')) {
				entity = entity.substr(1);
				var span = document.createElement("span");
				span.innerHTML = entity;
				return elem._add(span);
			}
			if (WS.CallEvent(elem, "onAddElem", entity)) {
				elem.innerHTML += entity;
			}
			return elem.lastChild;
		}
		if (entity instanceof Node) {
			if (WS.CallEvent(elem, "onAddElem", entity)) {
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
		if ((entity) instanceof Object) {
			var div = WS.ToDiv(entity, value);
			if (WS.CallEvent(elem, "onAddElem", div)) {
				elem.appendChild(div);
				return div;
			}
		}
		return elem;
	};
	
	
	DOM.Del = DOM.del = DOM._del = function(entity) {
		var elem = this;
		if (this == DOM){
			elem = document.documentElement;
		}
		if (entity == undefined || entity == null || entity.length == 0) {
			if (WS.CallEvent(elem, "onDelElem")) {
				elem.parentNode.removeChild(elem);
				return null;
			}
			return elem;
		}
		if (typeof (entity) == "string" && entity.start('.')) {
			return WS.ResetClass(elem, entity);
		}
		if (typeof (entity) == "string" && entity.start('@')) {
			return WS.DelAttribute(elem, entity);
		}
		if (typeof (entity) == "string") {
			return elem._all(entity)._del();
		}
		return this;
	};
	
	BOM = {};
	
	/* Для совместимости со старым DOM */
	
	BOM.AGet = BOM.aget = BOM._AGet = BOM._aget = function(path, value, selector) {
		if (selector == undefined || selector == null) {
			selector = "";
		}
		if (this == BOM){
			return WS.Body._get(selector + "[" + path + "='" + value + "']");
		}
		return this._get(selector + "[" + path + "='" + value + "']");
	};
	
	DOM.aget = function(path, value, selector) {
		if (selector == undefined || selector == null) {
			selector = "";
		}
		if (this == DOM){
			return DOM._get(selector + "[" + path + "='" + value + "']");
		}
		return this._get(selector + "[" + path + "='" + value + "']");
	};
	
	BOM.Attr = BOM.attr = BOM._Attr = BOM._attr = function(attr, value) {
		if (value != undefined) {
			return this._set("@" + attr, value);
		}
		if (this == BOM){
			return WS.Body._get("@" + attr);
		}
		return this._get("@" + attr);
	};
	
	BOM.ratt = function(attr) {
		this.removeAttribute(attr);
	};
	
	
	
	BOM.Cls = BOM.cls = BOM._Cls = BOM._cls = BOM.addc = BOM.adc = function(cls) {
		cls = cls.replace(/ /g, ".");
		cls = "." + cls;
		return this._add(cls);
	};
	
	BOM.Rcs = BOM.rcs = BOM._Rcs = BOM._rcs = BOM.delc = BOM.dlc = function(cls) {
		cls = cls.replace(" ", ".");
		cls = "." + cls;
		return this._del(cls);
	};
	
	
	BOM.html = BOM._html = function(html) {
		var owner = this;
		if (owner == DOM) owner = WS.Body;
		owner.innerHTML = html;
	};
	
	
	// Конец совместимости
	
	BOM.GetOrDiv = function(selector){
		if (this == BOM){
			var elem = WS.Body._get(selector);
		}
		else{
			var elem = this._get(selector);	    
		}
		if (!elem){
			elem = this._div(selector);
		}
		return elem;
	}
		
	BOM.Show = BOM.show = function(toggle) {
		if (toggle){
			if (this.is(".invisible")){
				this._Del(".invisible");
			}
			else{
				this._Add(".invisible");	
			}
			return;
		}
		this._Del(".invisible");
	};
	
	BOM.Hide = BOM.hide = function(element) {
		this._Add(".invisible");
	};
	
	
	BOM.Clear = BOM.empty = BOM.Empty = BOM.clear = function(element) {
		this.innerHTML = "";
	};
	
	BOM.SetCoord = BOM.setCoord = function(x, y) {
		this.style.top = y + "px";
		this.style.left = x + "px";
	};
	
	BOM.ToString = BOM.toString = function(withBody) {
		if (this == DOM) return "DOM " + DOM.vesion;
		var result = "<" + this.tagName.toLowerCase();
		if (this.attr("id") != null) {
			result += "#" + this.attr("id");
		}
		var cls = this.attr("class");
		if (cls) {
			result += "." + cls.replace(/ /g, ".");
		}
		if (withBody) {
			
		}
		var url = this.attr("url");
		if (url) {
			result += "@url='" + url + "'";
		}
		result += ">";
		return result;
	};
	
	BOM.ToObj = BOM.toObj = function() {
		var res = {};
		for (var i = 0; i < this.attributes.length; i++) {
			var attr = this.attributes[i];
			res[attr.name] = attr.value;
		}
		return res;
	};
	
	BOM.BubbleEvent = function(eventName, eventObj, conditions){
		if (this.parentNode && this.parentNode.BubbleEvent){
			if (this.parentNode._eventCheck && this.parentNode._eventCheck(eventName, eventObj, conditions) != false){
				this.parentNode.BubbleEvent(eventName, eventObj, conditions);
			}
		}
	};
	
	BOM._eventCheck = function(eventName, eventObj, conditions){
		var event = this[eventName];
		if (event && typeof(event.fire) == "function"){
			if (conditions){
				return event.fire(conditions, eventObj);
			}
			else{
				return event.fire(eventObj);
			}
		}
		return true;
	};
	
	BOM.AttrProperty = function(name){
		var obj = this;
		Object.defineProperty(obj, name, { 
			get: function(){
				return obj.attr(name);   
			}
			, set: function(newValue){
				obj.attr(name, newValue);
			}});
	};
	
	BOM.AttrClassProperty = function(name){
		var obj = this;
		Object.defineProperty(obj, name, {
			get: function(){
				return obj.attr(name);
			}
			, set: function(newValue){
				var value = obj.attr(name);
				if (value){
					obj.rcs(value);
				}
				if (newValue){
					obj.attr(name, newValue);
					obj.cls(newValue);
				}
			}});
	};
	
	BOM.InnerProperty = function(name, selector){
		var obj = this;
		if (!selector) selector = "." + name;
		Object.defineProperty(obj, name, {
			get: function(){
				return obj.Get(selector).innerHTML;
			}
			, set: function(newValue){
				obj.Get(selector).innerHTML = newValue;
			}});
	};
	
	BOM.ValueProperty = function(name, selector){
		var obj = this;
		if (!selector) selector = "." + name;
		obj.get(selector).onchange = function(){
			if (this.update){
				//this.update();
			}
		};
		Object.defineProperty(obj, name, {
			get: function(){
				return obj.Get(selector).value;
			}
			, set: function(newValue){
				var inp = obj.Get(selector);
				inp.value = newValue;
				if (inp.update){
					inp.update();
				}
			}});
	};
	
	BOM.AttrValueProperty = function(name, selector){
		var obj = this;
		if (!selector) selector = "." + name;
		/*obj.get(selector).onchange = function(){
obj.attr(name, this.value);
if (this.update){
//this.update();
}
};*/
		Object.defineProperty(obj, name, {
			get: function(){
				return obj.Get(selector).value;
			}
			, set: function(newValue){
				if (newValue){
					obj.attr(name, newValue);
				}
				var inp = obj.Get(selector);
				inp.value = newValue;
				if (inp.update){
					inp.update();
				}
			}});
	};
	
	BOM.AttrInnerProperty = function(name, selector){
		var obj = this;
		if (!selector) selector = "." + name;
		obj.attr(name, "");
		Object.defineProperty(obj, name, {
			get: function(){
				return obj.Get(selector).innerHTML;//obj.attr(name);
			}
			, set: function(newValue){
				if (newValue){
					obj.attr(name, newValue);
				}
				obj.Get(selector).innerHTML = newValue;
			}});
	};
	
	BOM.FillObj = function(obj){
		for (key in obj){
			obj[key] = this.get('@' + key);
		};
		return obj;
	};
	
	BOM.On = function(event, callback){
		if (typeof (event) == "string") {
			if (event.start('.')) {
				event = event.substr(1);
				this.onAddClass = function(classString){
					if (classString == event){
						callback.call(this, classString);
					}
				};
				
				return;
			}
			if (event.start('@')) {
				event = event.substr(1);
				this.onSetAttr = function(attr, value){
					if (event == attr){
						callback.call(this, attr, value);
					}
				};
				
				return;
			}
			this.onAddElem = function(element){
				if (this._is(event)){
					callback.call(this, element);
				}
			};
		}
	};
	
	BOM.OnClass = function(event, callback){
		if (typeof (event) == "string") {
			if (event.start('.')) {
				event = event.substr(1);
			}
			this.onAddClass = function(classString){
				if (classString == event){
					callback.call(this, classString);
				}
			};
			return;
		}
	};
	
	BOM.OnElem = function(selector, callback){
		if (typeof (selector) == "string") {
			this.onAddElem = function(element){
				if (this._is(selector)){
					callback.call(this, element);
				}
			};
		}
	};
	
	BOM.OnAttr = function(event, callback){
		if (typeof (event) == "string") {
			if (event.start('@')) {
				event = event.substr(1);
			}
			this.onSetAttr = function(attr, value){
				if (event == attr){
					callback.call(this, attr, value);
				}
			};
		}
	};
	
	WS.DOMload = function(func) {
		/*if (document.body){
func();
return;
}*/
		if (document.addEventListener) {
			document.addEventListener("DOMContentLoaded", func, false);
		}
		else {
			if (window.addEventListener) {
				window.addEventListener("load", func, false);
			}
			else {
				if (window.attachEvent) {
					window.attachEvent("onload", func);
					return true;
				}
				
				window.onload = func;
			}
		}
	};
	
	WS.InitW = function() {
		if (navigator.appName != "Microsoft Internet Explorer") {
			WS.ExtendElement(HTMLElement.prototype);
			WS.DOMload(WS.InitDOM);
		}
		else {
			var ver = navigator.appVersion.get(/MSIE (\d+.\d+);/);
			ver = parseFloat(ver);
			if (ver >= 8.0) {
				WS.ExtendElement(HTMLElement.prototype); /*
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
			else {
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
	
	WS.ExtendElement = function(proto) {
		if (window.W) {
			for (var func in DOM) {
				if (func.indexOf("_") == 0) {
					continue;
				}
				
				proto["_" + func] = DOM[func];
			}
		} else {
			for (var func in DOM) {
				if (func.indexOf("_") == 0 || typeof(DOM[func]) != 'function') {
					continue;
				}
				proto["_" + func] = DOM[func];
				proto[func] = DOM[func];
			}
		}
		for (var func in BOM) {
			proto[func] = BOM[func];
		}
		//Совместимость
		/*
proto.rcs = DOM._rcs;
proto.cls = DOM._cls;
proto.attr = DOM._attr;
proto.html = DOM._html;
proto.aget = DOM._aget;
*/
		//Конец совместимости
		if (proto.__defineGetter__) {
			if (!HTMLElement.outerHTML && window.Node && window.XMLSerializer) {
				proto.__defineGetter__("outerHTML", WS.GetOuterHTML);
			}
			proto.__defineGetter__("dom", WS.SetOutWrapper);
			proto.__defineSetter__("dom", WS.SetInWrapper);
		}
		return proto;
	};
	
	
	WS.InitDOM = function() {
		WS.Body = document.body;
		window.Body = document.body;
		WS.Header = document.head;
		
		if (window.W) {
			for (var func in DOM) {
				WS.Header["_" + func] = DOM[func];
			}
		}
		else {
			for (var func in DOM) {
				WS.Header["_" + func] = DOM[func];
				WS.Header[func] = DOM[func];
			}
		}
		
		if (window.ev) {
			/*ev.CreateEvent("onAddElem", WS);
ev.CreateEvent("onDelElem", WS);
ev.CreateEvent("onAddClass", WS);
ev.CreateEvent("onDelClass", WS);
ev.CreateEvent("onSetAttr", WS);
ev.CreateEvent("onDelAttr", WS);
ev.CreateEvent("onSetContent", WS);
ev.CreateEvent("onDelContent", WS);*/
		}
		if (WS.onload) {
			WS.onload();
		}
	};
	
	WS.JsonToHtml = function(obj, div) {
		if (!div){
			div = DOM.Div();
		}
		if (Array.isArray(obj)){
			div._add(".array");
			for (var i = 0; i < obj.length; i++){
				div._add(WS.JsonToHtml(obj[i]));
			}
			return div;
		}
		for (var prop in obj) {
			var value = obj[prop]; 
			if (prop.indexOf(".") == 0) {
				if (value){
					div._add(prop);
				}
				continue;
			}
			if (prop.indexOf("@") == 0) {
				div._set(prop, value);
				continue;
			}
			if (typeof(value) == "object") {
				if (value instanceof HTMLElement) {
					div._add(value);
				}
				else{
					div._add(WS.JsonToHtml(value));
				}
			}
			else {
				div[prop] = obj[prop];
			}
		}
		return div;
	}
	
	WS.ToDiv = function(obj, param1, param2, param3) {
		var div = DOM.Div();
		var isdefault = false;
		for (var prop in obj) {
			if (["default", 'innerHTML', 'innerText', 'innerValue', 'defaultValue'].contains(prop))
				isdefault = true;
			div[prop] = obj[prop];
			if ((obj[prop]) instanceof Object) {
				if (isdefault && (obj[prop] instanceof HTMLElement)) {
					div._add(obj.prop);
				}
			}
			else {
				if (isdefault) {
					div.innerHTML = prop;
				}
				else {
					if (prop.indexOf(".") == 0) {
						div._add(prop);
					}
					else {
						if (prop.indexOf("@") == 0) {
							div._set(prop, obj[prop]);
						}
						else {
							WS.AddAttribute(div, prop, obj[prop]);
						}
					}
				}
			}
		}
		for (var i = 1; i < arguments.length; i++) {
			div._add(arguments[i]);
		}
		return div;
	}
		
	WS.SetOutWrapper = function() {
		return "$";
	};
	
	WS.SetInWrapper = function(value) {
		if (value.start("$")) {
			this._add(value.substr(1));
		}
		else {
			this._set(value.substr(1));
		}
	};
	
	WS.ToggleClass = function(elem, clss){
		if (elem._is("." + clss)){
			elem.del("." + clss);
			return false;
		}
		else{
			elem.add("." + clss);
			return true;
		}
	}
		
		WS.GetOuterHTML = function() {
			var serialized = new XMLSerializer().serializeToString(this);
			return serialized.replace('xmlns="http://www.w3.org/1999/xhtml"', "");
		};
	
	WS.WrapArray = function(array) {
		for (var func in DOM) {
			array[func] = WS.BindFunction(func);
		}
		for (var func in BOM) {
			array[func] = WS.BindFunction(func);
		}
		array.IsElementArray = true;
		array.each = WS.Each;
		array.select = WS.Select;
		if (array.__defineGetter__) {
			array.__defineGetter__("last", WS.GetLastElem);
			array.__defineGetter__("first", WS.GetFirstElem);
		}
		return array;
	};
	
	WS.GetLastElem = function() {
		if (this.length > 0) {
			return this[this.length - 1];
		}
		return null;
	};
	
	WS.GetFirstElem = function() {
		if (this.length > 0) {
			return this[0];
		}
		return null;
	};
	
	WS.Each = function(func) {
		for (var i = 0; i < this.length; i++) {
			func.call(this, this[i]);
		}
	};
	
	WS.Select = function(func) {
		var arr = [];
		for (var i = 0; i < this.length; i++) {
			var res = func.call(arr, this[i]);
			if (res){
				arr.push(res);
			};
		}
		return arr;
	};
	
	WS.BindFunction = function(funcName) {
		return function(param1, param2, param3) {
			for (var i = 0; i < this.length; i++) {
				this[i][funcName](param1, param2, param3);
			}
		};
	};
	
	WS.CallEvent = function(element, eventName, param1, param2, param3) {
		var result = true;
		if (typeof WS[eventName] == 'function') {
			var res = WS[eventName].call(element, param1, param2, param3);
			if (res != undefined) {
				result &= res;
			}
		}
		if (typeof element[eventName] == 'function') {
			var res = element[eventName].call(element, param1, param2, param3);
			if (res != undefined) {
				result &= res;
			}
		}
		return result;
	};
	
	WS.SetAttribute = function(elem, attrName, value) {
		if (attrName.start("@")) {
			attrName = attrName.substr(1, attrName.length - 1);
		}
		var attr = elem.attributes.getNamedItem(attrName);
		if (attr != null) {
			if (value == undefined || value == null){
				elem.removeAttribute(attrName);	
			}
			else
			{
				if (WS.CallEvent(elem, "onSetAttr", attrName, value)) {
					attr.value = value;
				};
			}
		}
		else {
			if (value == undefined || value == null){
				elem.removeAttribute(attrName);	
			}
			else{
				if (WS.CallEvent(elem, "onSetAttr", attrName, value)) {
					attr = document.createAttribute(attrName);
					attr.value = value + "";
					elem.attributes.setNamedItem(attr);
				}
			}
		}
		return elem;
	};
	
	WS.AddAttribute = function(elem, attrName, value) {
		if (attrName.start("@")) {
			attrName = attrName.substr(1, attrName.length - 1);
		}
		var attr = elem.attributes.getNamedItem(attrName);
		if (attr != null) {
			if (WS.CallEvent(elem, "onSetAttr", attrName, value)) {
				attr.value += value;
			};
		}
		else {
			if (WS.CallEvent(elem, "onSetAttr", attrName, value)) {
				attr = document.createAttribute(attrName);
				attr.value = value + "";
				elem.attributes.setNamedItem(attr);
			}
		}
		return elem;
	};
	
	WS.DelAttribute = function(elem, attrName) {
		if (attrName.start("@")) {
			attrName = attrName.substr(1, attrName.length - 1);
		}
		elem.removeAttribute(attrName);
		return elem;
	};
	
	WS.SetClass = function(elem, value) {
		var classes = value.split('.');
		for (var i = 0; i < classes.length; i++) {
			if (classes[i].length > 0) {
				if (elem.classList == undefined) {
					if (elem.className.indexOf(classes[i]) < 0) {
						if (WS.CallEvent(elem, "onAddClass", classes[i])) {
							elem.className += " " + classes[i] + " ";
						}
					}
				}
				else {
					if (WS.CallEvent(elem, "onAddClass", classes[i])) {
						elem.classList.add(classes[i]);
					}
				}
			}
		}
		return elem;
	};
	
	WS.ResetClass = function(elem, value) {
		var classes = value.split('.');
		for (var i = 0; i < classes.length; i++) {
			if (classes[i].length > 0) {
				if (elem.classList != undefined) {
					
					if (WS.CallEvent(this, "onDelClass", classes[i])) {
						elem.classList.remove(classes[i]);
					}
				}
				else {
					var regex = new RegExp('(?:\\s|^)' + classes[i] + '(?:\\s|$)');
					elem.className = elem.className.replace(regex, ' ');
				};
			}
		}
		
		return elem;
	};
	
	WS.ParseParams = function() {
		var obj = {
			other: [],
			parents: [],
			attributes: [],
			classes: [],
			id: null,
			inner: null,
			elements: [],
			functions: [],
			tree: [],
			count: 0,
			empty: true
		};
		for (var i = 0; i < arguments.length; i++) {
			var entity = arguments[i];
			WS.ParseParam(entity, obj);
		}
		return obj;
	};
	
	
	WS.ParseParam = function(entity, obj) {
		
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
		if (typeof (entity) == 'function') {
			obj.functions.push(entity);
			return obj;
		}
		if (typeof (entity) == 'object') {
			obj.tree.push(entity);
			return obj;
		}
		return obj;
	};
	
	WS.GetParamValue = function(separator, value) {
		return value.split(separator)[1];
	};
	
	
	WS.InitW();
}
else {
	
}

