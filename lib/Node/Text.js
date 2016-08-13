/**
 * HTML text node.
 * @constructor
 * @extends {Foundation.HTML.Parser.Node}
 */
Foundation.HTML.Parser.Node.Text = function () {
  Foundation.HTML.Parser.Node.call(this, Foundation.HTML.Parser.Node.Type.TEXT);

  /**
   * @private
   * @type {string}
   */
  this._text = "";
};
Foundation.inherit(Foundation.HTML.Parser.Node.Text, Foundation.HTML.Parser.Node);

/**
 * @override
 */
Foundation.HTML.Parser.Node.Text.prototype.canHaveChildren = function () {
  return false;
};

/**
 * @override
 * @return {string}
 */
Foundation.HTML.Parser.Node.Text.prototype.toString = function () {
  return "'" + this._text + "'";
};

/**
 * @override
 */
Foundation.HTML.Parser.Node.Text.prototype.addToken = function (token) {
  Foundation.HTML.Parser.Node.prototype.addToken.call(this, token);
  this._text += token.value;
};
