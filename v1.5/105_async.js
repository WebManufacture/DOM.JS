if (typeof(setImmediate) != "function"){
	function setImmediate(callback){
		setTimeout(callback, 1);
	}
}

Async = {
	Sync : function(){
		this.counter = 0;
		this.methods = 0;
	},

	Waterfall : function(callback){
		this.counter = 0;
		this.handlers = [];
		this._doneMethod = callback;
	},


	Collector : function(immediatly){
		var count = 0;
		if (typeof (count) == 'boolean'){
			this.immediatly = count;
			if (typeof (immediatly) == 'number') count = immediatly;
		}
		else{
			if (typeof (immediatly) == 'boolean'){
				this.immediatly = immediatly;
			}
		}
		this.methods = [];
		if (count > 0){
			this.handlers = new Array(count);
			this.results = new Array(count);
			this.count = count;
		}
		else{
			this.handlers = [];
			this.results = [];
			this.count = 0;
		}
	},
};

Async.Sync.prototype = {
	callThere: function(callback){
		callback.ready = true;
		this.handlers.push(callback);
		return callback;
	},

	check: function(){
		var syncProto = this;
		var i = this.handlers.length;						
		var func = function(){
			syncProto.handlers[i] = {};
			syncProto.handlers[i].ready = true;
			syncProto._checkHandlers();
		}						
		func.ready = false;
		this.handlers[i] = func;
		return func;
	},

	add: function(callback){
		var self = this;
		var i = this.handlers.length;						
		var func = function(){
			if (callback){
				callback();
			}
			self.handlers[i] = "done";
			self._checkHandlers();
		};		
		this.handlers.push(func);
		return func;
	},

	_checkHandlers : function(){
		var handlersReady = true;
		for (var j = 0; j < this.handlers.length; j++){
			handlersReady = handlersReady && (this.handlers[j].ready);
		}
		if (handlersReady){	
			for (var j = 0; j < this.handlers.length; j++){
				var hCall = this.handlers[j];
				if (typeof(hCall) == 'function'){
					hCall.apply(hCall.thisParam, hCall.args);
				}
			}
		}
	}
};

Async.Collector.prototype = {
	add : function(callback){
		var cb = this.getResultCallback();
		var func = function(){
			callback(cb);
		};		
		this.methods.push(func);
		if (this.immediatly) setImmediate(func); 
		return func;
	},
	
	createParametrizedCallback : function(param, thisParam, callback){
		if (typeof (thisParam) == 'function')  {
			callback = thisParam;
			thisParam = this;
		}
		if (!thisParam) thisParam = this;
		var cb = this.getResultCallback();
		if (!param) param = cb;
		var func = function(){
			callback.call(thisParam, param, cb);
		};		
		this.methods.push(func);
		if (this.immediatly) setImmediate(func); 
		return func;
	},

	run : function(callback){
		for (var i = 0; i < this.methods.length; i++){
			setImmediate(this.methods[i]); 
		}
		this.emit('start');
	},

	getResultCallback : function(){
		var syncProto = this;
		this.count++;
		var i = this.count - 1;
		var func = function(result){
			syncProto.handlers[i] = true;
			syncProto.results[i] = result;
			syncProto.emit('handler', result, i);
			syncProto._checkDone();
		};		
		return func;
	},

	_checkDone : function(){
		var handlersReady = true;
		for (var j = 0; j < this.count; j++){
			handlersReady = handlersReady && this.handlers[j];
		}
		if (handlersReady){	
			this.done();
		}
	},

	done : function(){
		this.emit('done', this.results);
	}
};

Async.Waterfall.prototype = {
	addClosure : function(){
		return this.add(CreateClosure.apply(this, arguments));
	},
	
	add: function(callback){
		var self = this;
		var func = function(){
			if (callback){
				callback.apply(self, arguments);
			}
			self.counter--;
			self._checkDone();
		};				
		this.counter++;
		return func;
	},

	_checkDone : function(){
		if (this.counter == 0 && typeof(this._doneMethod) == 'function'){
			var self = this;
			setTimeout(function(){
				self._doneMethod();
			}, 1);
		}
	},
};
