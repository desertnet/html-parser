import Instr from './Instr'
import Compiler from './Compiler'
import {NodeType} from './Node/Node.js'
import RootNode from './Node/RootNode'
import EntityNode from './Node/EntityNode'
import HTMLParseError from './HTMLParseError'

let _parserSingleton = null

/**
 * Basic HTML parser and validator. Call the parse() method with a
 * string of HTML, and it will return a Foundaiton.HTML.Parser.Node
 * object containing the parse tree.
 *
 * How does it work? It creates an instance of Compiler,
 * which in turn uses Foundation.Scanner to tokenize the string.
 * The compiler takes these tokens and generates arrays of
 * Op objects. The parser takes these arrays
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
 */
export default class HTMLParser {
  constructor () {
    /**
     * The string of HTML text we are going to parse.
     * @private
     * @type {string}
     */
    this._input;

    /**
     * The HTML parse tree.
     * @private
     * @type {RootNode}
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
     * @type {Array.<TagNode|RootNode>}
     */
    this._openElements;

    /**
     * The compiler. Takes the string of HTML, and tells us
     * what to do.
     * @private
     * @type {Compiler}
     */
    this._compiler = new Compiler();

    this.reset();
  }

  /**
   * @public
   * @param {string} html
   * @return {Array.<HTMLParseError>}
   */
  static validate (html) {
    if (!_parserSingleton) {
      _parserSingleton = new HTMLParser();
    }
    return _parserSingleton.parse(html).errors();
  }

  /**
   * @public
   * @return {Foundation.Promise}
   */
  static initializeExtraValidations () {
    return EntityNode.loadNamedEntitiesFromServer();
  }

  /**
   * Parses the given html string, returning the HTML parse tree.
   * @public
   * @param {string} html
   * @return {RootNode}
   */
  parse (html) {
    this.setInput(html);

    var code;
    while (code = this.compiler().generateNextCodeFragment()) {
      code.forEach(op => this.executeOp(op));
    }

    this.finalize();

    var result = this._root;
    this.reset();
    return result;
  }

  /**
   * @return {Compiler}
   */
  compiler () {
    return this._compiler;
  }

  /**
   * Get unfinished nodes into the tree and forcibly close any open tags.
   * @private
   */
  finalize () {
    var addedErrorToTopmostNode = false;
    while (this._nodes.length) {
      var unfinishedNode = this.popNode();
      if (!addedErrorToTopmostNode) {
        var error = new HTMLParseError();
        error.setMessage("Unexpected end of HTML.");
        error.addTokensFromNode(unfinishedNode);
        unfinishedNode.addError(error);
        addedErrorToTopmostNode = true;
      }
    }

    if (this.currentOpenElement() !== this._root) {
      var topmostTag = /** @type {TagNode} */ (this._openElements[this._openElements.length - 2]);
      this.addClosedElementToParent(topmostTag);
    }
  }

  /**
   * Reset the parser to its default state.
   * @private
   */
  reset () {
    this.setInput("");
  }

  /**
   * @private
   * @param {string} input
   */
  setInput (input) {
    this._input = input;
    this._compiler.setInput(this._input);

    this._nodes = [];
    this._root = new RootNode();
    this._openElements = [this._root];
  }

  /**
   * @private
   * @param {Op} op
   */
  executeOp (op) {
    switch (op.instruction()) {
      case Instr.PUSH_NODE:
        this.pushNode(op.node());
        break;

      case Instr.POP_NODE:
        this.popNode();
        break;

      case Instr.ADD_TOKEN:
        this.currentNode().addToken(op.token());
        break;

      default:
        throw new Error("Unknown instruction in executeOp(): " + op.instruction());
        break;
    }
  }

  /**
   * @private
   * @param {Foundation.HTML.Parser.Node} node
   */
  pushNode (node) {
    this._nodes.push(node);
  }

  /**
   * @private
   * @return {Foundation.HTML.Parser.Node}
   */
  popNode () {
    if (this._nodes.length === 0) {
      throw new Error("Node stack is unexpectedly empty.");
    }

    var poppedNode = this._nodes.pop();
    this.applyCompletedNode(poppedNode);
    return poppedNode;
  }

  /**
   * @private
   * @return {Foundation.HTML.Parser.Node}
   */
  currentNode () {
    if (this._nodes.length === 0) {
      throw new Error("called currentNode() when node stack is empty.");
    }
    return this._nodes[this._nodes.length - 1];
  }

  /**
   * @private
   * @param {Foundation.HTML.Parser.Node} node
   */
  applyCompletedNode (node) {
    switch (node.type()) {
      case NodeType.TEXT:
      case NodeType.ENT:
      case NodeType.CMNT:
        this.currentOpenElement().appendChild(node);
        break;

      case NodeType.ATTR:
        if (this.currentNode().type() !== NodeType.TAG) {
          throw new Error("Unexpected node type when applying attribute node.");
        }
        this.currentNode().addAttribute(node);
        break;

      case NodeType.TAG:
        var tagNode = /** @type {TagNode} */ (node);
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

      case NodeType.CLOSE:
        var tagToClose = this.mostRecentOpenElementWithName(node.tagName());
        if (tagToClose) {
          tagToClose.appendChild(node);
          this.addClosedElementToParent(tagToClose);
        }
        else {
          this.currentOpenElement().appendChild(node);
          var error = new HTMLParseError();
          error.setMessage('Found bogus closing tag "</'+node.tagName()+'>".');
          error.addTokensFromNode(node);
          node.addError(error);
        }
        break;

      default:
        throw new Error("Unknown node type in applyCompletedNode: " + node.type());
    }
  };

  addClosedElementToParent (element) {
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
        var error = new HTMLParseError();
        error.setMessage(
          'Unexpected closing tag, "</' + element.tagName() + '>". ' +
          'Expected closing tag for "<' + firstForciblyClosedElement.tagName() + '>".'
        );
        error.addTokensFromNode(closeTagNode);
        closeTagNode.addError(error);
      }
    }

    // Add errors to elements closed without a closing tag.
    closedElements.forEach(element => {
      if (!element.closingTag()) {
        var error = new HTMLParseError();
        error.setMessage(
          'Could not find closing tag for "<' + element.tagName() + '>".'
        );
        error.addTokensFromNode(element);
        element.addError(error);
      }
    });
  }

  /**
   * @private
   * @param {TagNode} element
   * @return {Array.<TagNode>}
   */
  popElementsToAndIncluding (element) {
    var closedElements = [];
    var foundElement = false;
    while (!foundElement) {
      var closedElement = this.popOpenElement();
      closedElements.push(closedElement);
      foundElement = (closedElement === element);
    }
    return closedElements;
  }

  /**
   * @private
   * @param {string} name
   * @return {TagNode}
   */
  mostRecentOpenElementWithName (name) {
    for (var i = 0; i < this._openElements.length - 1; i++) {
      var element = /** @type {TagNode} */ (this._openElements[i]);
      if (element.tagName() === name.toLowerCase()) {
        return element;
      }
    }

    // Couldn't find a matching tag.
    return null;
  }

  /**
   * @private
   * @return {RootNode}
   */
  parseTree () {
    return this._root;
  }

  /**
   * @private
   * @return {Foundation.HTML.Parser.Node}
   */
  currentOpenElement () {
    if (this._openElements.length === 0) {
      throw new Error("called currentOpenElement() when stack is empty");
    }
    return this._openElements[0];
  }

  /**
   * @private
   * @return {TagNode}
   */
  popOpenElement () {
    var element = this._openElements.shift();

    if (element instanceof RootNode) {
      throw new Error("Unexpectedly attempted to pop root node from open element stack.");
    }

    return element;
  }

  /**
   * @private
   * @param {Foundation.HTML.Parser.Node} elementNode
   */
  pushOpenElement (elementNode) {
    this._openElements.unshift(elementNode);
  }
}
