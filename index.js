let dbg
function debug(a) {
	if (dbg)console.log(a);
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

class IdentifierReference extends ParseNode {
	static tryMatch(src,y,a,p) {
		let c = Identifier.tryMatch(src,p)
		if (c) {
			return new IdentifierReference(c.start,c.end,[c])
		}
	}
}

class Identifier extends ParseNode {
	static tryMatch(src, p) {
		let idn = IdentifierName.tryMatch(src, p)
		if (idn) {
			let n = new Identifier(idn.start,idn.end)
			n.children.push(idn)
			return n
		}
	}
}

class PrimaryExpression extends ParseNode {
	static tryMatch(src,y,a,p) {
		let bt = p.pos;
		let c;
		if (p.test('this')) {
			return new PrimaryExpression(bt, p.pos)
		}
		p.goto(bt)
		if (c = IdentifierReference.tryMatch(src,y,a,p)) {
			return new PrimaryExpression(c.start,c.end,[c])
		}
		p.goto(bt)
		if (c = Literal.tryMatch(src,p)) {
			return new PrimaryExpression(c.start,c.end,[c])
		}
		p.goto(bt)
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
			p.consumews(false)
			let i =  StatementListItem.tryMatch(src, y, a, r, p)
			console.dir(i,{depth:null})
			if (i) {
				items.push(i)
			}
			else {
				cflag=0
			}
		}
		if (items.length>0) {
			let n = new StatementList(items[0].start, items[items.length-1].end, items)
			return n
		}
	}
}
class StatementListItem extends ParseNode {
	static tryMatch(src, y, a, r, p) {
		let d = Declaration.tryMatch(src,y,a,p)
		if (!d) d = Statement.tryMatch(src,y,a,r,p)
		if (d) {
			let n = new StatementListItem(d.start,d.end);
			n.children.push(d)
			return n
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

class Literal extends ParseNode {
	static tryMatch(src, p) {
		let bt=p.pos
		let s = StringLiteral.tryMatch(src,p)
		if (!s) {
			p.goto(bt)
			s = NumericLiteral.tryMatch(src,p)
		}
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
class NumericLiteral extends ParseNode {
	static tryMatch(src,p) {
		let n = DecimalLiteral.tryMatch(src,p);
		if (n) return new NumericLiteral(n.start,n.end,[n]);
	}
}
class DecimalLiteral extends ParseNode {
	static tryMatch(src,p) {
		let n = DecimalIntegerLiteral.tryMatch(src,p);
		if (n) return new DecimalLiteral(n.start,n.end,[n]);
	}
}
class DecimalIntegerLiteral extends ParseNode {
	static tryMatch(src,p) {
		p.consumews();
		if (p.get()=='0') return new DecimalIntegerLiteral(p.pos-1,p.pos)
		else {
			let n = [];
			let a = NonZeroDigit.tryMatch(src,p);
			if (!a) return
		}
	}
}
class NonZeroDigit extends ParseNode{
	static tryMatch(src,p) {
		let bt = p.pos
		let n =  p.get()
		if (n=='1'||'2'||'3'||'4'||'5'||'6'||'7'||'8'||'9') return new NonZeroDigit(bt,p.pos)
	}
}
class DecimalDigits extends ParseNode {
	static tryMatch(src,p) {
		let f = 1
		let d = []
		while (f) {
			let a = DecimalDigit.tryMatch(src,p)
			if (!a) {
				f=0
				return new DecimalDigits(d[0].start,d[d.length-1].end,d)
			}
			d.push(a)
		}
	}
}
class DecimalDigit extends ParseNode {
	static tryMatch(src,p) {
		let bt = p.pos
		let n =  p.get()
		if (n=='1'||'2'||'3'||'4'||'5'||'6'||'7'||'8'||'9'||'0') return new DecimalDigit(bt,p.pos)		
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
		if (id) {
			let n = new BindingIdentifier(id.start,id.end)
			n.children.push(id)
			return n
		}
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

class Statement extends ParseNode {
	static tryMatch(src,y,a,r,p) {
		let s = ExpressionStatement.tryMatch(src,y,a,p)
		if (!s) s = ReturnStatement.tryMatch(src,y,a,p)
		if (s) return new Statement(s.start,s.end,[s])
	}
}

class ExpressionStatement extends ParseNode {
	static tryMatch(src,y,a,p) {
		if (p.test('{',0)||p.test('function',0)||p.test('async function',0)||p.test('class',0)||p.test('let [',0)) return
		let e = Expression.tryMatch(src,1,y,a,p);
		if (e) return new ExpressionStatement(e.start,e.end,[e])
	}
}

class ReturnStatement extends ParseNode {
	static tryMatch(src,y,a,p) {
		let bt = p.pos;
		if (p.test('return')) {
			
			if (p.get()==';') return new ReturnStatement(bt,p.pos)
			else {
				p.goto(p.pos-1)
				p.consumews()
				let e = Expression.tryMatch(src,1,y,a,p)
				if (e) {
					if (p.get()==';') {
						return new ReturnStatement(bt,e.end+1)
					}
				}
			}
		}
		p.goto(bt)
	}
}
class Expression extends ParseNode {
	static tryMatch(src,i,y,a,p){
		let e = AssignmentExpression.tryMatch(src,i,y,a,p)
		if (e) return new Expression(e.start,e.end,[e])
	}
}
class Declaration extends ParseNode {
	static tryMatch(src, y, a, p) {
		let hd = HoistableDeclaration.tryMatch(src,y,a,0,p);
		if (hd) {
			return new Declaration(hd.start, hd.end, [hd])
		}
		// todo other expressions.
		let ld = LexicalDeclaration.tryMatch(src,1,y,a,p)
		if (ld) {
			let d = new Declaration(ld.start, ld.end)
			d.children.push(ld)
			return d
		}
	}
}
class HoistableDeclaration extends ParseNode {
	static tryMatch(src,y,a,d,p) {
		let f = FunctionDeclaration.tryMatch(src,y,a,d,p)
		if (f) {
			return new HoistableDeclaration(f.start,f.end,[f])
		}
	}
}
class FunctionDeclaration extends ParseNode {
	static tryMatch(src,y,a,d,p) {
		let bt = p.pos
		if (p.test('function ')) {
			let id = BindingIdentifier.tryMatch(src,y,a,p);
			if (id) {
				p.consumews()
				if (p.get()=='(') {
					p.consumews()
					let params = FormalParameters.tryMatch(src,0,0,p)
					if (params) {
						p.consumews()
						if (p.get()==')') {
							p.consumews()
							if (p.get()=='{'){
								let fbody = FunctionBody.tryMatch(src,0,0,p)
								debug(fbody)
								if (fbody) {
									p.consumews()
									debug('a')
									if (p.get() =='}') {
										debug('a')
										return new FunctionDeclaration(bt, p.pos, [id, params,body])
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

class FormalParameters extends ParseNode {
	static tryMatch(src,y,a,p) {
		let bt = p.pos
		let rest = FunctionRestParameter.tryMatch(src,y,a,p)
		if (rest) {
			return new FormalParameters(rest.start,rest.end,[rest])
		}
		let params = FormalParameterList.tryMatch(src,y,a,p)
		if (params) {
			if (p.get() == ',') {
				rest = FunctionRestParameter.tryMatch(src,y,a,p)
				if (rest) {
					return new FormalParameters(params.start,rest.end,[params,rest])
				}
				return new FormalParameters(params.start,params.end+1,[params])
			}
			else (p.goto(p.pos-1))
			return new FormalParameters(params.start,params.end,[params])
		}
		return new FormalParameters(bt,bt)
	}
}

class FormalParameterList extends ParseNode {
	static tryMatch(src,y,a,p) {
		let params = []
		let f = 1
		let i = FormalParameter.tryMatch(src,y,a,p)
		if (!i) return
		params.push(i)
		while(f) {
			if(p.get()!=',') {
				f=0
				p.goto(p.pos-2)
				break
			}
			let i=FormalParameter.tryMatch(src,y,a,p)
			if (!i) {
				f=0
				p.goto(p.pos-1)
				break
			}
			params.push(i)
		}
		return new FormalParameterList(params[0].start,params[params.length-1].end,...params)
	}
}

class FunctionRestParameter extends ParseNode{
	static tryMatch(src,y,a,p) {

	}
}

class FormalParameter extends ParseNode {
	static tryMatch(src,y,a,p) {
		let bt = p.pos
		let param = BindingElement.tryMatch(src,y,a,p)
		if (param) return new FormalParameter(param.start,param.end,[param])
		else p.goto(bt)
	}
}
class BindingElement extends ParseNode {
	static tryMatch(src,y,a,p) {
		let snb = SingleNameBinding.tryMatch(src,y,a,p)
		if (snb) return new BindingElement(snb.start,snb.end,[snb])
	}
}
class SingleNameBinding extends ParseNode {
	static tryMatch(src,y,a,p) {
		let id = BindingIdentifier.tryMatch(src,y,a,p)
		if (!id) return
		let init = Initializer.tryMatch(src,1,y,a,p)
		if (init) return new SingleNameBinding(id.start,init.end,[id,init])
		return new SingleNameBinding(id.start,id.end, [id])
	}
}
class FunctionBody extends ParseNode {
	static tryMatch(src,y,a,p) {
		debugger;
		let sl = FunctionStatementList.tryMatch(src,y,a,p)
		return new FunctionBody(sl.start,sl.end,[sl])
	}
}
class FunctionStatementList extends ParseNode{
	static tryMatch(src,y,a,p) {
		let bckt = p.pos
		let s = StatementList.tryMatch(src,y,a,1,p)
		debug(s)
		if (s) return new FunctionStatementList(s.start, s.end, [s])

		return new FunctionStatementList(bckt,bckt)
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

	consumews(includelb=false) {
		let f = true;
		while (f) {
			let bt = this.pos;
			let c = this.get()
			let a = false;
			if (includelb) if (c != '\n') a = true;
			if(c!=' ' && c!='	' && !a) {
				f = false
				this.goto(bt);
			}
		}
	}

	test(str, consumeIfTrue = true) {
		let len = str.length
		let p = 1
		for (let i = 1; i-1<len; i++) {
			let c = this.peek(i)
			if (c != str.charAt(i-1)) return false
		}
		if (consumeIfTrue) {
			this.goto(this.pos+len+1)
		}
		return true
	}
}

const Tokens = {
	let: 0,
	const: 1
}

let source = `const a = 'Hello World!';
function main(thing) {
	return 0;
}
let b;
b = false;
b = !b;
if (b) {
	main(a);
}`
//dbg = 1
debugger;
let a = new Parser()
let s = a.ParseScript(source)
//console.dir(s, {depth:null})
function dbgtree(t) {
	console.log(t.constructor.name + ': ' + source.substr(t.start,t.end-t.start))
	t.children.forEach((c) => {
		dbgtree(c)
	})
}
//dbgtree(s.ECMAScriptCode)