
if (!UsingDOM("Log", "L")){ 
    
    L.Init = function(){
	if (L.initialized) return false;
	EV.CreateEvent("OnError", L);
	L.LogInfo("L initialized!");   
	L.initialized = true;
    };
    
    L.LogInfo = function(str, module, type){
	this.LogItem(module, str, "info", type);
	if (window.console == undefined || window.console == null) return;
	    if (module != undefined && module != null)
	    {
		console.info(str); 
	    }
	else
	    console.info(str);
    };
    
    L.LogObject = function(obj, module, type){
	if (window.console == undefined || window.console == null) return;
	    console.info(obj);
    };
    
    L.LogWarn = function(str, module, type){
	this.LogItem(module, str, "warn", type);
	if (window.console == undefined || window.console == null) return;
	    if (module != undefined && module != null)
	    {
		console.warn(str); 
	    }
	else
	    console.warn(str);
    };
    
    L.LogError = function(e, m, module, type){
	if (window.NoLogErrors) throw e;
	this.LogItem(module, e + " : " + module, "err", type);
	if (window.console == undefined || window.console == null) return;
	    this.OnError(e, m);
	if (Check(module)){
	    m = module + ": " + m; 
	}
	console.error(e, m);
    };
    
    L.LogItem = function(module, message, type, itemType){
	if (this.Log == undefined) return;
	    var item = W.div("item");
	item.cls(type);
	if (Check(itemType)){
	    item.cls(itemType);
	}
	item.attr("module", module);
	item.attr("itemType", itemType);
	item.html(message + "");
	item.module = module;
	item.message = message;
	item.logtype = type;
	item.itemtype = itemType;
	this.Log.add(item);
    };
    
    WS.DOMload(L.Init);
}
else{
    L.LogError("reinitializing L!"); 
}

