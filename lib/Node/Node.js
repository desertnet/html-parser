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
export default class Node {
  /**
   * @param {NodeType} type
   */
  constructor (type) {
    /**
     * @private
     * @type {NodeType}
     */
    this._type = type;

    /**
     * @private
     * @type {Array.<Foundation.HTML.Parser.Node>?}
     */
    this._children = null;

    /**
     * @private
     * @type {Array.<Foundation.Scanner.Token>}
     */
    this._sourceTokens = [];

    /**
     * @private
     * @type {Array.<HTMLParseError>}
     */
    this._errors = [];
  }

  /**
   * Subclasses must override this.
   * @return {boolean}
   */
  canHaveChildren () {
    throw new NodeError(
      "canHaveChildren not overriden in subclass", this
    );
  }

  /**
   * Subclasses must override this.
   * @return {string}
   */
  toString () {
    throw new NodeError(
      "toString not overriden in subclass", this
    );
  }

  /**
   * @return {Array.<Foundation.HTML.Parser.Node>?}
   */
  children () {
    if (this._children === null || this._children.length === 0) {
      return null;
    }

    return this._children.slice(0);
  }

  /**
   * @return {Foundation.HTML.Parser.Node}
   */
  lastChild () {
    var children = this.children();
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
      error.setMessage("Invalid token: \"" + token.value + "\"");
      error.addToken(token);
      this.addError(error);
    }
  }

  /**
   * @return {Array.<Foundation.Scanner.Token>}
   */
  tokens () {
    return this._sourceTokens.slice(0);
  }

  /**
   * @return {Array.<number>?}
   */
  indexRange () {
    var tokens = this.tokens();
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
   * @param {Foundation.HTML.Parser.Node} childNode
   * @return {Foundation.HTML.Parser.Node}
   */
  appendChild (childNode) {
    if (! this.canHaveChildren()) {
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
   * @return {NodeType}
   */
  type () {
    return this._type;
  }

  /**
   * @public
   * @return {Array.<HTMLParseError>}
   */
  errors () {
    var childErrors = [];
    if (this.canHaveChildren()) {
      var children = this.children();
      if (children) {
        children.forEach(function (child) {
          childErrors = childErrors.concat(child.errors());
        }.bind(this));
      }
    }
    return this.ownErrors().concat(childErrors);
  }

  /**
   * @param {HTMLParseError} error
   */
  addError (error) {
    this._errors.push(error);
  }

  /**
   * @private
   * @return {Array.<HTMLParseError>}
   */
  ownErrors () {
    return this._errors.slice(0);
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
   * @param {Foundation.HTML.Parser.Node} node
   */
  constructor (message, node) {
    super(message);
    this.name = "HTMLParserNodeError";
    this.node = node;
  }
};
