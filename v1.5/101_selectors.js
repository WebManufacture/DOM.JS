

Selector = function(str){
	this.source = "";
	if (str && typeof str == "string") {
		var item;
		//while (str.indexOf('') > 0)
		if (str.start("/") || str.start(">")){
			this.isRoot = true;
			this.source = str;
			str = str.substr(1);
		}
		var regex = new RegExp(Selector._regex, "ig");
		while((item = regex.exec(str)) != null){
			if (item[1] == ""){
				this._add(item[2], item[3]);
			}
			else{
				if (item[1] == " "){
					this._follow(new Selector(str.substr(item.index + 1)));
					break;
				}
				if (item[1] == "/" || item[1] == ">"){
					this._next(new Selector(str.substr(item.index + 1)));
					break;
				}
			}
		}
	}
}


Selector._regex = "([/>\\s]?)([#.:@]?)([\\w\\*='\"-]+)";

Selector.prototype = {
	_identify : function(symbol, entity){
		if (!entity) return;
		if (symbol == "" && !this.item){
			this.type = entity;
		}
		if (symbol == "#" && !this.id){
			this.id = entity;
		}		
		if (symbol == ":"){
			if (!this.meta) this.meta = {};
			this.meta[entity] = true;
		}
		if (symbol == "@"){
			var keyValue = entity.split("=");
			this[keyValue[0]] = keyValue.length > 1 ? keyValue[1] : null;
		}
		if (symbol == "."){
			if (!this.classes) this.classes = [];
			var tags = '';
			if (this.classes.length == 0){
				this.classes = [ entity ];
				this.tags = " " + entity + " ";
			}
			else{
				if (!this.tags.contains(" " + entity + " ")){
					this.tags = '';
					for (var i = 0; i < this.classes.length; i++){
						if (entity && this.classes[i] > entity){
							this.classes.splice(i, 0, entity);
							entity = null;
							break;							
						}
					}					
					if (entity){
						this.classes.push(entity);
					}
					for (var i = 0; i < this.classes.length; i++){
						this.tags += " " + this.classes[i];
					}
					this.tags += " ";
				}
			}
		}
	},
	
	is : function(selector){
		if (this.id && selector.id != this.id) return false;	
		if (this.type && this.type != "*" && selector.type != this.type) return false;	
		if (this.classes){
			if (selector.tags){
				var tags = " " + selector.tags + " ";
				for (var i = 0; i < this.classes.length; i++){
					var cls = this.classes[i];
					if (!tags.contains(" " + cls +  " ")){ return false; }
				}
			}
			else{
				if (this.classes.length > 0) return false;
			}
		}
		if (this.meta){
			for (var item in this.meta){
				if (!selector.meta[item]){ return false; }
			}
		}
		/*for (var item in this){
			if (!Selector.InternalProperties.contains(item)){
				if (selector[item] != this[item]){ return false; }
			}
		}*/
		return true;
	},
	
	add : function(){
		
	},
	
	has : function(){
		
		
	},
	
	set : function(){
		
		
	},
	
	del : function(){
		
		
	},	
	
	get : function(){
		
		
	},
	
	all : function(){
		
		
	},
	
	_add : function(symbol, entityName){
		if (typeof symbol != "string") return;
		if (!entityName && symbol.length >= 1){
			entityName = symbol.substr(1);
		}
		this.source += symbol + entityName;
		this._identify(symbol, entityName);
	},
	
	_next : function(selector){
		this.next = selector;
		return selector;
	},
	
	_follow : function(selector){
		this.follow = selector;
		return selector;
	}
}

Selector.Parse = function(txt){
	if (txt){
		var item;
		var items = [];
		var lines = txt.split('\n');	
		for (var i = 0; i < lines.length; i++){
			var parts = lines[i].split(',');		
			for (var j = 0; j < parts.length; j++){
				items.push(new Selector(parts[j]));
			}
		}
		return items;
	}	
}

Selector.InternalProperties = "_intID,_parentID,childs,follow,next,id,type,tags,classes";

Selector._rootNode = new Selector("root");

Selector._rootNode.isRoot = true;

Selector.first = Selector.single = function(txt){
	if (txt){
		return new Selector(txt);
	}	
}

