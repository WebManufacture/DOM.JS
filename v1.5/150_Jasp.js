if (!UsingDOM("Contexts")) {

	C = Contexts;

	C.id = "Jasp_Contexts";

	C.url = "jasp.js";

	if (L){
		C.info = L.Info;
		C.error = L.Error;
	}
	else{
		C.info = C.error = function(message){
			console.log(message);
		};
	}

	C.ContextsCounter = 1;

	C.Add = C.add = function() {
		var obj = arguments[0];
		if (obj && (obj) instanceof Object && !((obj) instanceof HTMLElement)) {
			obj[".context"] = null;
			if (obj.ContextId) {
				if (!obj.id) {
					obj.id = obj.ContextId;
				}
			}
			else {
				if (obj.id) {
					obj.ContextId = obj.id;
				}
				else {
					obj.ContextId = C.ContextsCounter;
					obj.id = 'context' + C.ContextsCounter;
					C.ContextsCounter++;
				}
			}
			if (obj.Condition) {
				obj["." + obj.Condition] = null;
			}
			L.LogObject(obj);
		}
		return this._add(arguments);
	};

	C.AddContext = function(processor, context, selector, type, priority) {
		var obj = { "context": context,
				   "for": selector,
				   "processor": processor,
				   "priority": priority,
				   "type": type
				  };
		var cnt = C.add(obj);
		cnt.context = context;
		return cnt;
	};

	C.Process = function(element, condition, param1) {
		//C.info("proc-start", condition, " in " + element.ToString());
		founded = 0;
		if (condition) {
			var contexts = C._all(".context." + condition);
			for (var c = 0; c < contexts.length; c++) {
				var context = contexts[c];
				if (this.ProcessContext(element, context, param1)) {
					founded++;
				};
			}
		}
		//C.info("proc-end", condition, founded, " in " + element.ToString());
	};

	C.ProcessContext = function(element, context, param1) {
		var url = element._get("@url");
		if (context.OnlyChilds != undefined && context.OnlyChilds) {
			var tags = element.childs(context.Selector);
		}
		else {
			var tags = element._all(context.Selector);
		}
		var found = 0;
		var processed = 0;
		for (var i = 0; i < tags.length; i++) {
			var elem = tags[i];
			if (elem._is(".jasp-processed-" + context.ContextId)) {
				L.LogWarn("Context " + context.ContextId + "(" + context.Selector + ") already processed on " + elem.ToString(), "Jasp.js");
			}
			found++;
			C.info("proc-found", elem.ToString());
			if (elem._is(".jasp-processing-" + context.ContextId)) {
				L.LogWarn("Context " + context.ContextId + "(" + context.Selector + ") in progress on " + elem.ToString(), "Jasp.js");
				continue;
			}
			var result = context.Process(elem, context, element, param1);
			if (result) {
				processed++;
				if (!elem.processedContexts) elem.processedContexts = " ";
				elem.processedContexts += context.ContextId + " ";
				elem.cls("jasp-processed-" + context.ContextId);
			}
			else {
				if (result != null) {
					processed++;
					elem.cls("jasp-processing-" + context.ContextId);
				}
			}
		}
		return processed;
	};

	function GetNodesBySelector(selector) {
		if (selector.start("this")) {
			selector = selector.replace("this", "");
			selector = selector.trim();
			var result = this._all(selector);
		}
		else {
			var result = DOM._all(selector);
		}
		return result;
	};

	HTMLElement.prototype["GetNodesBySelector"] = GetNodesBySelector;

	L.LogInfo("Contexts created!");
}
else {
	L.LogError("Reinitilizing Contexts!");
}

if (!using("Jasp")) {
	J = Jasp = { IsOlmObject: true };

	J.id = "JPR";

	J.url = "jasp.js";

	J.info = L.Info;

	J.ContextContext = { Selector: "context", Condition: "module-parsing" };
	J.ContextContext.Selector = "context";
	J.ContextContext.Process = function(element) {
		var context = {};
		context.Selector = element.attr("selector");
		context.Condition = element.attr("condition");
		context.OnlyChilds = element.attr("onlychilds");
		context.element = element;
		context.code = element.innerHTML;
		context.module = element._get("^.module");
		context.Process = J.ProcessContext;
		C.Add(context);
		element._add(".processed");
		return true;
		//Contexts.ProcessContext(W.Body, context);
	}

	C.Add(J.ContextContext);

	J.ProcessContext = function(element, context, processingElem, param1) {
		var Processor = {};
		Processor.Element = element;
		Processor.Context = context;
		Processor.ProcessingElement = processingElem;
		Processor.Param = param1;
		Processor.ContextElement = context.element;
		try {
			with (Processor) {
				eval(context.code);
			}
		}
		catch (e) {
			var url = context.Selector;
			if (Check(context.module)) {
				url += " : " + context.module.url;
			}
			L.LogError(e, "ProcessingContext : " + url, "System.Jasp.js");
		}
	};

	J.LoadingContext = { Condition: "ui-processing" };
	J.LoadingContext.Selector = ".content[url]:not(.loaded)";
	J.LoadingContext.Process = function(element) {
		var url = element.url = element.attr("url");
		AX.Get(url, J.ProcessLoadedContent, { context: element });
		return false;
	}
	C.Add(J.LoadingContext);

	J.ProcessLoadedContent = function(result, context) {
		context._add(result);		
		M.ParseModule(context);
		//C.Process(context, 'ui-processing');
		/*
var scripts = context.findAll("script:not(.loaded)");
if (check(window.M) && M.IsOlmObject){
for(var i = 0; i < scripts.length; i++){
M.ProcessScript(scripts[i], context)
}
}
else{
for(var i = 0; i < scripts.length; i++){
window.eval(scripts[i].innerHTML);
}   
}
*/
		var load = context.attr("onload");
		try{
			if (Check(load)) {
				window.eval(load);
			}
		}
		catch (ex){
			console.log(ex);
		}
		J.EndProcess(context, J.LoadingContext);
		return false;
	};

	J.ProcessLoadedContent = function(result, context) {
		context._add(result);		
		M.ParseModule(context);
		//C.Process(context, 'ui-processing');
		/*
var scripts = context.findAll("script:not(.loaded)");
if (check(window.M) && M.IsOlmObject){
for(var i = 0; i < scripts.length; i++){
M.ProcessScript(scripts[i], context)
}
}
else{
for(var i = 0; i < scripts.length; i++){
window.eval(scripts[i].innerHTML);
}   
}
*/
		var load = context.attr("onload");
		try{
			if (Check(load)) {
				window.eval(load);
			}
		}
		catch (ex){
			console.log(ex);
		}
		J.EndProcess(context, J.LoadingContext);
		return false;
	};

	J.JSONContext = { Condition: "ui-processing" };
	J.JSONContext.Selector = ".json-content[url]:not(.loaded)";
	J.JSONContext.ContextId = "JsonDataLoadingContext";
	J.JSONContext.Process = function(element) {
		if (element.is(".jasp-processing-" + J.JSONContext.ContextId)) return false;
		if (element.is(".jasp-processed-" + J.JSONContext.ContextId)) return false;
		var url = element.url = element.attr("url");
		if (element.textContent.trim().length > 0){
			var tc = element.textContent;
			element.textContent = "";
			J.ProcessJSONContext(tc, element);
			return true;
		}
		else{
			if (window.Net){
				if (element.is(".partial-loading")){
					var req = Net.get(url);
					req.lastStateChar = 0;
					req.onreadystatechange = function(){
						if (this.readyState == 3) {
							var result = this.responseText;
							if (result && result.length > 0 && result.length - 1 > this.lastStateChar && this.status == 200) {
								var end = result.lastIndexOf(",\n");
								result = result.substring(this.lastStateChar, end);
								this.lastStateChar = end + 1;
								result = result.split(",\n");
								for (var i = 0; i < result.length; i++) {
									var obj = result[i];
									if (obj.length > 2) {
										J.ProcessPartialJSONContext(obj, element);
									}
								} 
							}
						}
						if (this.readyState == 4) {
							J.ProcessJSONContextComplete(result, element);
						}

					}

					req.send();
				}
				else{
					var req = Net.get(url, function(result){J.ProcessJSONContext(result, element)});
				}
			}
			else{
				AX.Get(url, J.ProcessJSONContext, { context: element });
			}
		}
		return false;
	};

	C.Add(J.JSONContext);

	J.ProcessPartialJSONContext = function(result, context) {
		var idpref = context.get("@id-prefix");
		if (!idpref) idpref = "";
		try{
			var json = JSON.parse(result);
		}
		catch (err){
			console.log("Error parsing json in " + context.url);
			console.error(err);
			json = null;
		}
		if (json){
			var idobj = "";
			if (json.id){
				idobj = idpref + json.id;
			}
			if (json._id && !json.id){
				idobj = idpref + json._id;
			}
			var elem = context._add(J.JsonToDivObject(json, idobj));
			var onitem = context.get("@onitem");
			var cnt = { data: json, element: elem };
			try {
				with (cnt) {
					eval(onitem);
				}
			} catch (e) {
				console.error(e);
			}
		}
	};

	J.ProcessJSONContextComplete = function(result, context) {
		context.add(".loaded");
		J.EndProcess(context, J.JSONContext);
		return false;
	};

	J.ProcessJSONContext = function(result, context) {
		var idpref = context.get("@id-prefix");
		if (!idpref) idpref = "";
		try{
			var json = JSON.parse(result.replace(/\n/g, " "));
		}
		catch (err){
			console.log("Error parsing json in " + context.url);
			console.error(err);
			json = null;
		}
		if (json){
			if (json.length){
				json.each(function(obj){
					var id = "";
					if (obj.id){
						id = idpref + obj.id;
					}
					if (obj._id && !obj.id){
						id = idpref + obj._id;
					}
					var elem = context._add(J.JsonToDivObject(obj, id));
					var onitem = context.get("@onitem");
					var cnt = { data: obj, element: elem };
					try {
						with (cnt) {
							eval(onitem);
						}
					} catch (e) {
						console.error(e);
					}
				});
			}
			else{
				var idobj = "";
				if (json.id){
					idobj = idpref + json.id;
				}
				if (json._id && !json.id){
					idobj = idpref + json._id;
				}
				var elem = context._add(J.JsonToDivObject(json, idobj));
				var onitem = context.get("@onitem");
				var cnt = { data: json, element: elem };
				try {
					with (cnt) {
						eval(onitem);
					}
				} catch (e) {
					console.error(e);
				}
			}

			context.add(".loaded");
		}
		else{

			context.add(".error");	
		}
		J.EndProcess(context, J.JSONContext);
		return false;
	};

	J.JsonToDivObject = function(obj, id){
		var div = DOM.div(".json-object");
		if (id){
			div.set("@id", id);
		}
		for (var fld in obj){
			var value = obj[fld];
			if (typeof(value) == "object"){
				var field = div.add(J.JsonToDivObject(value));
			}
			else{
				if (fld.start("_")){
					div.set("@" + fld, obj[fld]);
					continue;
				}				
				else{
					var field = div.div(".json-field");
					field.textContent = obj[fld] + "";
				}
			}
			field.set("@field", fld);
		}
		return div;
	};

	J.EndProcess = function(element, context) {
		J.info("jasp-end", element.ToString(), context.id);
		element.rcs("jasp-processing-" + context.ContextId);
		element.cls("jasp-processed-" + context.ContextId);
	};

	J.IdToWinContext = { Condition: "ui-processing" };
	J.IdToWinContext.Selector = "div[id]";
	J.IdToWinContext.Process = function(element) {
		if (!window[element.id]){
			window[element.id] = element;
		}
	};
	C.Add(J.IdToWinContext);

	J.MapByIdContext = { Condition: "ui-processing", Selector: "[mapById]" };
	J.MapByIdContext.Process = function(element) {
		var mbId = element.get("@mapById");
		if (element.id){
			var mappingElem = element.get(mbId);
			if (mappingElem){
				mappingElem[element.id] = element;
			}
		}
	};
	C.Add(J.MapByIdContext);

	J.ExtendsContext = { Condition: "ui-processing.ui-clone" };
	J.ExtendsContext.Selector = "[extend]";
	J.ExtendsContext.Process = function(element) {
		var extendObject = element.get("@extend");
		if (!extendObject || extendObject == "") return;
		var objects = extendObject.split(".");
		extendObject = window;
		for (var i = 0; i < objects.length; i++){
			extendObject = extendObject[objects[i]];
			if (!extendObject){
				extendObject = null;
				return;
			}
		}
		Extend(element, extendObject);
		if (extendObject.initObject){
			extendObject.initObject.call(element);
		}
	};
	C.Add(J.ExtendsContext);

	J.Commands = ['+', '<', '-', '=', '!'];

	J.ProcessJaspContext = function(element) {
		element.code = J.Compile(element.html());
		element.attr("code", element.code);
		element.cls("compiled");
		//Contexts.ProcessContext(W.Body, context);
	};

	J.JaspContext = { Condition: "module-jasp" };
	J.JaspContext.Selector = "jasp:not(.compiled)";
	J.JaspContext.Process = J.ProcessJaspContext;
	C.Add(J.JaspContext);

	J.Macros = AArray();

	J.Convert = function(obj){
		var id = null;
		var type = "";
		var tags = "";
		var classes = null;
		var props = {};
		var childs = null;
		var next = null;
		var follow = null;
		for (var item in obj){
			if (typeof obj[item] != "function"){
				switch (item.toLowerCase()){
					case "id": id = obj[item]; break;
					case "type": type = obj[item]; break;
					case "tags": tags = obj[item]; break;
					case "classes": classes = obj[item]; break;
					case "childs": childs = obj[item]; break;//changed from "_childs" to "childs"
					case "next": next = obj[item]; break;				
					case "follow": follow = obj[item]; break;
					default : props[item] = obj[item]; break;
				}
			}
		}
		if (!classes && tags){
			classes = tags.split(" ");
		}
		if (!next && childs) next = [];
		if (next) next.join(childs);
		var selector = type + (id ? "#" + id : "");
		for (var i = 0; i < classes.length; i++){
			selector += "." + classes[i];
		}
		tags = tags.trim().split(" ");
		for (var i = 0; i < tags.length; i++){
			if (!selector.contains("." + tags[i])){
				selector += "." + tags[i];
			}
		};
		for (var item in props){
			selector += '@' + item + '=' + props[item];	
		}
		if (childs || next || follow){
			if (childs.length > 0){
				if (childs.length > 1){
					selector += "/(";
					for (var i = 0; i < childs.length; i++){
						selector += J.Convert(childs[i]);
						if (i < childs.length - 1)  selector += ",";
					}
					selector += ")";
				}
				else{
					selector += "/" + J.Convert(childs[0]);
				}
			}
			if (next.length > 0){
				if (childs.length > 1){
					selector += "/(";
					for (var i = 0; i < next.length; i++){
						selector += J.Convert(next[i]);
						if (i < next.length - 1)  selector += ",";
					}
					selector += ")";
				}
				else{
					selector += "/" + J.Convert(next[0]);
				}
			}
			if (follow.length > 0){
				if (childs.length > 1){
					selector += " (";
					for (var i = 0; i < follow.length; i++){
						selector += J.Convert(follow[i]);
						if (i < follow.length - 1)  selector += ",";
					}
					selector += ")";
				}
				else{
					selector += "/" + J.Convert(follow[0]);
				}
			}
		}
		return selector;
	};

	J.Compile = function(code) {
		var compiledCode = "";
		var lines = code.split('\n');
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			var index = -1;
			for (var c = 0; c < J.Commands.length; c++) {
				var ind = line.indexOf(J.Commands[c]);
				if (ind >= 0 && (ind < index || index < 0)) {
					index = ind;
					var command = J.Commands[c];
				}
			}
			if (index >= 0) {
				var left = line.substring(0, index);
				var right = J.Compile(line.substring(index + 1));
				if (left.length > 0) {
					if (left.search(/^\s*[.#]/) >= 0) {
						compiledCode += "var elem = W.findAll('" + left + "');";
						switch (command) {
							case "<":
								compiledCode += "elem.html(" + right + ");";
								break;
							case "+":
								compiledCode += "elem._add(" + right + ");";
								break;
						}
						continue;
					}
					if (line.search(/^\s*[!]/) >= 0) {

						switch (command) {
							case "<":
								compiledCode += "window." + left.raplace('!', "").trim() + "(" + right + ");";
								break;
							case "+":
								compiledCode += "J.CallParams._add(" + right + ");";
								break;
						}
						continue;
					}

					if (command == "=") {
						compiledCode += "J.Macros._add(" + left.replace('!', '') + ");";
						continue;
					}
					switch (command) {
						case "<":
							compiledCode += left + "=" + right + ";";
							break;
						case "+":
							compiledCode += left.trim() + "._add(" + right + ");";
							break;
					}
				}
			}
			else {
				if (line.search(/^\s*[!]/) >= 0) {
					compiledCode += "window." + left + "(J.CallParams); J.CallParams.clear();";
				}
				if (left.search(/^\s*[.#]/) >= 0) {
					compiledCode += "W.findAll('" + left + "')";
				}
			}
		}
		return compiledCode;
	}

	L.LogInfo("JASP Contexts registered!");
}
else {
	L.LogError("Reinitilizing JASP!");
}
