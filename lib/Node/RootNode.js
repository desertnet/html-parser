import Node, {NodeType} from './Node'

export default class RootNode extends Node {
  constructor () {
    super(NodeType.ROOT)
  }

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
    return this.children() ? this.children().join("") : "";
  }
}
