if (!using("Ax")) {
	
	
	ax.init = function(){
		if (window.ev){
			ev.CreateEvent("onAjaxStart", ax);
			ev.CreateEvent("onAjaxFinish", ax);
			ev.CreateEvent("onAjaxError", ax);
		}
	};
	
	
	ax.get = ax.Get = function(url, callback, params, urlparams){
		if (check(callback)){
			var rq = ax.GetRequestInternal("GET", url, null, callback, params, urlparams);
			rq.start();
			return rq;
		}
		else
		{
			var rq = ax.GetRequestSync("GET", url, null, callback, params, urlparams);
			rq.send();
			if(rq.status == 200) {
				var div = DOM.div();
				div.innerHTML = rq.responseText;
				return div;
			}
			return rq;
		}
	};
	
	ax.set = ax.Set = ax.Post = ax.post = function(url, data, callback, params, urlparams){
		var rq = ax.GetRequestInternal("POST", url, data, callback, params, urlparams);
		rq.start();
		return rq;
	};
	
	ax["new"] = ax.New = function(url, callback, params, urlparams){
		var rq = ax.GetRequestInternal("POST", url, null, callback, params, urlparams);
		rq.start();
		return rq;
	};
	
	ax.add = ax.Add = function(url, data, callback, params, urlparams){
		var rq = ax.GetRequestInternal("PATCH", url, data, callback, params, urlparams);
		rq.start();
		return rq;	
	};
	
	ax.del = ax.Del = function(url, callback, params, urlparams){
		var rq = ax.GetRequestInternal("DELETE", url, null, callback, params, urlparams);
		rq.start();
		return rq;
	};
	
	ax.load = ax.Load = function(url, context, callback, params, urlparams){
		return ax.Get(url, callback, context, params, urlparams);
	};
	
	ax.getRequest = ax.GetRequest = ax.request = ax.Request = ax.postRequest = ax.PostRequest = function(url, data, callback, params, urlparams){
		if (typeof callback == 'Object'){
			urlparams = params;
			params = callback;
			callback = null;
		}
		if (check(data)){
			var req = ax.GetRequestInternal("POST", url, data, callback, params, urlparams);
			req.data = data;
		}
		else{
			var req = ax.GetRequestInternal("GET", url, data, callback, params, urlparams);	    
		}
		return req;
	};
	
	ax.GetRequestInternal = function(method, url, data, callback, params, urlparams){
		var req = new XMLHttpRequest();
		ax.AddRequestParams(req, params);
		req.url = ax.GetUrl(url);
		req.url = ax.AddUrlParams(req.url, urlparams);
		if (check(callback)){
			if (typeof(callback) != 'function'){
				ax.AddRequestParams(req, callback);
			}
			else{
				req.callback = callback;
			}
		}
		else{
			if (typeof(data) == 'function'){
				req.callback = data;
				data = null;
			}   
		}
		req.data = data;
		req.onerror = AX.AjaxError;
		req.start = AX.StartRequest;
		req.onload = AX.EndRequest;
		req.open(method, req.url, true);
		return req;
	};
	
	ax.GetRequestSync = function(method, url, data, callback, params, urlparams){
		var req = new XMLHttpRequest();
		ax.AddRequestParams(req, params);
		req.url = ax.GetUrl(url);
		req.url = ax.AddUrlParams(req.url, urlparams);
		if (check(callback)){
			req.callback = callback;
		}
		else{
			if (typeof(data) == 'function'){
				req.callback = data;
				data = null;
			}   
		}
		req.onerror = AX.AjaxError;
		req.open(method, req.url, false);
		return req;
	};
	
	ax.AddRequestParams = function(req, params){
		if (check(params)) {
			for (var p in params) {
				req[p] = params[p];
			}
		}
	};
	
	ax.GetUrl = function(url, urlparams) {
		if (!url.start("/") && url.contains("/") && !url.start("http://")) {
			url = "http://" + url;
		}
		url = ax.AddUrlParams(url, urlparams);
		return url;
	};
	
	ax.AddUrlParam = function(url, paramName, value) {
		if (!url || !paramName) {return url;}
		if (url.contains("?")){
			url += "&";
		}
		else{
			url += "?";   
		}
		if (value)
		{
			paramName = paramName + "=" + encodeURIComponent(value);
		}
		url += paramName;
		return url;
	};
	
	ax.AddUrlParams = function(url, urlparams) {
		if (!urlparams || !url) {return url;}
		if (typeof(urlparams) == 'string'){
			url = ax.AddUrlParam(url, urlparams);
		}
		else{
			for(var param in urlparams){
				url = ax.AddUrlParam(url, param, urlparams[param]);
			}
		}
		return url;
	};
	
	ax.EndRequest = function(req) {
		if (ax.onAjaxFinish){
			ax.onAjaxFinish.fire(this.type, this);
		}
		var result = true;
		if (check(this.callback)) {
			var context = this.context;
			if (!check(this.context)){
				context = DOM.div("", this.responseText);
			}
			var res = this.callback(this.responseText, context);
			if (res != undefined) {
				result = result && res;
			}
		}
		if (check(this.context) && result) {
			this.context._add(this.responseText);
		}
		if (typeof this.postback == 'function') {
			var context = this.context;
			this.postback(context);
		}
	};
	
	AX.StartRequest = function() {
		if (ax.onAjaxStart){
			ax.onAjaxStart.fire(this.type, this);
		}
		if (this.data != undefined) {
			this.send(this.data);
		}
		else {
			this.send(null);
		}
	};
	
	AX.AjaxError = function(e) {
		var message = "AJAX: " + this.status + ":" + this.statusText + ":" + this.url;
		if (ax.onAjaxError != undefined) {
			ax.onAjaxError.fire(this.type, this);
		}
		if (window.L != undefined) {
			L.LogError(message);
		}
	}; 
	
	ajax = ax;
	
	WS.DOMload(ax.init);
}

if (!using("Server")) {
	
	Server.Create = server.create = function(server, handler, root) {
		for (var prop in Server){
			if (typeof Server[prop] == 'function'){
				server[prop] = Server[prop];
			}
		}
		server.Init(handler, root);
		return server;
	};
	
	Server.Init = server.init = function(handler, root) {
		if (check(root)){
			this.SystemRoot = this.root = root;
		}
		else{
			this.SystemRoot = this.root = Server.SystemRoot;
		}
		this.Handler = this.handler = handler;
		this.CrossDomain = this.cd = this.SystemRoot != window.location.host
			this.actionParam = 'action';
		this.selectorParam = 'selector';
		return this;
	};
	
	Server.GetSystemUrl = function(url, urlparams) {
		if (!url.start("http://")){
			url = "http://" + this.SystemRoot + "/" + url;
		}
		return ajax.AddUrlParams(url, urlparams);
	};
	
	Server.GetHandlerUrl = function(urlparams) {
		return this.GetSystemUrl(this.handler, urlparams);
	};
	
	Server.GetActionUrl = function(action) {
		var url = this.GetHandlerUrl();
		if (action){
			url = ajax.AddUrlParam(url, this.actionParam, action);
		}
		return url;
	};
	
	Server.AddSelector = function(url, selector){
		if (selector){
			url = ajax.AddUrlParam(url, this.selectorParam, selector);
		}
		return url;
	}
		
		Server.Request = Server.request = Server._request = function(action, selector, data, callback, params, urlparams) {
			var url = this.GetActionUrl(action);
			url = this.AddSelector(url, selector);
			url = ajax.AddUrlParams(url, urlparams);
			var req = ajax.Request(url, data, callback);
			ajax.AddRequestParams(req, params);
			return req;
		};
	
	Server.Command = Server.command = Server._command = function(action, selector, data, callback, params, urlparams) {
		var req = this.Request(action, selector, data, callback, params, urlparams);
		req.start();
		return req;
	};
	
	Server.Default = Server['default'] = function(callback, params) {
		var req = this.Request(null, null, null, callback, params, null);
		req.start();
		return req;
	};
	
	Server.Get = Server.get = function(selector, callback, params, urlparams) {
		var req = this.Request('get', selector, null, callback, params, urlparams);
		req.start();
		return req;
	};
	
	Server.Set = Server.set = Server.Post = Server.post = function(selector, data, callback, params, urlparams) {
		var req = this.Request('set', selector, data, callback, params, urlparams);
		req.start();
		return req;
	};
	
	Server["new"] = Server.New = function(selector, callback, params, urlparams){
		var req = this.Request('new', selector, null, callback, params, urlparams);
		req.start();
		return req;
	};
	
	Server.add = Server.Add = function(selector, data, callback, params, urlparams){
		var req = this.Request('add', selector, data, callback, params, urlparams);
		req.start();
		return req;	
	};
	
	Server.del = Server.Del = function(selector, callback, params, urlparams){
		var req = this.Request('del', selector, null, callback, params, urlparams);
		req.start();
		return req;
	};
	
	Server.load = Server.Load = function(url, context, callback){
		return this.Get(url, callback, context);
	};
	
	if (Request.Params.SystemDomain) {
		Server.SystemRoot = Request.Params.SystemDomain;
	}    
	else{
		Server.SystemRoot = "system.web-manufacture.net" ;  
	}
	
	Server.Init("system.default.ashx", Request.Host);
	Server.Settings = DOM.Div(".server-settings.sys-object");
	Server.Default(null, {context:Server.Settings});
};


if (!using("Files")) {
	
	if (Request.Params.UserDomain) {
		Server.Create(Files, "system.handler.ashx", Request.Params.UserDomain);
	}
	else{
		Server.Create(Files, "system.handler.ashx");   
	}
	
	if (Request.Params.SystemPath) {
		Files.SystemPath = Request.Params.SystemPath;
	}
	else{
		Files.SystemPath = "";
	}
	
	Files.Request = function(action, selector, data, callback, params, urlparams) {
		if (Files.SystemPath){
			if (!urlparams)urlparams = {};
			urlparams.path = Files.SystemPath;
		}
		return Files._request(action, selector, data, callback, params, urlparams);
	};
	
	Files.selectorParam = "file";
	
	Files.Text = Files.ContentGet = function(file, callback) {
		return this.Command('text', file, null, callback);
	};
	
	Files.File = Files.Get;
	
	Files.Save = Files.save = Files.Post;
	
	Files.Proxied = function(url, callback) {
		return this.Command('proxy', url, null, callback);
	};
	
	Files.ProxiedByUrl = function(url, callback) {
		return this.Command('url', url, null, callback);
	};
	
	Files.LoadUrl = function(url, callback) {
		return this.Command('urlload', url, null, callback);
	};
	
	
};

if (!using("SysAjax")) {
	Server.Create(SysAjax, "system.handler.ashx");
	
	SysAjax.selectorParam = 'file';
	
	SysAjax.LoadModule = function(fileName, module, cache, callback) {
		var urlparams = null;
		if (Request.Params.cache == "nocache"){
			cache = true;
		}
		if (cache){
			urlparams = {rnd : Math.random()};
		}
		
		if (this.CrossDomain){
			var rq = this.Request('get', fileName, null, callback, null, urlparams);
		}
		else{
			var rq = ax.GetRequest(fileName, null, callback, null, urlparams)
				}
		rq.module = module;
		rq.start();
		return rq;
	};
}

WS.DOMload(function(){
	if (!usingDOM("Aj")) {
		if (Request.Params.UserDomain) {
			Server.Create(Aj, "system.jasp.ashx", Request.Params.UserDomain);
		}
		else{
			Server.Create(Aj, "system.jasp.ashx");
		}
		
		
		AjaxJasp = AJ;
		
		AjaxJasp.actionParam = "type";	
		
		AjaxJasp.onAddElem = function(parent, elem){
			if (elem.is(".ajax-file")){
				elem.File = elem._get("@file");
				elem.Path = elem._get("@path");
				elem.Get = function (selector, callback, context){
					if (this.context){
						context = this.context;
					}
					return AjaxJasp.JaspRequest('get', this.File, selector, null, callback, context);
				};
				elem.Set = function (selector, data, callback, context){
					return AjaxJasp.JaspRequest('set', this.File, selector, data, callback, context);
				};
				elem.Add = function (selector, data, callback, context){
					if (this.context){
						context = this.context;
					}
					return AjaxJasp.JaspRequest('append', this.File, selector, data, callback, context);
				};
				elem.Ins = function (selector, data, callback, context){
					return AjaxJasp.JaspRequest('prepend', this.File, selector, data, callback, context);
				};
				elem.Acs = function (selector, data, callback, context){
					return AjaxJasp.JaspRequest('addClass', this.File, selector, data, callback, context);
				};
				elem.Rcs = function (selector, callback, context){
					return AjaxJasp.JaspRequest('delClass', this.File, selector, data, callback, context);
				};	
			}
			return true;
		};
		
		AjaxJasp.BasePath = null;
		
		AjaxJasp.JaspRequest = function(action, file, selector, data, callback, context) {
			var params = {file: file};
			if (AjaxJasp.BasePath){
				params.path = AjaxJasp.BasePath;
			}
			return this.Command(action, selector, data, callback, {context: context}, params);
		};
		
		AjaxJasp.Get = AjaxJasp.get = function(file, selector, callback, context) {
			return AjaxJasp.JaspRequest('get', file, selector, null, callback, context);
		};
		
		AjaxJasp.Set = AjaxJasp.set = function(file, selector, data, callback, context) {
			return AjaxJasp.JaspRequest('set', file, selector, data, callback, context);
		};
		
		AjaxJasp.Del = AjaxJasp.del = function(file, selector, callback, context) {
			return AjaxJasp.JaspRequest('delete', file, selector, "", callback, context);
		};
		
		AjaxJasp.Add = AjaxJasp.add = function(file, selector, data, callback, context) {
			return AjaxJasp.JaspRequest('add', file, selector, data, callback, context);
		};
		
		AjaxJasp.Ins = function(file, selector, data, callback, context) {
			return AjaxJasp.JaspRequest('prepend', file, selector, data, callback, context);
		};
		
		AjaxJasp.Acs = function(file, selector, data, callback, context) {
			return AjaxJasp.JaspRequest('addClass', file, selector, data, callback, context);
		};
		
		AjaxJasp.Rcs = function(file, selector, data, callback, context) {
			return AjaxJasp.JaspRequest('delClass', file, selector, data, callback, context);
		};
		
		AJ = AjaxJasp;
	}
});


WS.DOMload(function(){
	if (!usingDOM("Nj")) { // if (window.Nj) {return true;} else { Nj = {} return false; }
		if (Request.Params.UserDomain) {
			Server.Create(Nj, "nodejasp", Request.Params.UserDomain);
		}
		else{
			Server.Create(Nj, "nodejasp");
		}
		
		
		NodeJasp = Nj;	
		
		NodeJasp.JaspRequest = function(action, selector, data, asyncParam) {
			var params = null;
			var context = null;
			var callback = null;
			if (typeof asyncParam == 'function'){
				callback = asyncParam;
			}
			else
			{
				context = asyncParam;
			}	    
			var url = this.GetHandlerUrl();
			if (action){
				url = ajax.AddUrlParam(url, "action", action);
			}
			if (selector){
				url = ajax.AddUrlParam(url, "selector", selector);
			}		    
			var req = ajax.Request(url, data, callback);
			ajax.AddRequestParams(req, params);
			req.start();
			return req;
		};
		
		NodeJasp.Get = NodeJasp.get = function(selector, asyncParam) {
			return NodeJasp.JaspRequest('get', selector, null, asyncParam);
		};
		
		NodeJasp.Set = NodeJasp.set = function(selector, data, asyncParam) {
			return NodeJasp.JaspRequest('set', selector, data, asyncParam);
		};
		
		NodeJasp.Del = NodeJasp.del = function(selector, asyncParam) {
			return NodeJasp.JaspRequest('delete', selector, "", asyncParam);
		};
		
		NodeJasp.Add = NodeJasp.add = function(selector, data, asyncParam) {
			return NodeJasp.JaspRequest('add', selector, data, asyncParam);
		};
		
		NodeJasp.actionParam = "type";	
		
		NodeJasp.onAddElem = function(parent, elem){
			if (elem.is(".ajax-file")){
				elem.File = elem._get("@file");
				elem.Path = elem._get("@path");
				elem.Get = function (selector, callback, context){
					if (this.context){
						context = this.context;
					}
					return AjaxJasp.JaspRequest('get', this.File, selector, null, callback, context);
				};
				elem.Set = function (selector, data, callback, context){
					return AjaxJasp.JaspRequest('set', this.File, selector, data, callback, context);
				};
				elem.Add = function (selector, data, callback, context){
					if (this.context){
						context = this.context;
					}
					return AjaxJasp.JaspRequest('append', this.File, selector, data, callback, context);
				};
				elem.Ins = function (selector, data, callback, context){
					return AjaxJasp.JaspRequest('prepend', this.File, selector, data, callback, context);
				};
				elem.Acs = function (selector, data, callback, context){
					return AjaxJasp.JaspRequest('addClass', this.File, selector, data, callback, context);
				};
				elem.Rcs = function (selector, callback, context){
					return AjaxJasp.JaspRequest('delClass', this.File, selector, data, callback, context);
				};	
			}
			return true;
		};
		
		NodeJasp.BasePath = null;
		
	}
});