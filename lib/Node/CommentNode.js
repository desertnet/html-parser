import Node, {NodeType} from './Node'

/**
 * HTML comment node.
 */
export default class CommentNode extends Node {
  constructor () {
    super(NodeType.CMNT);

    /**
     * @private
     * @type {string}
     */
    this._text = "";
  }

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
