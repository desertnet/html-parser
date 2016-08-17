import HTMLNode, {NodeType} from './HTMLNode'

/**
 * HTML comment node.
 */
export default class CommentNode extends HTMLNode {
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
  get type () { return NodeType.CMNT }

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
    return "<!--" + this._text + "-->";
  }

  /**
   * @override
   */
  addToken (token) {
    super.addToken(token);

    if (token.type !== "commentStart" && token.type !== "commentEnd") {
      this._text += token.value;
    }
  }
}
