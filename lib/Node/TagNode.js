import Node, {NodeType} from './Node'

/**
 * HTML tag node.
 */
export default class TagNode extends Node {
  constructor () {
    super(NodeType.TAG);

    /**
     * @private
     * @type {string}
     */
    this._tagName;

    /**
     * @private
     * @type {Array.<Foundation.HTML.Parser.Node.Attr>?}
     */
    this._attributes = null;

    /**
     * @private
     * @type {Foundation.HTML.Parser.Node.CloseTag?}
     */
    this._closeTag = null;
  }

  /**
   * @override
   */
  canHaveChildren () {
    var result = true;

    if (!TagNode._voidTags) {
      TagNode._voidTags = {};
      Foundation.HTML.voidTags().forEach(function (voidTag) {
        TagNode._voidTags[voidTag] = true;
      });
    }

    if (TagNode._voidTags[this.tagName()]) {
      result = false;
    }

    return result;
  }

  /**
   * @return {boolean}
   */
  hasRawtextContent () {
    return !! this.tagName().match(/^(script|style|xmp)$/);
  }

  /**
   * @override
   */
  appendChild (child) {
    var foundOurClosingTag = false;
    if (child.type() === NodeType.CLOSE) {
      var closingTag = /** @type {Foundation.HTML.Parser.Node.CloseTag} */ (child);
      if (closingTag.tagName() === this.tagName()) {
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
    var openTag = "<" + this.tagName() + inside + ">";
    var children = this.children() ? this.children().join("") : "";
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
      this.setTagName(token.value.replace(/^</, ""));
    }
  }

  /**
   * @return {string}
   */
  tagName () {
    return this._tagName;
  }

  /**
   * @param {string} name
   */
  setTagName (name) {
    this._tagName = name.toLowerCase();
  }

  /**
   * @param {Foundation.HTML.Parser.Node.Attr} attribute
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
   * @return {Array.<Foundation.HTML.Parser.Node.Attr>}
   */
  attributes () {
    if (this._attributes) {
      return this._attributes.slice(0);
    }
    else {
      return [];
    }
  }

  /**
   * @return {Foundation.HTML.Parser.Node.CloseTag?}
   */
  closingTag () {
    return this._closeTag;
  }

  /**
   * @override
   */
  errors () {
    var errors = super.errors();

    var attrErrors = [];
    this.attributes().forEach(function (attribute) {
      attrErrors = attrErrors.concat(attribute.errors());
    }.bind(this));

    var closingTagErrors = [];
    if (this.closingTag()) {
      closingTagErrors = this.closingTag().errors();
    }

    return attrErrors.concat(errors, closingTagErrors);
  }
}