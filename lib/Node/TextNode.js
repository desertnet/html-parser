import Node, {NodeType} from './Node'

/**
 * HTML text node.
 */
export default class TextNode extends Node {
  constructor () {
    super(NodeType.TEXT);

    /**
     * @private
     * @type {string}
     */
    this._text = "";
  };

  /**
   * @override
   */
  canHaveChildren () {
    return false;
  }

  /**
   * @override
   * @return {string}
   */
  toString () {
    return "'" + this._text + "'";
  }

  /**
   * @override
   */
  addToken (token) {
    super.addToken(token);
    this._text += token.value;
  }
}
