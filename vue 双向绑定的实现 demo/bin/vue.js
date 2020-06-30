class Vue{
    constructor (option){
        this.option = option;
        this.el = document.querySelector(this.option.el);
        this.data = option.data;
        this.watch = new Watch();
        this.observer(this.data);
        this.compile(this.el);
    };
    compile(el){
        let child = el.childNodes;
        [...child].map((element) => {
            if (element.nodeType === 1 ) {
                let attr = element.attributes;
                if (attr.hasOwnProperty('v-model')) {
                    let keyname = attr['v-model'].nodeValue;
                    element.value =  this.data[keyname];
                    element.addEventListener('input',  event => {
                        this.data[keyname] = element.value;
                    })
                }
                // 这是一个元素节点，下面可能还有子元素
                this.compile(element);
            } else if (element.nodeType === 3){
                // 这是一个文本节点
                let text = element.textContent;
                // 匹配花括号中的数据
                let reg = /\{\{\s*([^\s\{\}]+)\s*\}\}/g;
                if (reg.test(text)) {
                    let $s1 = RegExp.$1;
                    this.data[$s1] && (element.textContent = text.replace(reg, this.data[$s1]));
                    // 创建元素监听事件，修改data 中的值。
                    this.watch.on($s1, (data) => {
                        element.textContent = text.replace(reg, this.data[$s1]);
                    });
                }
            } 
        });
    };
    observer (data) {
        let _this = this;
        this.data = new Proxy(data, {
            set (target, prop, newValue){
                _this.watch.emit(prop, newValue);
                return Reflect.set(...arguments);
            },
        });
    }
}

class Watch {
    constructor () {
        this.eventPool = {};
    }
    on (type, fn) {
        if (!this.eventPool) {
            this.eventPool = {};
        }
        if(!this.eventPool[type]){
            this.eventPool[type] = [fn];
        } else {
            this.eventPool[type].push(fn);
        }
    };
    emit (type) {
        if (!this.eventPool || !this.eventPool[type]) {
            return;
        }
        let args = [...arguments];
        for (let i = 0; i < this.eventPool[type].length; i++) {
            this.eventPool[type][i].apply(this, args);
        }
    };
    off (type) {
        if (!type) {
            this.eventPool = null;
        }
        let args = [...arguments].splice(1);
        if (args.length === 0) {
            this.eventPool[type] = null;
        }
        for ( let i = 0; i < args.length; i++) {
            let idx = this.eventPool[type].indexOf(args[i]);
            if (idx > -1) {
                this.eventPool[type].splice(idx, 1);
            }
        }
    };
}