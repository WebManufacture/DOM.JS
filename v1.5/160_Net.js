if (!UsingDOM("KLabNet")){
	KLabNet = {
		Tunnels : {}
	};

	Net = NET = _klabNetInternal = {
		GetTunnel : function(serverUrl){	
			return new KLabTunnel(serverUrl);	
		}	
	};

	function HttpChannel(url, read){
		this.url = url;
		EV.CreateEvent("onRead", this);
		if (read){
			if (typeof read == "function"){
				this.onRead.subscribe(read);
			}
			this.connectRead(read);
		}
	};

	HttpChannel.prototype = {
		connectRead : function(callback) {
			var url = this.url;
			if(typeof url == "string"){
				url  = new Url(url);
			}
			//url.addParam("rnd", Math.random());
			var rq = _klabNetInternal.GET(url);
			rq.lastStateChar = 0;
			rq.channel = this;
			rq.onreadystatechange = this.readStateChanged;
			rq.send();
		},

		write : function(messages){
			var url = new Url(this.url + url);
			url.addParam("rnd", Math.random());
			var rq = _klabNetInternal.POST(url, messages);
			rq.send(messages);
		},

		send : function(url, data){
			if (!url) url = "";
			if (!data) data = null;
			url = new Url(this.url + url);
			url.addParam("rnd", Math.random());
			var rq = _klabNetInternal.POST(url, data);
			rq.send(data);
		},

		readStateChanged: function() {
			var channel = this.channel;
			if (this.readyState == 3){
				var result = this.responseText.substr(this.lastStateChar);
				this.lastStateChar = this.responseText.length;				
				if (result && result.length > 0 && this.status == 200) {
					result = result.split("\n");
					for (var i = 0; i < result.length; i++){
						if (result[i] == "") continue;
						try{
							var value = JSON.parse(result[i]);
						}
						catch(e){
							console.log(result[i]);
							continue;
						}
						channel.processMessages(value);
					}
				}
			}
			if (this.readyState == 4){
				if (this.status == 200){
					setTimeout(function(){ channel.connectRead(); }, 500);	
				}
				else{
					setTimeout(function(){ channel.connectRead(); }, 5000);	
				}
			}
		},

		processMessages : function(messages){
			this.onRead.fire(messages);
		}
	};	

	Net.HMCH = function(url, dstChannel, srcChannel){
		this.url = url;
		if(typeof url == "string"){
			this.url  = new Url(url);
		}
		this.channels = {};
		this.remotePaths = [];
		var self = this;
		if (srcChannel || dstChannel){
			self.bind(dstChannel, srcChannel, "remote");
		}
		this.reconnect(200);
	};

	Net.HMCH.prototype = {
		reconnect :function(timeout) {			
			if (this.currentRequest){
				this.currentRequest.aborting = true;
				this.currentRequest.abort();
				this.currentRequest = null;
			}
			if (this.reconnectTimeout){
				clearTimeout(this.reconnectTimeout);
			}
			var self = this;
			this.reconnectTimeout = setTimeout(function(){
				self.currentRequest = self.connect(self.url);
				delete self.reconnectTimeout;
			}, timeout);
		},
		
		connect : function(url, callback) {			
			//url.addParam("rnd", Math.random());
			var rq = _klabNetInternal._getRequest("POST", url);
			rq.lastStateChar = 0;
			rq.hmch = this;
			rq.callback = callback;
			rq.onload = null;
			rq.onerror = null;
			rq.setRequestHeader("request-type", "channel");
			rq.onreadystatechange = this._readStateChanged;
			rq.send(JSON.stringify(this.remotePaths));
			return rq;
		},

		_writeMessage : function(messages){
			var rq = _klabNetInternal._getRequest("PUT", this.url);
			rq.setRequestHeader("request-type", "channel");
			rq.send(JSON.stringify(messages));
		},
		
		sendMessages : function(messages){
			if (typeof messages == 'object' && messages.length){
				this._writeMessage(JSON.stringify(messages));
			}
		},

		_readStateChanged: function() {
			var self = this.hmch;
			if (this.readyState == 2){
				if (this.callback)	{
					setImmediate(this.callback);
				}
			}
			if (this.readyState == 3){
				var result = this.responseText.substr(this.lastStateChar);
				this.lastStateChar = this.responseText.length;				
				if (result && result.length > 0 && this.status == 200) {
					result = result.split("\n");
					for (var i = 0; i < result.length; i++){
						if (result[i] == "") continue;
						try{
							var value = JSON.parse(result[i]);
						}
						catch(e){
							console.log(result[i]);
							continue;
						}
						self._processMessage(value);
					}
				}
			}
			if (this.readyState == 4){
				if (!this.aborting){
					if (this.status == 200){
						self.reconnect(500);	
					}
					else{
						self.reconnect(5000);	
					}
				}
			}
		},

		_processMessage : function(args){
			if (!args || !args.length) return;					
			var params = [];
			var message = args[0];
			for (var i = 0; i < args.length - 1; i++){
				params.push(args[i]);
			}
			var ch = this.channels[message.source];
			if (ch){				
				Channels.emit(ch, params)	
			}
			else{
				message = Channel.ParsePath(message.source);
				for (var item in this.channels){
					if (message.is(item)){
						var innerCh = this.channels[item];
						ch = Channel.ParsePath(innerCh, message.source);
						ch.remote = true;
						Channels.emit(ch, params)
					}
				}
			}
		},
		
		bind : function(remoteChannel, localChannel, directions){
			if (!localChannel) localChannel = "/";
			if (!remoteChannel) remoteChannel = "/";
			if (!directions) directions = { local: true, remote : true };
			if (typeof (directions) == "string"){
				switch(directions){
					case "both" : directions = { local: true, remote : true }; break;
					case "remote" : directions = { local: false, remote : true }; break;
					case "local" : directions = { local: true, remote : false }; break;
				}	
			}
			if (directions.remote){
				this.remotePaths.push(remoteChannel);
				this.channels[remoteChannel] = localChannel;
				this.reconnect(100);
			}
			var self = this;
			if (directions.local){
				Channels.on(localChannel, function(message){
					try{
						if (!this.remote){
							var params = [];
							for (var i = 1; i < arguments.length; i++){
								params.push(arguments[i]);
							}
							message.args = params;
							self._writeMessage(message);
						}
					}
					catch(e){
						console.log(e);
					}					
				});
			}
		},
		
		subscribe : function(remoteChannel, localChannel){
			return this.bind(remoteChannel, localChannel, "remote");
		},
		
		follow : function(remoteChannel, localChannel){
			return this.bind(remoteChannel, localChannel, "local");
		},
		
	};	



	function ServerTunnel(url, isFullDuplex){
		this.url = url;
		if (isFullDuplex){
			this.connect();
		}
	};

	ServerTunnel.prototype = {
		Init: function(){
			EV.CreateEvent("OnMessage", this);
		},

		connect : function() {
			var url = this.url;
			if(typeof url == "string"){
				url = new Url(url);
			}
			//url.addParam("rnd", Math.random());
			var rq = _klabNetInternal.POST(url);
			rq.lastStateChar = 0;
			rq.tunnel = this;
			rq.onreadystatechange = this.stateChanged;
			rq.send();
		},

		stateChanged: function() {
			var tunnel = this.tunnel;
			if (this.readyState == 3){
				_klabNetInternal.Online = true;
				_klabNetInternal.OnConnectionState.fire(true);
				if (tunnel.onConnected){
					tunnel.onConnected();
				}
				var result = this.responseText.substr(this.lastStateChar);
				this.lastStateChar = this.responseText.length;

				if (result && result.length > 0 && this.status == 200) {
					result = JSON.parse(result);
					tunnel.processMessages(result);
				}
			}
			if (this.readyState == 4){
				
				if (this.status == 200){
					setTimeout(function(){ tunnel.connect(); }, 500);	
				}
				else{
					_klabNetInternal.Online = false;
					_klabNetInternal.OnConnectionState.fire(false);
					setTimeout(function(){ tunnel.connect(); }, 5000);	
				}
			}
		},

		processMessages : function(messages){
			if (messages.length){
				for (var i = 0; i < messages.length; i++){
					this.OnMessage.fire(messages[i]);
				}
			}
			else{
				this.OnMessage.fire(messages);
			}
		}
	};	


	function KLabTunnel(url, isPermanent){
		if (!url){
			this.TunnelUrl = null; //Url.Resolve(window.location.protocol + "//" + window.location.host);
			this.ServerUrl = "";
		}
		else{
			this.TunnelUrl = url;//new Url(serverUrl, true);
			this.ServerUrl = (new Url(url, true)) + "";
			//this.crossDomain = this.ServerUrl.hostname != window.location.hostname;	
		}
		if (isPermanent){
			this._createServerTunnel();
		}
	};


	KLabTunnel.prototype = {
		_endRequest : function(){		
			if (this.callback){
				var contentType = this.getResponseHeader("Content-Type");
				this.contentType = contentType;
				if (typeof(this.callback) == "function"){
					var result = this.responseText;
					if (contentType && (contentType.start("text/json") || contentType.start("application/json"))){
						try{
							result = JSON.parse(result);
						}
						catch(e){
							this.callback(this.responseText, this.status);
							return;
						}
					}
					this.callback(result, this.status);
					return;
				}
				if (this.callback.add){
					if (DOM){
						this.callback.add(DOM.Wrap(this.responseText));
					}
					else{
						this.callback.add(this.responseText);
					}
					return;
				}
				delete this.callback;
			}
		},

		_createServerTunnel : function(){		
			if (KLabNet.Tunnels[this.ServerUrl]){
				this.serverTunnel = KLabNet.Tunnels[this.ServerUrl];
			}
			else{
				this.serverTunnel = KLabNet.Tunnels[this.ServerUrl] = new ServerTunnel(this.ServerUrl, true);
			}
			this.serverTunnel.Init();
			EV.CreateEvent("OnConnected", this);
			var tunnel = this;
			this.serverTunnel.onConnected = function(){
				tunnel.OnConnected.fire();
			}
		},


		_errorRequest : function(){		
			if (this.callback){
				if (typeof(this.callback) == "function"){
					this.callback(this.responseText, this.status);
					return;
				}
			}
		},

		_getRequest : function(method, url, callback){
			var rq = new XMLHttpRequest();
			if (this.TunnelUrl && typeof(url) == "string"){			
				url = this.TunnelUrl + url;
			}
			rq.id = (Math.random() + "").replace("0.", "");
			if (typeof url == 'string') url = new Url(url);
			url = url + "";
			rq.open(method, url, true);
			rq.callback = callback;
			rq.onload = this._endRequest;
			rq.onerror = this._errorRequest;
			return rq;
		},

		_sendRequest : function(method, url, data, callback){
			if (typeof(url) == "function"){
				callback = url;
				url = "";
			}
			var rq = this._getRequest(method, url, callback);
			if (callback){
				rq.send(data);
			}
			return rq;
		},


		get : function(url, data, callback){
			if (!callback && typeof data == "function"){
				callback = data;
				data = null;
			}
			{
				return this._sendRequest("GET", url, data, callback);
			}
		},

		all : function(url, data, callback){
			if (!callback && typeof data == "function"){
				callback = data;
				data = null;
			}
			return this._sendRequest("SEARCH", url, data, callback);
		},

		add : function(url, data, callback){
			if (!callback && typeof data == "function"){
				callback = data;
				data = null;
			}
			{
				return this._sendRequest("POST", url, data, callback);
			}
		},

		set : function(url, data, callback){
			if (!callback && typeof data == "function"){
				callback = data;
				data = null;
			}
			{
				return this._sendRequest("PUT", url, data, callback);
			}
		},

		del : function(url, data, callback){
			if (!callback && typeof data == "function"){
				callback = data;
				data = null;
			}
			else{
				if (typeof(data) != 'string') data = JSON.stringify(data);
			}
			{				
				return this._sendRequest("DELETE", url, data, callback);
			}
		}	
	};

	KLabTunnel.prototype.Gdd = KLabTunnel.prototype.GET = KLabTunnel.prototype.get;
	KLabTunnel.prototype.Add = KLabTunnel.prototype.POST = KLabTunnel.prototype.add;
	KLabTunnel.prototype.All = KLabTunnel.prototype.SEARCH = KLabTunnel.prototype.browse = KLabTunnel.prototype.all;
	KLabTunnel.prototype.Set = KLabTunnel.prototype.PUT = KLabTunnel.prototype.set;
	KLabTunnel.prototype.Del = KLabTunnel.prototype.DELETE = KLabTunnel.prototype.del;

	for (var item in KLabTunnel.prototype){
		Net[item] = KLabTunnel.prototype[item];	
	}

	Net.POST = Net.add;
	Net.GET = Net.get;
	Net.DELETE = Net.del;
	Net.PUT = Net.set;
	Net.SEARCH = Net.all;

	Net.bindChannel = function(url, remoteChannel, localChannel){
		if (window.Channels && url){
			if (!localChannel) localChannel = "/";
			if (!remoteChannel) remoteChannel = "/";
			if (remoteChannel.start("/")) {
				remoteChannel = remoteChannel.replace("/", "");
			}
			url = new Url(url);
			if (url.pathname.ends("/")){
				url.pathname += remoteChannel;
			}
			else{
				url.pathname += "/" + remoteChannel;
			}
			
			if (window.io){

			}
			else{
				var httpChannel = new HttpChannel(url, function(messages){
					if (messages && messages.length){
						var message = messages[0];
						if (message && message.source){
							message = messages[0] = localChannel + message.source;
						}
						message = messages[0] = Channel.ParsePath(message);
						message.remote = true;
						Channels.emit.apply(Channels, messages);						
					}
				});
				Channels.on(localChannel, function(message){
					try{
						if (!this.remote){
							var params = [];
							for (var i = 0; i < arguments.length; i++){
								params.push(arguments[i]);
							}
							httpChannel.write(JSON.stringify(params) + "\n");
						}
					}
					catch(e){
						console.log(e);
					}					
				});
				return httpChannel;
			}
		}
	}

	Net.Online = false;
	WS.DOMload(function(){
		EV.CreateEvent("OnConnectionState", Net);
	});
}
