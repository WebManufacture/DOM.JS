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
	var event = ev[lname] = ev.div(".event");
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
	event.add = event.Add = SysEvent.add;
	event.del = event.Del = SysEvent.del;
	event.init(lname, parent);
	
	return event;
    };
    
    Events.CheckEvent = function (name) {
	var lname = name.toLowerCase();
	var event = e.get("#" + lname);
	if (check(event)) event = ev.CreateEvent(name);
	return event;
    };
    
    
    Events.IsFired = function(name, condition) {
	name = name.toLowerCase();
	var event = null;
	if (condition) {
	    event = ev.Get("." + name + " .event-fire[condition='" + condition + "']");
	}
	else {
	    event = ev.Get("." + name + ".event-fire");
	}
	return event != null;
    };
    
    Events.AddHandler = function(name, handler, condition) {
	name = name.toLowerCase();
	var event = ev[name];
	if (event == undefined) {
	    Log.add("$SysEvent Not found!", ".event-system", { caller: "EventSystem.AddHandler", EventName: name });
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
    return this._add.apply(this, arguments);
};

SysEvent.del = function (handler, condition) {
    if (typeof handler == 'function') {
	this.unsubscribe(handler, condition);
    }
    return this._del.apply(this, arguments);
};

SysEvent.unsubscribe = function (handler, condition) {
    if (condition){
	var handlers = this.all(".handler[condition='" + condition + "']");
	for (var i = 0; i < handlers.length; i++) {
	    if (handlers[i].handlers == handler) {
		handlers[i].del();
	    }
	}
    }
    else{
	var handlers = this.all('.handler:not[condition]');
	for (var i = 0; i < handlers.length; i++) {
	    if (handlers[i].handlers == handler) {
		handlers[i].del();
	    }
	}
    }
    this.attr("handlers", this.all('.handler').length);
};
    
    SysEvent.subscribe = function (handler, condition) {
	if (handler != undefined && handler != null) {
	    var h = this.div(".handler");
	    if (condition != undefined) {
		h.condition = condition;
		h.add(".condition");
		h.attr("condition", condition);
	    }
	    h.handler = handler;
	    this.attr("handlers", this.all('.handler').length);
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
	    var handlers = this.all(".handler[condition='" + condition + "']");
	    for (var i = 0; i < handlers.length; i++) {
		if (handlers[i].handlers == handler) {
		    handlers[i].del();
		}
	    }
	}
	else{
	    var handlers = this.all('.handler:not[condition]');
	    for (var i = 0; i < handlers.length; i++) {
		if (handlers[i].handlers == handler) {
		    handlers[i].del();
		}
	    }
	}
	this.attr("handlers", this.all('.handler').length);
    };
    
    SysEvent.clear = function () {
	var src = this;
	if (typeof(this) == 'function'){
	    src = ev.get("#" + this.eventId);
	}
	src.handlers = [];
    };
    
    SysEvent.fire = function (condition, params) {
//	if (Request && Request.Params.debug){
	{
	    this.currentFire = this.Div(".event-fire");
	    this.currentFire.Set("@name", this.name);
	    this.currentFire.Set("@date", (new Date()).formatTime(true));
	    if (condition) {
		this.currentFire.Set("@condition", condition);
	    }
	    this.currentFire.argument = params;
	}
	var result = true;
	var success = 0;
	var handlers = this.all('.handler');
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
		    handler.del();
		}
	    }
	    if (!result) {
		this.currentFire.innerHTML += success + " on " + i + " handler stop processing";
		return false;
	    }
	}
	this.attr("handlers", this.all('.handler').length);
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
	    event = this.All(".event-fire[condition='" + condition + "']");
	}
	else {
	    event = this.All(".event-fire");
	}
	return event.length;
    };
    
    
    SysEvent.lastFired = function (condition) {
	var event;
	if (condition) {
	    event = this.aget("condition", condition, ".event-fire");
	}
	else {
	    event = this.Get(".event-fire");
	}
	return event;
    };    
    
if (document.addEventListener){
	    document.addEventListener("DOMContentLoaded", Events.Init, false);
	}
	else{
	    window.addEventListener("load", Events.Init, false);
	}
