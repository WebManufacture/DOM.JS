if (!using("Log")){
	Log = L = {};
	Log.Add = Log.add = function(){};
	Log.LogInfo = function(){};
	Log.LogWarn = function(){};
	Log.LogError = function(){};
	Log.LogObject = function(){};
}



if (window.ev == undefined) 
{
	Events = {};
}

Sync = function(){
	this.handlers = [];
};

Sync.prototype = {
	callThere: function(callback){
		callback.ready = true;
		this.handlers.push(callback);
		return callback;
	},
	
	check: function(){
		var syncProto = this;
		var i = this.handlers.length;						
		var func = function(){
			syncProto.handlers[i] = {};
			syncProto.handlers[i].ready = true;
			syncProto._checkHandlers();
		}						
		func.ready = false;
		this.handlers[i] = func;
		return func;
	},
	
	add: function(callback){
		var syncProto = this;
		var i = this.handlers.length;						
		var func = function(){
			syncProto.handlers[i] = callback;
			syncProto.handlers[i].ready = true;
			syncProto.handlers[i].thisParam = this;
			syncProto.handlers[i].args = arguments;
			syncProto._checkHandlers();
		};		
		func.ready = false;
		this.handlers[i] = func;
		return func;
	},
	
	_checkHandlers : function(){
		var handlersReady = true;
		for (var j = 0; j < this.handlers.length; j++){
			handlersReady = handlersReady && (this.handlers[j].ready);
		}
		if (handlersReady){	
			for (var j = 0; j < this.handlers.length; j++){
				var hCall = this.handlers[j];
				if (typeof(hCall) == 'function'){
					hCall.apply(hCall.thisParam, hCall.args);
				}
			}
		}
	}
};

Events.url = "events.js";

Events.Init = function() {
	UsingDOM("events", "Ev");
	for(elem in Events){
		ev[elem] = Events[elem];
	}
	ev.id = "Events_System";
};

Events.CreateEvent = function (name, parent, singleEvent) {
	var lname = name.toLowerCase();
	var event = ev[lname] = ev._div(".event");
	event.id = lname;
	event.name = lname;
	event.single = singleEvent;
	event.cls('.single');
	if (parent != undefined && parent != null) {
		parent[name] = event;
		/*if (lname.toLowerCase().start('on')){
var sname = name.substr(2);
parent[sname] = function(){
parent[name].fire.apply(parent[name], arguments);
}
}*/
		event.parent = parent;
	}
	for(var member in SysEvent){
		event[member] = SysEvent[member];
	}
	event.__add = event.add;
	event.__del = event.del;
	event.add = event._add = event.Add = SysEvent.add;
	event.del = event._del = event.Del = SysEvent.del;
	event.init(lname, parent);
	
	return event;
};

Events.CheckEvent = function (name) {
	var lname = name.toLowerCase();
	var event = e._get("#" + lname);
	if (check(event)) event = ev.CreateEvent(name);
	return event;
};


Events.IsFired = function(name, condition) {
	name = name.toLowerCase();
	var event = null;
	if (condition) {
		event = ev._Get("." + name + " .event-fire[condition='" + condition + "']");
	}
	else {
		event = ev._Get("." + name + ".event-fire");
	}
	return event != null;
};

Events.AddHandler = function(name, handler, condition) {
	name = name.toLowerCase();
	var event = ev[name];
	if (event == undefined) {
		Log._add("$SysEvent Not found!", ".event-system", { caller: "EventSystem.AddHandler", EventName: name });
		return;
	}
	event.add(handler, condition);
	var lastFired = event.lastFired(condition);
	if (lastFired) {
		event.handle(handler, condition, lastFired.argument);
	}
};

SysEvent = {};

SysEvent.init = function (name, parent) {
	this.parent = parent;
	if (check(name)) {
		this.name = name;
	}
	else {
		this.name = null;
	}
};

SysEvent.add = function (handler, condition) {
	if (typeof handler == 'function') {
		this.subscribe(handler, condition);
	}
	if (window.Log && window.Log.Debug){
		return this.__add.apply(this, arguments);
	}
	return null;
};

SysEvent.del = function (handler, condition) {
	if (typeof handler == 'function') {
		this.unsubscribe(handler, condition);
	}
	if (window.Log && window.Log.Debug){
		return this.__del.apply(this, arguments);
	}
	return null;
};

SysEvent.unsubscribe = function (handler, condition) {
	if (condition){
		var handlers = this._all(".handler[condition='" + condition + "']");
		for (var i = 0; i < handlers.length; i++) {
			if (handlers[i].handlers == handler) {
				handlers[i]._del();
			}
		}
	}
	else{
		var handlers = this._all('.handler:not[condition]');
		for (var i = 0; i < handlers.length; i++) {
			if (handlers[i].handlers == handler) {
				handlers[i]._del();
			}
		}
	}
	this.attr("handlers", this._all('.handler').length);
};

SysEvent.subscribe = function (handler, condition) {
	if (handler != undefined && handler != null) {
		var h = this._div(".handler");
		if (condition != undefined) {
			h.condition = condition;
			h._add(".condition");
			h._attr("condition", condition);
		}
		h.handler = handler;
		this._attr("handlers", this._all('.handler').length);
		if (this.single && this.isFired(condition)){
			if (L && L.Info){
				L.Info.call(Ev, "subscribe", "last fired process on", this.name, condition);
			}
			this.handle(h, condition);
		}
	}
	
};

SysEvent.unsubscribe = function (handler, condition) {
	if (condition){
		var handlers = this._all(".handler[condition='" + condition + "']");
		for (var i = 0; i < handlers.length; i++) {
			if (handlers[i].handlers == handler) {
				handlers[i]._del();
			}
		}
	}
	else{
		var handlers = this._all('.handler:not[condition]');
		for (var i = 0; i < handlers.length; i++) {
			if (handlers[i].handlers == handler) {
				handlers[i]._del();
			}
		}
	}
	this.attr("handlers", this._all('.handler').length);
};

SysEvent.clear = function () {
	var src = this;
	if (typeof(this) == 'function'){
		src = ev._get("#" + this.eventId);
	}
	src.handlers = [];
};

SysEvent.fire = function (condition, params) {
	//	if (Request && Request.Params.debug){
	{
		this.currentFire = this._div(".event-fire");
		this.currentFire._set("@name", this.name);
		this.currentFire._set("@date", (new Date()).formatTime(true));
		if (condition) {
			this.currentFire._set("@condition", condition);
		}
		this.currentFire.argument = params;
	}
	var result = true;
	var success = 0;
	var handlers = this._all('.handler');
	for (var i = 0; i < handlers.length; i++) {
		var handler = handlers[i];
		var funcRes = this.handle(handler, condition, params);
		if (typeof funcRes == 'boolean'){
			result &= funcRes;
			if (funcRes){
				success++;
			}
		}
		else{
			if (funcRes == "del"){
				handler._del();
			}
		}
		if (!result) {
			this.currentFire.innerHTML += success + " on " + i + " handler stop processing";
			return false;
		}
	}
	this.attr("handlers", this._all('.handler').length);
	this.currentFire.innerHTML += success + " handler processed succesfully";
	return true;
};


SysEvent.handle = function (handler, condition, params) {
	if (handler.condition) {
		if (handler.condition == condition) {
			handler = handler.handler;
			if (typeof(handler) != "function" && handler[this.name] != undefined) {
				return handler[this.name].call(this, condition, params);
			}
			return handler.call(this,condition, params);
		}
	}
	else {
		handler = handler.handler;
		if (typeof(handler) != "function" && handler[this.name] != undefined) {
			return handler[this.name].call(this, condition, params);
		}
		return handler.call(this,condition, params);
	}
	return null;
};


SysEvent.isFired = function (condition) {
	return this.lastFired(condition) != null;
};

SysEvent.firesCount = function (condition) {
	var event = "";
	if (condition) {
		event = this._all(".event-fire[condition='" + condition + "']");
	}
	else {
		event = this._all(".event-fire");
	}
	return event.length;
};


SysEvent.lastFired = function (condition) {
	var event;
	if (condition) {
		event = this.aget("condition", condition, ".event-fire");
	}
	else {
		event = this._get(".event-fire");
	}
	return event;
};    

if (document.addEventListener){
	document.addEventListener("DOMContentLoaded", Events.Init, false);
}
else{
	window.addEventListener("load", Events.Init, false);
}
