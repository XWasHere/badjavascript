/**
 * @abstract
 */
class ParseNode {
    /**
     * @type Array<ParseNode>
     */
    children = [];
    start = 0;
    end = 0;

    /**
     * @param {Number} start 
     * @param {Number} end 
     * @param {Array<ParseNode>} [children] 
     */
    constructor(start, end, children = []) {
        this.start = start
        this.end = end;
        this.children = children;
        return;
    }

    /**
     * @param {Parser} parser
     * @returns {ParseNode}
     */
    static tryMatch(parser) {

    }
}
