var ContextMenu = function(containerId) {
    if (containerId) {
        this.container = document.getElementById(containerId);
    } else {
        this.container = document;
    }
    this.create();
};
ContextMenu.prototype = {
    constructor: ContextMenu,
    menu: null,
    menuItems: [{
        'name': '新增',
        'id': 'insert',
        'function': function(target, index) {
            var row = target.insertRow(index + 1);
            row.innerHTML = '<td class="lineNoWrap"></td><td class="lineNoWrap"></td>';
            row.click();
        }
    }, {
        'name': '删除',
        'id': 'delete',
        'function': function(target, index) {
            if (index !== 0) {
                target.deleteRow(index);
            }
        }
    }],
    eventsMap: {},
    create: function() {
        this.bindEvent();
    },
    bindEvent: function() {
        var that = this;
        this.container.oncontextmenu = function(e) {
            
            if (e.target.parentElement.className.indexOf('selected') < 0) {
                e.target.parentElement.click();
            }
            that.showMenu(e.clientX, e.clientY - 10);
            that.rowIndex = e.target.parentElement.rowIndex;  
        };
    },
    showMenu: function(x, y, target) {
        this.createMenu(target);
        this.menu.style.display = '';
        this.menu.getElementsByTagName('ul')[0].style.cssText = 'top: ' + y + '; left: ' + x;
    },
    createMenu: function() {
        if (!this.menu) {
            this.menu = document.createElement('div');
            this.menu.className = 'menu_context';
            var htmlStr = '<ul>';
            for (var i = 0, l = this.menuItems.length; i < l; i++) {
                htmlStr += '<li id="' + this.menuItems[i].id  + '">' + this.menuItems[i].name + '</li>';
                this.eventsMap[this.menuItems[i].id] = this.menuItems[i]['function'];
            }
            htmlStr += '</ul>';
            this.menu.innerHTML = htmlStr;
            this.container.parentNode.appendChild(this.menu);
            var that = this;
            this.menu.onclick = function(e) {
                if (e.target.id) {
                    if (that.eventsMap[e.target.id](that.container, that.rowIndex) !== false) {
                        that.menu.style.display = 'none';
                    }
                } else {
                    that.menu.style.display = 'none';
                }
                
            };
        }
    }
};

var menu = new ContextMenu('dataTable');
