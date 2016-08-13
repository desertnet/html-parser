/**
 * HTML closing tag node.
 * @constructor
 * @extends {Foundation.HTML.Parser.Node}
 */
Foundation.HTML.Parser.Node.CloseTag = function () {
  Foundation.HTML.Parser.Node.call(this, Foundation.HTML.Parser.Node.Type.CLOSE);

  /**
   * @private
   * @type {string}
   */
  this._tagName = "";
};
Foundation.inherit(Foundation.HTML.Parser.Node.CloseTag, Foundation.HTML.Parser.Node);

/**
 * @override
 */
Foundation.HTML.Parser.Node.CloseTag.prototype.canHaveChildren = function () {
  return false;
};

/**
 * @override
 * @return {string}
 */
Foundation.HTML.Parser.Node.CloseTag.prototype.toString = function () {
  return "</" + this.tagName() + ">";
};

/**
 * @override
 */
Foundation.HTML.Parser.Node.CloseTag.prototype.addToken = function (token) {
  Foundation.HTML.Parser.Node.prototype.addToken.call(this, token);

  if (token.type === "closeTagStart") {
    this.setTagName(token.value.replace(/^<\//, ""));
  }
  else if (token.type === "closeTag") {
    this.setTagName(token.value.replace(/^<\/([^>\s]+)>/, "$1"));
  }
};

/**
 * @return {string}
 */
Foundation.HTML.Parser.Node.CloseTag.prototype.tagName = function () {
  return this._tagName;
};

/**
 * @param {string} name
 */
Foundation.HTML.Parser.Node.CloseTag.prototype.setTagName = function (name) {
  this._tagName = name.toLowerCase();
};
