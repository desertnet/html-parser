import HTMLNode, {NodeType} from './HTMLNode'

/**
 * HTML attribute node
 */
export default class AttrNode extends HTMLNode {
  constructor() {
    super();

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
  get type () { return NodeType.ATTR }

  /**
   * @override
   */
  get canHaveChildren () {
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
