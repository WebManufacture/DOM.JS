function Check(arg){
	return arg != undefined && arg != null;
}
function check(arg){
	return arg != undefined && arg != null;
}

Extend = function(objToExtend, obj){
	for (var item in obj){
		objToExtend[item] = obj[item];
	}
}

function gfdp(dp){
	if (dp < 10) return "0" + dp;
	return dp + "";
}

Date.prototype.formatTime = function(withMilliseconds){
	if (withMilliseconds){
		return gfdp(this.getHours()) + ":" + gfdp(this.getMinutes()) + ":" + gfdp(this.getSeconds()) + "." + this.getMilliseconds();
	}
	else{
		return gfdp(this.getHours()) + ":" + gfdp(this.getMinutes()) + ":" + gfdp(this.getSeconds());
	}
};
Date.prototype.formatDate = function(separator, reverse){
	var date = this.getDate();
	date = gfdp(date);
	var month = this.getMonth() + 1;
	month = gfdp(month);
	if (!separator){ separator = "-" }
	if (reverse){
		return date + separator + month + separator + this.getFullYear();
	}
	else
	{
		return this.getFullYear() + separator + month + separator + date;
	}
};
Date.prototype.formatDateRus = function(){
	return this.formatDate('.', true);
};
Date.MonthRusNames = [
	"январь",
	"февраль",
	"март",
	"апрель",
	"май",
	"июнь",
	"июль",
	"август",
	"сентябрь",
	"октябрь",
	"ноябрь",
	"декабрь"
];
Date.prototype.formatRus = function(){
	var date = this.getDate();
	var month = Date.MonthRusNames[this.getMonth()];
	return date + " " + month + " " + this.getFullYear();
};
Date.ParseRus = function(value){
	var dt = value.split(" ");
	var time = null;
	if (dt.length > 1){
		var time = dt[1].split(":");
	}
	var date = dt[0].split(".");
	if (time){
		return new Date(parseInt(date[2]), parseInt(date[1]) - 1, parseInt(date[0]), parseInt(time[0]), parseInt(time[1]));
	}
	else{
		return new Date(parseInt(date[2]), parseInt(date[1]) - 1, parseInt(date[0]));
	}
};
Array.prototype.Contains = Array.prototype.contains = function(value){
	return this.indexOf(value) >= 0;
};


Array.prototype.Each = Array.prototype.each = function(func) {
	for (var i = 0; i < this.length; i++) {
		if (func.call(this[i], this[i]) == false){
			return;
		};
	}
};

Array.prototype.Get = Array.prototype.get = Array.prototype.search = function(obj) {
	if (typeof(obj) != 'object') return null;
	for (var i = 0; i < this.length; i++) {
		if (typeof(this[i]) != 'object') return;
		var allres = true;
		for (var item in obj){
			if (this[i][item] == undefined || this[i][item] != obj[item]) {
				allres = false;				
				break;
			}
		}
		if (allres) return this[i];
	}
	return null;
};


Array.prototype.GetIndex = Array.prototype.getIndex = function(obj) {
	if (typeof(obj) != 'object') return null;
	for (var i = 0; i < this.length; i++) {
		if (typeof(this[i]) != 'object') return;
		var allres = true;
		for (var item in obj){
			if (this[i][item] == undefined || this[i][item] != obj[item]) {
				allres = false;				
				break;
			}
		}
		if (allres) return i;
	}
	return null;
};

	String.prototype.Contains = function(str) {
		var type = typeof(str);
		if (type == "string"){
			return this.indexOf(str) >= 0;
		}
		if (str.length != undefined){
			for (var i = 0; i < str.length; i++) {
				if (this.indexOf(str[i]) >= 0) return true;
			}
		}
		return false;
	};
String.prototype.endsWith = String.prototype.end = String.prototype.ends = function(str)
	{
		return this.lastIndexOf(str) == this.length - str.length;
	};
function StringSelector(){
	return DOM(this);
};
//String.prototype.__defineGetter__("sel", StringSelector);
String.prototype.contains = String.prototype.has = function(substr){
	return this.indexOf(substr) > -1;
};
String.prototype.start = function(str){
	return this.indexOf(str) == 0;
};
String.prototype.get = function(regex){
	if (regex instanceof RegExp){
		var match = regex.exec(this);
		if (match.length > 0) return match[match.length - 1];
		return null;
	}
	return null;
};
function AssociatedArray(){
	this.objects = {};
	this.count = 0;
}
AssociatedArray.prototype = {
	add : function(name, elem){
		if (this.objects == undefined || this.objects == null)
		{
			this.objects = {};
		}
		var obj = this.objects[name];
		if (obj == undefined || obj == null)
		{
			this.count++;
		}
		if (elem == undefined || elem == null){
			this.count--;
		}
		this.objects[name] = elem;
		return this.count;
	},
	get : function(name){
		var obj = this.objects[name];
		if (obj != undefined && obj != null)
		{
			return obj;
		}
		return null;
	},
	remove : function(name){
		var obj = this.objects[name];
		if (obj != undefined && obj != null)
		{
			this.objects[name] = null;
			this.objects[name] = undefined;
			this.count--;
		}
		return this.count;
	}
};
function AArray(){
	var arr = [];
	arr.uadd = function(name){
		if (this.contains(name)) return null;
		this.push(name);
		return this.length;
	};
	arr.contains = function(name){
		return this.indexOf(name) >= 0;
	};
	arr.add = function(name, elem){
		if (this.objects == undefined || this.objects == null)
		{
			this.objects = {};
		}
		var obj = this.objects[name];
		if (obj == undefined || obj == null)
		{
			this.push(name);
			this.objects[name] = elem;
		}
		if (elem == undefined || elem == null){
			this.del(name);
		}
		return this.length;
	};
	arr.get = function(name){
		if (this.objects == undefined || this.objects == null)
		{
			this.objects = {};
		}
		var obj = this.objects[name];
		if (obj != undefined && obj != null)
		{
			return obj;
		}
		return null;
	};
	arr.del = function(name){
		if (this.objects == undefined || this.objects == null)
		{
			return this.length;
		}
		var obj = this.objects[name];
		if (obj != undefined && obj != null)
		{
			this.objects[name] = undefined;
			this.remove(name);
		}
		return this.length;
	};
	arr.insert = function(index, name, elem){
		if (this.objects == undefined || this.objects == null)
		{
			return this.length;
		}
		if (index == 0 && this.length == 0){
			this.add(name, elem);
		}
		if (index >= 0 && index < this.length)
		{
			this.objects[name] = elem;
			var other = this.slice(index);
			this[index] = name;
			index++;
			for (var i = 0; i < other.length; i++){
				this[index + i] = other[i];
			}
		}
		return this.length;
	};
	return arr;
}
Using = using = function(name){
	var obj = window[name.toLowerCase()];
	if (obj){
		if (window.debug && window.L) L.Warn("Reinitializing " + name + "!");
		return true;
	}
	else{
		SetAllCaseProperty(window, {}, name);
		return false;
	}
};
UsingDOM = usingDOM = function(name, sname){
	var lname = name.toLowerCase();
	var obj = document.querySelector("." + lname + ".provider");
	if (obj){
		if (check(sname)){
			SetAllCaseProperty(window, obj, sname);
		}
		else{
			SetAllCaseProperty(window, obj, name);
		}
		if (window.debug && window.L){
			if (L) L.Warn("Reinitializing " + name + "!");
		}
		return true;
	}
	else{
		obj = document.createElement("div");
		obj.className += lname + " provider system-object invisible";
		document.documentElement.appendChild(obj);
		if (check(sname)){
			SetAllCaseProperty(window, obj, sname);
		}
		else{
			SetAllCaseProperty(window, obj, name);
		}
		if (window.L){
			L.LogObject(obj);
		}
		return false;
	}
};
SetAllCaseProperty = function(obj, value, name){
	var lname = name.toLowerCase();
	var hname = name.toUpperCase();
	obj[lname] = value;
	obj[hname] = value;
	obj[name] = value;
}
	Exists = exists = function(name){
		var lname = name.toLowerCase();
		var obj = DOM.get("." + lname + ".provider");
		if (obj){
			if (window[lname] != obj){
				SetAllCaseProperty(window, obj, name);
			}
			return true;
		}
		throw name + " not exists in modules!";
		return false;
	};
var Base64 = {
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
		while (i < input.length) {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
			output = output +
				Base64._keyStr.charAt(enc1) + Base64._keyStr.charAt(enc2) +
				Base64._keyStr.charAt(enc3) + Base64._keyStr.charAt(enc4);
		}
		return output;
	},
	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		while (i < input.length) {
			enc1 = Base64._keyStr.indexOf(input.charAt(i++));
			enc2 = Base64._keyStr.indexOf(input.charAt(i++));
			enc3 = Base64._keyStr.indexOf(input.charAt(i++));
			enc4 = Base64._keyStr.indexOf(input.charAt(i++));
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
			output = output + String.fromCharCode(chr1);
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
		}
		return output;
	}
}
	// UTF-8 encode / decode by Johan Sundstr?m
	function encode_utf8( s )
{
	return unescape( encodeURIComponent( s ) );
}
function decode_utf8( s )
{
	return decodeURIComponent( escape( s ) );
}
function sha1 ( str ) { // Calculate the sha1 hash of a string
	//
	// + original by: Webtoolkit.info (http://www.webtoolkit.info/)
	// + namespaced by: Michael White (http://crestidg.com)
	var rotate_left = function(n,s) {
		var t4 = ( n<<s ) | (n>>>(32-s));
		return t4;
	};
	var lsb_hex = function(val) {
		var str="";
		var i;
		var vh;
		var vl;
		for( i=0; i<=6; i+=2 ) {
			vh = (val>>>(i*4+4))&0x0f;
			vl = (val>>>(i*4))&0x0f;
			str += vh.toString(16) + vl.toString(16);
		}
		return str;
	};
	var cvt_hex = function(val) {
		var str="";
		var i;
		var v;
		for( i=7; i>=0; i-- ) {
			v = (val>>>(i*4))&0x0f;
			str += v.toString(16);
		}
		return str;
	};
	var blockstart;
	var i, j;
	var W = new Array(80);
	var H0 = 0x67452301;
	var H1 = 0xEFCDAB89;
	var H2 = 0x98BADCFE;
	var H3 = 0x10325476;
	var H4 = 0xC3D2E1F0;
	var A, B, C, D, E;
	var temp;
	str = encode_utf8(str);
	var str_len = str.length;
	var word_array = new Array();
	for( i=0; i<str_len-3; i+=4 ) {
		j = str.charCodeAt(i)<<24 | str.charCodeAt(i+1)<<16 |
			str.charCodeAt(i+2)<<8 | str.charCodeAt(i+3);
		word_array.push( j );
	}
	switch( str_len % 4 ) {
		case 0:
			i = 0x080000000;
			break;
		case 1:
			i = str.charCodeAt(str_len-1)<<24 | 0x0800000;
			break;
		case 2:
			i = str.charCodeAt(str_len-2)<<24 | str.charCodeAt(str_len-1)<<16 | 0x08000;
			break;
		case 3:
			i = str.charCodeAt(str_len-3)<<24 | str.charCodeAt(str_len-2)<<16 | str.charCodeAt(str_len-1)<<8 | 0x80;
			break;
	}
	word_array.push( i );
	while( (word_array.length % 16) != 14 ) word_array.push( 0 );
	word_array.push( str_len>>>29 );
	word_array.push( (str_len<<3)&0x0ffffffff );
	for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {
		for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
		for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
		A = H0;
		B = H1;
		C = H2;
		D = H3;
		E = H4;
		for( i= 0; i<=19; i++ ) {
			temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
		for( i=20; i<=39; i++ ) {
			temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
		for( i=40; i<=59; i++ ) {
			temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
		for( i=60; i<=79; i++ ) {
			temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
		H0 = (H0 + A) & 0x0ffffffff;
		H1 = (H1 + B) & 0x0ffffffff;
		H2 = (H2 + C) & 0x0ffffffff;
		H3 = (H3 + D) & 0x0ffffffff;
		H4 = (H4 + E) & 0x0ffffffff;
	}
	var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
	return temp.toLowerCase();
}
function dec2hex(d) {
	return d.toString(16);
}
function hex2dec(h) {
	return parseInt(h,16);
} 