const debugging = require('./debugging.js');

const token = {
	LET: 0,
	CONST: 1
}

function debug(a) {
	//console.log(a);
}
class ParseNode {
	children = []
	start = 0
	end = 0
	constructor(start, end, children = []) {
		this.start = start
		this.end = end
		this.children = children
	}
	static tryMatch(src, p) {

	}
}

class Script extends ParseNode{
	static tryMatch(src, p) {
		let body = ScriptBody.tryMatch(src, p)
		if (body) {
			let s = new Script(body.start, body.end)
			s.children.push(body)
			return s
		}
		else return new Script(0,0)
	}
}

class ScriptBody extends ParseNode {
	static tryMatch(src, p) {
		let sl = StatementList.tryMatch(src,0,0,0,p)
		if (sl) {
			let n = new ScriptBody(sl.start,sl.end)
			n.children.push(sl)
			return n
		}
	}
}
class StatementList extends ParseNode {
	static tryMatch(src, y, a, r, p) {
		let bt = p.pos;
		let cflag = 1;
		let items = []
		let loops = 0;
		while (cflag) {
			let i =  StatementListItem.tryMatch(src, y, a, r, p)
			if (i) {
				items.push(i)
			}
			else {
				cflag=0
			}
		}
		if (items.length>0) {
			let n = new StatementList(items[0].start, items[items.length-1].end)
			n.children.push(...items)
			return n
		}
	}
}
class StatementListItem extends ParseNode {
	static tryMatch(src, y, a, r, p) {
		// todo add statements
		let d = Declaration.tryMatch(src,y,a,p)
		if (d) {
			let n = new StatementListItem(d.start,d.end);
			n.children.push(d)
			return n
		}
	}
}

class Declaration extends ParseNode {
	static tryMatch(src, y, a, p) {
		// todo other expressions.
		let ld = LexicalDeclaration.tryMatch(src,1,y,a,p)
		if (ld) {
			let d = new Declaration(ld.start, ld.end)
			d.children.push(ld)
			return d
		}
	}
}

class LexicalDeclaration  extends ParseNode {
	static tryMatch(src, i, y, a, p) {
		let bc = p.pos;
		let lc = LetOrConst.tryMatch(src,p);
		if (!lc) return undefined
		if (p.get() == ' ') {
			let lb = BindingList.tryMatch(src, i, y, a, p);
			if (lb) {
				if (p.get() == ';') {
					let n = new LexicalDeclaration(lc.start,lb.end+1)
					n.children.push(lc)
					n.children.push(lb)
					return n
				}
			}
		}
		return undefined
	}
}

class LetOrConst extends ParseNode {
	token = undefined;
	constructor(start, end,tokenType) {
		super()
		this.token = tokenType
		this.start = start
		this.end   = end;
		return
	}
	static tryMatch(src, p) {
		let bc = p.pos;
		let c = p.get();
		if (c=='l') {
			if (p.get()=='e') {
				if (p.get()=='t') {
					return new LetOrConst(bc, p.pos)
				}
			}
		}
		else if (c=='c') {
			if (p.get()=='o') {
				if (p.get()=='n') {
					if (p.get()=='s') {
						if (p.get()=='t') {
							return new LetOrConst(bc, p.pos)
						}
					}
				}
			}
		}
		p.goto(bc)
		return undefined;
	}
}

class BindingList extends ParseNode {
	static tryMatch(src, i, y, a, p) {
		let continueflag = 1;
		let loopc = 0;
		let nodes = []
		while (continueflag) {
			let n = LexicalBinding.tryMatch(src, i, y, a, p)
			nodes.push(n);
			continueflag = 0;
		}
		if (nodes.length>0) {
			let n = new BindingList(nodes[0].start, nodes[nodes.length-1].end)
			n.children.push(...nodes)
			return n
		}
	}
}

class LexicalBinding  extends ParseNode {
	static tryMatch(src, i, y, a, p) {
		let id = BindingIdentifier.tryMatch(src, y, a, p);
		if (id) {
			let init = Initializer.tryMatch(src,i,y,a,p)
			if (init) {
				let x = new LexicalBinding(id.start, init.end);
				x.children.push(id);
				x.children.push(init)
				return x
			}
			else {
				let x = new LexicalBinding(id.start, id.end)
				x.children.push(id)
				return x
			}
		}
		else {

		}
	}
}

class Initializer extends ParseNode {
	static tryMatch(src, i, y, a, p) {
		p.consumews()
		if (p.get() == '=') {
			p.consumews()
			let e = AssignmentExpression.tryMatch(src,i,y,a,p);
			if (e) {
				let n = new Initializer(e.start,e.end)
				n.children.push(e)
				return n
			}
		}
	}
}

class AssignmentExpression extends ParseNode {
	static tryMatch(src, i, y, a, p) {
		let e = ConditionalExpression.tryMatch(src,i,y,a,p)
		if(e) {
			return new AssignmentExpression(e.start,e.end,[e])
		}
	}
}

class ConditionalExpression extends ParseNode {
	static tryMatch(src,i,y,a,p) {
		let e = ShortCircuitExpression.tryMatch(src,i,y,a,p)
		if (e) {
			return new ConditionalExpression(e.start,e.end,[e])
		}
	}
}

class ShortCircuitExpression extends ParseNode {
	static tryMatch(src,i,y,a,p) {
		let e = LogicalORExpression.tryMatch(src,i,y,a,p)
		if(e) {
			return new ShortCircuitExpression(e.start,e.end,[e])
		}
	}
}
class LogicalORExpression extends ParseNode {
	static tryMatch(src,i,y,a,p) {
		let e = LogicalANDExpression.tryMatch(src,i,y,a,p)
		if (e) {
			return new LogicalORExpression(e.start,e.end,[e])
		}
	}
}

class LogicalANDExpression extends ParseNode {
	static tryMatch(src,i,y,a,p) {
		let e = BitwiseORExpression.tryMatch(src,i,y,a,p)
		if (e) {
			return new LogicalANDExpression(e.start,e.end,[e])
		}
	}
}

class BitwiseORExpression extends ParseNode {
	static tryMatch(src,i,y,a,p) {
		let e = BitwiseXORExpression.tryMatch(src,i,y,a,p)
		if (e) {
			return new BitwiseORExpression(e.start,e.end,[e])
		}
	}
}

class BitwiseXORExpression extends ParseNode {
	static tryMatch(src,i,y,a,p) {
		let e = BitwiseANDExpression.tryMatch(src,i,y,a,p)
		if (e) {
			return new BitwiseXORExpression(e.start,e.end,[e])
		}
	}
}

class BitwiseANDExpression extends ParseNode {
	static tryMatch(src,i,y,a,p) {
		let e = EqualityExpression.tryMatch(src,i,y,a,p)
		if (e) {
			return new BitwiseANDExpression(e.start,e.end,[e])
		}
	}
}

class EqualityExpression extends ParseNode {
	static tryMatch(src,i,y,a,p) {
		let e = RelationalExpression.tryMatch(src,i,y,a,p)
		if (e) {
			return new EqualityExpression(e.start,e.end,[e])
		}
	}
}

class RelationalExpression extends ParseNode {
	static tryMatch(src,i,y,a,p) {
		let e = ShiftExpression.tryMatch(src,y,a,p)
		if (e) {
			return new RelationalExpression(e.start,e.end,[e])
		}
	}
}

class ShiftExpression extends ParseNode {
	static tryMatch(src,y,a,p) {
		let e = AdditiveExpression.tryMatch(src,y,a,p)
		if(e) {
			return new ShiftExpression(e.start,e.end,[e])
		}
	}
}

class AdditiveExpression extends ParseNode {
	static tryMatch(src,y,a,p) {
		let e = MultiplicativeExpression.tryMatch(src,y,a,p)
		if(e) {
			return new AdditiveExpression(e.start,e.end,[e])
		}
	}
}

class MultiplicativeExpression extends ParseNode {
	static tryMatch(src,y,a,p) {
		let e = ExponentiationExpression.tryMatch(src,y,a,p)
		if(e) {
			return new MultiplicativeExpression(e.start,e.end,[e])
		}
	}
}

class ExponentiationExpression extends ParseNode {
	static tryMatch(src,y,a,p) {
		let e = UnaryExpression.tryMatch(src,y,a,p)
		if (e) {
			return new ExponentiationExpression(e.start,e.end,[e])
		}
	}
}

class UnaryExpression extends ParseNode{
	static tryMatch(src,y,a,p) {
		let e = UpdateExpression.tryMatch(src,y,a,p)
		if(e) {
			return new UnaryExpression(e.start,e.end,[e])
		}
	}
}

class UpdateExpression extends ParseNode {
	static tryMatch(src,y,a,p) {
		let e = LeftHandSideExpression.tryMatch(src,y,a,p)
		if(e) {
			return new UpdateExpression(e.start,e.end,[e])
		}
	}
}

class LeftHandSideExpression extends ParseNode {
	static tryMatch(src,y,a,p) {
		let e = NewExpression.tryMatch(src,y,a,p)
		if(e) {
			return new LeftHandSideExpression(e.start,e.end,[e])
		}
	}
}

class NewExpression extends ParseNode {
	static tryMatch(src,y,a,p) {
		let e = MemberExpression.tryMatch(src,y,a,p)
		if (e) {
			return new NewExpression(e.start,e.end,[e])
		}
	}
}

class MemberExpression extends ParseNode {
	static tryMatch(src,y,a,p) {
		let e = PrimaryExpression.tryMatch(src,y,a,p)
		if (e) {
			return new MemberExpression(e.start,e.end,[e])
		}
	}
}

class PrimaryExpression extends ParseNode {
	static tryMatch(src,y,a,p) {
		let l = Literal.tryMatch(src,p)
		if (l) {
			return new PrimaryExpression(l.start,l.end,[l])
		}
	}
}

class Literal extends ParseNode {
	static tryMatch(src, p) {
		let s = StringLiteral.tryMatch(src,p)
		if (s) {
			return new Literal(s.start, s.end, [s])
		}
	}
}

class StringLiteral extends ParseNode {
	static tryMatch(src,p) {
		let bt = p.pos;
		let type = p.get()
		
		if (type=='"') {

		}
		if (type=='\'') {
			let str = SingleStringCharacters.tryMatch(src,p)
			if (p.get()=='\'') {
				let n = new StringLiteral(bt, p.pos)
				if (str) n.children.push(str);
				return n
			}
		}
	}
}

class SingleStringCharacters extends ParseNode {
	static tryMatch(src,p) {
		let children = []
		let f = 1;
		while (f) {
			let char = SingleStringCharacter.tryMatch(src,p)
			if (!char) {
				f = 0;
				p.goto(p.pos-1)
			}
			else children.push(char)
		}
		if (children != []) {
			let n = new SingleStringCharacters(children[0].start,children[children.length-1].end)
			n.children.push(...children)
			return n
		}
	}
}

class SingleStringCharacter extends ParseNode {
	static tryMatch(src,p) {
		let c = p.get()
		if (!(c=='\''||c=='\\')) {
			let n = new SingleStringCharacter(p.pos-1,p.pos);
			return n
		}
	}
}
class BindingIdentifier extends ParseNode {
	static tryMatch(src, y, a, p) {
		let id = Identifier.tryMatch(src, p)
		let n = new BindingIdentifier(id.start,id.end)
		n.children.push(id)
		return n
	}
}

class Identifier extends ParseNode {
	static tryMatch(src, p) {
		let idn = IdentifierName.tryMatch(src, p)
		let n = new Identifier(idn.start,idn.end)
		n.children.push(idn)
		return n
	}
}

class IdentifierName extends ParseNode {
	static tryMatch(src, p) {
		let bt = p.pos;
		let s = IdentifierStart.tryMatch(src,p)
		if (!s) return undefined
		let children = []
		children.push(s)
		let loopflag = 1
		while(loopflag) {
			let c = IdentifierPart.tryMatch(src, p)
			if (!c) {
				p.goto(p.pos-1);
				loopflag=0;
				break;
			}
			children.push(c)
		}
		let n = new IdentifierName(bt,p.pos)
		n.children.push(...children)
		return n
	}
}

class IdentifierStart extends ParseNode {
	static tryMatch(src, p) {
		let s = UnicodeIDStart.tryMatch(src,p)
		if (!s) return undefined
		let n = new IdentifierStart(p.pos-1,p.pos)
		n.children.push(s)
		return n
	}	
}

class IdentifierPart extends ParseNode {
	static tryMatch(src, p) {
		let s  = UnicodeIDContinue.tryMatch(src, p)
		if (!s) return undefined
		let n = new IdentifierPart(p.pos-1,p.pos)
		n.children.push(s)
		return n
	}
}

class UnicodeIDStart extends ParseNode {
	static tryMatch(src, p) {
		let a = p.get();
		if (/[\p{L}\p{Nl}]/u.test(a)) {
			return new UnicodeIDStart(p.pos-1, p.pos)
		}
	}
}

class UnicodeIDContinue extends ParseNode {
	static tryMatch(src, p) {
		let a = p.get();
		if (/[\p{L}\p{Nl}\p{Mn}\p{Mc}\p{Nd}\p{Pc}]/u.test(a)) {
			return new UnicodeIDContinue(p.pos-1, p.pos)
		}
		return undefined
	}
}
function ScriptRecord() {
	let record = {};
	record.Realm = undefined
	record.Environment = undefined
	record.ECMAScriptCode = undefined
	record.HostDefined = undefined;
	return record
}

class Parser {
	src = ""
	pos = 0

	ParseScript(sourceText) {
		this.src = sourceText
		this.pos = 0
		let parsed = Script.tryMatch(sourceText, this);

		let record = new ScriptRecord()
		
		record.ECMAScriptCode = parsed
		return record
	}
	
	goto(pos) {
		debug(`GOTO ${pos}`)
		this.pos = pos
	}

	peek(dist = 1) {
		debug(`PEEK ${dist}`)
		return this.src.charAt(this.pos+dist)
	}

	get() {
		let c = this.src.charAt(this.pos)
		debug(`GET CHAR ${c} AT ${this.pos}`)
		this.pos++
		return c
	}

	consumews() {
		let f = true;
		while (f) {
			let bt = this.pos;
			if(this.get()!=' ') {
				f = false
				this.goto(bt);
			}
		}
	}
}

const Tokens = {
	let: 0,
	const: 1
}

let source = `const a = 'Hello World!';
function main(thing) {
	console.log(thing);
	return 0;
};
let b;
b = false;
b = !b;
if (b) {
	main(a);
}`
let a = new Parser()
let s = a.ParseScript(source)
//console.dir(s, {depth:null})
function dbgtree(t) {
	console.log(t.constructor.name + ': ' + source.substr(t.start,t.end-t.start))
	t.children.forEach((c) => {
		dbgtree(c)
	})
}

dbgtree(s.ECMAScriptCode)