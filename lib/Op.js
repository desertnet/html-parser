import Instr from './Instr'

/**
 * Contains an operation containing an instruction for the parser to perform,
 * plus any necessary data.
 */
export default class Op {
  /**
   * @param {Instr} instruction
   * @param {Foundation.HTML.Parser.Node|Foundation.Scanner.Token|string=} data
   */
  constructor (instruction, data) {
    /**
     * @private
     * @type {Instr}
     */
    this._instr = instruction;

    /**
     * @private
     * @type {Foundation.HTML.Parser.Node?}
     */
    this._node = null;

    /**
     * @private
     * @type {Foundation.Scanner.Token}
     */
    this._token = null;

    if (data) {
      if (this.instruction() === Instr.PUSH_NODE) {
        this.setNode(/** @type {Foundation.HTML.Parser.Node} */ (data));
      }
      else if (this.instruction() === Instr.ADD_TOKEN) {
        this.setToken(/** @type {Foundation.Scanner.Token} */ (data));
      }
    }
  }

  /**
   * Instruction getter.
   * @return {Instr}
   */
  instruction () {
    return this._instr;
  }

  /**
   * @param {Foundation.Scanner.Token} token
   * @return {Op}
   */
  setToken (token) {
    if (this.instruction() !== Instr.ADD_TOKEN) {
      throw new Error("Can't set token on non-ADD_TOKEN op.");
    }
    this._token = token;
    return this;
  }

  /**
   * @return {Foundation.Scanner.Token}
   */
  token () {
    if (this._token === null) {
      throw new Error("Can't call token() on this op, setToken was never called.");
    }
    return this._token;
  }

  /**
   * @param {Foundation.HTML.Parser.Node} node
   * @return {Op}
   */
  setNode (node) {
    if (this.instruction() !== Instr.PUSH_NODE) {
      throw new Error("Can't set node on non-PUSH_NODE op.");
    }
    this._node = node;
    return this;
  }

  /**
   * @return {Foundation.HTML.Parser.Node}
   */
  node () {
    if (this._node === null) {
      throw new Error("Can't call node() on this op, setNode() was never called.");
    }
    return this._node;
  }

  /**
   * @return {string}
   */
  toString () {
    if (this.instruction() === Instr.PUSH_NODE) {
      return "PUSH_NODE:" + this.node().type;
    }
    else if (this.instruction() === Instr.ADD_TOKEN) {
      return "ADD_TOKEN:" + this.token().type;
    }
    else {
      return this.instruction();
    }
  }
}
