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
        var url = "/" + file;
        var paramsString = "";
        for (var param in params) {
            paramsString += "&" + param + "=" + params[param];
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
            Request.Params[partName] = partValue;
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
