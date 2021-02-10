const ParseTreeBranch = '|'
const ParseTreeDisjunction = '\\'
const ParseTreeSep = ' '

function printParseTree(node) {
	function printParseNode(n, r) {

		let d = ''
		for (let ur = 0; ur<r; ur++) {
			d+=ParseTreeSep;
		}
		d+=ParseTreeDisjunction;
		d+=n.constructor.name
		n.children.forEach((i) => {
			console.log(d)
			printParseNode(i,r+1)
		})
	}
	printParseNode(node, 0);
}

module.exports = {printParseTree: printParseTree}