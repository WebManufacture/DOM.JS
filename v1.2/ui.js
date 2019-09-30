if (!UsingDOM("Ui")){

    
    ui.id =  "UI";
    ui.url =  "ui.js";
    
    ui.info = L.info;
    
    ui.ComponentContext = { Condition: "ui-processing" };
    ui.ComponentContext.id = "uicomponents";
    ui.ComponentContext.Selector = ".component[component-url]:not(.jasp-processed-uicomponents)";
    ui.ComponentContext.Process = function(element){
	var url = element.componentUrl = element.attr("component-url");
	var wait = element.wait = element.attr("wait");
	url = url.toLowerCase();
	element.set("@component-url", url);
	Ev.CreateEvent("OnComponentInitialized", element);
	if (M.GetModuleStatus(url) == "notfound") {
	    M.OnModuleRegistered.subscribe(ui.ModuleInitialized, url);
	    element.module = M.Load(url, "component " + element.ToString());
	    return false;
	}
	return true;
    }
	
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
    }
}