import HTMLNode, {NodeType} from './HTMLNode'

/**
 * @type {Object.<string,boolean>}
 */
let _voidTags = null;

/**
 * HTML tag node.
 */
export default class TagNode extends HTMLNode {
  constructor () {
    super();

    /**
     * @private
     * @type {string}
     */
    this._tagName;

    /**
     * @private
     * @type {Array.<AttrNode>?}
     */
    this._attributes = null;

    /**
     * @private
     * @type {CloseTagNode?}
     */
    this._closeTag = null;
  }

  /**
   * @override
   */
  get type () { return NodeType.TAG }

  /**
   * @override
   */
  get canHaveChildren () {
    var result = true;

    if (!_voidTags) {
      const voidTagList = [
        "area", "col", "command", "keygen", "track", "wbr",
        "base", "link", "meta", "br", "hr", "img", "embed", "param", "source",
        "input"
      ];

      _voidTags = {};
      voidTagList.forEach(voidTag => { _voidTags[voidTag] = true });
    }

    if (_voidTags[this.tagName]) {
      result = false;
    }

    return result;
  }

  /**
   * @return {boolean}
   */
  hasRawtextContent () {
    return !! this.tagName.match(/^(script|style|xmp)$/);
  }

  /**
   * @override
   */
  appendChild (child) {
    var foundOurClosingTag = false;
    if (child.type === NodeType.CLOSETAG) {
      var closingTag = /** @type {CloseTagNode} */ (child);
      if (closingTag.tagName === this.tagName) {
        this._closeTag = closingTag;
        foundOurClosingTag = true;
      }
    }

    if (!foundOurClosingTag) {
      super.appendChild(child);
    }

    return this;
  }

  /**
   * @override
   */
  toString () {
    var inside = this._attributes ? " " + this._attributes.join(" ") : "";
    var openTag = "<" + this.tagName + inside + ">";
    var children = this.children ? this.children.join("") : "";
    var closingTag = this.closingTag() ? this.closingTag().toString() : "";
    return openTag + children + closingTag;
  }

  /**
   * @override
   * @param {Foundation.Scanner.Token} token
   */
  addToken (token) {
    super.addToken(token);

    if (token.type === "tagStart") {
      this.tagName = token.value.replace(/^</, "");
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
  set tagName (name) {
    this._tagName = name.toLowerCase();
  }

  /**
   * @param {AttrNode} attribute
   * @return {TagNode}
   */
  addAttribute (attribute) {
    if (! this._attributes) {
      this._attributes = [];
    }

    this._attributes.push(attribute);

    return this;
  }

  /**
   * @return {Array.<AttrNode>}
   */
  get attributes () {
    if (this._attributes) {
      return this._attributes.slice(0);
    }
    else {
      return [];
    }
  }

  /**
   * @return {CloseTagNode?}
   */
  closingTag () {
    return this._closeTag;
  }

  /**
   * @override
   */
  get errors () {
    var errors = super.errors;

    var attrErrors = [];
    this.attributes.forEach(attribute => {
      attrErrors = attrErrors.concat(attribute.errors);
    });

    var closingTagErrors = [];
    if (this.closingTag()) {
      closingTagErrors = this.closingTag().errors;
    }

    return attrErrors.concat(errors, closingTagErrors);
  }
}
