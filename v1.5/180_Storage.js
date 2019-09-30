if (!UsingDOM("KLabStorage")){
	
	SimpleStorage = function(url){
		this.url = url;	
		this.tunnel = new KLabTunnel(url, false);
		if (window.Channel){
			this.channel = new Channel();	
		}
	};
	
	SimpleStorage.prototype = {
		on : function(){
			return this.channel.on.apply(this.channel, arguments);
		},
		
		once : function(){
			return this.channel.once.apply(this.channel, arguments);
		},
		
		emit : function(){
			return this.channel.emit.apply(this.channel, arguments);
		},
		
		_sendRequest : function(type, data, callback){
			var storage = this;
			return this.tunnel.POST("?action=" + type, JSON.stringify(data), function(result){
				if (callback){
					callback.call(this, result, storage);
				}
				if (storage.channel){
					storage.channel.emit(type + "." + this.id, result);	
				}
			});
		},
		
		all : function(searchobj, callback) {
			if (!callback && typeof(searchobj) == "function") {
				callback = searchobj;	
				searchobj = null;
			}
			return this._sendRequest("all", searchobj, callback);
		},
		
		get : function(searchobj, callback) {
			return this._sendRequest("get", searchobj, callback);
		},
		
		add : function(dataobj, callback) {
			return this._sendRequest("add", dataobj, callback);
		},
		
		
		set : function(dataobj, callback) {
			return this._sendRequest("set", dataobj, callback);
		},
		
		del : function(dataobj, callback) {
			return this._sendRequest("del", dataobj, callback);
		}
	};
	
	SimpleStorage.prototype.load = SimpleStorage.prototype.all;
	
	KLabStorage = {};
	
	KLabStorage.Init = function(){
		
	};
	
	KLabStorage.GetStorage = function(url){
		return new KLabServerStorage(url);
	};
	
	function KLabServerStorage(url){
		this.tunnel = KLabNet.GetTunnel(url);
		this.url = Url.Resolve(url);
	};
	
	KLabServerStorage.prototype = {
		get : function(path){
			var klabObj = new KLabStorageAsyncObj(path);
			klabObj._parent = this;
			klabObj._state = KLabObjectStates.INPROGRESS;
			var rq = this.tunnel.get(this._baseUrl + path);
			rq.obj = this;
			rq.callback = function(result, status){
				if (result && result.length > 0){
					var res = JSON.parse(result);
					for (var item in res){
						if (item == "_id"){
							klabObj.id = res[item];	
						}
						else{
							klabObj[item] = res[item];
						}
					}
					klabObj._synchronize();
				}
			};
			rq.send();
			return klabObj;
		},
		
		all : function(path){
			return new KLabStorageAsyncObj(path);
		},
		
		add : function(obj){
			return new KLabStorageAsyncObj(obj);
		},
		
		set : function(obj){
			return new KLabStorageAsyncObj(obj);
		},
		
		del : function(obj){
			return new KLabStorageAsyncObj(obj);
		},
		
		each : function(func){
			
		}
	};
	
	KLabObjectStates = {
		CREATED : 0,
		INPROGRESS : 10,
		WAITING : 15,
		SYNCHRONIZED : 20,
	}
		
		function KLabStorageAsyncObj(path, syncFunc){
			this._path = path;
			this._syncFunc = syncFunc;
			this._state = KLabObjectStates.CREATED;
		};
	
	KLabStorageAsyncObj.prototype = {
		_synchronize : function(){
			this._state = KLabObjectStates.SYNCHRONIZED;
			if (typeof(this._onsync) == 'function'){
				this._onsync();	
			}
		},
		
		sync : function(func){
			//if (this._state < KLabObjectStates.SYNCHRONIZED
			this._onsync = func;
			this._syncFunc();
		},
		
		get : function(path){
			return new KLabStorageAsyncObj(path);
		},
		
		all : function(path){
			return new KLabStorageAsyncObj(path);
		},
		
		add : function(obj){
			return new KLabStorageAsyncObj(obj);
		},
		
		set : function(obj){
			return new KLabStorageAsyncObj(obj);
		},
		
		del : function(obj){
			return new KLabStorageAsyncObj(obj);
		},
		
		each : function(func){
			
		}
	};
	
	function KLabCachedStorage(url, readyfunc){
		var storage = this;
		this._tunnel = new KLabTunnel(url, true);
		this._baseUrl = Url.Resolve(url);
		this.itemsState = localStorage[this._baseUrl + "/_states"];
		if (!this.itemsState){
			this.itemsState	= {};
		}
		else{
			this.itemsState = JSON.parse(this.itemsState);
		}
		EV.CreateEvent("OnObjectChangedAsync", this);
		window.setInterval(function(){
			storage._checkHistory();
		}, 3000);
		EV.CreateEvent("OnServerEvent", this);		
		EV.CreateEvent("OnItemStateUpdatedAsync", this);
		this.OnServerEvent.subscribe(function(condition, obj){storage._onAddServerback(obj);}, "ADD");
		this.OnServerEvent.subscribe(function(condition, obj){storage._onDelServerback(obj);}, "DEL");
		this.OnServerEvent.subscribe(function(condition, obj){storage._onSetServerback(obj);}, "SET");
		this._tunnel.OnConnected.subscribe(function(condition, obj){storage._synchronizeCache();});
	};
	
	KLabCachedStorage.prototype = {
		
		
		_clearCache : function(){
			this.cache = null;
			localStorage.removeItem(this._baseUrl);
			localStorage.removeItem(this._baseUrl + "/_states");
		},
		
		
		_updateServerItem : function(item){
			item.id = item._id;
			delete item._id;
			return item;
		},
		
		
		_saveLocalCache : function(){
			localStorage[this._baseUrl] = JSON.stringify(this.cache);
			localStorage[this._baseUrl + "/_states"] = JSON.stringify(this.itemsState);
		},
		
		_synchronizeCache : function(){
			if (Net.Online){
				for (var item in this.itemsState){
					this._synchronizeItem(item, this.cache.get({id: item}));
				}
			}
		},
		
		_synchronizeItem : function(id, obj){
			var storage = this;
			if (this.itemsState[id] == "deleted" && Net.Online){
				this._tunnel.del("?id=" + id, function(result){
					delete storage.itemsState[id];
					storage._saveLocalCache();
				});
				return;
			}
			if (this.itemsState[id] == "modified" && Net.Online && obj){
				this._tunnel.set("?id=" + id, JSON.stringify(obj), function(result){
					delete storage.itemsState[id];
					storage._saveLocalCache();
				});
			}
			if (this.itemsState[id] == "added" && Net.Online && obj){
				delete obj.id;
				this._tunnel.add("", JSON.stringify(obj), function(result){
					if (result){
						result = JSON.parse(result);
						if (result.internalNum){
							obj.id = result._id;
							delete storage.itemsState[obj.id];
							delete storage.itemsState[result.internalNum];
							storage._saveLocalCache();
							storage.OnItemStateUpdatedAsync.fire("ADD", obj)
						}					
					}
				});
			}
		},
		
		_FillItems : function(path, readyFunc){
			var obj = this;
			this._tunnel.all(path, function(result){
				if (result && result.length > 0){
					obj.cache = JSON.parse(result);
					for (var i = obj.cache.length-1; i >= 0 ; i--){
						var item = obj.cache[i];
						if (!item._id){
							obj.cache.splice(i, 1);
							continue;
						}
						if (item._id == "000000000000000000000000"){
							localStorage[obj._baseUrl + "/_history"] = item.counter;
							obj.cache.splice(i, 1);
							continue;
						}
						obj._updateServerItem(item);
					}
					obj._saveLocalCache();
				}
				else{
					obj.cache = [];
					obj._saveLocalCache();
				}
				if (readyFunc){
					readyFunc.call(obj, obj.cache);
				}
			});
			return this;			
		},
		
		_checkHistory : function(){
			if (Net.Online && this.cache){
				this._synchronizeCache();
				var lh = localStorage[this._baseUrl + "/_history"];
				if (lh){
					var rq = this._tunnel.all("/_history?last_history=" + lh);	
				}
				else{
					this._clearCache();
					this._FillItems("/*");
					return;
				}
				rq.storage = this;
				rq.callback = this._historyReturned;
				rq.send();
			}
		},
		
		_historyReturned: function(result){
			if (result && result.length > 0){
				this.storage._processHistory(JSON.parse(result));	
			}
			else{
				this.storage._clearCache();
				this.storage._FillItems("/*");
			}			
		},
		
		_processHistory : function(items){
			var storage = this;
			var lh = localStorage[this._baseUrl + "/_history"];
			if (!lh) lh = 0;
			var last_history_counter = parseInt(lh);
			items.each(function(item){
				if (item.counter > last_history_counter){
					last_history_counter = item.counter;
				};
				storage.OnServerEvent.fire(item.action, item);
			});
			localStorage[this._baseUrl + "/_history"] = last_history_counter;
		},
		
		_onAddServerback : function(obj){
			if (obj.id){
				var index = this.cache.getIndex({id: obj.id});
				if (index == null){
					this.get("?id=" + obj.id, function(obj, tunnel){
						tunnel.cache.push(tunnel._updateServerItem(obj));
						tunnel._saveLocalCache();
						tunnel.OnItemStateUpdatedAsync.fire("ADD", obj);
					});
				}
				else{
					this.get("?id=" + obj.id, function(obj, tunnel){
						tunnel.cache[index] = tunnel._updateServerItem(obj);
						tunnel._saveLocalCache();
						tunnel.OnItemStateUpdatedAsync.fire("ADD", obj);
					});
				}
			}
		},
		
		_onDelServerback : function(obj){
			if (obj.id){
				var index = this.cache.getIndex({id: obj.id});
				if (index != null){
					this.cache.splice(index, 1);
					this._saveLocalCache();
				}
				
			}
			this.OnItemStateUpdatedAsync.fire("DEL", obj);
		},
		
		_onSetServerback : function(obj){
			if (obj.id){
				var index = this.cache.getIndex({id: obj.id});
				
				this.get("?id=" + obj.id, function(obj, tunnel){
					if (index != null){
						tunnel.cache[index] = tunnel._updateServerItem(obj);
					}
					else{
						tunnel.cache.push(tunnel._updateServerItem(obj));
					}
					tunnel._saveLocalCache();
					tunnel.OnItemStateUpdatedAsync.fire("SET", obj);
				});
			}
		},
		
		Refresh : function(readyFunc){
			var ls = localStorage[this._baseUrl];
			if (ls){
				this.cache = JSON.parse(ls);
				if (readyFunc){
					readyFunc.call(this, this.cache);
				}
			}
			else{
				this._FillItems("/*", readyFunc);
			}
		},
		
		
		Sort : function(fieldName){
			if (!fieldName) return;
			this.cache.sort(function(item1, item2){
				if(item1[fieldName] < item2[fieldName]) return -1; // Или любое число, меньшее нуля
				if(item1[fieldName] > item2[fieldName]) return 1;  // Или любое число, большее нуля
				return 0;
			});
		},
		
		get : function(path, callback){
			var obj = this;
			this._tunnel.get(path, function(result){
				if (result && result.length > 0){
					result = JSON.parse(result);
					callback(result, obj);
					return;
				}
				callback(null, obj);
			});
			return this;
		},
		
		
		all : function(path){
			var obj = this;
			if (!path) path = "/*";
			this._tunnel.all(path, function(result){
				if (result && result.length > 0){
					result = JSON.parse(result);
					callback(result, obj);
					return;
				}
				callback(null, obj);
			});
			return this;
		},
		
		add : function(obj){
			var cache = this.cache;
			var storage = this;
			if (this.cache){
				this.cache.push(obj);
				this._saveLocalCache();
			}
			this.itemsState[obj.id] = "added";
		},
		
		set : function(obj){
			var storage = this;
			if (this.cache){
				for (var i = 0; i < this.cache.length; i++){
					if (this.cache[i].id == obj.id){
						this.cache[i] = obj;
					}
				}
				this.itemsState[obj.id] = "modified";
				localStorage[this._baseUrl] = JSON.stringify(this.cache);
			}
			return this;
		},
		
		del : function(obj){
			var storage = this;
			if (this.cache && obj.id){
				for (var i = 0; i < this.cache.length; i++){
					if (this.cache[i].id == obj.id){
						this.cache.splice(i, 1);						
						
					}
				}
				this.itemsState[obj.id] = "deleted";
				localStorage[this._baseUrl] = JSON.stringify(this.cache);
			}
		},
		
		each : function(func){
			for (var i = 0; i < this.cache.length; i++){
				func.call(this,this.cache[i]);
			}
		}
	};
	
	function CachedStorage(url) {
    var storage = this;
    this._tunnel = Net.GetTunnel(url);
};

CachedStorage.prototype = {
    Refresh: function (readyFunc, itemready) {
        var storage = this;
        this.all(
            function () {
                storage._refreshIndexes();
                if (readyFunc) readyFunc(storage.items);
            },
            function (result) {
                if (!storage.items) storage.items = [];
                storage.items.push(result);
                if (itemready) {
                    window.setTimeout(function () {
                        itemready(result);
                    }, 100);
                }
            }
        );
    },

    _refreshIndexes: function () {
        this.indexes = {};
        for (var i = 0; i < this.items.length; i++) {
            var id = this.items[i].id;
            this.indexes[id] = i;
        }
    },
	
	Select : function(start, count){
		return this.items.slice(start, start + count);	
	},

    Sort: function (fieldName) {
        if (!fieldName || !this.items) return;
        this.items.sort(function (item1, item2) {
            if (item1[fieldName] < item2[fieldName]) return -1; // Или любое число, меньшее нуля
            if (item1[fieldName] > item2[fieldName]) return 1;  // Или любое число, большее нуля
            return 0;
        });
    },
	
	Filter : function(searchexp, callback, limit){
		var items = 0;
		this.items.each(function(item){
			for (var name in item){				
				if (typeof(item[name]) == 'string' && item[name].contains(searchexp)){
					window.setTimeout(function(){
						callback(item);	
					},100);
					items++;
					if (limit && items >= limit){
						return false;	
					}
					break;				
				}
				if (typeof(item[name]) == 'object'){
					var item2 = item[name];
					for (var name2 in item2){	
						if (typeof(item2[name2]) == 'string' && item2[name2].contains(searchexp)){
							window.setTimeout(function(){
								callback(item);	
							},100);
							items++;
							if (limit && items >= limit){
								return false;	
							}
							break;				
						}
					}
				}
			}
			return true;
		});
	},

    get: function (id, callback) {
        if (this.indexes && this.indexes.length > 0) {
            var ind = this.indexes[id];
            if (ind != undefined && ind != null) {
                callback(this.items[ind]);
                return this;
            }
        }
        this._tunnel.GET("?action=get&id=" + id, function (result) { callback(JSON.parse(result.replace(/\n/g, " "))); });
        return this;
    },

    all: function (callback, onitemcallback) {
        if (this.items) {
            callback(this.items);
            return this;
        }
        if (onitemcallback) {
            var req = this._tunnel.GET("?action=all&chunked=all");
            req.lastStateChar = 0;
            req.onreadystatechange = function () {
                if (this.readyState == 3) {
                    var result = this.responseText;
                    if (result && result.length > 0 && result.length - 1 > this.lastStateChar && this.status == 200) {
                        var end = result.lastIndexOf("\n");
                        result = result.substring(this.lastStateChar, end);
                        this.lastStateChar = end + 1;
                        result = result.split("\n");
                        for (var i = 0; i < result.length; i++) {
                            var obj = result[i];
                            if (obj.length > 2) {
                                try {
                                    obj = JSON.parse(obj);
                                    onitemcallback(obj);
                                }
                                catch (err) {
                                    console.log('error parsing object');
                                    console.log(obj);
                                }
                            }
                        } /*
                        var endCharIndex = result.indexOf("}", this.lastStateChar);
                        while (endCharIndex > 0) {
                            
                            this.lastStateChar = endCharIndex + 1;
                            endCharIndex = result.indexOf("}", this.lastStateChar)
                        } */
                    }
                }
                if (this.readyState == 4) {
                    callback(this.responseText);
                }
            };
            req.send();
        }
        else {
            var req = this._tunnel.GET("?action=all", function (result) { callback(JSON.parse(result.replace(/\n/g, " "))); });
        }
        return this;
    },

    add: function (obj, callback) {
        if (this.items) {
            this.items.push(obj);
        }
        this._tunnel.POST("?action=add", JSON.stringify(obj), callback);
        return this;
    },

    set: function (obj, callback) {
        if (obj.id) {
            if (this.indexes) {
                var ind = this.indexes[id];
                if (ind != undefined && ind != null) {
                    this.items[ind] = obj;
                }
            }
            this._tunnel.POST("?action=update&id=" + id, JSON.stringify(obj), callback);
        }
        return this;
    },

    del: function (obj, callback) {
        if (obj.id) {
            if (this.indexes) {
                var ind = this.indexes[id];
                if (ind != undefined && ind != null) {
                    this.items.splice(ind, 1);
                }
            }
            this._tunnel.POST("?action=delete&id=" + obj.id, callback);
        }
        return this;
    },

    each: function (func) {
        if (this.items) {
            for (var i = 0; i < this.items.length; i++) {
                func(this.items[i]);
            }
        }
    }
};
	
	WS.DOMload(KLabStorage.Init);

	StorageLayer = function(objects){
		if (!objects) objects = [];
		this.objects = objects;
		this.indexes = {};
		this.internals = {};
		this.types = {

		};
		this.classes = {

		};	
		if (objects){		
			this._fillIndexes(this.objects);
		}
	}

	StorageLayer.prototype = {		
		_fillIndexes: function(data){
			if (!data) return;
			for(var i = 0; i < data.length; i++){
				var obj = data[i];
				if (obj.id){
					if (this.indexes[obj.id]){
						if (!this.indexes[obj.id].length){
							this.indexes[obj.id] = [this.indexes[obj.id]]
						}
						this.indexes[obj.id].push(obj);
					}
					else{
						this.indexes[obj.id] = obj;
					}
				}
				if (obj._intID){
					this.internals[obj._intID] = obj;
				}
				var type = obj.type;
				if (type){
					if (!this.types[type]) this.types[type] = [];
					this.types[type].push(obj);
				}
				if (data[i].tags){
					var classes = data[i].tags.split(' ');
					for(var cl = 0; cl < classes.length; cl++){
						if (classes[cl]){
							if (!this.classes[classes[cl]]){
								this.classes[classes[cl]] = [];
							}
							this.classes[classes[cl]].push(data[i]);
						}
					}
				}
			}
		},	

		_filterByClasses: function(selector, items){
			if (!items) return [];
			if (!selector.tags) return [].concat(items);
			var arr = [];
			for (var i = 0; i < items.length; i++){
				if (selector.is(items[i])) arr.push(items[i]);
			}
			return arr;
		},

		_getByClasses: function(selector, items){
			if (!items || !selector) return null;
			for (var i = 0; i < items.length; i++){
				if (selector.is(items[i])) return items[i];
			}
			return null;
		},


		_queryInternal: function(selector, item){
			if (!selector) return null;
			if (selector.id){
				var candidate = this.indexes[selector.id];
				if (candidate && candidate.length){
					candidate = candidate[0];
				}
				if (!candidate || !selector.is(candidate)) return null;			
				return candidate;
			}
			var candidates = this.objects;
			if (selector.type){
				if (selector.type != "*"){
					var candidates = this.types[selector.type];
					if (!candidates) return null;
				}
			}
			return this._getByClasses(selector, candidates);
		},


		_queryAllInternal: function(selector){
			if (!selector) return;
			if (selector.id){
				var candidate = this.indexes[selector.id];
				if (candidate && candidate.length){
					var newCandidates = [];
					for (var i = 0; i < candidate.length; i++){
						if (selector.is(candidate[i])){
							newCandidates.push(candidate[i]);
						};
					}
					return newCandidates;
				}
				if (!candidate || !selector.is(candidate)) return [];			
				return [candidate];
			}		
			if (selector.type && selector.type != "*"){
				var candidates = this.types[selector.type];
			}
			else{
				var candidates = this.objects;	
			}
			return this._filterByClasses(selector, candidates);
		},

		all : function(selector, callback){
			if (typeof(selector) == 'string') selector = new Selector(selector);
			return this._queryAllInternal(selector);
		},

		get : function(selector){
			if (typeof(selector) == 'string') selector = new Selector(selector);
			return this._queryInternal(selector);
		},

		resolveExternalLinks : function(resolver){
			if (typeof resolver == "function"){
				for (var cl = 0; cl < this.objects.length; cl++){
					var obj = this.objects[cl];	

				}	
			}
		},

		add : function(obj){
			if (obj){
				if (obj.id){
					if (this.indexes[obj.id]){
						if (!this.indexes[obj.id].length){
							this.indexes[obj.id] = [this.indexes[obj.id]]
						}
						this.indexes[obj.id].push(obj);
					}
					else{
						this.indexes[obj.id] = obj;
					}
				}
				if (obj.type){
					if (!this.types[obj.type]) this.types[obj.type] = [];
					this.types[obj.type].push(obj);
				}
				if (obj.classes){
					for (var cl = 0; cl < obj.classes.length; cl++){
						var tag = obj.classes[cl];	
						if (!this.classes[tag]) this.classes[tag] = [];
						this.classes[tag].push(obj);
					}				
				}
				if (obj._intID){
					this.internals[obj._intID] = obj;
				}
				this.objects.push(obj);
				return obj;
			}
			return null;
		},

		del : function(obj){
			if (obj){
				var result = false;
				for (var i = 0; i < this.objects.length; i++){
					if (this.objects[i] == obj){
						this.objects.splice(i, 1);
						result = true;
						break;
					};
				}
				if (result){
					if (obj.id && this.indexes[obj.id]){
						delete this.indexes[obj.id];
					}
					if (obj.type && this.types[obj.type]){
						var items = this.types[obj.type];
						for (var i = 0; i < items.length; i++){
							if (items[i] == obj){
								items.splice(i, 1);
								break;
							};
						}
					}
					if (obj.classes){
						for (var cl = 0; cl < obj.classes.length; cl++){
							var tag = obj.classes[cl];	
							var items = this.classes[tag];
							for (var i = 0; i < items.length; i++){
								if (items[i] == obj){
									items.splice(i, 1);
									break;
								};
							}
						}				
					}
				}
				return result;
			}
			return false;
		}
	};

	Storage = function(file, createIfNotExists){
		if (file) file = Path.resolve(file);
		var stor = this;
		this.Init = function(){
			if (!stor.closed){
				stor.layers = [];
			}
		}

		function Watch(){
			if (!stor.watching){
				this.watcher = fs.watch(file, {}, function(event, fname){
					console.log("Reloading storage: " + fname + " " + event);
					if (!stor.selfChange && !stor.closed && !stor.reloading){
						stor.Reload();
					}
				});
				stor.watching = true;
			}
		}

		this.Reload = function(create){
			if (!stor.closed && !stor.reloading){
				stor.Init();
				if (stor.file){
					var exists = fs.existsSync(stor.file);
					if (exists || create){
						stor.reloading = true;
						if (exists){
							fs.readFile(stor.file, function(err, data){
								var objects = JSON.parse(data);
								if (!objects){
									console.warn("Loading storage " + stor.file + " EMPTY!")
								}
								else{
									console.log("Loading storage " + stor.file + " " + objects.length + " items")
								}
								stor._loadStore(objects);
								stor.emit("store-loaded");
								Watch();
								stor.reloading = false;	
							});						
						}				
						else{
							stor.emit("store-loaded");
							stor.reloading = false;	
							if (create) { stor._save(); };
							Watch();
						}					
					}
					else{
						console.error("Deleted " + stor.file);
						stor._close();	
					}
				}
			}
		}
		stor.file = file;
		this.Reload(createIfNotExists);
	}

	Storage.Delete = function(storage){
		if (!storage.closed){
			storage._close();
		}
		if (storage.file && fs.existsSync(storage.file)){
			fs.unlinkSync(storage.file);
		}
	}

	Inherit(Storage, EventEmitter, {
		_close : function(){
			this.objects = null;
			this.indexes = null;
			this.items = null;
			this.classes = null;
			if (this.watcher){
				this.watcher.close();
			}
			this.closed = true;
		},

		_loadStore : function(objects){
			this.layers = [new StorageLayer()];
			if (objects){
				for (var i = 0; i < objects.length; i++){
					this._addToLayer(0, objects[i]);
				}
			}
		},

		LoadData : function(objects){
			if (util.isArray(objects)){
				return this._loadStore;
			}
			return this._loadStore([objects]);
		},

		_save : function(){
			if (this.file && !this.closed){
				var stor = this;
				if (stor.reloading){
					setTimeout(function(){
						stor._save();
					}, 200);
					return;
				}
				this.selfChange = true;
				var objects = [];
				if (this.layers.length > 0){
					objects = this.layers[0].objects;
				}
				fs.writeFileSync(this.file, JSON.stringify(objects));
				this.selfChange = false;
			}
		},


		_hasParentInLayer : function(layerNum, obj, parentID){
			if (!obj) return null;
			if (obj.__layer <= layerNum){
				return obj._intID == parentID;
			}
			var layer = this.layers[obj.__layer - 1];
			if (!layer) return null;
			var parentObj = layer.internals[obj._parentID];
			return this._hasParentInLayer(layerNum, parentObj, parentID);
		},

		_getFromLayer : function(layerNum, selector, parentID){
			if (!this.layers[layerNum]) return null;
			if (!selector) return null;
			var items = this.layers[layerNum].all(selector);
			if (!items || !items.length){			
				if (!parentID && !selector.isRoot){
					return this._getFromLayer(layerNum+1, selector);
				}
				else{
					return null;
				}
			}
			else{
				if (!parentID && !selector.isRoot){
					var items2 = this._getFromLayer(layerNum+1, selector);
				}
			}
			if (parentID){
				for (var i = 0; i < items.length; i++){
					var item = items[i];
					if (item._parentID != parentID){
						items.splice(i,1);
						i--;
					}
				}
			}
			if (!items.length) return null;
			if (selector.next){
				var result = [];
				if (items2 && items2.length){
					result = result.concat(items2);
				}
				for (var i = 0; i < items.length; i++){
					var fItems = this._getFromLayer(layerNum + 1, selector.next,items[i]._intID);
					if (fItems){
						result = result.concat(fItems);					   
					}
				}
				return result;
			}
			if (selector.follow){
				var result = []; 
				if (items2 && items2.length){
					result = result.concat(items2);
				}
				for (var i = 0; i < items.length; i++){
					var fItems = this._getFromLayer(layerNum + 1, selector.follow);
					if (fItems){
						for (var ff = 0; ff < fItems.length; ff++){
							if (!this._hasParentInLayer(layerNum, fItems[ff], items[i]._intID)){
								fItems.splice(ff, 1);
								ff--;
							};
						}
						result = result.concat(fItems);					   
					}
				}
				return result;
			}
			if (items2 && items2.length){
				items = items.concat(items2);
			}
			return items
		},
		
		
		_getObjects : function(data){
			if (!data) return null;
			if (!data.length) return [];
			for (var i = 0; i < data.length; i++){
				data[i] = this._getObject(data[i]);
			}
			return data;
		},

		_getObject : function(data){
			if (data){
				if (typeof(data) == 'string') 
					data = new Selector(data);
				else{
					data.__proto__ = StorageObjectPrototype;		   
					if (data.childs) data.childs = this._getObjects(data.childs);
					if (data.next) data.next = this._getObjects(data.next);
					if (data.follow) data.follow = this._getObjects(data.follow);
				}
			}
			return data;
		},
		

		_getId : function(){
			return ("" + Math.random()).replace("0.", "") + ("" + Math.random()).replace("0.", "");	
		},

		_addToLayer : function(layerNum, data, parentId){
			if (!data) return null;
			if (!this.layers[layerNum]) this.layers[layerNum] = new StorageLayer();
			if (!data._intID) data._intID = this._getId();
			if (parentId && !data._parentID) data._parentID = parentId;
			if (!data.__layer) data.__layer = layerNum;
			if (this.layers[layerNum].internals[data._intID]) return null;
			this.layers[layerNum].add(data);
			if (data.childs){
				for (var i = 0; i < data.childs.length; i++){
					this._addToLayer(layerNum + 1, data.childs[i], data._intID);				
				}	
			}
			if (data.next){
				this._addToLayer(layerNum + 1, data.next, data._intID);				
			}
			if (data.follow){
				this._addToLayer(layerNum + 1, data.follow, data._intID);				
			}
			return data;
		},


		_formatObject : function(selector, data){
			var internalProps = Selector.InternalProperties;
			if (!selector){
				return this._getObject(data);
			}
			if (!data){ 			
				return this._getObject(selector);
			}
			selector = this._getObject(selector);
			data = this._getObject(data)
			if (selector.id && !data.id){
				data.id = selector.id;
			}
			if (data.classes){
				for (var i = 0; i < data.classes.length; i++){
					if (!data.tags) data.tags = " ";
					var cls = data.classes[i];
					if (!data.tags.contains(" " + cls + " ")){
						data.tags += cls + " ";
					}
				}
			}		
			if (selector.tags && !selector.classes){
				selector.classes = selector.tags.trim().split(" ");
			}		
			if (selector.classes){
				for (var i = 0; i < selector.classes.length; i++){
					if (!data.tags) data.tags = " ";
					var cls = selector.classes[i];
					if (!data.tags.contains(" " + cls + " ")){
						data.tags += cls + " ";
					}
				}
			}		
			if (data.tags){
				data.classes = data.tags.trim().split(" ");
			}
			if (selector.type && !data.type){
				data.type = selector.type;
			}
			if (selector.childs){
				if (!data.childs) data.childs = [];
				data.childs = data.childs.concat(this._getObjects(selector.childs));
			}		
			if (!data.next) data.next = selector.next;
			if (!data.follow) data.follow = selector.follow;
			for (var item in selector){
				if (typeof data[item] == "undefined" && !internalProps.contains(item)){
					data[item] = selector[item];
				}
			}
			return data;
		},
		getByKey : function(key){
			for (var i = 0; i < this.layers.length; i++){
				if (this.layers.internals[key]){
					return this.layers.internals[key];
				}
			}
			return null;
		},


		all : function(selector, data){
			if (this.layers.length == 0) return [];
			var items = null;
			var me = this;
			if (typeof(data) == 'function'){ 
				var callback = data;
				setImmediate(function(){
					callback.call(me, items ? items : []);
				});
				data = null;
			}
			selector = this._formatObject(selector, data);
			if (!selector) selector = "*";
			var layerNum = 0;
			items = this._getFromLayer(layerNum, selector);
			return items ? items : [];
		},
		
		get : function(selector, data){
			var items = null;
			var me = this;
			if (typeof(data) == 'function'){ 
				var callback = data;
				setImmediate(function(){
					callback.call(me, (items && items.length > 0) ? items[0] : null);
				});
				data = null;
			}	
			if (this.layers.length > 0) {
				selector = this._formatObject(selector, data);
				if (!selector) selector = "*";
				var layerNum = 0;
				items = this._getFromLayer(layerNum, selector);
			}
			return (items && items.length > 0) ? items[0] : null;
		},


		set : function(selector, data){
			if (!data) data = selector;
			data = this._formatObject(selector, data);
			if (data.id){
				if (this.indexes[data.id]){
					var obj = this.indexes[data.id];
					for (var item in data){
						obj[item] = data[item];
					}
				}
			}	
			else{

			}
			this._save();
			return null;
		},
		
		add : function(selector, data){
			if (!selector && !data) return;
			if (this.layers.length == 0) this.layers.push(new StorageLayer());
			var items = null;
			var me = this;
			if (typeof(data) == 'function'){ 
				var callback = data;
				setImmediate(function(){
					callback.call(me, data);
				});
				data = null;
			}
			data = this._formatObject(selector, data);
			//if (data._intID) data._intID = this._getId();
			
			this._addToLayer(0, data);
			this._save();
			return data;
		},

		del : function(selector, data){		
			selector = this._formatObject(selector, data);
			if (!selector) return;
			var count = 0;
			var me = this;
			if (typeof(data) == 'function'){ 
				var callback = data;
				setImmediate(function(){
					callback.call(me, count);
				});
				data = null;
			}
			for (var i = this.layers.length-1; i >= 0; i--){
				var all = this.layers[i].all(selector);
				for (var oi = all.length-1; oi >= 0; oi--){
					if (this.layers[i].del(all[oi])){
						count++;
					}
				}
			}
			this._save();
			return count;
		}
	});

	StorageObjectPrototype = {
		is: Selector.prototype.is,
		toString: function(){
			return this._intID + "";
		}
	}
	
}

