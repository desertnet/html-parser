import Node, {NodeType} from './Node'

/**
 * HTML attribute node
 */
export default class AttrNode extends Node {
  constructor() {
    super(NodeType.ATTR);

    /**
     * @private
     * @type {string}
     */
    this._name;

    /**
     * @private
     * @type {string}
     */
    this._value = "";
  }

  /**
   * @override
   */
  canHaveChildren () {
    return false;
  }

  /**
   * @override
   */
  toString () {
    return this._name.toLowerCase() + "='" + this._value + "'";
  }

  /**
   * @override
   */
  addToken (token) {
    super.addToken(token);

    // TODO: this needs considerably more logic
    if (token.type === "attributeStart") {
      this._name = token.value;
    }
    else if (token.type === "text" || token.type === "error") {
      this._value += token.value;
    }
  }
}
