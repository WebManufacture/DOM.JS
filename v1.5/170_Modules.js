if (!UsingDOM("Modules")) {
	
	
	M = Modules;
	
	M.id = 'Modules_Container';
	
	M.url = "modules.js";
	
	M.info = L.Info;
	M.error = L.Error;
	
	M.Context = {};
	
	M.Init = function() {
		//WS.Body.appendChild(M);
		M.info("initialized", M.url);
		EV.CreateEvent("OnModuleRegistered", M, true);
		EV.CreateEvent("OnModuleLoad", M);
		EV.CreateEvent("OnModuleLoaded", M);
		EV.CreateEvent("OnModulesLoaded", M);
		if (window.DFC_ModulesLoaded != undefined) {
			EV.AddHandler("OnModulesLoaded", window.DFC_ModulesLoaded, "modules");
		}
		C.Add(M.WaitContext);
		C.Add(M.ParsingIncludeContext);
		C.Add(M.ParsingUrlScriptContext);
		C.Add(M.ParsingScriptContext);
		C.Add(M.ParsingLinkContext);
		C.Add(M.ParsingStyleContext);
		C.Add(M.DefferedScriptContext);
		M.SearchModules(WS.Body);
	};
	
	M.GetModuleStatus = function(url) {
		var mod = DOM.aget("url", url, ".module");
		if (mod == null) return "notfound";
		if (mod._is(".inprogress")) return "inprogress";
		if (mod._is(".processed")) return "processed";
		return "unknown";
	};
	
	
	ServicesUrl = M.ServicesUrl = "http://services.web-manufacture.net";
	SystemUrl = M.SystemUrl = "http://system.web-manufacture.net";
	ModulesUrl = M.ModulesUrl = "http://modules.web-manufacture.net";
	
	
	M.prepareUrl = function(url){
		if (!url) return null;
		url = url.toLowerCase();
		url = url.replace("%services%", M.ServicesUrl);
		url = url.replace("%system%", M.SystemUrl);
		url = url.replace("%modules%", M.ModulesUrl);
		return url;
	}
	
	M.GetModuleByUrl = function(url) {
		return M.aget("url", M.prepareUrl(url), ".module");
	};
	
	M.GetModuleContainsUrl = function(url) {
		return M._get(".module[url*='" + M.prepareUrl(url) + "']", ".module");
	};
	
	M.GetModuleEndsUrl = function(url) {
		return M._get(".module[url$='" + M.prepareUrl(url) + "']", ".module");
	};
	
	M.SubscribeTo = function(url, handler) {
		url = M.prepareUrl(url);
		var modl = M.GetModuleByUrl(url);
		if (!modl || modl._is(".inprogress")) {
			M.OnModuleRegistered.subscribe(handler);
			return false;
		}
		handler(url, modl);
	};
		
	M.WaitModule = function(url, callback){
		url = M.prepareUrl(url);
		if (M.GetModuleStatus(url) == "processed"){
			callback(url, M.GetModuleByUrl(url));
			return true;
		}
		M.OnModuleRegistered.subscribe(function(modUrl, module){
			callback(modUrl, module);
			return "del";
		}, url);
		return false;
	};
		
	M.CreateModule = function(url, state) {
		url = M.prepareUrl(url);
		var module = M._div(".module");
		module._add("." + state);
		url = url.toLowerCase();
		module.url = url;
		module._set("@url", module.url);
		module.isScript = url.ends(".js");
		var url = Request.ParseUrl(url);
		module.id = (url.file ? url.file : url.host).replace(/\./g, "_");
		return module;
	};
	
	
	M.SearchModules = function(elem) {
		var url = "Body";
		var nfo = DOM._get("module-info");
		if (nfo != null) {
			url = nfo.attr("url");
		} else {
			url = WS.Body.attr("url");
			if (url == null) {
				if (check(Request.File) && Request.File != "") {
					url = Request.File;
				} else {
					url = "Body";
				}
			}
		}
		url = url.toLowerCase();
		var module = M.CreateModule(url, "inprogress");
		
		/*var scripts = WS.Body._all("script.deffered");
for(var i = 0; i < scripts.length; i++){
WS.Header._add(scripts[i]);
}*/
		
		var includes = elem._all("script[url]");
		for (var i = 0; i < includes.length; i++) {
			if (includes[i].parentNode == elem)
				module._add(includes[i]);
		}
		var includes = elem._all("include");
		for (var i = 0; i < includes.length; i++) {
			includes[i]._add(".include");
			if (includes[i].parentNode == elem)
				module._add(includes[i]);
		}
		M.OnModuleRegistered.subscribe(M.BodyLoaded, url);
		M.ParseModule(module);
	};
	
	M.BodyLoaded = function(url, module) {
		//M.OnModuleRegistered.unsubscribe(M.BodyLoaded, url);
		M.info("finishing");
		C.Process(WS.Body, "ui-processing");
		M.OnModulesLoaded.fire(url, module);
		return "del";
	};
	
	M.ParseModule = function(module) {
		var result = true;
		try {
			if (module._is(".processed")) {
				M.info("parse", "reprocess", module.attr("url"));
				return true;
			}
			if (!module.id){
				module.id = "Module" + Math.round(Math.random()*100000000000);	
			}
			module.cls("inprogress");
			var type = module.attr("type");
			module.moduleType = type;
			/*if (module.childNodes.length == 1 && module.firstNode.tagName == 'DIV'){
				var fnode =  module.firstNode;
				if (fnode.id){
					module.id = fnode.id;
				}
			}*/
			C.Process(module, "module-parsing", " Parsing: " + module.url);
			result &= M.CheckModule(module, "Parsing " + module.url);
		} catch (e) {
			L.LogError(e, " Parsing: " + module.url, "modules module parsing");
		}
		return result;
	};
	
	M.LoadScriptInternal = function(ourl, module, cmod, cache) {
		var script = M.CreateScript(ourl, cache);
		script.cls("created");
		if (module != null) {
			module._add(script);
			script._set("@module-id", module.id);
		}
		else {
			M._add(script);
		}
		M.info("load-script", script.url, " from ", cmod);
		return script;
	};
	
	M.ScriptExists = function(ourl) {
		var cmod = "";
		if (ourl == undefined || ourl == null) return null;
		var selector = "script.loaded[src='1'], script.processed[src='1']";
		//проверка в оригинальном регистре
		var docScript = DOM._get(selector.replace(/1/g, ourl));
		if (docScript != null) {
			L.LogWarn("M.ScriptExists rescript: " + ourl + " FROM: " + cmod, M.url);
			return docScript;
		}
		//проверка в малом регистре
		var url = M.prepareUrl(ourl);
		var docScript = DOM._get(selector.replace(/1/g, url));
		if (docScript != null) {
			L.LogWarn("M.ScriptExists rescript: " + url + " FROM: " + cmod, M.url);
			return docScript;
		}
		//проверка в малом регистре на загружающиеся скрипты
		selector = "script.inprogress[src='1']";
		var docScript = DOM._get(selector.replace(/1/g, url));
		if (docScript != null) {
			L.LogWarn("M.ScriptExists inprogress: " + url + " FROM: " + cmod, M.url);
			return docScript;
		}
		return null;
	};
	
	M.CreateScript = function(ourl, cache) {
		var url = M.prepareUrl(ourl);
		var surl = url;
		if (window.AX && AX.CrossDomain) surl = AX.SystemRoot + url;		
		if (Request.Params.cache == "nocache") {
			cache = true;
		}
		if (cache) surl += '?rnd=' + Math.random();
		
		var scriptElement = document.createElement("script");
		scriptElement.attr("type", "text/javascript");
		scriptElement.attr("class", "module-script inprogress");
		scriptElement.attr("url", url);
		scriptElement.attr("src", surl);
		scriptElement.url = url;
		scriptElement.onload = M.scriptLoaded;
		scriptElement.onerror = function(){
			console.error("SCRIPT " + url + " loading error!");
			M.scriptLoaded.call(scriptElement);
		}
		/*M.waitScript(scriptElement, function(){
			M.scriptLoaded.call(scriptElement);
		});*/
		return scriptElement;
	};
	
	M.LoadScript = function(ourl, from, cache) {
		var url = M.prepareUrl(ourl);
		if (url.ends(".js")) {
			var scriptModule = M.ScriptExists(url);
			if (scriptModule) {
				return scriptModule;
			};
			scriptModule = M.CreateModule(ourl, "inprogress");
			var result = M.LoadScriptInternal(ourl, scriptModule, from, cache);
			return scriptModule;
		}
		return null;
	};
	
	
	M.scriptLoaded = function(event, code) {
		if (!this.is(".loaded")){
			this.rcs("inprogress");
			this.rcs("created");
			this.cls("loaded");
			this.cls("processed");
			if (!this.local) {
				//var item = globalStorage['system.web-manufacture.net'].setItem("module:" + this.url, code);
			}
			var modId = this._get("@module-id");
			if (modId){	
				var module = document.getElementById(modId);
			}
			else{
				var module = this._get("^.module");
			}
			M.info("script-load", this.url, " from ", module ? module.url : undefined);
			if (module) {
				M.CheckModule(module, "script: " + this.url);
			}
		};
	};
	
	M.waitScript = function(script, callback) {
		if (script.is(".loaded")) return;
		var txt = script.text;
		var event = script.event;
		if (txt){
			callback();
		}
		else{
			setTimeout(function(){
				M.waitScript(script, callback);
			},20);
		}
	};
	
	M.Load = function(ourl, from, cache) {
		var url = M.prepareUrl(ourl);
		if (url.ends(".js")) {
			return M.LoadScript(ourl, from, cache);
		}
		else {
			return M.LoadModule(ourl, null, from, cache);
		}
	};
	
	M.LoadModule = function(ourl, module, cmod, cache) {
		if (ourl == undefined || ourl == null) return;
		var url = M.prepareUrl(ourl);
		if (module == undefined || module == null) {
			module = M.GetModuleByUrl(url);
			if (module != null) {
				if (module._is(".inprogress")) {
					L.LogWarn("inprogress: " + url + " FROM: " + cmod, M.url);
				}
				if (module._is(".processed")) {
					L.LogWarn("reincluding: " + url + " FROM: " + cmod, M.url);
				}
				return module;
			}
			else {
				M.info("mod-create", ourl, " from ", cmod);
				module = M.CreateModule(url, "inprogress");
				module.cls("created");
			}
		}
		module.from = cmod;
		M.info("load-module", url, " from ", cmod);
		M.OnModuleLoad.fire(module.url.toLowerCase(), module);
		if (window.SysAjax){
			SysAjax.LoadModule(url, module, cache, M.moduleLoaded);
		}
		else{
			var rq = new XMLHttpRequest();
			rq.open("GET", url + "", true);
			rq.onload = function(){
				M.moduleLoaded.call(this, this.responseText);
			};
			rq.module = module;
			rq.send();	
		}
		return module;
	};
	
	
	M.moduleLoaded = function(result) {
		var module = this.module;
		try {
			module.rcs("created");
			module.cls("loaded");
			//var item = globalStorage['system.web-manufacture.net'].setItem("module:" + req.file, req.responseText);
			M.info("modul-load", module.url, " from ", module.from);
			var data = this.responseText;
			var exp = /(<script[^>]+)src=/ig;
			if (exp.test(data)) {
				L.LogWarn(M.id + ":" + " regexing : scripts injection from : " + module.url, M.url);
				data = data.replace(exp, "$1 url=");
			}
			var exp = /(<link[^>]+)href=/ig;
			if (exp.test(data)) {
				data = data.replace(exp, "$1 url=");
				L.LogWarn("style injection:  from: " + this.file, M.url);
			}
			/*if (data.contains("<module")){
var mod = DOM._div();
mod.html(data);
mod = mod._get("module");
if (mod != null){
module.attr("title", mod.attr("title")); 
data = mod.html();
}
}*/
			
			if (module.url.toLowerCase().endsWith(".css")) {
				module.html('<style type="text/css">' + data + "</style>");
			}
			else {
				module.html(data);
			}
			M.OnModuleLoaded.fire(module.url.toLowerCase(), module);
		}
		catch (e) {
			L.LogError(e, "System.Modules.js : moduleLoaded: " + module.url, "System.Modules.js");
		}
		M.ParseModule(module);
	};
	
	M.WaitContext = { Selector: "wait:not(.inprogress):not(.processed)", Condition: "module-parsing" };
	
	M.WaitContext.Process = function(element, context, module, from) {
		var url = element.attr("url");
		if (url != null) {
			if (element._is(".inprogress")) return false;
			url = M.prepareUrl(url);
			element.url = url;
			element.attr("url", url);
			if (M.GetModuleStatus(url) == "processed") {
				M.info("wait_accept", module.url, " for ", module.wait);
				element.cls("processed");
				return true;
			}
			else {
				module.wait = url;
				M.info("waiting", module.url, " for ", module.wait);
				M.OnModuleRegistered.subscribe(M.ProcessWait, url);
			}
			element.cls('inprogress');
			return false;
		}
		return true;
	};
	
	M.ProcessWait = function(url, module) {
		url = M.prepareUrl(url);
		if (!module) {
			module = M.GetModuleByUrl(url);
		}
		var waits = M._all("wait[url='" + url + "']");
		for (var i = waits.length - 1; i >= 0; i--) {
			var wait = waits[i];
			wait.rcs("inprogress");
			wait.cls("processed");
			module = waits[i]._get("^.module");
			if (module) {
				M.info("wait_end", module.url, " for ", module.wait);
				module.wait = null;
				M.ParseModule(module);
			}
			else {
				M.error("wait_end", url, " from wait ", wait.url);
			}
		}
		return "del";
	};
	
	
	M.ParsingUrlScriptContext = { Selector: "script:not(.inprogress):not(.processed)[url],script:not(.inprogress):not(.processed)[src]", Condition: "module-parsing" };
	
	M.ParsingUrlScriptContext.Process = M.ProcessUrlScript = function(script, context, module, from) {
		if (module.wait) return false;
		var url = script.attr("url");
		if (!url){
			url = script.attr("src");	
		}
		if (url != null) {
			if (script._is(".inprogress")) return false;
			script._del();
			var exists = M.ScriptExists(url);
			if (exists) return false;
			M.LoadScriptInternal(url, module, from);
		}
		return true;
	};
	
	
	M.ParsingScriptContext = { Selector: "script:not(.inprogress):not(.processed):not([url]):not(.deffered)", Condition: "module-parsing" };
	
	M.ParsingScriptContext.Process = M.ProcessScript = function(script, context, module, from) {
		if (module.wait) return false;
		if (script._is(".deffered")) return true;
		M.info("script-exec", module.url, " from ", from);
		try {
			var result = EvalInContext(script.innerHTML, module);
			if (!module.evaledScripts) module.evaledScripts = [];
			module.evaledScripts.push(script.innerHTML);
			if (!module.scriptResults) module.scriptResults = [];
			module.scriptResults.push(result);
		}
		catch (e) {
			e.fileName = module.url;
			L.LogError(e, module.url);
		}
		return true;
	};
	
	
	M.DefferedScriptContext = { Selector: "script.deffered:not(.inprogress):not(.processed)", Condition: "module-post-registered" };
	
	M.DefferedScriptContext.Process = M.ProcessDeffered = function(element, context, module, from) {
		if (module.wait) return false;
		M.info("Deffered", module.url, 'script', element.ToString());
		window.eval(element.innerHTML);
		element.cls("processed");
		return true;
	};
	
	
	M.ParsingLinkContext = { Selector: "link:not(.inprogress):not(.processed)[url]", Condition: "module-parsing" };
	
	M.ParsingLinkContext.Process = M.ProcessStyle = function(element, context, module, from) {
		if (module.wait) return false;
		if (element._is("link")) {
			var url = element.attr("url");
			if (url == null) return true;
			var lnk = DOM.aget("href", url, 'link');
			if (lnk == null) {
				element.attr("href", url);
				WS.Header._add(element);
			}
			else {
				element.cls("rescript");
				element.cls("processed");
			}
		}
		return true;
	};
	
	M.ParsingStyleContext = { Selector: "style:not(.inprogress):not(.processed)", Condition: "module-parsing" };
	
	M.ParsingStyleContext.Process = M.ProcessStyle = function(element, context, module, from) {
		if (module.wait) return false;
		element.cls(".processed");
		return true;
	};
	
	M.ParsingIncludeContext = { Selector: "include:not(.inprogress):not(.processed)", Condition: "module-parsing" };
	
	M.ParsingIncludeContext.Process = M.ProcessInclude = function(element, context, module, from) {
		if (module.wait) return false;
		element.url = element.attr("url");
		element.aurl = element.attr("alt");
		if (Check(element.aurl)) {
			var mod = M.GetModuleByUrl(element.aurl);
			if (mod != null) {
				L.LogWarn("alt-using: " + element.aurl + " not: " + element.url + " FROM: " + module.url, M.url);
				element.url = element.aurl;
				element.attr("url", element.url);
			}
		}
		var url = "body";
		if (Check(module)) {
			url = module.url;
		}
		var result = M.Load(element.url, module.url, null);
		element.url = M.prepareUrl(element.url);
		element.setAttribute("url", element.url);
		if (result && result._is(".inprogress")) {
			element.cls("inprogress");
			M.info("include-run", element.url, " from ", url);
		}
		else {
			element.cls("processed");
			M.info("include-stop", element.url, " from ", url);
		}
		return true;
	};
	
	
	M.CheckModule = function(module, from) {
		M.info("checking", module.url, " from ", from);
		if (module.wait) {
			M.info("waiting", module.url, " for ", module.wait);
			return false;
		}
		var inprogress = module._all(".inprogress");
		if (inprogress.length > 0) {
			M.info("decline", module.url, " count ", inprogress.length, " not checked ", inprogress[0].ToString());
			return false;
		}
		M.info("continue", module.url);
		M.ModuleRegistered(module.url, module);
		M.OnModuleRegistered.fire(module.url, module);
		return true;
	};
	
	M.ModuleRegistered = function(url, module) {
		url = M.prepareUrl(url);
		M.info("pre-register", url);
		module.rcs("inprogress");
		/*var checks = DOM._all("check.inprogress[url='" + url + "']");
for (var i = 0; i < checks.length; i++) {
checks[i].rcs("inprogress");
var mod = checks[i].findParent("module");
if (mod != null) {
M.CheckModule(mod, url);
}
}*/
		
		if (!module.isScript) C.Process(module, "module-pre-registered", " registering " + url);
		if (module.Init) {
			module.Init();
			
		}
		else {
			if (module.init) {
				module.init();
				
			}
		}
		
		if (!module.isScript) {
			C.Process(module, "ui-processing", module);
			if (false){
				var elems = module._all(">*:not(.processed):not(.ui-processed):not(.module-element):not(script):not(link):not(style):not(title):not(meta)");
				for (var i = elems.length - 1; i >= 0; i--) {
					var elem = WS.Body._add(elems[i]);
				}
			}
		}
		C.Process(module, "module-post-registered", "registering " + url);
		module.reload = M.Reload;
		module.cls("processed");
		C.Process(module, "module-registered", "registering " + url);
		M.info("registered", url);
		var includings = DOM._all("include.inprogress[url='" + url + "']");
		for (var i = 0; i < includings.length; i++) {
			var inc = includings[i];
			inc.rcs("inprogress");
			inc.cls("processed");
			var mod = inc._get("^.module");
			if (inc.attr("onreg") != null) {
				eval(inc.attr("onreg"));
			}
			if (mod) {
				M.CheckModule(mod, url);
			}
		}
		var parent = module._get("^.module.inprogress");
		if (parent) {
			M.CheckModule(parent, url);
		}
	};
	
	M.Reload = function(random) {
		var url = this.attr('url');
		this._del();
		M.LoadModule(url, null, 'reload', random);
	};
	
	M.ReloadLinks = function() {
		var links = [];
		DOM.all("link").each(function(lnk){
			var cln = lnk.clone();
			cln.attr("href", cln.attr("href").contains("?") ? cln.attr("href") + "&rnd=" + Math.random() : cln.attr("href") + "?rnd=" + Math.random());
			links.push(cln);
			lnk.del();
		});
		for (var i = 0; i < links.length; i++){
			document.head.appendChild(links[i]);
		}
	};
	
	M.ReloadScripts = function() {
		var links = [];
		DOM.all("script.reloadable").each(function(lnk){
			var cln = lnk.clone();
			cln.attr("src", cln.attr("src").contains("?") ? cln.attr("src") + "&rnd=" + Math.random() : cln.attr("src") + "?rnd=" + Math.random());
			links.push(cln);
			lnk.del();
		});
		
		for (var i = 0; i < links.length; i++){
			document.head.appendChild(links[i]);
		}
	};
	
	WS.DOMload(M.Init);
	
}
else {
	L.LogError("Reinitilizing M (Modules)!");
}
