import Node, {NodeType} from './Node'

/**
 * HTML closing tag node.
 */
export default class CloseTagNode extends Node {
  constructor () {
    super(NodeType.CLOSE);

    /**
     * @private
     * @type {string}
     */
    this._tagName = "";
  }

  /**
   * @override
   */
  get canHaveChildren () {
    return false;
  };

  /**
   * @override
   * @return {string}
   */
  toString () {
    return "</" + this.tagName + ">";
  }

  /**
   * @override
   */
  addToken (token) {
    super.addToken(token);

    if (token.type === "closeTagStart") {
      this.setTagName(token.value.replace(/^<\//, ""));
    }
    else if (token.type === "closeTag") {
      this.setTagName(token.value.replace(/^<\/([^>\s]+)>/, "$1"));
    }
  }

  /**
   * @return {string}
   */
  get tagName () {
    return this._tagName;
  }

  /**
   * @param {string} name
   */
  setTagName (name) {
    this._tagName = name.toLowerCase();
  }
}
