// ================ PRODUCTS ================ 
//use strict
function ProductsModel (dataBase) {
	this.productList;
	this.init(dataBase)
};
ProductsModel.prototype.init = function(product) {
	this.productList = product.reduce(function(db, currentItem) {
		db[currentItem.id] = currentItem;
		return db;
	}, {});
};
ProductsModel.prototype.search = function(strSearch) {
	var items = {},
			find,
			name;
	strSearch = strSearch.toLowerCase();
	for(index in this.productList) {

		name = this.productList[index].name.toLowerCase();
		find = name.indexOf(strSearch);
		
		if (find > -1) {
			items[index] = this.productList[index];
		}
	}
	return items;
};
ProductsModel.prototype.sortType = {
	'all': function() { return 0; },
	'priceLowestFirst': function(a, b) { return a[1]['price'] - b[1]['price']; },
	'priceHighestFirst': function(a, b) { return b[1]['price'] - a[1]['price']; },
};
ProductsModel.prototype.sort = function(type) {
	var sortable = [],
			sortFunc = this.sortType[type];
	for (itemName in this.productList) {
		sortable.push([itemName, this.productList[itemName]]);
	}

	sortable.sort(function(a, b) {
		return sortFunc.bind(this);
	});
	return sortable;
};


function ProductsView () {
	this.template = '<div class="product-img-wrap"></div>' +
					'<div class="product-name">%(name)</div>' +
					'<div class="product-price">%(price)</div><hr>' +
					'<button class="plus">+</button>' +
					'<input type="number" class="itemCount" min="1" value="1">' +
					'<button class="minus">-</button><hr>' +
					'<button class="add-to-cart">add to cart</button>';
};
ProductsView.prototype.renderProduct = function(item) {

	//если я преобразовал в масив
	//item = Array.isArray(item) ? item[1] : item;
	if ( Array.isArray(item) ) {
		item = item[1];
	}

	var productBlock = this.template.replace(/%\((.+?)\)/g, function(expr, paramName) {
		if(paramName in item) {
			return item[paramName];
		}
		return expr;
	});

	var itemElement = document.createElement('div');

	itemElement.setAttribute('data-id', item['id']);
	itemElement.classList.add('product-item');
	itemElement.innerHTML = productBlock;
	
	return itemElement;
};
ProductsView.prototype.render = function(items) {

	var fragProductList = document.createDocumentFragment(),
			productList = document.querySelector(".product-list");

	productList.innerHTML = '';

	for(var item in items) {
		fragProductList.appendChild( this.renderProduct(items[item]) )
	}

	productList.appendChild( fragProductList );
};


// ================ CART ================ 
function CartModel (dataBase) {
	this.DB = dataBase;
	this.items = {};
	this.subscribers = [];
}
CartModel.prototype.add = function(id, count) {
	if( !this.items[ id ] ) {
		this.items[ id ] = 0;
	}
	this.items[ id ] += count;
	this.publish(this);
};
CartModel.prototype.delete = function(id, count) {
	delete this.items[id];
	this.publish(this);
};
CartModel.prototype.getTotalSum = function() {
	var sum = 0;
	for (id in this.items) {
		sum += this.DB[id].price * this.items[id];
	}

	return sum;
};
CartModel.prototype.getTotalCount = function() {
	var count = 0;
	for (id in this.items) {
		count += this.items[id];
	}
	return count;
};
// --- Observer ---
CartModel.prototype.subscribe = function(fn) {

	this.subscribers.push(fn);
};
CartModel.prototype.unsubscribe = function(fn) {   
	var i = 0,
		len = this.subscribers.length;
   
	for (; i < len; i++) {
		if (this.subscribers[i] === fn) {
			this.subscribers.splice(i, 1);
			return;
		}
	}
};
CartModel.prototype.publish = function(data) {
	var i = 0,
		len = this.subscribers.length;
   
	for (; i < len; i++) {
		this.subscribers[i](data);
	}        
};


function CartView() {
	this.popupWrapEL = document.createElement('div');
	this.popupWrapEL.classList.add('popup-wrap');
	this.cartOpen = false;

	this.template = '<div class="header-popup">Cart' +
		'<div class="close-popup"></div></div>' +
		'<div class="body-popup">%(content)</div>' +
		'<div class="footer-popup"></div>';

	this.item = '<div class="item-name">%(name)</div>'+
				'<div class="item-price">%(price)</div>'+
				'<div class="item-count">%(count)</div>'+
				'<div class="item-total-price">%(total)</div>'+
				'<div class="item-delate"><span class="del" data-id="%(id)">x</span></div>';
};
CartView.prototype.renderCartInHeader = function(data) {
	var countEl = document.querySelector(".cart-count"),
		totalPrice = document.querySelector(".cart-price"),
		count = data.getTotalCount(),
		sum = data.getTotalSum();

	countEl.innerText = count;
	totalPrice.innerText = sum;
};
CartView.prototype.renderPopupWrap = function(content) {
	var popupEL = document.createElement('div');
	popupEL.classList.add('popup');
	popupEL.innerHTML = this.template.replace("%(content)", content);
	this.popupWrapEL.appendChild(popupEL);
	
	document.querySelector('body').appendChild(this.popupWrapEL);
};
CartView.prototype.renderPopupContent = function(data) {
	var content = '',
			item = '';

	for(item in data.items) {
		productBlock = this.item.replace(/%\((.+?)\)/g, function(expr, paramName) {
			if(paramName in data.DB[item]) {
				return data.DB[item][paramName];
			}
			if(paramName === "count") {
				return data.items[item];
			}
			if(paramName === "total") {
				return data.items[item] * data.DB[item]["price"];
			}
			return expr;
		});
		content += '<div class="item-popup">' + productBlock + '</div>';
	}

	if (content === '') {
		return '<center>Cart is empty</center>';
	}

	return content;
};
CartView.prototype.renderPopup = function(data) {
	var content;
	content = this.renderPopupContent(data);
	
	if (!this.cartOpen) {
		this.renderPopupWrap(content);
		this.cartOpen = !this.cartOpen;
		return;
	}    
	document.querySelector('.body-popup').innerHTML = content;
};
CartView.prototype.destroy = function() {
	document.querySelector('body').removeChild(this.popupWrapEL);
	this.popupWrapEL.innerHTML = "";
	this.cartOpen = !this.cartOpen;
};


// ================ APP ================ 
function App() {
	this.products = new ProductsModel(window.products);
	this.cart = new CartModel(this.products.productList);
	this.cartView = new CartView();
	this.productsView = new ProductsView(this.products.productList);

	this.cart.subscribe(this.cartView.renderCartInHeader);
	this.renderPopup = this.cartView.renderPopup.bind(this.cartView);

	this.init();
	this.products.sort();
};
App.prototype.init = function() {   
	this.productsView.render(this.products.productList);
	var productsWrapEl = document.querySelector("body");
	productsWrapEl.addEventListener('click', this.redirected.bind(this), false);
};
App.prototype.routes = function(event) {
	var self = this;

	if (event.target.parentNode.classList.contains('product-item')) {
		var countItemEl = event.target.parentNode.querySelector(".itemCount"),
				countItem = event.target.parentNode.querySelector(".itemCount").value,
				idItem  = event.target.parentNode.getAttribute('data-id');
		countItem = parseInt( countItem );
		idItem = parseInt( idItem );
	}

	return {
		'plus': function() {
			countItemEl.value = countItem + 1;
		},
		'minus': function() {
			if ( countItem != 1 ) {
				countItemEl.value = countItem - 1;
			}
		},
		'add-to-cart': function() {
			self.cart.add(idItem, countItem);
		},
		'header-shop-cart': function() {
			self.cart.subscribe(self.renderPopup);  
			self.cartView.renderPopup(self.cart);
		},
		'close-popup': function() {
			self.cart.unsubscribe(self.renderPopup);
			self.cartView.destroy();
		},
		'del': function() {
			self.cart.delete(event.target.getAttribute('data-id'));
		},
		'btn-search': function() {
			var searchText = document.getElementById('search'),
					items = self.products.search(searchText.value);
			self.productsView.render(items);
		},
		'btn-crear': function() {
			self.productsView.render(self.products.productList);
		},
		'filter-item': function() {
			var a = event.target.value;
			debugger;
			var items = self.products.sort(a);
			self.productsView.render(items);
		},
	};
};
App.prototype.redirected = function() {
	var hasClass = function(className) {
		return event.target.classList.contains(className);
	};
	var route = this.routes.call(this, event)
	for(var className in route) {
		if ( route.hasOwnProperty(className) && hasClass(className) ) {
			route[className]();
			break;
		}
	}
};

var app = new App();
