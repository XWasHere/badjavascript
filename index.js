const CHAR = {
    LF: "\u000a",
    CR: "\u000d",
    LS: "\u2028",
    PS: "\u2029"
}

class ParseNode {
    children = [];
    start = 0;
    end = 0;
    
    /**
     * The generic Parse Node constructor.
     * @param {Number} start 
     * @param {Number} end 
     * @param {ParseNode[]} children 
     */
    constructor(start, end, children = []) {
        this.start = start;
        this.end = end;
        this.children = children;
    }

    static tryMatch() {
        return undefined;
    }
}

class SourceCharacter extends ParseNode {}
class InputElementDiv extends ParseNode {}
class InputElementRegExp extends ParseNode {}
class InputElementRegExpOrTemplateTail extends ParseNode {}
class InputElementTemplateTail extends ParseNode {}
class WhiteSpace extends ParseNode {}
class LineTerminator extends ParseNode {}
class LineTerminatorSequence extends ParseNode {}
class Comment extends ParseNode {}
class MultiLineComment extends ParseNode {}
class MultiLineCommentChars extends ParseNode {}
class PostAsteriskCommentChars extends ParseNode {}
class PostAsteriskCommentChar extends ParseNode {}
class MultiLineNotForwardSlashOrAsteriskChar extends ParseNode {}
class SingleLineComment extends ParseNode {}
class SingleLineCommentChars extends ParseNode {}
class SingleLineCommentChar extends ParseNode {}
class CommonToken extends ParseNode {}

class IdentifierName extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let s = IdentifierStart.tryMatch();
        if (!s) return
        let children = []
        children.push(s)
        while (true) {
            let bt = Parser.pos
            let c = IdentifierPart.tryMatch()
            if (!c) {
                Parser.goto(bt)
                break;
            }
            children.push(c)
        }
        return new IdentifierName(bt,Parser.pos,children)
    }
}

class IdentifierStart extends ParseNode {
    static tryMatch() {
        let s = UnicodeIDStart.tryMatch()
        if (!s) return
        return new IdentifierStart(Parser.pos-1,Parser.pos,[s])
    }
}

class IdentifierPart extends ParseNode {

}

class UnicodeIDStart extends ParseNode {
    static tryMatch() {
        let a = Parser.get()
        if (/[\p{L}\p{Nl}]/u.test(a)) return new UnicodeIDStart(Parser.pos-1, Parser.pos)
        Parser.goto(Parser.pos-1)
    }
}

class UnicodeIDContinue extends ParseNode {

}

class ReservedWord extends ParseNode {}
class Punctuator extends ParseNode {}
class OptionalChainingPunctuator extends ParseNode {}
class OtherPunctuator extends ParseNode {}
class DivPunctuator extends ParseNode {}
class RightBracePunctuator extends ParseNode {}
class NullLiteral extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos
        if (Parser.test('null')) return new NullLiteral(bt,Parser.pos)
    }
}
class BooleanLiteral extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos
        if (Parser.test('true')) {}
        else if (Parser.test('false')) {}
        else {return}
        return new BooleanLiteral(bt,Parser.pos)
    }
}
class NumericLiteral extends ParseNode {
    static tryMatch() {
        let c;
        if  (c=DecimalBigIntegerLiteral.tryMatch()) {}
        else if (c=NonDecimalIntegerLiteral.tryMatch()) {
            let d
            if (d=BigIntLiteralSuffix.tryMatch()) {
                return new NumericLiteral(c.start,d.end,[c,d])
            }
        }
        else if (c=DecimalLiteral.tryMatch()) {}
        else {return}
        return new NumericLiteral(c.start,c.end,[c])
    }
}
class DecimalBigIntegerLiteral extends ParseNode {
    static tryMatch() {
        let c = [];
        let d
        let bt = Parser.pos;
        if (Parser.test('0')) {}
        else if (d=NonZeroDigit.tryMatch()) {
            c.push(d)
            let e;
            if (e = DecimalDigits.tryMatch()) {
                c.push(e)
            }
        }
        else {
            Parser.goto(bt)
            return
        }
        let e;
        if (e=BigIntLiteralSuffix.tryMatch()) {
            c.push(e)
            return new DecimalBigIntegerLiteral(bt,e.end,c)
        }
        else {
            Parser.goto(bt)
            return
        }
    }
}
class NonDecimalIntegerLiteral extends ParseNode {
    static tryMatch() {
        let c;
        if (c=BinaryIntegerLiteral.tryMatch()) {}
        else if (c=OctalIntegerLiteral.tryMatch()) {}
        else if (c=HexIntegerLiteral.tryMatch()) {}
        else return
        return new NonDecimalIntegerLiteral(c.start,c.end,[c])
    }
}

class BigIntLiteralSuffix extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        if (Parser.test('n')) return new BigIntLiteralSuffix(bt,Parser.pos)
    }
}

class DecimalLiteral extends ParseNode {
    static tryMatch() {
        let c;
        if (c=DecimalIntegerLiteral.tryMatch()) {
            let d;
            if (Parser.test('.')) {
                if (d=DecimalDigits.tryMatch()) {
                    let e;
                    if (e=ExponentPart.tryMatch()) {
                        return new DecimalLiteral(c.start,e.end,[c,d,e])
                    }
                    else return new DecimalLiteral(c.start,d.end,[c,d])
                }
                else return new DecimalLiteral(c.start,c.end+1,[c])
            }
            else if (d=ExponentPart.tryMatch()) {
                return new DecimalLiteral(c.start,d.end,[c,d])
            }
            else return new DecimalLiteral(c.start,c.end,[c])
        }
        else if (Parser.test('.')) {
            let d;
            if (d=DecimalDigits.tryMatch()) {
                let e;
                if (e=ExponentPart.tryMatch()) {
                    return new DecimalLiteral(c.start,e.end,[c,d,e])
                }
                return new DecimalLiteral(c.start,d.end,[c,d])
            }
        }
        // No need for another block, despite the third production.
        // We can keep it grouped with the first, because if DecimalIntegerLiteral matches
        // test('.') WILL fail B)
        else return
    }
}

class DecimalIntegerLiteral extends ParseNode {
    static tryMatch() {
        if (Parser.test('0')) return new DecimalIntegerLiteral(Parser.pos-1,Parser.pos)
        let c;
        if (c=NonZeroDigit.tryMatch()) {
            let d;
            if (d=DecimalDigits.tryMatch()) {
                return new DecimalIntegerLiteral(c.start,d.end,[c,d])
            }
            else return new DecimalIntegerLiteral(c.start,c.end,[c])
        }
    }
}

class DecimalDigits extends ParseNode {
    static tryMatch() {
        let c = []
        let d = 0
        while (true) {
            let e = DecimalDigit.tryMatch()
            if (e) {
                c.push(e)
                d = 1
            }
            else break
        }
        if (d) return new DecimalDigits(c[0].start,Parser.pos,c)
    }
}

class DecimalDigit extends ParseNode {
    static tryMatch() {
        let a = Parser.get()
        if (/[0-9]/.test(a)) return new DecimalDigit(Parser.pos-1,Parser.pos)
        else {
            Parser.goto(Parser.pos-1)
        }
    }
}

class NonZeroDigit extends ParseNode {
    static tryMatch() {
        let a = Parser.get()
        if (/[1-9]/.test(a)) return new NonZeroDigit(Parser.pos-1,Parser.pos)
        else {
            Parser.goto(Parser.pos-1)
        }
    }
}

class ExponentPart extends ParseNode {
    static tryMatch() {
        let c;
        let d;
        if (c=ExponentIndicator.tryMatch()) {
            if (d=SignedInteger.tryMatch()) {
                return new ExponentPart(c.start,d.end,[c,d])
            }
        }
    }
}

class ExponentIndicator extends ParseNode {
    static tryMatch() {
        let c = 0
        if (Parser.test('e')) {}
        else if (Parser.test('E')) {}
        else {return}
        return new ExponentIndicator(Parser.pos-1,Parser.pos)
    }
}

class SignedInteger extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos
        if (Parser.test('+')) {}
        else if (Parser.test('-')) {}
        let c;
        if (c=DecimalDigits.tryMatch()) return new SignedInteger(bt,c.end,[c])
        else {
            Parser.goto(bt)
        }
    }
}

class BinaryIntegerLiteral extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos
        if (!Parser.test('0')) {Parser.goto(bt);return}
        if (Parser.test('b')) {}
        else if (Parser.test("B")) {}
        else {Parser.goto(bt);return}
        let c;
        if (c=BinaryDigits.tryMatch()) return new BinaryIntegerLiteral(c.start-2,c.end,[c])
    }
}
class BinaryDigits extends ParseNode {
    static tryMatch() {
        let c = []
        let bt = Parser.pos
        while (1) {
            let d;
            if (d=BinaryDigit.tryMatch()) c.push(d)
            else break
        }
        if (c.length>0) return new BinaryDigits(bt,Parser.pos,c)
        else Parser.goto(bt)
    }
}

class BinaryDigit extends ParseNode {
    static tryMatch() {
        let a = Parser.get()
        if (/[01]/.test(a)) return new BinaryDigit(Parser.pos-1,Parser.pos)
        else {
            Parser.goto(Parser.pos-1)
        }
    }
}
class OctalIntegerLiteral extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos
        if (!Parser.test('0')) {Parser.goto(bt);return;}
        if (Parser.test('o')) {}
        else if (Parser.test("O")) {}
        else {Parser.goto(bt);return}
        let c;
        if (c=OctalDigits.tryMatch()) return new OctalIntegerLiteral(c.start-2,c.end,[c])
    }
}
class OctalDigits extends ParseNode {
    static tryMatch() {
        let c = []
        let bt = Parser.pos
        while (1) {
            let d;
            if (d=OctalDigit.tryMatch()) c.push(d)
            else break
        }
        if (c.length>0) return new OctalDigits(bt,Parser.pos,c)
        else Parser.goto(bt)
    }
}
class OctalDigit extends ParseNode {
    static tryMatch() {
        let a = Parser.get()
        if (/[0-7]/.test(a)) return new OctalDigit(Parser.pos-1,Parser.pos)
        else {
            Parser.goto(Parser.pos-1)
        }
    }
}
class HexIntegerLiteral extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos
        if (!Parser.test('0')) {Parser.goto(bt);return}
        if (Parser.test('x')) {}
        else if (Parser.test("X")) {}
        else {Parser.goto(bt);return}
        let c;
        if (c=HexDigits.tryMatch()) return new HexIntegerLiteral(c.start-2,c.end,[c])
    }
}
class HexDigits extends ParseNode {
    static tryMatch() {
        let c = []
        let bt = Parser.pos
        while (1) {
            let d;
            if (d=HexDigit.tryMatch()) c.push(d)
            else break
        }
        if (c.length>0) return new HexDigits(bt,Parser.pos,c)
        else Parser.goto(bt)
    }
}
class HexDigit extends ParseNode {
    static tryMatch() {
        let a = Parser.get()
        if (/[0-9a-fA-F]/.test(a)) return new HexDigit(Parser.pos-1,Parser.pos)
        else {
            Parser.goto(Parser.pos-1)
        }
    }
}
class StringLiteral extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos
        let c;
        if (Parser.test('"')) {
            if (c=DoubleStringCharacters.tryMatch()) {
                if (Parser.test('"')) return new StringLiteral(bt,Parser.pos,[c])
            }
            else if (Parser.test('"')) return new StringLiteral(bt,Parser.pos)
        }
        if (Parser.test("'")) {
            if (c=SingleStringCharacters.tryMatch()) {
                if (Parser.test("'")) return new StringLiteral(bt,Parser.pos,[c])
            }
            else if (Parser.test("'")) return new StringLiteral(bt,Parser.pos)
        }
    }
}
class DoubleStringCharacters extends ParseNode {
    static tryMatch() {
        let c = []
        while (true) {
            let d
            if (d=DoubleStringCharacter.tryMatch()) c.push(d)
            else break;
        }
        if (c.length>0) return new DoubleStringCharacters(c[0].start,Parser.pos,c)
    }
}
class SingleStringCharacters extends ParseNode {
    static tryMatch() {
        let c = []
        while (true) {
            let d
            if (d=SingleStringCharacter.tryMatch()) c.push(d)
            else break;
        }
        if (c.length>0) return new SingleStringCharacters(c[0].start,Parser.pos,c)
    }
}

class SingleStringCharacter extends ParseNode {
    static tryMatch() {
        if (!(Parser.test("'",false) || Parser.test("\\",false) || Parser.prodTest(LineTerminator))) {
            Parser.goto(Parser.pos+1)
            return new SingleStringCharacter(Parser.pos-1,Parser.pos)
        }
        else if (Parser.test(CHAR.LS)) {return new SingleStringCharacter(Parser.pos-1,Parser.pos)}
        else if (Parser.test(CHAR.PS)) {return new SingleStringCharacter(Parser.pos-1,Parser.pos)}
        else if (Parser.test('\\')) {
            let c;
            let bt = Parser.pos-1
            if (c=EscapeSequence.tryMatch()) {return new SingleStringCharacter(bt,Parser.pos,[c])}
            else {
                Parser.goto(bt)
                if (c= LineTerminator.tryMatch) {return new SingleStringCharacter(bt,Parser.pos,[c])}
                else return
            }
        }
        else return
    }
}

class DoubleStringCharacter extends ParseNode {
    static tryMatch() {
        if (!(Parser.test('"',false) || Parser.test("\\",false) || Parser.prodTest(LineTerminator))) {
            Parser.goto(Parser.pos+1)
            return new DoubleStringCharacter(Parser.pos-1,Parser.pos)
        }
        else if (Parser.test(CHAR.LS)) {return new DoubleStringCharacter(Parser.pos-1,Parser.pos)}
        else if (Parser.test(CHAR.PS)) {return new DoubleStringCharacter(Parser.pos-1,Parser.pos)}
        else if (Parser.test('\\')) {
            let c;
            let bt = Parser.pos-1
            if (c=EscapeSequence.tryMatch()) {return new DoubleStringCharacter(bt,Parser.pos,[c])}
            else {
                Parser.goto(bt)
                if (c= LineTerminator.tryMatch) {return new DoubleStringCharacter(bt,Parser.pos,[c])}
                else return
            }
        }
        else return
    }
}
class LineContinuaton extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos
        if (!Parser.test('\\')) return
        let c;
        if (c=LineTerminatorSequence.tryMatch()) return new LineContinuaton(bt,c.end,[c])
        Parser.goto(bt)
    }
}
class EscapeSequence extends ParseNode {
    static tryMatch() {
        let c;
        if (c=CharacterEscapeSequence.tryMatch()) {
            return new EscapeSequence(c.start,c.end,[c])
        }
        if (Parser.tryMatch('0')) {
            let bt = Parser.pos;
            if (!DecimalDigit.tryMatch()) {
                Parser.goto(bt)
                return new EscapeSequence(bt-1,bt) 
            }
        }
        if (c=HexEscapeSequence.tryMatch()) {
            return new EscapeSequence(c.start,c.end,[c])
        }
        if (c=UnicodeEscapeSequence.tryMatch()) {
            return new EscapeSequence(c.start,c.end,[c])
        }
    }
}
class CharacterEscapeSequence extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c;
        
        if (c=SingleEscapeCharacter.tryMatch()) return new CharacterEscapeSequence(c.start,c.end,[c])
        if (c=NonEscapeCharacter.tryMatch()) return new CharacterEscapeSequence(c.start,c.end,[c])

        Parser.goto(bt);
    }
}
class SingleEscapeCharacter extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        if (/['"\\bfnrtv]/.Parser.peek()) {
            Parser.goto(bt+1)
            return new SingleEscapeCharacter(bt,Parser.pos)
        }
    }
}
class NonEscapeCharacter extends ParseNode {
    // todo: matching
}
class EscapeCharacter extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos
        let c;
        if (c=SingleEscapeCharacter.tryMatch()) return new EscapeCharacter(c.start,c.end,[c])
        if (c=DecimalDigit.tryMatch()) return new EscapeCharacter(c.start,c.end,[c])
        c = Parser.get()
        if (c=='x' || c == 'u') return new EscapeCharacter(Parser.pos-1,Parser.pos)
        else Parser.goto(bt)
    }
}
class HexEscapeSequence extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos
        let c;
        let d;

        if (Parser.test('x')) {
            if (c=HexDigit.tryMatch()) {
                if (d = HexDigit.tryMatch()) {
                    return new HexEscapeSequence(bt,d.end,[c,d])
                }
            }
        }
        Parser.goto(bt)
    }
}
class UnicodeEscapeSequence extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let bt1;
        let c;

        if (Parser.test('u')) {
            bt1 = Parser.pos
            if (c=Hex4Digits.tryMatch) {
                return new UnicodeEscapeSequence(bt,c.end,[c])
            }
            Parser.goto(bt1)
            if (Parser.test('{')) {
                if (c=CodePoint.tryMatch()) {
                    if (Parser.test('}')) return new UnicodeEscapeSequence(bt,Parser.pos,[c])
                }
            }
        }
        Parser.goto(bt)
    }
}
class Hex4Digits extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c,d,e,f;

        if (c=HexDigit.tryMatch()) {
            if (d=HexDigit.tryMatch()) {
                if (e=HexDigit.tryMatch()) {
                    if (f=HexDigit.tryMatch()) {
                        return new Hex4Digits(c.start,f.end,[c,d,e,f])
                    }
                }
            }
        }

        Parser.goto(bt)
    }
}
class RegularExpressionLiteral extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c,d;

        if (Parser.test('/')) {
            if (c=RegularExpressionBody.tryMatch()) {
                if (Parser.test('/')) {
                    if (d=RegularExpressionFlags.tryMatch()) {
                        return new RegularExpressionLiteral(bt, Parser.pos, [c,d])
                    }
                }
            }
        }

        Parser.goto(bt)
    }
}
class RegularExpressionBody extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c,d;
        
        if (c=RegularExpressionFirstChar.tryMatch()) {
            if (d=RegularExpressionChars.tryMatch()) {
                return new RegularExpressionBody(bt, Parser.pos, [c,d])
            }
        }

        Parser.goto(bt)
    }
}
class RegularExpressionChars extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c  = []
        while (true) {
            let d = RegularExpressionChar.tryMatch();
            if (d) c.push(d)
            else break
        }
        return new RegularExpressionChars(bt,Parser.pos,c)
    }
}
class RegularExpressionFirstChar extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c;
        if (c=RegularExpressionNonTerminator.tryMatch()) {
            let d = Parser.peek()
            if (!(d=='*'||d=='\\'||d=='/'||d=='[')) {
                return new RegularExpressionFirstChar(bt,Parser.pos,[c])
            }
        }
        Parser.goto(bt);
        if (c=RegularExpressionBackslashSequence.tryMatch()) {
            return new RegularExpressionFirstChar(bt,Parser.pos,[c]);
        }
        Parser.goto(bt);
        if (c=RegularExpressionClass.tryMatch()) {
            return new RegularExpressionFirstChar(bt,Parser.pos,[c])
        }
        Parser.goto(bt);
    }
}
class RegularExpressionChar extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c;
        if (c=RegularExpressionNonTerminator.tryMatch()) {
            let d = Parser.peek(-1)
            if (!(d=='\\'||d=='/'||d=='[')) {
                return new RegularExpressionChar(bt,Parser.pos,[c])
            }
        }
        Parser.goto(bt);
        if (c=RegularExpressionBackslashSequence.tryMatch()) {
            return new RegularExpressionChar(bt,Parser.pos,[c]);
        }
        Parser.goto(bt);
        if (c=RegularExpressionClass.tryMatch()) {
            return new RegularExpressionChar(bt,Parser.pos,[c])
        }
        Parser.goto(bt);
    }
}
class RegularExpressionBackslashSequence extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c;
        if (Parser.test('\\')) {
            if (c=RegularExpressionNonTerminator.tryMatch()) {
                return new RegularExpressionBackslashSequence(bt,Parser.pos,[c])
            }
        }
        Parser.goto(bt)
    }
}
class RegularExpressionNonTerminator extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        if (!LineTerminator.tryMatch()) {
            Parser.goto(Parser.pos+1)
            return new RegularExpressionNonTerminator(bt,Parser.pos)
        }
        Parser.goto(bt)
    }
}
class RegularExpressionClass extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        if (Parser.test('[')) {
            let c;
            if (c=RegularExpressionClassChars.tryMatch()) {
                if (Parser.test(']')) {
                    return new RegularExpressionClass(bt,Parser.pos,[c])
                }
            }
        }
        Parser.goto(bt)
    }
}
class RegularExpressionClassChars extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c  = []
        while (true) {
            let d = RegularExpressionClassChar.tryMatch();
            if (d) c.push(d)
            else break
        }
        return new RegularExpressionClassChars(bt,Parser.pos,c)
    }
}
class RegularExpressionClassChar extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c;
        if (c=RegularExpressionNonTerminator.tryMatch()) {
            let d = Parser.peek(-1)
            if (!(d==']'||d=='\\')) {
                return new RegularExpressionClassChar(bt,Parser.pos,[c])
            }
        }
        Parser.goto(bt);
        if (c=RegularExpressionBackslashSequence.tryMatch()) {
            return new RegularExpressionClassChar.tryMatch(bt,Parser.pos,[c])
        }
        Parser.goto(bt);
    }
}
class RegularExpressionFlags extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c  = []
        while (true) {
            let d = IdentifierPart.tryMatch();
            if (d) c.push(d)
            else break
        }
        return new RegularExpressionFlags(bt,Parser.pos,c)
    }
}
class Template extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c;
        
        if (c=NoSubstitutionTemplate.tryMatch()) return new Template(c.start,c.end,[c])
        if (c=TemplateHead.tryMatch()) return new Template(c.start,c.end,[c])
        
        Parser.goto(bt);
    }
}
class NoSubstitutionTemplate extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c;

        if (Parser.test('`')) {
            let bt2 = Parser.pos;
            if (c = TemplateCharacters.tryMatch()) {
                if (Parser.test('`')) {
                    return new NoSubstitutionTemplate(bt,Parser.pos,[c])
                }
            }
            Parser.goto(bt2)
            if (Parser.test('`')) {
                return new NoSubstitutionTemplate(bt,Parser.pos)
            }
        }

        Parser.goto(bt)
    }
}
class TemplateHead extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c;

        if (Parser.test('`')) {
            let bt2 = Parser.pos;
            if (c = TemplateCharacters.tryMatch()) {
                if (Parser.test('${')) {
                    return new TemplateHead(bt,Parser.pos,[c])
                }
            }
            Parser.goto(bt2)
            if (Parser.test('${')) {
                return new TemplateHead(bt,Parser.pos)
            }
        }

        Parser.goto(bt)
    }
}
class TemplateSubstitutionTail extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c;
        
        if (c=TemplateMiddle.tryMatch()) return new TemplateSubstitutionTail(c.start,c.end,[c])
        if (c=TemplateTail.tryMatch()) return new TemplateSubstitutionTail(c.start,c.end,[c])
        
        Parser.goto(bt);
    }
}
class TemplateMiddle extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c;

        if (Parser.test('}')) {
            let bt2 = Parser.pos;
            if (c = TemplateCharacters.tryMatch()) {
                if (Parser.test('${')) {
                    return new TemplateMiddle(bt,Parser.pos,[c])
                }
            }
            Parser.goto(bt2)
            if (Parser.test('${')) {
                return new TemplateMiddle(bt,Parser.pos)
            }
        }

        Parser.goto(bt)
    }
}
class TemplateTail extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c;

        if (Parser.test('}')) {
            let bt2 = Parser.pos;
            if (c = TemplateCharacters.tryMatch()) {
                if (Parser.test('`')) {
                    return new TemplateTail(bt,Parser.pos,[c])
                }
            }
            Parser.goto(bt2)
            if (Parser.test('`')) {
                return new TemplateTail(bt,Parser.pos)
            }
        }

        Parser.goto(bt)
    }
}
class TemplateCharacters extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c = []
        let d = 0
        
        while (true) {
            let e = TemplateCharacter.tryMatch()
            if (e) {
                c.push(e)
                d = 1
            }
            else break
        }
        if (d) return new TemplateCharacters(c[0].start,Parser.pos,c)
        
        Parser.goto(bt)
    }
}
class TemplateCharacter extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        let c;

        if (Parser.test('$')) {
            if (!Parser.test('{')) {
                return new TemplateCharacter(bt,Parser.pos)
            }
        }

        Parser.goto(bt)

        if (Parser.test('\\')) {
            let bt1 = Parser.pos;
            if (c=EscapeSequence.tryMatch()) return new TemplateCharacter(bt,Parser.pos,[c])
            
            Parser.goto(bt1)

            if (c=NotEscapeSequence.tryMatch()) return new TemplateCharacter(bt,Parser.pos,[c])
        }

        Parser.goto(bt)

        if (c=LineContinuaton.tryMatch()) {
            return new TemplateCharacter(bt, Parser.pos, [c])
        }

        Parser.goto(bt)

        if (c=LineTerminatorSequence.tryMatch()) {
            return new TemplateCharacter(bt,Parser.posm [c])
        }

        Parser.goto(bt)

        if (!Parser.test('`')) {
            if (!Parser.test('\\')) {
                if (!Parser.test('$')) {
                    if (!LineTerminator.tryMatch()) {
                        Parser.goto(Parser.pos+1)
                        return new TemplateCharacter(bt, Parser.pos)
                    }
                }
            }
        }

        Parser.goto(bt)
    }
}
class NotEscapeSequence extends ParseNode {}
class NotCodePoint extends ParseNode {}
class CodePoint extends ParseNode {}
class IdentifierReference extends ParseNode {
    static tryMatch(y,a) {
        let bt = Parser.pos;
        let c
        if (c=Identifier.tryMatch()) return new BindingIdentifier(bt,Parser.pos,[c])
    }
}

class BindingIdentifier extends ParseNode {
    static tryMatch(y,a) {
        let n = Identifier.tryMatch();
        if (n) return new BindingIdentifier(n.start,n.end,[n])
        // XXX: we need the yield and await stuff. stop cutting corners something is gonna break
    }
}

class LabelIdentifier extends ParseNode {}

class Identifier extends ParseNode {
    static tryMatch() {
        let r = IdentifierName.tryMatch()
        // XXX: What did I say.
        if (r) return new Identifier(r.start,r.end,[r])
    }
}

class PrimaryExpression extends ParseNode {
    static tryMatch(y,a) {
        let bt = Parser.pos
        let c
        
        if (Parser.test('this')) {
            return new PrimaryExpression(bt,Parser.pos)
        }
        
        if (c=IdentifierReference.tryMatch(y,a)) {
            return new PrimaryExpression(bt,Parser.pos,[c])
        }
        
        if (c=Literal.tryMatch()) {
            return new PrimaryExpression(bt,Parser.pos,[c])
        }

        if (c = ArrayLiteral.tryMatch(y,a)) {
            return new PrimaryExpression(bt,Parser.pos,[c])
        }

        if (c = ObjectLiteral.tryMatch(y,a)) {
            return new PrimaryExpression(bt,Parser.pos,[c])
        }

        if (c = FunctionExpression.tryMatch()) {
            return new PrimaryExpression(bt,Parser.pos,[c])
        }

        if (c = ClassExpression.tryMatch(y,a)) {
            return new PrimaryExpression(bt,Parser.pos,[c])
        }

        if (c = GeneratorExpression.tryMatch()) {
            return new PrimaryExpression(bt,Parser.pos,[c])
        }

        if (c = AsyncFunctionExpression.tryMatch()) {
            return new PrimaryExpression(bt,Parser.pos,[c])
        }

        if (c = AsyncGeneratorExpression.tryMatch()) {
            return new PrimaryExpression(bt,Parser.pos,[c])
        }

        if (c = RegularExpressionLiteral.tryMatch()) {
            return new PrimaryExpression(bt,Parser.pos,[c])
        }

        if (c = TemplateLiteral.tryMatch(y,a,0)) {
            return new PrimaryExpression(bt,Parser.pos,[c])
        }

        if (c = CoverParenthesizedExpressionAndArrowParameterList.tryMatch(y,a)) {
            return new PrimaryExpression(bt,Parser.pos,[c])
        }

        Parser.goto(bt)
    }
}

class CoverParenthesizedExpressionAndArrowParameterList extends ParseNode {}
class ParenthesizedExpression extends ParseNode {}
class Literal extends ParseNode {
    static tryMatch() {
        let c
        if (c=NullLiteral.tryMatch()) {}
        else if (c=BooleanLiteral.tryMatch()) {}
        else if (c=NumericLiteral.tryMatch()) {}
        else if (c=StringLiteral.tryMatch()) {}
        else {return} //hehe. that's right.
        return new Literal(c.start,c.end,[c])
    }
}
class ArrayLiteral extends ParseNode {}
class ElementList extends ParseNode {}
class Elison extends ParseNode {}
class SpreadElement extends ParseNode {}
class ObjectLiteral extends ParseNode {}
class PropertyDefinitionList extends ParseNode {}
class PropertyDefinition extends ParseNode {}
class PropertyName extends ParseNode {}
class LiteralPropertyName extends ParseNode {}
class ComputedPropertyName extends ParseNode {}
class CoverInitializedName extends ParseNode {}

class Initializer extends ParseNode {
    static tryMatch(i,y,a) {
        Parser.consumews()
        let bt = Parser.pos
        if (Parser.test('=')) {
            Parser.consumews()
            let e = AssignmentExpression.tryMatch(i,y,a)
            if (e) return new Initializer(bt,e.end,[e])
        }
        
    }
}

class TemplateLiteral extends ParseNode {
    static tryMatch(y,a,t) {
        let bt = Parser.pos;
        let c;
        
        if (c=NoSubstitutionTemplate.tryMatch()) return new TemplateLiteral(bt,Parser.pos,[c])
        if (c=SubstitutionTemplate.tryMatch(y,a,t)) return new TemplateLiteral(bt,Parser.pos,[c])
        
        Parser.goto(bt);
    }
}

class SubstitutionTemplate extends ParseNode {
    static tryMatch(y,a,t) {
        let bt = Parser.pos;
        let c,d,e;

        if (c=TemplateHead.tryMatch()) {
            if (d=Expression.tryMatch(1,y,a)) {
                if (e=TemplateSpans.tryMatch(y,a,t)) {
                    return new SubstitutionTemplate(bt, Parser.pos, [c,d,e])
                }
            }
        }

        Parser.goto(bt)
    }
}
class TemplateSpans extends ParseNode {
    static tryMatch(y,a,t) {
        let bt = Parser.pos;
        let c,d;
        
        if (c=TemplateTail.tryMatch()) return new TemplateSpans(bt,Parser.pos,[c])
        if (c=TemplateMiddleList.tryMatch(y,a,t)) {
            if (d=TemplateTail.tryMatch()) return new TemplateSpans(bt,Parser.pos,[c])
        }

        Parser.goto(bt);
    }
}
class TemplateMiddleList extends ParseNode {
    static tryMatch(y,a,t) {
        let bt = Parser.pos;
        let c,d;
        let e = []
        while (true) {
            if (c=TemplateMiddle.tryMatch()) {
                if (d=Expression.tryMatch(1,y,a)) e.push(c,d)
                else break
            }
            else break
        }

        if (e.length>0) {
            return new TemplateMiddleList(bt,Parser.pos,e)
        }

        Parser.goto(bt)
    }
}
class MemberExpression extends ParseNode {
    static tryMatch(y,a) {
        let c = PrimaryExpression.tryMatch(y,a)
        if (c) return new MemberExpression(c.start,c.end,[c])
    }
}
class SuperProperty extends ParseNode {}
class MetaProperty extends ParseNode {}
class NewTarget extends ParseNode {}
class ImportMeta extends ParseNode {}
class NewExpression extends ParseNode {
    static tryMatch(y,a) {
        let c = MemberExpression.tryMatch(y,a)
        if (c) return new NewExpression(c.start,c.end,[c])
    }
}
class CallExpression extends ParseNode {}
class CallMemberExpression extends ParseNode {}
class SuperCall extends ParseNode {}
class ImportCall extends ParseNode {}
class Arguments extends ParseNode {}
class ArgumentList extends ParseNode {}

class OptionalExpression extends ParseNode {}

class LeftHandSideExpression extends ParseNode {
    static tryMatch(y,a) {
        let c = NewExpression.tryMatch(y,a)
        if (c) return new LeftHandSideExpression(c.start,c.end,[c])
    }
}

class UpdateExpression extends ParseNode {
    static tryMatch(y,a) {
        let c = LeftHandSideExpression.tryMatch(y,a)
        if (c) return new UpdateExpression(c.start,c.end,[c])
    }
}

class UnaryExpression extends ParseNode {
    static tryMatch(y,a) {
        let c = UpdateExpression.tryMatch(y,a)
        if (c) return new UnaryExpression(c.start,c.end,[c])
    }
}

class ExponentiationExpression extends ParseNode {
    static tryMatch(y,a) {
        let c = UnaryExpression.tryMatch(y,a)
        if (c) return new ExponentiationExpression(c.start,c.end,[c])
    }
}

class MultiplicativeExpression extends ParseNode {
    static tryMatch(y,a) {
        let c = ExponentiationExpression.tryMatch(y,a)
        if (c) return new MultiplicativeExpression(c.start,c.end,[c])
    }
}

class MultiplicativeOperator extends ParseNode {
    static tryMatch() {

    }
}

class AdditiveExpression extends ParseNode {
    static tryMatch(y,a) {
        let c = MultiplicativeExpression.tryMatch(y,a)
        if (c) return new AdditiveExpression(c.start,c.end,[c])
    }
}

class ShiftExpression extends ParseNode {
    static tryMatch(y,a) {
        let c = AdditiveExpression.tryMatch(y,a)
        if (c) return new ShiftExpression(c.start,c.end,[c])
    }
}

class RelationalExpression extends ParseNode {
    static tryMatch(i,y,a) {
        let c = ShiftExpression.tryMatch(y,a)
        if (c) return new RelationalExpression(c.start,c.end,[c])
    }
}

class EqualityExpression extends ParseNode {
    static tryMatch(i,y,a) {
        let c = RelationalExpression.tryMatch(i,y,a)
        if (c) return new EqualityExpression(c.start,c.end,[c])
    }
}

class BitwiseANDExpression extends ParseNode {
    static tryMatch(i,y,a) {
        let c = EqualityExpression.tryMatch(i,y,a)
        if (c) return new BitwiseANDExpression(c.start,c.end,[c])
    }
}

class BitwiseXORExpression extends ParseNode {
    static tryMatch(i,y,a) {
        let c = BitwiseANDExpression.tryMatch(i,y,a)
        if (c) return new BitwiseXORExpression(c.start,c.end,[c])
    }
}

class BitwiseORExpression extends ParseNode {
    static tryMatch(i,y,a) {
        let c = BitwiseXORExpression.tryMatch(i,y,a)
        if (c) return new BitwiseORExpression(c.start,c.end,[c])
    }
}

class LogicalANDExpression extends ParseNode {
    static tryMatch(i,y,a) {
        let c = BitwiseORExpression.tryMatch(i,y,a)
        if (c) return new LogicalANDExpression(c.start,c.end,[c])
    }
}

class LogicalORExpression extends ParseNode {
    static tryMatch(i,y,a) {
        let c = LogicalANDExpression.tryMatch(i,y,a)
        if (c) return new LogicalORExpression(c.start,c.end,[c])
    }
}
class CoalesceExpression extends ParseNode {}
class CoalesceExpressionHead extends ParseNode {}
class ShortCircuitExpression extends ParseNode {
    static tryMatch(i,y,a) {
        let c = LogicalORExpression.tryMatch(i,y,a)
        if (!c) c = CoalesceExpression.tryMatch(i,y,a)
        if (c) return new ShortCircuitExpression(c.start,c.end,[c])
    }
}
class ConditionalExpression extends ParseNode {
    static tryMatch(i,y,a) {
        let c = ShortCircuitExpression.tryMatch(i,y,a)
        if (c) return new ConditionalExpression(c.start,c.end,[c])
    }
}

class AssignmentExpression extends ParseNode {
    static tryMatch(i,y,a) {
        let c = ConditionalExpression.tryMatch(i,y,a)
        if (c) return new AssignmentExpression(c.start,c.end,[c])
    }
}
class AssignmentOperator extends ParseNode {}
class AssignmentPattern extends ParseNode {}
class ObjectAssignmentPattern extends ParseNode {}
class ArrayAssignmentPattern extends ParseNode {}
class AssignmentRestProperty extends ParseNode {}
class AssignmentPropertyList extends ParseNode {}
class AssignmentElementList extends ParseNode {}
class AssignmentElisonElement extends ParseNode {}
class AssignmentProperty extends ParseNode {}
class AssignmentElement extends ParseNode {}
class AssignmentRestElement extends ParseNode {}
class DestructuringAssignmentTarget extends ParseNode {}
class Expression extends ParseNode {
    static tryMatch(i,y,a) {
        let bt = Parser.pos;
        let c = []
        while (true) {
            let e = AssignmentExpression.tryMatch(i,y,a);
            if (!e) break
            c.push(e)
            if (!Parser.test(',')) break
        }
        if (c.length>0) return new Expression(bt,Parser.pos,c)
    }
}

class Statement extends ParseNode {
    
}

class Declaration extends ParseNode {
    static tryMatch(y,a) {
        let d = HoistableDeclaration.tryMatch(y,a,0);
        if (!d) d = ClassDeclaration.tryMatch(y,a,0);
        if (!d) d = LexicalDeclaration.tryMatch(1,y,a);
        if (d) return new Declaration(d.start,d.end,[d])
    }
}

class HoistableDeclaration extends ParseNode {}
class BreakableStatement extends ParseNode {}
class BlockStatement extends ParseNode {}
class Block extends ParseNode {}

class StatementList extends ParseNode {
    static tryMatch(y, a, r) {
        let items = []
        while (true) {
            Parser.consumews(true)
            let item = StatementListItem.tryMatch(y,a,r)
            if (item) items.push(item)
            else break;
        }
        if (items.length>0) return new StatementList(items[0].start, items[items.length-1].end, items)
    }
}

class StatementListItem extends ParseNode {
    static tryMatch(y,a,r) {
        let d = Declaration.tryMatch(y,a);
        if (!d) d = Statement.tryMatch(y,a,r)
        if (d) return new StatementListItem(d.start,d.end,[d])
    }
}

class LexicalDeclaration extends ParseNode {
    static tryMatch(i,y,a) {
        let lc = LetOrConst.tryMatch()
        if (!lc) return
        if (Parser.test(' ')) {
            Parser.consumews();
            let bindings = BindingList.tryMatch(i,y,a);
            if (bindings) {
                Parser.consumews();
                if (Parser.test(';')) return new LexicalDeclaration(lc.start, Parser.pos, [lc, bindings])
            }
        }
    }
}

class LetOrConst extends ParseNode {
    static tryMatch() {
        let bt = Parser.pos;
        if (Parser.test('let')) return new LetOrConst(bt, Parser.pos)
        else if (Parser.test('const')) return new LetOrConst(bt, Parser.pos)
    }
}

class BindingList extends ParseNode {
    static tryMatch(i,y,a) {
        let bindings = []
        let n = LexicalBinding.tryMatch(i,y,a)
        if (n) bindings.push(n)
        else return 
        while (true) {
            Parser.consumews()
            if (!Parser.test(',')) break
            let n = LexicalBinding.tryMatch(i,y,a)
            if (n) bindings.push(n)
            else break;
        }
        if (bindings.length > 0) return new BindingList(bindings[0].start,bindings[bindings.length-1].end,bindings)
    }
}

class LexicalBinding extends ParseNode {
    static tryMatch(i,y,a) {
        let back = Parser.pos;
        Parser.consumews()
        let id = BindingIdentifier.tryMatch(y,a)
        if (id) {
            let init = Initializer.tryMatch(i,y,a)
            if (init) return new LexicalBinding(id.start, init.end, [id, init])
            else return new LexicalBinding(id.start,id.end,[id])
        }
        // looks like we failed. lets try another production
        Parser.goto(back)
        Parser.consumews()
        id = BindingPattern.tryMatch(y,a)
        if (id) {
            let init = Initializer.tryMatch(i,y,a)
            if (init) return new LexicalBinding(id.start, init.end, [id, init])
        }
        // yeah we failed.
        Parser.goto(back)
    }
}

class VariableStatement extends ParseNode {}
class VariableDeclarationList extends ParseNode {}
class VariableDeclaration extends ParseNode {}
class BindingPattern extends ParseNode {}
class ObjectBindingPattern extends ParseNode {}
class ArrayBindingPattern extends ParseNode {}
class BindingRestProperty extends ParseNode {}
class BindingPropertyList extends ParseNode {}
class BindingElementList extends ParseNode {}
class BindingElisonElement extends ParseNode {}
class BindingProperty extends ParseNode {}
class BindingElement extends ParseNode {}
class SingleNameBinding extends ParseNode {}
class BindingRestElement extends ParseNode {}
class EmptyStatement extends ParseNode {}
class IfStatement extends ParseNode {}
class IterationStatement extends ParseNode {}
class ForDeclaration extends ParseNode {}
class ForBinding extends ParseNode {}
class ContinueStatement extends ParseNode {}
class BreakStatement extends ParseNode {}
class ReturnStatement extends ParseNode {}
class WithStatement extends ParseNode {}
class SwitchStatement extends ParseNode {}
class CaseBlock extends ParseNode {}
class CaseClauses extends ParseNode {}
class CaseClause extends ParseNode {}
class DefaultClause extends ParseNode {}
class LabelledStatement extends ParseNode {}
class LabelledItem extends ParseNode {}
class ThrowStatement extends ParseNode {}
class TryStatement extends ParseNode {}
class Catch extends ParseNode {}
class Finally extends ParseNode {}
class CatchParameter extends ParseNode {}
class DebuggerStatement extends ParseNode {}
class FunctionDeclaration extends ParseNode {}
class FunctionExpression extends ParseNode {}
class UniqueFormalParameters extends ParseNode {}
class FormalParameters extends ParseNode {}
class FormalParameterList extends ParseNode {}
class FunctionRestParameter extends ParseNode {}
class FormalParameter extends ParseNode {}
class FunctionBody extends ParseNode {}
class FunctionStatementList extends ParseNode {}
class ArrowFunction extends ParseNode {}
class ArrowParameters extends ParseNode {}
class ConciseBody extends ParseNode {}
class ExpressionBody extends ParseNode {}
class ArrowFormalParameters extends ParseNode {}
class AsyncArrowFunction extends ParseNode {}
class AsyncConciseBody extends ParseNode {}
class AsyncArrowBBindingIdentifier extends ParseNode {}
class CoverCallExpressionAndAsyncArrowHead extends ParseNode {}
class AsyncArrowHead extends ParseNode {}
class MethodDefinition extends ParseNode {}
class PropertySetParameterList extends ParseNode {}
class GeneratorMethod extends ParseNode {}
class GeneratorDeclaration extends ParseNode {}
class GeneratorExpression extends ParseNode {}
class GeneratorBody extends ParseNode {}
class YieldExpression extends ParseNode {}
class AsyncGeneratorMethod extends ParseNode {}
class AsyncGeneratorDeclaration extends ParseNode {}
class AsyncGeneratorExpression extends ParseNode {}
class AsyncGeneratorBody extends ParseNode {}
class AsyncFunctionDeclaration extends ParseNode {}
class AsyncFunctionExpression extends ParseNode {}
class AsyncMethod extends ParseNode {}
class AsyncFunctionBody extends ParseNode {}
class AwaitExpression extends ParseNode {}
class ClassDeclaration extends ParseNode {}
class ClassExpression extends ParseNode {}
class ClassTail extends ParseNode {}
class ClassHeritage extends ParseNode {}
class ClassBody extends ParseNode {}
class ClassElementList extends ParseNode {}
class ClassElement extends ParseNode {}

class Script extends ParseNode {
    static tryMatch() {
        let body = ScriptBody.tryMatch()
        if (body) return new Script(body.start,body.end,[body])
        else return new Script(0,0)
    }
}

class ScriptBody extends ParseNode {
    static tryMatch() {
        let statements = StatementList.tryMatch(0,0,0);
        if (statements) return new ScriptBody(statements.start, statements.end, [statements])
    }
}

class Module extends ParseNode {}
class ModuleBody extends ParseNode {}
class ModuleItemList extends ParseNode {}
class ModuleItem extends ParseNode {}
class ImportDeclaration extends ParseNode {}
class ImportClause extends ParseNode {}
class ImportedDefaultBinding extends ParseNode {}
class NameSpaceImport extends ParseNode {}
class NamedImports extends ParseNode {}
class FromClause extends ParseNode {}
class ImportsList extends ParseNode {}
class ModuleSpecifier extends ParseNode {}
class ImportedBinding extends ParseNode {}
class ExportDeclaration extends ParseNode {}
class ExportFromClause extends ParseNode {}
class NamedExports extends ParseNode {}
class ExportsList extends ParseNode {}
class ExportSpecifier extends ParseNode {}
class StringNumericLiteral extends ParseNode {}
class StrWhiteSpace extends ParseNode {}
class StrWhiteSpaceChar extends ParseNode {}
class StrNumericLiteral extends ParseNode {}
class StrDecimalLiteral extends ParseNode {}
class StrUnsignedDecimalLiteral extends ParseNode {}
class uri extends ParseNode {}
class uriCharacters extends ParseNode {}
class uriCharacter extends ParseNode {}
class uriReserved extends ParseNode {}
class uriUnescaped extends ParseNode {}
class uriEscaped extends ParseNode {}
class uriAlpha extends ParseNode {}
class uriMark extends ParseNode {}
class Pattern extends ParseNode {}
class Disjunction extends ParseNode {}
class Alternative extends ParseNode {}
class Term extends ParseNode {}
class Assertion extends ParseNode {}
class Quantifier extends ParseNode {}
class QuantifierPrefix extends ParseNode {}
class Atom extends ParseNode {}
class SyntaxCharacter extends ParseNode {}
class AtomEscape extends ParseNode {}
class CharacterEscape extends ParseNode {}
class ControlEscape extends ParseNode {}
class ControlLetter extends ParseNode {}
class GroupSpecifier extends ParseNode {}
class GroupName extends ParseNode {}
class RegExpIdentifierName extends ParseNode {}
class RegExpIdentifierStart extends ParseNode {}
class RegExpUnicodeEscapeSequence extends ParseNode {}
class LeadSurrogate extends ParseNode {}
class TrailSurrogate extends ParseNode {}
class NonSurrogate extends ParseNode {}
class IdentityEscape extends ParseNode {}
class DecimalEscape extends ParseNode {}
class CharacterClassEscape extends ParseNode {}
class UnicodePropertyValueExpression extends ParseNode {}
class UnicodePropertyName extends ParseNode {}
class UnicodePropertyNameCharacters extends ParseNode {}
class UnicodePropertyValue extends ParseNode {}
class UnicodePropertyNameOrValue extends ParseNode {}
class UnicodePropertyValueCharacters extends ParseNode {}
class UnicodePropertyValueCharacter extends ParseNode {}
class UnicodePropertyNameCharacter extends ParseNode {}
class CharacterClass extends ParseNode {}
class ClassRanges extends ParseNode {}
class NonEmptyClassRanges extends ParseNode {}
class NonEmptyClassRangesNoDash extends ParseNode {}
class ClassAtom extends ParseNode {}
class ClassAtomNoDash extends ParseNode {}
class ClassEscape extends ParseNode {}

function ScriptRecord() {
	let record = {};
	record.Realm = undefined;
	record.Environment = undefined;
	record.ECMAScriptCode = undefined;
	record.HostDefined = undefined;
	return record;
}

class Parser {
    static goto;
    static peek;
    static get;
    static consumews;
    static test;
    static prodTest;

    src = '';
    pos = 0;

    constructor() {
        Parser.goto = this.goto.bind(this);
        Parser.peek = this.peek.bind(this);
        Parser.get  = this.get.bind(this);
        Parser.consumews = this.consumews.bind(this);
        Parser.test = this.test.bind(this);
        Parser.prodTest = this.prodTest.bind(this)
        Object.defineProperty(Parser, 'src', {
            get: (() => {
                return this.src;
            }).bind(this)
        })
        Object.defineProperty(Parser, 'pos', {
            get: (() => {
                return this.pos;
            }).bind(this)
        })
    }

    goto(pos) {
        this.pos = pos;
    }

    peek(dist = 1) {
        return this.src.charAt(this.pos+dist);
    }

    get() {
        let c = this.src.charAt(this.pos);
        this.pos++;
        return c;
    }

    consumews(includelb = true) {
        let f = true;
        while (f) {
            let bt = this.pos;
            let c = this.get();
            let g = false;
            if (includelb) {if (c == '\n') g=true;}
            if (c != ' ' && c != '\t' && !g) {
                f = false;
                this.goto(bt);
            }
        }
    }

    test(str, consumeIfTrue = true) {
        let len = str.length;
        for (let i = 0; i < len; i++) {
            let c = this.peek(i);
            if (c != str.charAt(i)) return false
        }
        if (consumeIfTrue) this.goto(this.pos + len);
        return true
    }

    prodTest(NonTerminal, ntParams = [], consumeIfTrue = false) {
        let bt = this.pos;
        let t = NonTerminal.tryMatch(...ntParams);
        if (!consumeIfTrue) this.goto(bt)
        if (t) return true
        else return false
    }
    ParseScript(sourceText) {
        this.src = sourceText;
        this.pos = 0;
        let parsed = Script.tryMatch()
        let record = new ScriptRecord()
        record.ECMAScriptCode = parsed
        return record;
    }
}

let source = `let a;
let b = 1;
let c = 0;
let d = 1n;
let e = 1.0;
let f = 1e+1;
let g = 0b1;
let h = 0o1;
let i = 0x1;

let j = "Hello World!";
let k = 'pog.';

let l = \`\`;
let m = \`cool\`;
let n = \`super duper \${m} \${k}\`;

let o = /hello *[wW]orld./;`

dbg = 0
let a = new Parser()
let s = a.ParseScript(source)
function dbgtree(t) {
	console.log(t.constructor.name + ': ' + source.substr(t.start,t.end-t.start))
	t.children.forEach((c) => {
		dbgtree(c)
	})
}
dbgtree(s.ECMAScriptCode)