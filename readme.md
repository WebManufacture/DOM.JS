#DOM.JS
Это библиотека, которая позволяет значительно увеличить скорость разработки HTML-приложений. Для подключения необходимо добавить в &lt;head&gt; следующие ссылки:
					
&lt;link rel="stylesheet" href="http://services.web-manufacture.net/Styles/System.default.css"/> 
					
&lt;script type="text/javascript" src="http://services.web-manufacture.net/Base/v1.6?join=true"></script>

&lt;script type="text/javascript" src="http://services.web-manufacture.net/System/ui.js"></script>

#### как манипулировать элементами на странице
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
    
    DOM.all(".value[id*='item-']").add(".active");// Все элементы DOM, с классом value и именем (аттрибут), содержащим -item- получат класс active
    
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

### Контексты в DOM.js

### Декларативное программирование в DOM.js

### Компоненты в DOM.JS
