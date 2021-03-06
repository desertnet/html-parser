import HTMLNode, {NodeType} from './HTMLNode'

/**
 * HTML text node.
 */
export default class TextNode extends HTMLNode {
  constructor () {
    super();

    /**
     * @private
     * @type {string}
     */
    this._text = "";
  }

  /**
   * @override
   */
  get type () { return NodeType.TEXT }

  /**
   * @override
   */
  get canHaveChildren () {
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
