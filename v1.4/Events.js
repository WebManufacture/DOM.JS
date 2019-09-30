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

Events._prescribe = {};

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
	var ps = Events._prescribe[name];
	if (ps){
		for (var i = 0; i < ps.length; i++){
			event.add(ps[i].handler, ps[i].condition);
		}
		delete Events._prescribe[name];
	}
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
		if (!Events._prescribe[name]) Events._prescribe[name] = [];
		Events._prescribe.push({handler : handler, condition : condition});
		//Log._add("$SysEvent prescribe!", ".event-system", { caller: "EventSystem.AddHandler", EventName: name });
		//Log._add("$SysEvent Not found!", ".event-system", { caller: "EventSystem.AddHandler", EventName: name });
		return;
	}
	event.add(handler, condition);
	var lastFired = event.lastFired(condition);
	if (lastFired) {
		event.handle(handler, condition, lastFired.argument);
	}
};

Events.On = Events.on = function(name, condition, handler){
	if (typeof(condition) == 'function'){
		handler = condition;
		condition = null;
	}	
	return Events.AddHandler(name, handler, condition);
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

SysEvent.subscribe = SysEvent.on = function (handler, condition) {
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

SysEvent.fire = SysEvent.emit = function (condition, params) {
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

Channel = function(route){
	this.name = route;
	this.routes = { $path : "/" };
}

Channel.RouteNode = function(route){
	route = route.replace(/\$/ig, ""); //Чтобы предотвратить перезапись внутренних функций в узлах
	this.source = route;
	this.type = "*";
	this.tags = [];
	this.components = [];
	if (route){
		route = route.split(".");
		if (route.length > 0){
			if (route[0] != ""){
				this.type = route[0].toLowerCase();
			}
			route.shift();
			this.components.push(this.type);
			var i = 0;
			while (i < route.length){
				if (route[i] == ""){
					route.splice(i, 1);
				}
				else{
					route[i] = route[i].toLowerCase();
					this.components.push("." + route[i]);
					i++;	
				}
			}
			this.tags = route;
		}
	}
	this.is = function(other){
		if (other.type != "*" && other.type != this.type) {
			return false;
		}
		for (var i = 0; i < other.tags.length; i++){
			if (this.source.indexOf("." + other.tags[i]) < 0){
				return false;
			}
		}
		return true;
	};
	this.setType = function(otherType){
		this.type = otherType;
		if (this.components.length > 0) this.components[0] = otherType;
	};
};

Channel.RouteNode.prototype.toString = function(){
	var str = this.type;
	if (this.tags.length > 0){
		str += "." + this.tags.join(".");
	}
	return str;
};

Channel.Route = function(route){
	if (!route || route == "") return null;
	if (typeof route != "string"){
		route.push(0);
	}
	if (route.indexOf("/") != 0){
		route = "/" + route;	
	}
	this.source = route;
	this.nodes = route.split("/");
	this.nodes.shift();
	this.components = [];
	for (var i = 0; i < this.nodes.length; i++){
		if (this.nodes[i] == "") this.nodes[i] = "*";
		this.nodes[i] = new Channel.RouteNode(this.nodes[i]);
		this.components = this.components.concat(this.nodes[i].components);
	}
	
};

Channel.Route.prototype = {
	clone : function(){
		var newRoute = new Channel.Route(this.source);
		for (var item in this){
			if (item != "source" && item != "nodes" && item != "components" && !Channel.Route.prototype[item]){
				newRoute[item] = this[item];
			}
		}
		return newRoute;
	},
	
	is : function(other){
		other = Channel.ParsePath(other);
		thisRoute = Channel.ParsePath(this.source);
		if (thisRoute.nodes.length < other.nodes.length) {
			return false;
		}
		for (var i = 0; i < other.nodes.length; i++){
			if (!thisRoute.nodes[i].is(other.nodes[i])) return false;
		}
		return true;
	}
}


Channel.Route.prototype.toString = function(index){
	var str = "";
	index = parseInt(index);
	if (!isNaN(index) && index >= 0 && index < this.nodes.length){
		for (var i = index; i < this.nodes.length; i++){
			str += "/" + this.nodes[i].toString();
		}
	}
	return str;
};

			
Channel.ParsePath = function(route){
	if (!route) return null;
	if (typeof route == "string") return new Channel.Route(route);
	if (typeof route == "object"){
		if (route instanceof Channel.RouteNode){
			return new Channel.Route(route);
		}		
		if (route instanceof Channel.Route){
			return route;
		}
	}
	return null;
}

Channel.prototype.once = Channel.prototype._single = function(path, callback){
	callback.callMode = "single";
	return this.on(path, callback);
}

Channel.prototype.on = Channel.prototype.for = Channel.prototype.subscribe = Channel.prototype.add = Channel.prototype._addListener = function(route, callback){
	route = Channel.ParsePath(route);
	if (!route) return null;
	if (!callback) return null;
	callback.id = (Math.random() + "").replace("0.", "handler");
	var path = [];
	var root = this._createRoute(this.routes, route, path);
	if (root && path.length > 0){
		var result = true;
		for (var i = 0; i < path.length; i++){
			var tunnels = path[i]["$tunnels"];
			if (tunnels){
				var j = 0;
				var param = { source: route.source, path : path[i].$path, current : route.source.replace(path[i].$path, "") };
				while (j < tunnels.length){
					var res = tunnels[j].call(route, param);
					if (res == null){
						tunnels.splice(j, 1);
					}
					else
					{
						if (res == false){
							result = false;
							break;
						}
					}
					j++;
				}
				if (result == false) break;
			}
		}
		if (result){
			return this._addRouteHandler(root, callback);
		}
	}
	return null;
};
		
Channel.prototype._addRouteHandler = function(root, callback){
	if (!root) return null;
	if (!callback) return null;
	if (root) {
		if (!root["."]){
			root["."] = [];
		}
		root["."].push(callback);
		return callback;
	}	
	return null;
};

Channel.prototype._getRoute = function(root, route, path){
	if (!root) return null;
	if (!route) return null;	
	var nodes = route.components;
	for (var i = 0; i < nodes.length; i++){
		var inner = root[nodes[i]];
		if (!inner){
		    return null;
		}	
		if (path) path.push(inner);
		root = inner;
	}
	return root;
};		

Channel.prototype._createRoute = function(root, route, path){
	if (!root) return null;
	if (!route) return null;
	var nodes = route.components;
	var itemsPath = "";
	for (var i = 0; i < nodes.length; i++){
		if (nodes[i].length == 0) continue;
		if (nodes[i][0] == "."){
				itemsPath += nodes[i];
			}
			else{
				itemsPath += "/" + nodes[i];
			}
		var inner = root[nodes[i]];
		if (!inner){
			inner = root[nodes[i]] = {  };
			inner.$path = itemsPath;
		}	
		if (path) path.push(inner);
		root = inner;
	}
	return root;
};


Channel.prototype.tunnelTo = function(route, callback){
	route = Channel.ParsePath(route);
	if (!route) return null;
	if (!callback) return null;
	var root = this._createRoute(this.routes, route)
	if (root){
		if (!root['$tunnels']){
			root['$tunnels'] = [];
		}
		root['$tunnels'].push(callback);
		return root;
	}
	return null;
};

Channel.prototype.clear = Channel.prototype._removeListeners = function(route, handler){
	route = Channel.ParsePath(route);
	if (!route) return null;
	if (route.nodes.length == 0) return null;
	return this._removeHandler(this._getRoute(this.routes, route), handler);
};

Channel.prototype._removeHandler = function(root, handler){
	if (!root) return null;
	if (!root["."]) return false;
	var i = 0;
	if (handler){
		var handlers = root["."];
		while (i < handlers.length){
			if (typeof handler == "function"){
				if (handlers[i] == handler){
					handlers.splice(i, 1);
					continue;
				}		
			}
			if (typeof handler == "string"){
				if (handlers[i].id == handler){
					handlers.splice(i, 1);
					continue;
				}	
			}
			i++;	
		}		
	}
	else{
		root["."] = [];
	}
	return true;
};


Channel.prototype._removeRoute = function(root, nodes){
	if (!root) return null;
	if (!nodes) return null;
	if (nodes.length == 0){
		return true;	
	}
	for (var i = 0; i < nodes.length; i++){
		var inner = root[nodes[i]];
		if (inner) {
			if (this._removeRoute(inner, nodes.slice(0, i).concat(nodes.slice(i+1)), args)){
				delete root[nodes[i]];
			}			
		}
	}
	return false;
};


Channel.prototype.emit = function(route){
	var route = Channel.ParsePath(route);
	if (!route) return;
	if (route.nodes.length == 0) return null;
	route.id = (Math.random() + "").replace("0.", "");
	var root = this.routes;
	route.callplan = [];
	var count = this._sendMessage(root, route, 0, arguments);
	for (var i = route.callplan.length - 1; i >= 0; i--){
		route.callplan[i]();
	}
	return count;
}; 

Channel.prototype._sendMessage = function(root, route, nodeIndex, args){
	if (!root) return null;
	if (!route) return null;	
	var counter = 0;
	if (nodeIndex < route.nodes.length){
		var node = route.nodes[nodeIndex];
		counter += this._sendInternal(root[node.type],  nodeIndex, route, node.tags, args);
		counter += this._sendInternal(root["*"],  nodeIndex, route, node.tags, args);
	}
	return counter;
};

Channel.prototype._sendInternal = function(root, nodeIndex, route, tags, args){
	if (!root) return null;
	if (!tags) return null;
	var param = { source: route.source, path : root.$path, current : route.toString(nodeIndex + 1), timestamp: (new Date()).valueOf(), id : route.id };
	//console.log(param);
	var counter = this._callHandlers(root["."], route, param, args);
	if (counter > 0){
		//console.log(root.$path.warn);
	}
	else{	
		//console.log(root.$path);
	}
	for (var i = 0; i < tags.length; i++){
		if (tags[i] == "") continue;
		var inner = root["." + tags[i]];
		if (inner) {
			counter += this._sendInternal(inner, nodeIndex, route, tags.slice(0, i).concat(tags.slice(i+1)), args);
		}
	}	
	counter += this._sendMessage(root, route, nodeIndex + 1, args);
	return counter;
};

Channel.prototype._callHandlers = function(handlers, route, param, args){
	var counter = 0;
	if (handlers){
		var i = 0;
		while (i < handlers.length){
			if (handlers[i] != null){
				counter++;
				this._callHandlerAsync(route, handlers[i], param, args);
				if (handlers[i].callMode && handlers[i].callMode == "single"){
					handlers[i] = null;
					handlers.splice(i, 1);
				}
				else{
					i++;	
				}
			}
		}
	}
	return counter;
}

Channel.prototype._callHandlerAsync = function(route, callback, param, args){
	var channel = this;	
	var param1 = args[1];
	var param2 = args[2];
	var param3 = args[3];	
	var param4 = args[4];
	var param5 = args[5];
	function callCallback(){
		if (channel == Channels){
			return callback.call(route, param, param1, param2, param3, param4, param5);
		}
		else{
			return callback.call(channel, param, param1, param2, param3, param4, param5);
		}
	}
	if (route.callplan){
		route.callplan.push(callCallback);
	}
	else{
		setTimeout(callCallback, 2);
	}
}


Channels = new Channel("/");
		
