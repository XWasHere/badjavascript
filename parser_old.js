const ParseNodes = require('./parsenodes_old.js');

class Parser {
    src = "";
    pos = 0;

    ParseScript(sourceText) {
        // TODO: ParseScript function.
    }

    goto(index) {
        this.pos = index;
    }

    peek(distance = 1) {
        return this.src.charAt(this.pos+distance);
    }

    get(consume = true) {
        let c = this.src.charAt(this.pos);
        if (consume) this.pos++
        return c;
    }

    consumews(includelb = true) {
        let f = true;
        while (f) {
            let bt = this.pos;
            let c =  this.get();
            let g =  false;
            if (includelb && c=='\n') g=true;
            if (c!=' '&&c!='\t'&&!g) {
                f = false;
                this.goto(bt);
            }
        }
    }

    test(str, consumeIfTrue) {
        let len = str.length;
        for (let i = 0; i < len; i++) {
            let c = this.peek(i);
            if (c != str.charAt(i)) return false
        }
        if (consumeIfTrue) {
            this.goto(this.pos+len)
        }
        return true;
    }
}

module.exports = Parser;