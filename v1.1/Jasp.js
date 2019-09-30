if (!UsingDOM("Contexts")) {
    
  C = Contexts;
   
  C.id = "Jasp_Contexts";
    
  C.url = "jasp.js";  
    
  C.info = L.Info;
    
  C.ContextsCounter = 1;
  
  C.Add = C.add = function(){
      var obj = arguments[0];
      if (obj && (obj)instanceof Object && !((obj)instanceof HTMLElement)){
	  obj[".context"] = null;
	  if (obj.ContextId){
	      if (!obj.id)
	      {
		  obj.id = obj.ContextId;
	      }
	  }
	  else{
	      if (obj.id)
	      {
		  obj.ContextId = obj.id;
	      }
	      else{
		  obj.ContextId = C.ContextsCounter;
		  obj.id = 'context' + C.ContextsCounter;
		  C.ContextsCounter++;
	      }
	  }
	  if (obj.Condition){
	      obj["." + obj.Condition] = null;
	  }
	  L.LogObject(obj);
      }
    return this._add(arguments);
  };
    
  C.AddContext = function(processor, context, selector, type, priority){
    var obj = {"context": context, 
	       "for": selector, 
	       "processor": processor, 
	       "priority": priority,
	       "type": type};
    var cnt = C.add(obj);
    cnt.context = context;
    return cnt;
  };
  
  C.Process = function(element, condition, param1){
      C.info("proc-start", condition, " in " + element.ToString());
      founded = 0;
      if (condition){
	  var contexts = C.All(".context." + condition);
	  for(var c = 0; c < contexts.length; c++){
	      var context = contexts[c];	      
	      if (this.ProcessContext(element, context, param1)){
		  founded++; 
	      };
	  }
      }      
      C.info("proc-end", condition, founded, " in " + element.ToString());
  }

  C.ProcessContext = function(element, context, param1){
      var url = element.get("@url");
      if (context.OnlyChilds != undefined && context.OnlyChilds){
	  var tags = element.childs(context.Selector);             
      }
      else{
	  var tags = element.All(context.Selector);      
      }
      var found = 0;
      var processed = 0;
      for(var i = 0; i < tags.length; i++){
	  var elem = tags[i];
	  if (elem.is("jasp-processed-" + context.ContextId)){
	      L.LogWarn("Context " + context.ContextId + "(" + context.Selector + ") already processed on " + elem.ToString(), "Jasp.js");
	  }
	  found++;
	  C.info("proc-found", elem.ToString());
	  if (elem.is("jasp-processing-" + context.ContextId)){
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
	      else{
		  if (result != null){
		      processed++;
		      elem.cls("jasp-processing-" + context.ContextId);		      
		  }		  
	      }
      } 
      return processed;
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

if (!using("Jasp")) {    
    J = Jasp = {IsOlmObject: true};
    
    J.id = "JPR";
    
    J.url = "jasp.js";
    
    J.info = L.Info;
    
    J.ContextContext = { Selector: "context", Condition: "module-parsing" };
    J.ContextContext.Selector = "context";
    J.ContextContext.Process = function(element){
	var context = {};
	context.Selector = element.attr("selector");
	context.Condition = element.attr("condition");
	context.OnlyChilds = element.attr("onlychilds");
	context.element = element;
	context.code = element.innerHTML;
	context.module = element.get("^.module");
	context.Process = J.ProcessContext;
	C.Add(context);
	element.add(".processed");
	return true;
      //Contexts.ProcessContext(W.Body, context);
    }
    
    C.Add(J.ContextContext);
    
    J.ProcessContext = function(element, context, processingElem, param1){
      var Processor = {};
      Processor.Element = element;
      Processor.Context = context;
      Processor.ProcessingElement = processingElem;
      Processor.Param = param1;
      Processor.ContextElement = context.element;
      try{
        with(Processor){
          eval(context.code);
        }
      }
      catch(e){
        var url = context.Selector;
        if (Check(context.module))
        {
          url += " : " + context.module.url; 
        }
        L.LogError(e, "ProcessingContext : " + url, "System.Jasp.js");
      }
    };
        
    J.LoadingContext = { Condition: "module-parsing" };
    J.LoadingContext.Selector = ".content[url]:not(.loaded)";
    J.LoadingContext.Process = function(element){
	var url = element.url = element.attr("url");
	AX.Get(url, J.ProcessLoadedContent, {context: element});
	return false;
    }
    C.Add(J.LoadingContext);
    
    J.ProcessLoadedContent = function(result, context){
	C.Process(context, 'ui-processing');
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
	if (Check(load)){
	   window.eval(load);   
	}
	J.EndProcess(context, J.LoadingContext);
    };
	
	J.EndProcess = function(element, context){
	    J.info("jasp-end", element.ToString(), context.id);
	    element.rcs("jasp-processing-" + context.ContextId);
	    element.cls("jasp-processed-" + context.ContextId);
	};

    J.Commands = ['+', '<', '-', '=', '!'];
	
    J.ProcessJaspContext = function(element){
      element.code = J.Compile(element.html());
      element.attr("code", element.code);
      element.cls("compiled");
      //Contexts.ProcessContext(W.Body, context);
    }	
	
    J.JaspContext = { Condition: "module-jasp" };
    J.JaspContext.Selector = "jasp:not(.compiled)";
    J.JaspContext.Process = J.ProcessJaspContext;
    C.Add(J.JaspContext);
    
    J.Macros = AArray();
    
    J.Compile = function(code){
      var compiledCode = "";
      var lines = code.split('\n');
      for (var i = 0; i < lines.length; i++){
	  var line = lines[i];
	  var index = -1;
	  for (var c = 0; c < J.Commands.length; c++){
	      var ind = line.indexOf(J.Commands[c]);
	      if (ind >= 0 && (ind < index || index < 0)){
		  index = ind;
		  var command = J.Commands[c];
	      }
	  }
	  if (index >= 0){
	      var left = line.substring(0, index);
	      var right = J.Compile(line.substring(index + 1));
	      if (left.length > 0){
		  if (left.search(/^\s*[.#]/) >= 0){
		      compiledCode += "var elem = W.findAll('" + left + "');";
		      switch(command){
			  case "<" : 
			      compiledCode += "elem.html(" + right + ");";
			      break;
		          case "+" : 
			      compiledCode += "elem.add(" + right + ");";
			      break;
				  }
		      continue;
			  }
		  if (line.search(/^\s*[!]/) >= 0){

	      switch(command){
		  case "<" : 
		      compiledCode += "window." + left.raplace('!', "").trim() + "(" + right + ");";
		      break;
		  case "+" : 
		      compiledCode += "J.CallParams.add(" + right + ");";
		      break;
			  }
	      continue;
		  }
		  
		  if (command == "="){
		      compiledCode += "J.Macros.add(" + left.replace('!', '') + ");";
		      continue;
			  }
		  switch(command){
		      case "<" : 
			  compiledCode += left + "=" + right + ";";
			  break;
		      case "+" : 
			  compiledCode += left.trim() + ".add(" + right + ");";
			  break;
		  }		  
	      }
	  }
	  else{
	      if (line.search(/^\s*[!]/) >= 0){
		  compiledCode += "window." + left + "(J.CallParams); J.CallParams.clear();";
	      }
	      if (left.search(/^\s*[.#]/) >= 0){
		      compiledCode += "W.findAll('" + left + "')";
	      }
	  }
      }
      return compiledCode;
    }
    
    L.LogInfo("JASP Contexts registered!");
}
else
{
  L.LogError("Reinitilizing JASP!");
}
  