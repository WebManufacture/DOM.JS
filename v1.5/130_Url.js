Request = {
	Params: {},
	
	CreateUrl: function(file, param0, param1, param2, param3, param4, param5, param6) {
		var url = "http://" + Request.Host + "/" + file;
		if (param0 != undefined && param0 != null) {
			url += "?" + param0;
		}
		if (param1 != undefined && param1 != null) {
			url += "&" + param1;
		}
		if (param2 != undefined && param2 != null) {
			url += "&" + param2;
		}
		if (param3 != undefined && param3 != null) {
			url += "&" + param3;
		}
		if (param4 != undefined && param4 != null) {
			url += "&" + param4;
		}
		if (param5 != undefined && param5 != null) {
			url += "&" + param5;
		}
		if (param6 != undefined && param6 != null) {
			url += "&" + param6;
		}
		return url;
	},  
	
	GetParam: function (paramName) {
		var param = Request.Params[paramName];
		if (param == undefined) return null;
		return param;
	},
	
	GetUrl: function (file, params) {
		var url = file;
		if (!file.start("/")){
			if (!file.start("http://") && !file.start("https://")){
				if (file.contains("/")){
					url = "http://" + file;
				}
				else{
					url = "/" + file;
				}
			}
		}
		var paramsString = "";
		for (var param in params) {
			paramsString += "&" + param + "=" + encodeURIComponent(params[param]);
		}
		if (paramsString.length > 0) {
			paramsString = "?" + paramsString.substr(1); ;
		}
		return url + paramsString;
	},
	
	ParseRequest: function () {
		var parts = window.location.search.split("&");
		for (var i = 0; i < parts.length; i++) {
			var parameters = parts[i].split("=");
			var partName = parameters[0];
			partName = partName.replace('?', '');
			var partValue = parameters[1];
			Request.Params[partName] = decodeURIComponent(partValue);
		}
		Request.Host = window.location.host;
		Request.File = window.location.pathname.replace("/", "");
	},
	
	Redirect: function (file, params) {
		window.location = Request.GetUrl(file, params);
	},
	
	ParseUrl: function(url) {
		var rq = {};
		if (url.start("http://")){
			url = url.substr(7);
		}
		var slash = url.indexOf("/");
		if (slash < 0){
			rq.host = url;
			return rq;
		}
		rq.host = url.substr(0, slash);
		url = url.substr(slash + 1);
		var par = url.indexOf("?");
		if (par < 0){
			rq.file = url;
			return rq;
		}
		rq.params = {};
		rq.file = url.substr(0, par);
		url = url.substr(par + 1);
		var parts = url.split("&");
		for (var i = 0; i < parts.length; i++) {
			var parameters = parts[i].split("=");
			var partName = parameters[0];
			var partValue = parameters[1];
			rq.params[partName] = partValue;
		}
		return rq;
	}
};

Request.ParseRequest();

Url = function(href, baseOnly){
	//this.toString = Url.ToString;
	if (href) {
		Url.Parse(href, this, baseOnly);
	}
	else{
		Url.Parse(window.location.href, this, false);
	}
};

Url.getLocation = function(href) {
    var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && {
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
    }
}

Url.Parse = Url.parse = function(href, urlObject, baseOnly){
	if (!urlObject) urlObject = new Url();
	if (!href.contains("://")){
		if (href.start("/")){
			if (window.location.pathname.ends("/")){
				href = href.replace("/", "");
			}
			href = window.location.pathname + href;
		}
		if (href.start("./")){
			href = href.replace(".", "");
			href = window.location.origin + href;
		}
		if (href.start("../")){
			href = href.replace("..", "");
			href = window.location.origin + href;
		}
	}	
	var a = document.createElement("a");	
	a.href = urlObject.href = href;
	urlObject.href = a.href;
	urlObject.protocol = a.protocol;
	urlObject.host = a.host;
	urlObject.hostname = a.hostname;
	urlObject.port = a.port;
	if (baseOnly){
		urlObject.pathname = "";
		urlObject.search = "";
		urlObject.hash = "";
	}
	else{
		urlObject.pathname = a.pathname;
		urlObject.search = a.search;
		urlObject.hash = a.hash;
		urlObject.fill();
	}
	return urlObject;
};

Url.Resolve = function(relative, params){
	var url = new Url(relative);
	url.params = {};
	if (typeof(params) == "object"){
		url.params = params;		
	}
	if (typeof(params) == "string"){
		if (params.start("?")) params = params.substr(1);
		params = params.split("&");
		for (var i = 0; i < params.length; i ++){
			if (params[i] && params[i].length > 0){
				var param = params[i].split("=");
				var value = param[1];
				if (value){
					value = decodeURIComponent(value);
				}
				url.params[param[0]] = value;
			}
		}
	}
	for (var param in url.params) {
		url.search += "&" + param + "=" + encodeURIComponent(url.params[param]);
	}
	if (url.search.length > 0 && !url.search.start("?")) {
		url.search = url.search.replace("&", "?");
	}
	return url;
};

Url.prototype = {
	getBase : function(){
		var url = this.protocol + "//" + this.hostname;
		if (this.port && this.port != ""){
			url += ":" + this.port;	
		}
		return url;
	},
	
	toString : function(){
		var url = this.protocol + "//" + this.hostname;
		if (this.port && this.port != ""){
			url += ":" + this.port;	
		}
		url += this.pathname + this.search + this.hash;	
		return url;
	},
	
	fill : function(){
		this.path = this.pathname.split("/");
		this.path.shift();
		if (this.path.length == 1 && this.path[0] == ""){
			this.path = null;
		}
		if (this.path){
			this.file = this.path[this.path.length - 1];
		}
		this.params = {};
		var params = this.search.replace("?", "").split("&");
		for (var i = 0; i < params.length; i ++){
			if (params[i] && params[i].length > 0){
				var param = params[i].split("=");
				var value = param[1];
				if (value){
					value = decodeURIComponent(value);
				}
				this.params[param[0]] = value;
			}
		}	
	},
	
	resolve : function(relative){
		if (!relative.contains("://")){
			if (this.pathname.ends("/")){
				if (relative.start("/")){
					relative = relative.replace("/", "");
				}
			}
			else{
				if (relative.start("/")){
					relative = this.pathname + relative;
				}
				else{
					if (!relative.start(".")){
						relative = this.pathname + "/" + relative;
					}
				}
			}
		}		
		this.repath(relative);
		return this;
	},
	
	rebase : function(url){
		if (typeof(url) == "string"){
			url = new Url(url);	
		}
		this.host = url.host;
		this.hostname = url.hostname;
		this.protocol = url.protocol;
		this.port = url.port;
		return this;
	},
	
	repath : function(url){
		if (typeof(url) == "string"){
			url = new Url(url);	
		}
		this.pathname = url.pathname;
		this.search = url.search;
		this.hash = url.hash;
		this.fill();
		return this;
	},
	
	addParam : function(name, value){
		if (typeof (name) == "object"){
			
		}
		if (value){
			var param = name + "=" + encodeURIComponent(value);
		}
		else{
			var param = name;
		}
		if (this.search.length > 0) {
			param = "&" + param;
		}
		else{
			param = "?" + param;
		}
		this.search += param;
		this.fill();
		return this;
	},
};
