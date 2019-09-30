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

    Events.Init = function() {
	UsingDOM("events", "Ev");
	for(elem in Events){
	    ev[elem] = Events[elem];
	}
    };
    
    Events.CreateEvent = function (name, parent) {
	var lname = name.toLowerCase();
	var event = ev[lname] = ev.div(".event");
	event.id = lname;
	event.name = lname;
	for(var member in SysEvent){
	    event[member] = SysEvent[member];
	}
	event.init(lname, parent);
	if (parent != undefined && parent != null) {
	    parent[name] = function(){
		return event.fire(arguments);
	    };
	}
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
	this.handlers = [];
    };
    
    SysEvent.add = function (handler, condition) {
	if (handler != undefined && handler != null) {
	    if (condition != undefined) {
		handler.condition = condition;
	    }
	    this.handlers.push(handler);
	}
    };
    
    SysEvent.del = function (handler) {
	for (var i = 0; i < this.handlers.length; i++) {
	    if (this.handlers[i] == handler) {
		this.handlers[i] = null;
	    }
	}
    };
    
    SysEvent.clear = function () {
	this.handlers = [];
    };
    
    SysEvent.fire = function (condition, params) {
	var result = true;
	this.currentFire = this.Div(".event-fire");
	this.currentFire.Add("." + this.name);
	this.currentFire.Set("@name", this.name);
	if (condition) {
	    this.currentFire.Set("@codition", this.condition);
	}
	this.currentFire.argument = params;
	for (var i = 0; i < this.handlers.length; i++) {
	    if (this.handlers[i] == null) continue;
	    
	    var handler = this.handlers[i];
	    if (check(handler.condition)) {
		if (handler.condition == condition) {
		    this.result = this.handle(handler, condition, params);
		    if (typeof this.result == 'boolean'){
			result &= this.result;
		    }
		}
	    }
	    else {
		this.result = this.handle(handler, condition, params);
		if (typeof this.result == 'boolean'){
		    result &= this.result;
		}
	    }
	    if (!result) {
		this.currentFire.innerHTML += i + " handler stop processing";
		return false;
	    }
	}
	this.currentFire.innerHTML += i + " handler processed succesfully";
	return true;
    };
    
    
    SysEvent.handle = function (handler, condition, params) {
	if (handler) {
	    if (typeof(handler) != "function" && handler[this.name] != undefined) {
		return handler[this.name]();
	    }
	    this.handler = handler;
	    return this.handler(condition, params);
	}
	return true;
    };
    
    
    SysEvent.isFired = function (condition) {
	return this.lastFired != null;
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
	    event = this.Get(".event-fire[condition='" + condition + "']");
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
