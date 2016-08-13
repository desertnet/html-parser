/**
 * HTML comment node.
 * @constructor
 * @extends {Foundation.HTML.Parser.Node}
 */
Foundation.HTML.Parser.Node.Comment = function () {
  Foundation.HTML.Parser.Node.call(this, Foundation.HTML.Parser.Node.Type.CMNT);

  /**
   * @private
   * @type {string}
   */
  this._text = "";
};
Foundation.inherit(Foundation.HTML.Parser.Node.Comment, Foundation.HTML.Parser.Node);

/**
 * @override
 */
Foundation.HTML.Parser.Node.Comment.prototype.canHaveChildren = function () {
  return false;
};

/**
 * @override
 * @return {string}
 */
Foundation.HTML.Parser.Node.Comment.prototype.toString = function () {
  return "<!--" + this._text + "-->";
};

/**
 * @override
 */
Foundation.HTML.Parser.Node.Comment.prototype.addToken = function (token) {
  Foundation.HTML.Parser.Node.prototype.addToken.call(this, token);

  if (token.type !== "commentStart" && token.type !== "commentEnd") {
    this._text += token.value;
  }
};
