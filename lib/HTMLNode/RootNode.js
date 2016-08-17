import HTMLNode, {NodeType} from './.'

export default class RootNode extends HTMLNode {
  constructor () {
    super()
  }

  /**
   * @override
   */
  get type () { return NodeType.ROOT }

  /**
   * @override
   */
  get canHaveChildren () {
    return true;
  }

  /**
   * @override
   */
  toString () {
    return this.children ? this.children.join("") : "";
  }
}
