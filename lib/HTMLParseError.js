/**
 * Class for recording syntactic and semantic HTML errors.
 * @constructor
 */
Foundation.HTML.Parser.Error = function () {
  /**
   * @private
   * @type {string} message
   */
  this._message = "Unknown parse error";

  /**
   * @private
   * @type {Array.<Foundation.Scanner.Token>}
   */
  this._tokens = [];
};

/**
 * @param {string} message
 */
Foundation.HTML.Parser.Error.prototype.setMessage = function (message) {
  this._message = message;
};

/**
 * @public
 * @return {string}
 */
Foundation.HTML.Parser.Error.prototype.message = function () {
  return this._message;
};

/**
 * @param {Foundation.Scanner.Token} token
 */
Foundation.HTML.Parser.Error.prototype.addToken = function (token) {
  this._tokens.push(token);
  this._tokens.sort(function (a, b) { return (a.index < b.index) ? -1 : 1; });
};

/**
 * @param {Foundation.HTML.Parser.Node} node
 */
Foundation.HTML.Parser.Error.prototype.addTokensFromNode = function (node) {
  node.tokens().forEach(this.addToken.bind(this));
};

/**
 * The offset in the source string where the error begins.
 * @public
 * @return {number}
 */
Foundation.HTML.Parser.Error.prototype.startIndex = function () {
  this.assertTokensHaveBeenAdded();
  return this._tokens[0].index;
};

/**
 * The offset in the source string where the error stops.
 * @public
 * @return {number}
 */
Foundation.HTML.Parser.Error.prototype.endIndex = function () {
  this.assertTokensHaveBeenAdded();
  var lastToken = this._tokens[this._tokens.length - 1];
  return lastToken.index + lastToken.value.length;
};

/**
 * The line number in the source string where the error begins.
 * @public
 * @return {number}
 */
Foundation.HTML.Parser.Error.prototype.line = function () {
  this.assertTokensHaveBeenAdded();
  return this._tokens[0].line;
};

/**
 * The column number of the line in the source string where the error begins.
 * @public
 * @return {number}
 */
Foundation.HTML.Parser.Error.prototype.column = function () {
  this.assertTokensHaveBeenAdded();
  return this._tokens[0].column;
};

/**
 * @private
 */
Foundation.HTML.Parser.Error.prototype.assertTokensHaveBeenAdded = function () {
  if (this._tokens.length === 0) {
    throw new Error("No tokens added to error object.");
  }
};

/**
 * @private
 * @return {Array.<Foundation.Scanner.Token>}
 */
Foundation.HTML.Parser.Error.prototype.tokens = function () {
  return this._tokens.slice(0);
};

Foundation.HTML.Parser.Error.prototype["message"] = Foundation.HTML.Parser.Error.prototype.message;
Foundation.HTML.Parser.Error.prototype["startIndex"] = Foundation.HTML.Parser.Error.prototype.startIndex;
Foundation.HTML.Parser.Error.prototype["endIndex"] = Foundation.HTML.Parser.Error.prototype.endIndex;
Foundation.HTML.Parser.Error.prototype["line"] = Foundation.HTML.Parser.Error.prototype.line;
Foundation.HTML.Parser.Error.prototype["column"] = Foundation.HTML.Parser.Error.prototype.column;
