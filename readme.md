#DOM.JS
Это библиотека, которая позволяет значительно увеличить скорость разработки HTML-приложений. Для подключения необходимо добавить в &lt;head&gt; следующие ссылки:
					
&lt;link rel="stylesheet" href="http://services.web-manufacture.net/Styles/System.default.css"/> 
					
&lt;script type="text/javascript" src="http://services.web-manufacture.net/Base/v1.6?join=true"></script>

&lt;script type="text/javascript" src="http://services.web-manufacture.net/System/ui.js"></script>

### Как манипулировать элементами на странице
Для того, чтобы уверенно работать с DOM, необходимо знать селекторы:
http://htmlbook.ru/samcss (Самоучитель CSS)
    	
    
        var elem = DOM.all(".minefield"); //Получить ссылку на все! элементы DOM с классом minefield, вернет специального вида массив;
        
        var mines = elem.all(">.mine"); //Получить ссылку на все элементы .mine которые являются непосредственными детьми elem;
        
        var elem = DOM.get("div#MyDiv"); //Получить ссылку на div с ID #MyDiv;
        
        var elem = DOM("#MyDiv[url^='http']"); //Получить ссылку на div с ID #MyDiv у которого аттрибут url начинается с http;
        
        var parentDiv = elem.get("^div"); //Получить ссылку на DIV, в который вложен наш elem
        
        elem.add(".active"); //Добавить к elem класс active
        elem.add("@url", "http://ya.ru"); //Добавить аттрибут url в elem
        
        var url = elem.get("@url"); //Взять значение аттрибута url у elem
        
        
        var otherElem = DOM.div(".new", "Другой див"); //Создает новый Div с классом new в памяти (не на странице)
        elem.add(otherElem); //add добавляет наш DIV otherElem внутрь elem
        elem.add(DOM(".zagolovok")); //Ищет на странице элемент с классом .zagolovok и перемещает его внутрь elem
        
        elem.set(""<span>Привет!</span>"");// Записать html Привет! внутрь
        elem.html("<span>Привет!</span>");// Записать html Привет! внутрь
        elem.text("<span>Привет!</span>");// Записать текст <span>Привет!</span> внутрь
        
        
        var newDiv = elem.div(".inner-element"); //Создать DIV с классом inner-element внутри elem
        
        var newDiv2 = elem.get(".inner-element");//Находит первый inner-element внутри
        
        var newDivs = elem.all(".inner-element");//Находит все inner-element внутри. Возвращает массив
        
        elem.del(".inner-element"); //Удалить класс inner-element из списка классов elem
        elem.del(); //Удалить себя 
        
        elem.is(".active"); //Вернет true если элемент соответствует селектору .active
        
        Возможны такие конструкции: 
        
        var parents = elem.all("^div"); //Получить ссылку на все элементы div которые являются родителями elem;
        
        var minefield = elem.get("^.minefield"); //Получить ссылку на родителя elem c классом .minefield;
        
        DOM.all(".value").del();
        
        var l = 0;
        
        DOM.all(".value").each(function(item){ item.set("@id", "item-" + (l++)); }); //Угадайте что сделает ? :)
        
        DOM.all(".value[id*='item-']").add(".active");// Все элементы DOM, с классом value ��� именем (аттрибут), содержащим -item- получат класс active
        
        Также есть:
        
        DOM.has(),
        DOM.clear(),
        DOM.ins(),
        DOM.wrap(),
        DOM.last(),
        DOM.show(),
        DOM.hide(),
        DOM.clone(),
        DOM.aggregate(),

### Модули в DOM.js


		<include url='http://services.web-manufacture.net/UI/Toolbars.htm'></include>
		<include url='http://services.web-manufacture.net/UI/UiUtils.htm'></include>
		<include url='http://services.web-manufacture.net/UI/Win.htm'></include>
		<include url='http://services.web-manufacture.net/UI/HtmlElements.htm'></include>
        <include url='http://klab.web-manufacture.net/klab/editor.component.htm'></include>

### Контексты в DOM.js

        C.Add({
           Condition: "ui-processing",
           Selector: ".my-content[url]:not(.loaded)";
           Process: function(element) {
                var url = element.url = element.attr("url");
                NET.GET(url, function(result){
                    element.add(".loaded");
                    element.innerHTML = result; 
                });
                return false;
            }
        });


### Компоненты в DOM.JS
#### stl-view.htm
        <script type="text/javascript" src='stl-view.js'>
          //На самом деле можно и тут писать скрипты, но тут достаточно здоровый файл
        </script>
        
        <!-- Эта магия позволяет создать начальную верстку в месте где компонент используется
        Здесь оно скорее для наглядности и связи с CSS, такую верстку все же проще в конструкторе
        компонента делать.
        Данный элемент (inner-template) попадет в боди и будет там, но невидимый.
        Его содержиме будет скопировано (без сериализации, в смысле ссылки сохраняться)
        в элемент <stl-view>, который обрабатывается. (это определяется атрибутом for
        В дальнейшем будет вызван конструктор в JS который получит ссылку на <stl-view>
        -->
        <inner-template id="StlViewPrototype" for="stl-view" title="Stl View">
            <!-- SVG удобен, чтобы, к примеру нарисовать оси. -->
            <svg></svg>
            <!-- Канвас нам нужен чтобы отрисовывать на нем GL контекст -->
            <canvas class="stl-shower"></canvas>
            <!-- Оверлей удобен, чтобы показывать текст. -->
            <div class='overlay'></div>
        </inner-template>
        
        <!-- Ну и традиционная верстка, куда же без нее -->
        <style type="text/css">
            stl-view {
                display: block;
                overflow-x: hidden;
                overflow-y: hidden;
                min-height: 100px;
                min-width: 100px;
                background-color: black;
                position: relative;
            }
            
            stl-view canvas{
                width: 100%;
                height: 100%;
                position: absolute;
                z-index: 1;
                top: 0;
                left: 0;
            }
            
            stl-view svg{
                width: 100%;
                height: 100%;
                position: absolute;
                z-index: 0;
                top: 0;
                left: 0;
            }
            
            stl-view .overlay{
                width: 100%;
                height: 100%;
                position: absolute;
                z-index: 2;
                top: 0;
                left: 0;
            }
        </style>
    
#### stl-view.js
    
        //Конструктор, вызывается каждый раз когда ����а страничке используется компонент
        //element -- это тег <stl-view> куда внутрь уже перенесено все из темплейта
        function stlViewComponent(element) {
            //обязательно вызываем базовый Конструктор компонента. 
            this._super.apply(this, arguments);
            var self = this;
            
            //канвас нам нужен чтобы отрисовывать на нем GL контекст
            var canvas = this.canvas = element.get('canvas');
            //SVG удобен, чтобы, к примеру нарисовать оси.
            var svg = this.svg = element.get('svg');
            //Оверлей удобен, чтобы показывать текст.
            var overlay = this.overlay = element.get('div.overlay');
            
            //Пример, как организовать свойство или метод, чтобы было удобно использовать компонент
            this._color = 'blue';
            this.onColorChange = function(){};
            Object.defineProperty(element, 'color', {
              get: function(){
                  return self._color;
              },
              set: function(val) {
                this.onColorChange(val);
                self._color = val;
              }
            });
            
            //Немного лук энд фила
            this.resize = function(){
                var rect = element.getBoundingClientRect();
                this.width = canvas.width = rect.width;
                this.height = canvas.height = rect.height;  
            }
            
            //Подписываемся на внешние события
            element.onresize = this.resize.bind(this);
            this.resize();
            
            //Пример, как сделать внешнее АПИ
            
            //Функция лоад лежит в прототипе
            element.load = this.load.bind(this);
            
            element.loadFile = this.loadFile.bind(this);
            element.showStl = this.showStl.bind(this);
        };
        
        //Наследуемся от компонента. Тут не очевидно, но ui.inherit это скрывает
        //stl-view -- селектор на который мы будем вешаться, тут также и класс может быть
        //и селектор аттрибута.
        //Нужно понимать что инстанс stlViewComponent -- не то же самое что DOM элемент stl-view
        //как только перейдем на WebComponents -- сможем встраиваться.
        ui.inherit("stl-view", stlViewComponent, {
            
            load: function(data){
                this.currentData = data;
            },
            
            loadFile: function(file){
                NET.GET("test.stl", (data) => {
                   this.load(data); 
                });
            },
            
            showStl: function(data){
                if (!data) data = this.currentData;
                this.initGl();
                // Тут наверное вся магия и должна быть!
                
                
                
                // конец магии
                this.drawScene();
            },
        });  
        

### Декларативное программирование в DOM.js

Вот такой вот простой код позволяет из верстки сразу делать магию
    
        <div id='uiActionDemonstrator' class='ui-action' action-type='class-toggle' set='.invisible' for='#uiActionDemonstrator'>
            <img src="/images/Dom.png"       >
        </div>

Полный список возможностей ниже:
    
    	ui.UIActionContext = { 
    	    Condition: "ui-processing",
    	    id : "uiaction",
    	    Selector : ".ui-action:not(.jasp-processed-uiaction), [action-type]:not(.jasp-processed-uiaction)",
    	    Process : function(element){
        		var asel = element.uiActionSelector = element.attr("for");
        		var atype = element.uiActionType = element.attr("atype");
        		if (!atype){
        			atype = element.uiActionType = element.attr("action-type");	
        		}	
        		if (!atype) {
        			ui.Error("Element " + element.ToString() + " has no action-type or atype attribute!");
        			return true;
        		}
        		var aevent = element.uiActionEvent = element.attr("on");
        		if (!aevent){
        			aevent = element.uiActionEvent = ":click";
        		}	
        		
        		var handler = ui.UIActionHandlers[atype];
        		if (handler){
        			element.uiActionHandler = function(){
        				ui.info("UI Action: " + element.uiActionType + ":" + element.uiActionEvent + " -> " + element.uiActionSelector);
        				window.setTimeout(function(){
        					try{
        						handler(element, element.uiActionType, element.uiActionSelector, element.uiActionEvent)
        					}
        					catch(err){
        						console.log(err);	
        					}
        				}, 100);
        			};
        		}
        		else{
        			ui.Error("Element " + element.ToString() + " has unknown event type: " + atype);
        			return true;
        		}
        		
        		if (aevent.start(":")){
        			aevent = ui.ElementEvents[aevent];
        			if (aevent){
        				element[aevent] = element.uiActionHandler;
        			}
        			else{
        				ui.Error("Element " + element.ToString() + " has unknown event emitter: " + aevent);
        			}
        		}	
        		else{
        			ui.OnActionEvent.subscribe(ui.UIActionRecurseHandler, aevent);			
        			ui.info("Subscribe on " + aevent + " action " + aname + ":" + atype + " for " + asel);
        		}		
        		return true;
        	}
    	};
    	
    	C.Add(ui.UIActionContext);
    	
    	ui.UIActionRecurseHandler = function(ename, elem) {
    		ui.info("Recurse event emitted: " + ename);
    		if (elem){
    			elem.uiActionHandler();
    		}		
    	};
    	
    	ui.UIActionHandlers = {
    		"event" : function(elem, atype, asel, aevent){
    			ui.OnActionEvent.fire(asel, elem)
    		},
    		
    		"class-toggle" : function(elem, atype, asel, aevent){
    			var aname = elem.attr("set");
    			if (aname){
    				var target = DOM._all(asel);
    				target.each(function(elem){
    					if (this._is(aname)){
    						this._del(aname);
    					}
    					else{
    						this._add(aname)	
    					}
    				});
    			}
    		},
    		
    		"show" : function(elem, atype, asel, aevent){
    			var target = DOM._all(asel);
    			target.each(function(elem){
    				this.show();
    			});
    		},
    		
    		"hide" : function(elem, atype, asel, aevent){
    			var target = DOM._all(asel);
    			target.each(function(elem){
    				this.hide();
    			});
    		},		
    		
    		
    		"visibility-toggle" : function(elem, atype, asel, aevent){
    			var target = DOM._all(asel);
    			target.each(function(elem){
    				if (this._is(".invisible")){
    					this.show();
    				}
    				else{
    					this.hide()	
    				}
    			});
    		},
    		
    		"ins" : function(elem, atype, asel, aevent){
    			var aname = elem.attr("set");
    			if (aname){
    				var target = DOM._all(asel);
    				target._ins(aname);
    			}
    		},
    		
    		"set" : function(elem, atype, asel, aevent){
    			var aname = elem.attr("set");
    			if (aname){
    				var value = null;
    				var target = DOM._all(asel);
    				if (aname.contains("=")){
    					var parts = aname.split("=");
        				aname = parts[0];
        				value = parts[1];
        			}
        			target._set(aname, value);
        		}
        	},
        };
        
        ui.UIActionHandlers["class-on"] =
        ui.UIActionHandlers["add"] = 
            function(elem, atype, asel, aevent){
        		var aname = elem.attr("set");
        		if (aname){
        			var target = DOM._all(asel);
        			target._add(aname);
        		}
        	};
        
        ui.UIActionHandlers["class-off"] =
        ui.UIActionHandlers["del"] =
        	function(elem, atype, asel, aevent){
        		var aname = elem.attr("set");
        		if (aname){
        			var target = DOM._all(asel);
        			target._del(aname);
        		}
        	};
        
        ui.ElementEvents = {
        	":click" : "onclick",	
        	":hover" : "onmouseover",
        	":d-click" : "ondblclick",
        	":receive" : "ondropreceive",
        	":drop" : "OnDrop"
        };
        
