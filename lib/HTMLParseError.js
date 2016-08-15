/**
 * Class for recording syntactic and semantic HTML errors.
 */
export default class HTMLParseError {
  constructor () {
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
  }

  /**
   * @param {string} message
   */
  setMessage (message) {
    this._message = message;
  }

  /**
   * @public
   * @return {string}
   */
  message () {
    return this._message;
  }

  /**
   * @param {Foundation.Scanner.Token} token
   */
  addToken (token) {
    this._tokens.push(token);
    this._tokens.sort(function (a, b) { return (a.index < b.index) ? -1 : 1; });
  }

  /**
   * @param {Foundation.HTML.Parser.Node} node
   */
  addTokensFromNode (node) {
    node.tokens().forEach(token => this.addToken(token));
  }

  /**
   * The offset in the source string where the error begins.
   * @public
   * @return {number}
   */
  startIndex () {
    this.assertTokensHaveBeenAdded();
    return this._tokens[0].index;
  }

  /**
   * The offset in the source string where the error stops.
   * @public
   * @return {number}
   */
  endIndex () {
    this.assertTokensHaveBeenAdded();
    var lastToken = this._tokens[this._tokens.length - 1];
    return lastToken.index + lastToken.value.length;
  }

  /**
   * The line number in the source string where the error begins.
   * @public
   * @return {number}
   */
  line () {
    this.assertTokensHaveBeenAdded();
    return this._tokens[0].line;
  }

  /**
   * The column number of the line in the source string where the error begins.
   * @public
   * @return {number}
   */
  column () {
    this.assertTokensHaveBeenAdded();
    return this._tokens[0].column;
  }

  /**
   * @private
   */
  assertTokensHaveBeenAdded () {
    if (this._tokens.length === 0) {
      throw new Error("No tokens added to error object.");
    }
  }

  /**
   * @private
   * @return {Array.<Foundation.Scanner.Token>}
   */
  tokens () {
    return this._tokens.slice(0);
  }
}
