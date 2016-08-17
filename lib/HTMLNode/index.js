import HTMLParseError from '../HTMLParseError'

/**
 * HTML node types.
 * @enum {string}
 */
export const NodeType = {
  ROOT: "ROOT",
  TAG:  "TAG",
  ATTR: "ATTR",
  TEXT: "TEXT",
  ENT:  "ENT",
  CMNT: "CMNT",
  CLOSE: "CLOSE"
};

/**
 * HTML tree nodes base class. Should never be called outside of
 * subclass constructors!
 */
export default class HTMLNode {
  constructor () {
    /**
     * @private
     * @type {Array.<Foundation.HTML.Parser.HTMLNode>?}
     */
    this._children = null;

    /**
     * @private
     * @type {Array.<Foundation.Scanner.Token>}
     */
    this._sourceTokens = [];

    /**
     * @private
     * @type {Array.<HTMLParseError>?}
     */
    this._errors = null;
  }

  /**
   * Subclasses must override this.
   * @return {boolean}
   */
  get canHaveChildren () {
    throw new NodeError("canHaveChildren not overriden in subclass", this)
  }

  /**
   * Subclasses must override this.
   * @return {string}
   */
  toString () {
    throw new NodeError("toString not overriden in subclass", this)
  }

  /**
   * @return {NodeType}
   */
  get type () {
    throw new NodeError("type getter not overriden in subclass", this)
  }

  /**
   * @return {Array.<Foundation.HTML.Parser.HTMLNode>?}
   */
  get children () {
    if (this._children === null || this._children.length === 0) {
      return null;
    }

    return this._children.slice(0);
  }

  /**
   * @return {Foundation.HTML.Parser.HTMLNode}
   */
  get lastChild () {
    var children = this.children;
    if (children === null || children.length === 0) {
      return null;
    }
    return children[children.length - 1];
  }

  /**
   * @param {Foundation.Scanner.Token} token
   */
  addToken (token) {
    this._sourceTokens.push(token);

    // Create error objects when adding a token of type error.
    if (token.type === "error") {
      var error = new HTMLParseError();
      error.message = "Invalid token: \"" + token.value + "\"";
      error.addToken(token);
      this.addError(error);
    }
  }

  /**
   * @return {Array.<Foundation.Scanner.Token>}
   */
  get tokens () {
    return this._sourceTokens.slice(0);
  }

  /**
   * @return {Array.<number>?}
   */
  get indexRange () {
    var tokens = this.tokens;
    if (tokens.length === 0) {
      return null;
    }

    var firstToken = tokens[0];
    var lastToken = tokens[tokens.length - 1];
    return [
      firstToken.index,
      lastToken.index + lastToken.value.length - 1
    ];
  }

  /**
   * @param {Foundation.HTML.Parser.HTMLNode} childNode
   * @return {Foundation.HTML.Parser.HTMLNode}
   */
  appendChild (childNode) {
    if (! this.canHaveChildren) {
      throw new NodeError(
        "attempted to call appendChild on node that can't have children", this
      );
    }

    if (! this._children) {
      this._children = [];
    }

    this._children.push(childNode);

    return this;
  }

  /**
   * @public
   * @return {Array.<HTMLParseError>}
   */
  get errors () {
    if (this.canHaveChildren && this.children) {
      return this.children.reduce((accumulator, child) => {
        return accumulator.concat(child.errors)
      }, this.ownErrors)
    }

    return this.ownErrors
  }

  /**
   * @param {HTMLParseError} error
   */
  addError (error) {
    if (this._errors === null) {
      this._errors = [];
    }
    this._errors.push(error);
  }

  /**
   * @private
   * @return {Array.<HTMLParseError>}
   */
  get ownErrors () {
    return this._errors === null ? [] : this._errors.slice(0);
  }
}

/**
 * HTML node error class. This is a throwable Error object, not to be
 * confused with the HTMLParseError class which deals
 * with reporting errors found in the HTML source.
 */
export class NodeError extends Error {
  /**
   * @param {string} message
   * @param {Foundation.HTML.Parser.HTMLNode} node
   */
  constructor (message, node) {
    super(message);
    this.name = "HTMLParserNodeError";
    this.node = node;
  }
};
