if (window.M == undefined || window.M == null || !window.M.IsOlmObject) {


    M = {
        Context: {},
        IsOlmObject: true,
        Element: null,
        url: "Modules.js",

        Init: function() {
            M.Element = WS.Body.add("<modules class='modules'></modules>");
            L.LogInfo("Module context registered!", M.url);
            L.LogObject(M.Element, M.url);
            EV.CreateEvent("OnModuleRegistered", M);
            EV.CreateEvent("OnModuleLoad", M);
            EV.CreateEvent("OnModuleLoaded", M);
            EV.CreateEvent("OnModulesLoaded", M);
            if (window.DFC_ModulesLoaded != undefined) {
                EV.AddHandler("OnModulesLoaded", window.DFC_ModulesLoaded, "modules");
            }

            //M.LoadModule("System.Modules.htm");
            M.SearchModules(WS.Body);
        },

        GetModuleStatus: function(url) {
            var mod = DOM.aget("url", url, "module");
            if (mod == null) return "notfound";
            if (module.has("inprogress")) return "inprogress";
            if (module.has("processed")) return "processed";
            return "unknown";
        },

        GetModuleByUrl: function(url) {
            url = url.toLowerCase();
            return DOM.aget("url", url, "module");
        },


        SubscribeTo: function(url, handler) {
            var module = M.GetModuleByUrl(url);
            if (module.has("inprogress")) {
                E.AddHandler("OnModuleRegistered", handler, url);
                return false;
            }
            handler(url, module);
        },

        CreateModule: function(url, state) {
            var module = M.Element.add("<module class='module'></module>");
            module.add("." + state);
            module.set("@url", url);
            module.url = url;
            return module;
        },


        SearchModules: function(elem) {
            var url = "Body";
            var nfo = DOM.get("module-info");
            if (nfo != null) {
                url = nfo.attr("url");
            }
            else {
                url = WS.Body.attr("url");
                if (url == null) {
                    if (check(Request.File)) {
                        url = Request.File;
                    }
                    else {
                        url = "Body";
                    }
                }
            }
            var module = M.CreateModule(url, "inprogress");

            /*var scripts = WS.Body.all("script.deffered");
            for(var i = 0; i < scripts.length; i++){
            WS.Header.add(scripts[i]);
            }*/

            var includes = elem.all("script[url]");
            for (var i = 0; i < includes.length; i++) {
                if (includes[i].parentNode == elem)
                module.add(includes[i]);
            }
            var includes = elem.all("include");
            for (var i = 0; i < includes.length; i++) {
                if (includes[i].parentNode == elem)
                module.add(includes[i]);
            }

            var modules = elem.all("module");
            for (var i = 0; i < modules.length; i++) {
                if (modules[i].parentElement == M.Element || modules[i].has('inprogress') || modules[i].has('processed')) {
                    continue;
                }
                if (!modules[i].has("nomove")) {
                    M.Element.add(modules[i]);
                }
                modules[i].cls("module");
                modules[i].cls("inprogress");
                modules[i].url = modules[i].attr("url");
                M.ParseModule(modules[i]);
            }


            M.ParseModule(module);

            /*var modules = context.all("module");
            for(var i = 0; i < modules.length; i++){ 
            M.ParseModule(modules[i]);
            }*/
        },

        ParseModule: function(module) {
            var result = true;
            module.url = module.attr("url").toLowerCase();
            L.LogInfo("parsing: " + module.url, "System.Modules.js", "modules parsing");
            try {
                if (module.has("processed")) {
                    L.LogInfo("reprocess: " + module.attr("url"), M.url);
                    return true;
                }
                module.cls("inprogress");
                module.attr("url", module.url);
                var type = module.attr("type");
                module.moduleType = type;
                if (!module.has("nomove"))
                    M.Element.add(module);
                module.includes = 0;
                var includes = module.all("include");
                for (var i = 0; i < includes.length; i++) {
                    module.includes++;
                    result &= M.ProcessInclude(includes[i], module);
                }
                var checks = module.all("check");
                for (var i = 0; i < checks.length; i++) {
                    result &= M.ProcessCheck(checks[i]);
                }
                var styles = module.all("style");
                for (var i = 0; i < styles.length; i++) {
                    result &= M.ProcessStyle(styles[i], module);
                }
                var styles = module.all("link");
                for (var i = 0; i < styles.length; i++) {
                    result &= M.ProcessStyle(styles[i], module);
                }
                result &= M.CheckModule(module, "Parsing " + module.url);
            }
            catch (e) {
                L.LogError(e, "System.Modules.js : Parsing: " + module.url, "System.Modules.js");
            }
            return result;
        },

        LoadModule: function(ourl, module, cmod, cache) {
            L.LogInfo("load request: " + ourl + " from: " + cmod, M.url, "modules module request");
            if (ourl == undefined || ourl == null) return;
            var url = ourl.toLowerCase();
            if (module == undefined || module == null) {
                module = M.GetModuleByUrl(url);
                if (module != null) {
                    if (module.has("inprogress")) {
                        L.LogWarn("inprogress: " + url + " FROM: " + cmod, M.url);
                        return true;
                    }
                    else {
                        L.LogWarn("reincluding: " + url + " FROM: " + cmod, M.url);
                        return false;
                    }
                }
                else {
                    module = M.CreateModule(url, "inprogress");
                }
            }
            module.from = cmod;
            if (url.endsWith(".js")) {
                var docScript = DOM.get("script.loaded[src='" + ourl + "']");
                if (docScript != null) {
                    L.LogWarn("rescript: " + ourl + " FROM: " + cmod, M.url);
                    module.rcs("inprogress");
                    module.cls("processed");
                    return false;
                }
                var docScript = WS.Header.get("script[src='" + ourl + "']");
                if (docScript != null) {
                    L.LogWarn("rescript-head: " + ourl + " FROM: " + cmod, M.url);
                    module.rcs("inprogress");
                    module.cls("processed");
                    return false;
                }
                if (AX.CrossDomain)
                    ourl = AX.GetSystemUrl(url);
                else
                    ourl = url;
                var docScript = DOM.get("script.loaded[src='" + ourl + "']");
                if (docScript != null) {
                    L.LogWarn("rescript: " + url + " FROM: " + cmod, M.url);
                    module.rcs("inprogress");
                    module.cls("processed");
                    return false;
                }
                var docScript = WS.Header.get("script[src='" + ourl + "']");
                if (docScript != null) {
                    L.LogWarn("rescript-head: " + url + " FROM: " + cmod, M.url);
                    module.rcs("inprogress");
                    module.cls("processed");
                    return false;
                }
                var scriptElement = document.createElement("script");
                scriptElement.attr("type", "text/javascript");
                var surl = url;
                if (AX.CrossDomain)
                    surl = AX.SystemRoot + url;
                if (cache) surl += '?rnd=' + Math.random();
                scriptElement.attr("src", surl);
                scriptElement.url = url;
                scriptElement.onload = M.scriptLoaded;
                scriptElement.module = module;
                module.appendChild(scriptElement);
                L.LogInfo("loading-script: " + ourl + " from: " + cmod, M.url);
                return true;
            }
            L.LogInfo("loading: " + url + " from: " + cmod, M.url, "modules module loading");
            M.OnModuleLoad(module.url.toLowerCase(), module);
            SysAjax.LoadModule(url, module, cache, M.moduleLoaded);
            return true;
        },

        scriptLoaded: function(event, code) {
            var module = this.module;
            module.rcs("inprogress");
            this.cls("loaded");
            if (!this.local) {
                //var item = globalStorage['system.web-manufacture.net'].setItem("module:" + this.url, code);
            }
            L.LogInfo('script: ' + this.url, M.url, "modules script end");
            M.ModuleRegistered(this.url, this.module);
            M.OnModuleRegistered(this.url, this.module);
        },

        asyncScriptLoaded: function(event, code) {
            this.rcs("inprogress");
            this.cls("loaded");
            if (!this.local) {
                //var item = globalStorage['system.web-manufacture.net'].setItem("module:" + this.url, code);
            }
            L.LogInfo('async-script: ' + this.url, M.url, "modules script async-end");
            M.CheckModule(this.module, "script-async: " + this.url);
        },

        moduleLoaded: function(result, module) {
            try {
                //var item = globalStorage['system.web-manufacture.net'].setItem("module:" + req.file, req.responseText);
                L.LogInfo('module: ' + module.url + ' from: ' + module.from, M.url, "modules module loaded");
                var data = this.responseText;
                var exp = /(<script[^>]+)src=/ig;
                if (exp.test(data)) {
                    data = data.replace(exp, "$1 url=");
                    L.LogWarn("scripts reinjection:  from: " + this.file, M.url);
                }
                var exp = /(<link[^>]+)href=/ig;
                if (exp.test(data)) {
                    data = data.replace(exp, "$1 url=");
                    L.LogWarn("style reinjection:  from: " + this.file, M.url);
                }
                /*if (data.contains("<module")){
                var mod = DOM.div();
                mod.html(data);
                mod = mod.get("module");
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
                M.OnModuleLoaded(module.url.toLowerCase(), module);
            }
            catch (e) {
                L.LogError(e, "System.Modules.js : moduleLoaded: " + module.url, "System.Modules.js");
            }
            M.ParseModule(module);
        },

        ProcessScript: function(script, module) {
            var url = script.attr("url");
            if (url != null) {
                url = url.toLowerCase();
                var docScript = DOM.get("script.loaded[src='" + url + "']");
                if (docScript != null) {
                    L.LogWarn("rescript: " + url, M.url, "modules rescript");
                    script.del();
                    return true;
                }
                var docScript = WS.Header.get("script[src='" + url + "']");
                if (docScript != null) {
                    L.LogWarn("rescript-head: " + url, M.url, "modules rescript head-rescript");
                    script.del();
                    return true;
                }
                if (Request.Params.cache != "renew" && Request.Params.file != url && false) {
                    var item = globalStorage['system.web-manufacture.net'].getItem("module:" + url);
                    if (item != null) {
                        script.innerHTML = item.value;
                        L.LogInfo("executing:" + module.url, M.url, "modules executing-eval");
                        script.url = url;
                        script.src = url;
                        script.local = true;
                        script.onload = M.asyncScriptLoaded;
                        window.eval(item.value);
                        script.cls("processed");
                        M.ModuleRegistered(url, this.module);
                        M.OnModuleRegistered(url, this.module);
                        return true;
                    }
                }
                var elem = document.createElement("script");
                elem.attr("type", script.attr("type"));
                elem.attr("url", script.attr("src"));
                elem.async = false;
                elem.attr("async", "false");
                elem.url = url;
                script.attr("url", elem.url);
                if (AX.CrossDomain) {
                    elem.attr("src", AX.GetSystemUrl(elem.url));
                }
                else {
                    elem.attr("src", elem.url);
                }
                elem.attr("url", elem.url);
                elem.cls("inprogress");
                elem.module = module;

                script.del();
                elem.onload = M.asyncScriptLoaded;
                L.LogInfo("async-start: " + elem.url, M.url, "modules script async-start");
                M.Element.appendChild(elem);
                return false;
            }
            else {
                if (script.has("deffered")) return true;
                L.LogInfo("executing:" + module.url, M.url, "modules executing-eval");
                try {
                    window.eval(script.innerHTML);
                }
                catch (e) {
                    e.fileName = module.url;
                    L.LogError(e, module.url);
                }
            }
            return true;
        },

        ProcessStyle: function(element, module) {
            if (element.is("link")) {
                var url = element.attr("url");
                if (url == null) return true;
                var lnk = WS.Header.get("link[href='" + url + "']");
                if (lnk == null) {
                    element.attr("href", url);
                    WS.Header.add(element);
                }
                else {
                    element.cls("rescript");
                    element.cls("processed");
                }
            }
            return true;
        },

        ProcessContext: function(element, context, module) {
            L.LogInfo("__context-M: " + context.Selector, M.url);
            context.Process(element, context);
            return true;
        },

        ProcessInclude: function(element, module) {
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
            var url = "BODY";
            if (Check(module)) {
                url = module.url;
            }
            var result = M.LoadModule(element.url, null, url);
            element.url = element.url.toLowerCase();
            element.attr("url", element.url);
            if (result) {
                element.cls("inprogress");
                var url = " _ ";
                if (Check(module)) {
                    url = module.url;
                }
                L.LogInfo("include inprogress: " + element.url + " FROM: " + url, M.url, "modules include");
            };
            return result;
        },

        ProcessCheck: function(element, module) {
            element.url = element.attr("url").toLowerCase();
            element.attr("url", element.url);
            var mod = M.GetModuleByUrl(element.url);
            if (mod != null) {
                if (mod.has("inprogress")) {
                    element.cls("inprogress");
                    L.LogInfo("check inprogress: " + element.url, M.url);
                    return false;
                }
                if (mod.has("processed")) {
                    element.rcs("inprogress");
                    element.cls("processed");
                    return true;
                }
            }
            element.rcs("inprogress");
            return true;
        },


        CheckModule: function(module, from) {
            L.LogInfo("checking: " + module.url + " FROM: " + from, M.url, "modules checking start");
            var includings = module.all("include.inprogress");
            if (includings.length > 0) {
                L.LogInfo("decline: " + module.url + " count: " + includings.length + " not checked: " + includings[0].attr("url"), M.url, "modules checking decline");
                return false;
            }
            var checks = module.all("check.inprogress");
            if (checks.length > 0) {
                L.LogInfo("decline: " + module.url + " not check: " + checks[0].attr("url"), M.url, "modules checking decline decline-checks");
                return false;
            }
            L.LogInfo("continue: " + module.url, M.url, "modules checking continue");
            var scripts = module.all("script:not(.loaded)");
            for (var i = 0; i < scripts.length; i++) {
                if (!M.ProcessScript(scripts[i], module)) return false;
            }
            if (window.Contexts != undefined) {
                Contexts.Process(module, "System.Modules.js");
            }
            M.ModuleRegistered(module.url, module);
            M.OnModuleRegistered(module.url, module);
            return true;
        },

        ModuleRegistered: function(url, module) {
            url = url.toLowerCase();
            L.LogInfo("registered: " + url, M.url, "modules registered");
            module.rcs("inprogress");
            var includings = DOM.all("include.inprogress[url='" + url + "']");
            for (var i = 0; i < includings.length; i++) {
                var inc = includings[i];
                inc.rcs("inprogress");
                inc.cls("processed");
                var mod = inc.findParent("module");
                if (inc.attr("onreg") != null) {
                    eval(inc.attr("onreg"));
                }
                if (mod != null) {
                    M.CheckModule(mod, url);
                }
            }
            var checks = DOM.all("check.inprogress[url='" + url + "']");
            for (var i = 0; i < checks.length; i++) {
                checks[i].rcs("inprogress");
                var mod = checks[i].findParent("module");
                if (mod != null) {
                    M.CheckModule(mod, url);
                }
            }
            var scripts = module.all("script.deffered");
            for (var i = 0; i < scripts.length; i++) {
                L.LogInfo("Deffered: " + module.url, M.url, "modules deffered");
                window.eval(scripts[i].innerHTML);
            }
            module.reload = M.Reload;
            module.cls("processed");
            var modules = DOM.all("module:not(.processed)");
            if (modules.length == 0) {
                M.OnModulesLoaded();
                L.LogInfo("Modules Loading complete!");
            }
        },

        Reload: function(random) {
            var url = this.attr('url');
            this.del();
            M.LoadModule(url, null, 'reload', random);
        }
    }

    WS.DOMload(M.Init);

}
else {
    L.LogError("Reinitilizing M (Modules)!");
}
