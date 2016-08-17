import Node, {NodeType} from './Node'

export default class RootNode extends Node {
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
