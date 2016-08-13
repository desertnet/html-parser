/**
 * Basic HTML parser and validator. Call the parse() method with a
 * string of HTML, and it will return a Foundaiton.HTML.Parser.Node
 * object containing the parse tree.
 * 
 * How does it work? It creates an instance of Foundation.HTML.Parser.Compiler,
 * which in turn uses Foundation.Scanner to tokenize the string.
 * The compiler takes these tokens and generates arrays of
 * Foundation.HTML.Parser.Op objects. The parser takes these arrays
 * of ops, and executes them.
 * 
 * There are three op instructions: "push node", "pop node" and "add token".
 * Pushing a node adds a new Foundation.HTML.Parser.Node to the 
 * parser's node stack. Adding a token adds the Foundation.Scanner.Token
 * to the node at the top of the node stack. And popping a node 
 * pops the topmost node from the node stack, and applies it to the
 * parser's open element stack. This may just involve adding it to the
 * currently open element, or if it's a closing tag node it may modify
 * the open element stack in interesting ways.
 * 
 * http://www.w3.org/TR/html5/syntax.html#parsing
 * @constructor
 */
Foundation.HTML.Parser = function () {
    /**
     * The string of HTML text we are going to parse.
     * @private
     * @type {string}
     */
    this._input;

    /**
     * The HTML parse tree.
     * @private
     * @type {Foundation.HTML.Parser.Node.Root}
     */
    this._root;

    /**
     * The stack of unfinished nodes. The top of the stack is whatever
     * node we are working on assembling.
     * @private
     * @type {Array.<Foundation.HTML.Parser.Node>}
     */
    this._nodes;

    /**
     * The stack of open element nodes. When we consume a closing
     * tag, we use this stack to determine which nodes belong
     * as children of which elements.
     * @private
     * @type {Array.<Foundation.HTML.Parser.Node.Tag|Foundation.HTML.Parser.Node.Root>}
     */
    this._openElements;

    /**
     * The compiler. Takes the string of HTML, and tells us
     * what to do.
     * @private
     * @type {Foundation.HTML.Parser.Compiler}
     */
    this._compiler = new Foundation.HTML.Parser.Compiler();

    this.reset();
};

/**
 * @public
 * @param {string} html
 * @return {Array.<Foundation.HTML.Parser.Error>}
 */
Foundation.HTML.Parser.validate = function (html) {
    if (!Foundation.HTML.Parser.validate._parser) {
        Foundation.HTML.Parser.validate._parser = new Foundation.HTML.Parser();
    }
    return Foundation.HTML.Parser.validate._parser.parse(html).errors();
};

/**
 * @public
 * @return {Foundation.Promise}
 */
Foundation.HTML.Parser.initializeExtraValidations = function () {
    return Foundation.HTML.Parser.Node.Entity.loadNamedEntitiesFromServer();
};

/**
 * Parses the given html string, returning the HTML parse tree.
 * @public
 * @param {string} html
 * @return {Foundation.HTML.Parser.Node.Root}
 */
Foundation.HTML.Parser.prototype.parse = function (html) {
    this.setInput(html);
    
    var code;
    while (code = this.compiler().generateNextCodeFragment()) {
        code.forEach(this.executeOp.bind(this));
    }

    this.finalize();

    var result = this._root;
    this.reset();
    return result;
};

/**
 * @return {Foundation.HTML.Parser.Compiler}
 */
Foundation.HTML.Parser.prototype.compiler = function () {
    return this._compiler;
};

/**
 * Get unfinished nodes into the tree and forcibly close any open tags.
 * @private
 */
Foundation.HTML.Parser.prototype.finalize = function () {
    var addedErrorToTopmostNode = false;
    while (this._nodes.length) {
        var unfinishedNode = this.popNode();
        if (!addedErrorToTopmostNode) {
            var error = new Foundation.HTML.Parser.Error();
            error.setMessage("Unexpected end of HTML.");
            error.addTokensFromNode(unfinishedNode);
            unfinishedNode.addError(error);
            addedErrorToTopmostNode = true;
        }
    }

    if (this.currentOpenElement() !== this._root) {
        var topmostTag = /** @type {Foundation.HTML.Parser.Node.Tag} */ (this._openElements[this._openElements.length - 2]);
        this.addClosedElementToParent(topmostTag);
    }
};

/**
 * Reset the parser to its default state.
 * @private
 */
Foundation.HTML.Parser.prototype.reset = function () {
    this.setInput("");
};

/**
 * @private
 * @param {string} input
 */
Foundation.HTML.Parser.prototype.setInput = function (input) {
    this._input = input;
    this._compiler.setInput(this._input);

    this._nodes = [];
    this._root = new Foundation.HTML.Parser.Node.Root();
    this._openElements = [this._root];
};

/**
 * Possible instructions used in a Foundation.HTML.Parser.Op, and
 * by the parser's executeCode method.
 * @enum {string}
 */
Foundation.HTML.Parser.Instr = {
    PUSH_NODE: "PUSH_NODE",
    POP_NODE: "POP_NODE",
    ADD_TOKEN: "ADD_TOKEN"
};

/**
 * @private
 * @param {Foundation.HTML.Parser.Op} op
 */
Foundation.HTML.Parser.prototype.executeOp = function (op) {
    switch (op.instruction()) {
        case Foundation.HTML.Parser.Instr.PUSH_NODE:
            this.pushNode(op.node());
            break;

        case Foundation.HTML.Parser.Instr.POP_NODE:
            this.popNode();
            break;

        case Foundation.HTML.Parser.Instr.ADD_TOKEN:
            this.currentNode().addToken(op.token());
            break;

        default:
            throw new Error("Unknown instruction in executeOp(): " + op.instruction());
            break;
    }
};

/**
 * @private
 * @param {Foundation.HTML.Parser.Node} node
 */
Foundation.HTML.Parser.prototype.pushNode = function (node) {
    this._nodes.push(node);
};

/**
 * @private
 * @return {Foundation.HTML.Parser.Node}
 */
Foundation.HTML.Parser.prototype.popNode = function () {
    if (this._nodes.length === 0) {
        throw new Error("Node stack is unexpectedly empty.");
    }

    var poppedNode = this._nodes.pop();
    this.applyCompletedNode(poppedNode);
    return poppedNode;
};

/**
 * @private
 * @return {Foundation.HTML.Parser.Node}
 */
Foundation.HTML.Parser.prototype.currentNode = function () {
    if (this._nodes.length === 0) {
        throw new Error("called currentNode() when node stack is empty.");
    }
    return this._nodes[this._nodes.length - 1];
};

/**
 * @private
 * @param {Foundation.HTML.Parser.Node} node
 */
Foundation.HTML.Parser.prototype.applyCompletedNode = function (node) {
    switch (node.type()) {
        case Foundation.HTML.Parser.Node.Type.TEXT:
        case Foundation.HTML.Parser.Node.Type.ENT:
        case Foundation.HTML.Parser.Node.Type.CMNT:
            this.currentOpenElement().appendChild(node);
            break;

        case Foundation.HTML.Parser.Node.Type.ATTR:
            if (this.currentNode().type() !== Foundation.HTML.Parser.Node.Type.TAG) {
                throw new Error("Unexpected node type when applying attribute node.");
            }
            this.currentNode().addAttribute(node);
            break;

        case Foundation.HTML.Parser.Node.Type.TAG:
            var tagNode = /** @type {Foundation.HTML.Parser.Node.Tag} */ (node);
            if (tagNode.canHaveChildren()) {
                this.pushOpenElement(tagNode);
                if (tagNode.hasRawtextContent()) {
                    this.compiler().setRawtextModeForTag(tagNode.tagName());
                }
            }
            else {
                this.currentOpenElement().appendChild(tagNode);
            }
            break;

        case Foundation.HTML.Parser.Node.Type.CLOSE:
            var tagToClose = this.mostRecentOpenElementWithName(node.tagName());
            if (tagToClose) {
                tagToClose.appendChild(node);
                this.addClosedElementToParent(tagToClose);
            }
            else {
                this.currentOpenElement().appendChild(node);
                var error = new Foundation.HTML.Parser.Error();
                error.setMessage('Found bogus closing tag "</'+node.tagName()+'>".');
                error.addTokensFromNode(node);
                node.addError(error);
            }
            break;

        default:
            throw new Error("Unknown node type in applyCompletedNode: " + node.type());
    }
};

Foundation.HTML.Parser.prototype.addClosedElementToParent = function (element) {
    var closedElements = this.popElementsToAndIncluding(element);
    var appendChain = closedElements.concat([this.currentOpenElement()]);
    appendChain.reduce(function (child, parent) {
        parent.appendChild(child);
        return parent;
    });

    // Add error to close tag node if we had to forcibly close elements.
    if (closedElements.length > 1) {
        var closeTagNode = element.closingTag();
        var firstForciblyClosedElement = closedElements[0];

        if (closeTagNode) {
            var error = new Foundation.HTML.Parser.Error();
            error.setMessage(
                'Unexpected closing tag, "</' + element.tagName() + '>". ' +
                'Expected closing tag for "<' + firstForciblyClosedElement.tagName() + '>".'
            );
            error.addTokensFromNode(closeTagNode);
            closeTagNode.addError(error);
        }
    }

    // Add errors to elements closed without a closing tag.
    closedElements.forEach(function (element) {
        if (!element.closingTag()) {
            var error = new Foundation.HTML.Parser.Error();
            error.setMessage(
                'Could not find closing tag for "<' + element.tagName() + '>".'
            );
            error.addTokensFromNode(element);
            element.addError(error);
        }
    }.bind(this));
};

/** 
 * @private
 * @param {Foundation.HTML.Parser.Node.Tag} element
 * @return {Array.<Foundation.HTML.Parser.Node.Tag>}
 */
Foundation.HTML.Parser.prototype.popElementsToAndIncluding = function (element) {
    var closedElements = [];
    var foundElement = false;
    while (!foundElement) {
        var closedElement = this.popOpenElement();
        closedElements.push(closedElement);
        foundElement = (closedElement === element);
    }
    return closedElements;
};

/**
 * @private
 * @param {string} name
 * @return {Foundation.HTML.Parser.Node.Tag}
 */
Foundation.HTML.Parser.prototype.mostRecentOpenElementWithName = function (name) {
    for (var i = 0; i < this._openElements.length - 1; i++) {
        var element = /** @type {Foundation.HTML.Parser.Node.Tag} */ (this._openElements[i]);
        if (element.tagName() === name.toLowerCase()) {
            return element;
        }
    }

    // Couldn't find a matching tag.
    return null;
};

/**
 * @private
 * @return {Foundation.HTML.Parser.Node.Root}
 */
Foundation.HTML.Parser.prototype.parseTree = function () {
    return this._root;
};

/**
 * @private
 * @return {Foundation.HTML.Parser.Node}
 */
Foundation.HTML.Parser.prototype.currentOpenElement = function () {
    if (this._openElements.length === 0) {
        throw new Error("called currentOpenElement() when stack is empty");
    }
    return this._openElements[0];
};

/**
 * @private
 * @return {Foundation.HTML.Parser.Node.Tag}
 */
Foundation.HTML.Parser.prototype.popOpenElement = function () {
    var element = this._openElements.shift();

    if (element instanceof Foundation.HTML.Parser.Node.Root) {
        throw new Error("Unexpectedly attempted to pop root node from open element stack.");
    }

    return element;
};

/**
 * @private
 * @param {Foundation.HTML.Parser.Node} elementNode
 */
Foundation.HTML.Parser.prototype.pushOpenElement = function (elementNode) {
    this._openElements.unshift(elementNode);
};

window["Foundation"]["HTML"]["Parser"] = Foundation.HTML.Parser;
Foundation.HTML.Parser["validate"] = Foundation.HTML.Parser.validate;
Foundation.HTML.Parser["initializeExtraValidations"] = Foundation.HTML.Parser.initializeExtraValidations;
Foundation.HTML.Parser.prototype["parse"] = Foundation.HTML.Parser.prototype.parse;

