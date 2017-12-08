var parser = function parser (tokens) {
    "use strict";
    var Exception = require ('./Exception');
    var autofill = {
        "const" : true,
        "readonly" : true
    };

    class ParserException extends Exception {
        constructor (msg,token) {
            super(msg);
            this.self = JSON.stringify(token) | "No Token info";
        }

        toString () {
            return `ParserException : ${this.constructor.constructor.toString.call(this)} \n ${this.self}`;
        };
    }

    class Expression {
        constructor (option) {

        }
    }

    class Refernce extends Expression {
        constructor (option) {
            super(option);
        }
    }

    class Addition extends Refernce {
        constructor (option) {
            super(option);
        }
    }

    class Term extends Addition {
        constructor (option) {
            super(option);
        }
    }

    class Factor extends Term {
        constructor (option) {
            super(option);
        }
    }

    class Container {
        constructor (type) {
            if(WINDOW) {
                this.scope = {};
                this.scope.__proto__ = WINDOW.scope;
            } else {
                this.scope = {};
            }
            this.type = type;
            this.options = new Map();// option_name = [option_value,]
            this.childs = [];
        }

        static loadChild (container) { // load Attr and childs
            while(!token_parser.end_container()){
                let cont = token_parser.container();
                if(cont !== false) {
                    container.attachChild(cont);
                } else {
                    throw new ParserException("unexpected token", token());
                }
            }
        }

        static loadAttr (container) {
            var next;
            while(!((next = token()).type === "cont_end" || (next.type === "operator" && next.value === "/"))){
                let attr = token_parser.attr();
                if(attr !== false) {
                    container.options.set(attr.attr,attr.value);
                } else throw new ParserException("Not enough tokens for attr",next);
            }
        }

        attachChild (container) {
            container.scope.__proto__ = this.scope;
            this.childs.push(container);
        }

        appendAttr (attr) {
            this.options.set(attr.attr_name,attr.attr_value);
        }

        addValue (name,value) {
            this.scope.__proto__[name] = value;
        }

        initScope () {
            var iterator = Object.keys(this.scope);
            while(iterator.length) {
                this.scope[iterator.shift()] = {"type":undefined,"value":undefined};
            }
        }

        hasAttrs (attrs) {
            var result = true;
            while(attrs.length && result) {
                if(!this.options.has(attrs.shift())) result = false;
            }
            return result;
        }
    }

    class token_parser {
        static attr () {
            var tok = token();
            if(tok.type === "identifier") {
                let result_attr = { "attr" : tok.value };
                advance();
                tok = token();
                if(tok.type === "operator" && tok.value === "=") {
                    advance();
                    tok = token();
                    if(tok.type === "option") {
                        advance();
                        result_attr.value = this.expression(tok.value);
                    }
                } else {
                    result_attr.value = autofill[result_attr.attr];
                }
                return result_attr;
            }
            return false;
        }
        static container () {
            var tok = token();
            if(tok.type === "cont_start") {
                advance();
                tok = token();
                if(tok.type === "identifier") {
                    advance();
                    let new_container = new Container(tok.value);
                    Container.loadAttr(new_container);
                    if(token_parser.end_container()) {
                        return new_container;
                    } else {
                        advance();
                        Container.loadChild(new_container);
                        return new_container;
                    }
                } else recover();
            } else return false;
        }
        static end_container () {
            var tok = token();
            if(tok.type === "cont_start") { // </[ident]>
                advance();
                tok = tok.value + token().value;
                if(tok === "</" && token().type === "operator"){
                    advance();
                    tok = token();
                    if(tok.type === "identifier") {
                        advance();
                        advance();
                        return true;
                    } else throw new ParserException("No identifier for end_container",tok);
                } else recover();
            } else if (tok.type === "operator" && tok.value === "/") {// />
                advance();
                tok = tok.value + token().value;
                if(tok === "/>"){
                    advance();
                    return true;
                } else recover();
            }
            return false;
        }
        static expression (option) {
            return option;
            //return new Factor(option);
        }
    }

    function token () {
        return tokens[i];
    }

    function advance () {
        var result = token();
        i++;
        return result;
    }

    function recover () {
        i--;
    }

    var i = 0;
    var tl = tokens.length-1;
    var WINDOW = new Container("WINDOW");

    while(i < tl) {
        WINDOW.attachChild(token_parser.container());
    }
    return WINDOW;
};

module.exports = parser;