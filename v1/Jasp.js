if (!using("L")){
    L = {};
    L.LogInfo = function(){};
    L.LogWarn = function(){};
    L.LogError = function(){};
}

if (!using("Contexts")) {

    
  C = Contexts;
  
  C.AddContext = function(processor, context, selector, type, priority){
    var obj = {"context": context, 
	       "for": selector, 
	       "processor": processor, 
	       "priority": priority,
	       "type": type};
    var cnt = C.add(obj);
    cnt.add(context);
  };
  
  C.Process = function(element, condition, param1){
    L.LogInfo("processing contexts: " + condition, "System.Jasp.js");
    for(var c = 0; c < Contexts.length; c++){
      var context = Contexts[c];
      context = this.get(context);
      if (Check(condition) && Check(context.Condition)){
        if (context.Condition != condition){
          continue; 
        }
      }
      this.ProcessContext(element, context, param1);
    }
  }

  C.ProcessContext = function(element, context, param1){
      L.LogInfo("processing context: " + context.Selector + " in: " + element.attr('url') + " only>" + context.OnlyChilds, "System.Jasp.js");
    if (context.OnlyChilds != undefined && context.OnlyChilds){
      var tags = element.childs(context.Selector);             
    }
    else{
      var tags = element.findAll(context.Selector);      
    }
    for(var i = tags.length - 1; i >= 0 ; i--){
	L.LogInfo("found: " + element.ToString(true) + (Check(element.url) ? "@url='" + element.url + "'" : ""), "System.Jasp.js");
	context.Process(tags[i], context, element, param1);
    }
  };
      
  function GetNodesBySelector(selector){
	if (selector.start("this")){
	    selector = selector.replace("this", "");
	    selector = selector.trim();
	    var result = this.all(selector);
	}
	else
	{
	    var result = DOM.all(selector);
	}
      return result;
    };
    
  HTMLElement.prototype["GetNodesBySelector"] = GetNodesBySelector;

  L.LogInfo("Contexts created!");
}
else
{
  L.LogError("Reinitilizing Contexts!");
}