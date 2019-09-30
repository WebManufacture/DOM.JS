
if (!UsingDOM("Log")){ 
    
    L = Log;
    
    Log.OperationSize = 12;
    
    L.Init = function(){
	if (L.initialized) return false;
	//EV.CreateEvent("OnError", L);
	L.LogInfo("L initialized!");   
	L.initialized = true;
	if (Request){
	   L.Debug = L.debug = Request.Params.debug;
	}
    };
    
    L.LogInfo = function(str, module, type){
	this.LogItem(module, str, "info", type);
	if (window.console == undefined || window.console == null) return;
	console.info(str); 
    };
    
    L.Info = function(operation){
	if (!this.logId){
	    var id = this.id;
	    if (id && id.length > 0){
		if (id.length >= 3){
		    id = id.substring(0, 3);
		}
		else{
		    if (id.length == 2)
			id = id + " ";
		    else
			id = id + "  ";
		}
	    }
	    else{
		id = "   ";
	    }
	    this.logId = id;
	}
	var op = operation;
	if (op){
	    if (op.length >= Log.OperationSize){
		op = op.substring(0, Log.OperationSize);
	    }
	    else{
		op += new Array(Log.OperationSize - op.length).join(" ")
	    }
	}
	else{
	    op = new Array(Log.OperationSize).join(" ");
	}
	var str = this.logId + " : " + op;
	for (var i = 1; i < arguments.length; i++){
	    str += " : " + arguments[i];
	}
	L.LogItem(this, str, "info", operation);
	if (window.console == undefined || window.console == null) return;
	console.info(str); 
    };
    
    L.Error = function(operation){
	if (!this.logId){
	    var id = this.id;
	    if (id && id.length > 0){
		if (id.length >= 3){
		    id = id.substring(0, 3);
		}
		else{
		    if (id.length == 2)
			id = id + " ";
		    else
			id = id + "  ";
		}
	    }
	    else{
		id = "   ";
	    }
	    this.logId = id;
	}
	var op = operation;
	if (op){
	    if (op.length >= Log.OperationSize){
		op = op.substring(0, Log.OperationSize);
	    }
	    else{
		op += new Array(Log.OperationSize - op.length).join(" ")
	    }
	}
	else{
	    op = new Array(Log.OperationSize).join(" ");
	}
	var str = this.logId + " : " + op;
	for (var i = 1; i < arguments.length; i++){
	    str += " : " + arguments[i];
	}
	L.LogItem(this, str, "error", operation);
	if (window.console == undefined || window.console == null) return;
	console.error(str); 
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
	    if (this.OnError){
		this.OnError(e, m);
	    }
	if (Check(module)){
	    m = module + ": " + m; 
	}
	if (e.message){
	    console.error(e, e.message, m);   
	}
	else{
	    console.error(e, m);
	}
    };
    
    L.LogItem = function(module, message, type, itemType){
	if (L.debug) {
	    var item = DOM.div("item");
	    item.cls("item");
	    item.cls(type);
    	    item.attr("type", type);
	    if (module && module.id){
		item.add("." + module.id);
	    };	    
	    if (Check(itemType)){
		item.cls(itemType);
	    }
	    if (module && module.id){		
		item.attr("module-id", module.id);
	    };
	    if (module && module.url){		
		item.attr("module-url", module.url);
	    };
	    var date = new Date();
	    item.attr('date-val', date.valueOf());
	    item.attr('date', date.formatTime(true));
	    item.attr("itemType", itemType);
	    item.html((message+ "").replace(/</g, '&lt;').replace(/>/g, '&gt;') );
	    item.module = module;
	    item.message = message;
	    item.logtype = type;
	    item.itemtype = itemType;
	    L.add(item);
	}
    };
    
    WS.DOMload(L.Init);
}
else{
    L.LogError("reinitializing L!"); 
}

