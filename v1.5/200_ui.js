if (!UsingDOM("Ui")){
	
	ui.id =  "UI";
	ui.url =  "ui.js";
	
	ui.info = L.Info;
	ui.error = L.Error;
	
	ui.Init = function(){
		Ev.CreateEvent("OnActionEvent", ui);
		ui.info("UI Initializing");
		C.Process(WS.Body, "ui-processing");
	};
	
	ui.ComponentContext = { Condition: "ui-processing" };
	ui.ComponentContext.id = "uicomponents";
	ui.ComponentContext.Selector = ".component[component-url]:not(.jasp-processed-uicomponents)";
	ui.ComponentContext.Process = function(element){
		var url = element.componentUrl = element.attr("component-url");
		var wait = element.wait = element.attr("wait");
		url = url.toLowerCase();
		element.set("@component-url", url);
		Ev.CreateEvent("OnComponentInitialized", element);
		var module = M.GetModuleByUrl(url);
		if (module) {	    
			if (module.initComponent){
				module.initComponent.apply(this, arguments);
				element.OnComponentInitialized.fire();
			}
		}
		else{
			M.OnModuleRegistered.subscribe(ui.ModuleInitialized, url);
			element.module = M.Load(url, "component " + element.ToString());
			return false;
		}
		return true;
	};
	
	C.Add(ui.ComponentContext);
	
	ui.ModuleInitialized = function(url, module){
		//M.OnModuleRegistered.unsubscribe(ui.ModuleInitialized, url);
		J.info("jasp-init", url);
		WS.Body.all(".component[component-url='" + url + "'].jasp-processing-uicomponents").del(".jasp-processing-uicomponents");
		if (module.initComponent){
			var context = { Condition: "ui-processing" };
			context.Selector = "";
			context.Process = function(element, context, param){
				module.initComponent.apply(this, arguments);
				element.OnComponentInitialized.fire();
			}
				context = C.Add(context);
			context.Selector = ".component[component-url='" + url + "']:not(.jasp-processed-" + context.id + ")";
			C.ProcessContext(WS.Body, context);
		}
		return "del";
	};
	
	//<div class='action' on=":click" atype="class-toggle" for="#Item22" set=".invisible.showed">
	
	ui.UIActionContext = { Condition: "ui-processing" };
	ui.UIActionContext.id = "uiaction";
	ui.UIActionContext.Selector = ".ui-action:not(.jasp-processed-uiaction)";
	ui.UIActionContext.Process = function(element){
		var asel = element.uiActionSelector = element.attr("for");
		var atype = element.uiActionType = element.attr("atype");
		if (!atype){
			atype = element.uiActionType = element.attr("action-type");	
		}	
		if (!atype) {
			ui.Error("Element " + element.ToString() + " has no action-type or atype attribute!");
			return true;
		}
		var aevent = element.uiActionEvent = element.attr("on");
		if (!aevent){
			aevent = element.uiActionEvent = ":click";
		}	
		
		var handler = ui.UIActionHandlers[atype];
		if (handler){
			element.uiActionHandler = function(){
				ui.info("UI Action: " + element.uiActionType + ":" + element.uiActionEvent + " -> " + element.uiActionSelector);
				window.setTimeout(function(){
					try{
						handler(element, element.uiActionType, element.uiActionSelector, element.uiActionEvent)
					}
					catch(err){
						console.log(err);	
					}
				}, 100);
			};
		}
		else{
			ui.Error("Element " + element.ToString() + " has unknown event type: " + atype);
			return true;
		}
		
		if (aevent.start(":")){
			aevent = ui.ElementEvents[aevent];
			if (aevent){
				element[aevent] = element.uiActionHandler;
			}
			else{
				ui.Error("Element " + element.ToString() + " has unknown event emitter: " + aevent);
			}
		}	
		else{
			ui.OnActionEvent.subscribe(ui.UIActionRecurseHandler, aevent);			
			ui.info("Subscribe on " + aevent + " action " + aname + ":" + atype + " for " + asel);
		}		
		return true;
	};
	
	
	C.Add(ui.UIActionContext);
	
	ui.UIActionRecurseHandler = function(ename, elem) {
		ui.info("Recurse event emitted: " + ename);
		if (elem){
			elem.uiActionHandler();
		}		
	};
	
	ui.UIActionHandlers = {
		"event" : function(elem, atype, asel, aevent){
			ui.OnActionEvent.fire(asel, elem)
		},
		
		
		"class-toggle" : function(elem, atype, asel, aevent){
			var aname = elem.attr("set");
			if (aname){
				var target = DOM._all(asel);
				target.each(function(elem){
					if (this._is(aname)){
						this._del(aname);
					}
					else{
						this._add(aname)	
					}
				});
			}
		},
		
		"show" : function(elem, atype, asel, aevent){
			var target = DOM._all(asel);
			target.each(function(elem){
				this.show();
			});
		},
		
		"hide" : function(elem, atype, asel, aevent){
			var target = DOM._all(asel);
			target.each(function(elem){
				this.hide();
			});
		},		
		
		
		"visibility-toggle" : function(elem, atype, asel, aevent){
			var target = DOM._all(asel);
			target.each(function(elem){
				if (this._is(".invisible")){
					this.show();
				}
				else{
					this.hide()	
				}
			});
		},
		
		"ins" : function(elem, atype, asel, aevent){
			var aname = elem.attr("set");
			if (aname){
				var target = DOM._all(asel);
				target._ins(aname);
			}
		},
		
		"set" : function(elem, atype, asel, aevent){
			var aname = elem.attr("set");
			if (aname){
				var value = null;
				var target = DOM._all(asel);
				if (aname.contains("=")){
					var parts = aname.split("=");
				aname = parts[0];
				value = parts[1];
			}
			target._set(aname, value);
		}
	},
};

ui.UIActionHandlers["class-on"] =
	ui.UIActionHandlers["add"] =
	function(elem, atype, asel, aevent){
		var aname = elem.attr("set");
		if (aname){
			var target = DOM._all(asel);
			target._add(aname);
		}
	};

ui.UIActionHandlers["class-off"] =
	ui.UIActionHandlers["del"] =
	function(elem, atype, asel, aevent){
		var aname = elem.attr("set");
		if (aname){
			var target = DOM._all(asel);
			target._del(aname);
		}
	};

ui.ElementEvents = {
	":click" : "onclick",	
	":hover" : "onmouseover",
	":d-click" : "ondblclick",
	":receive" : "ondropreceive",
	":drop" : "OnDrop"
};

WS.DOMload(ui.Init);	
}