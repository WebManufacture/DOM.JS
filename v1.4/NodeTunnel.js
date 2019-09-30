function NodeTunnel(serverUrl){
	if (!serverUrl){
		this.ServerUrl = null; //Url.Resolve(window.location.protocol + "//" + window.location.host);
	}
	else{
		this.ServerUrl = new Url(serverUrl, true);
		this.crossDomain = this.ServerUrl.hostname != window.location.hostname;	
	}
	return this;	
}

NodeTunnel.prototype = {
	_endRequest : function(){		
		if (this.callback){
			if (typeof(this.callback) == "function"){
				this.callback(this.responseText, this.status);
				return;
			}
			if (this.callback.add){
				if (DOM){
					this.callback.add(DOM.Wrap(this.responseText));
				}
				else{
					this.callback.add(this.responseText);
				}
				return;
			}
			delete this.callback;
		}
	},
	
	
	_errorRequest : function(){		
		if (this.callback){
			if (typeof(this.callback) == "function"){
				this.callback(this.responseText, this.status);
				return;
			}
		}
	},
	
	_getRequest : function(method, url, callback){
		var rq = new XMLHttpRequest();
		if (this.ServerUrl){
			if (typeof url == "string"){
				url = new Url(url);
			}
			url.rebase(this.ServerUrl);
			url = url.toString();
		}
		rq.open(method, url + "", true);
		rq.callback = callback;
		rq.onload = this._endRequest;
		rq.onerror = this._errorRequest;
		return rq;
	},
	
	_sendRequest : function(method, url, data, callback){
		var rq = this._getRequest(method, url, callback);
		rq.send(data);
		return rq;
	},
	
	
	get : function(url, callback){
		return this._sendRequest("GET", url, null, callback);
	},
	
	all : function(url, callback){
		var rq = this._getRequest("SEARCH", url, callback);
		//rq.setRequestHeader("content-type", "application/json");
		//rq.setRequestHeader("content-type", "text/plain");
		rq.send();
		return rq;
	},
	
	add : function(url, text, contentType, callback){
		var rq = this._getRequest("POST", url, callback);
		if (!contentType){
			contentType = "text/plain";
		}
		rq.setRequestHeader("content-type", contentType);
		rq.send(text);
		return rq;
	},
	
	set : function(url, text, contentType, callback){
		var rq = this._getRequest("PUT", url, callback);
		if (!contentType){
			contentType = "text/plain";
		}
		rq.setRequestHeader("content-type", contentType);
		rq.send(text);
		return rq;
	},
	
	del : function(url, callback){
		return this._sendRequest("DELETE", url, null, callback);
	},
		
	run : function(url, callback){
		url = Url.Resolve(url, {action:"start"});
		return this._sendRequest("MKACTIVITY", url, null, callback);
	},
	
	reset : function(url, callback){
		url = Url.Resolve(url, {action:"reset"});
		return this._sendRequest("MKACTIVITY", url, null, callback);
	},
	
	stop : function(url, callback){
		url = Url.Resolve(url, {action:"stop"});
		return this._sendRequest("MKACTIVITY", url, null, callback);
	},
	
	
	status : function(url, callback){
		url = Url.Resolve(url, {action:"status"});
		return this._sendRequest("MKACTIVITY", url, null, callback);
	},
}