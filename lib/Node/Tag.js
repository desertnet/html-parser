import Node, {NodeType} from './Node'

/**
 * HTML tag node.
 * @constructor
 * @extends {Foundation.HTML.Parser.Node}
 */
Foundation.HTML.Parser.Node.Tag = function () {
  Foundation.HTML.Parser.Node.call(this, NodeType.TAG);

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
};
Foundation.inherit(Foundation.HTML.Parser.Node.Tag, Foundation.HTML.Parser.Node);

/**
 * @override
 */
Foundation.HTML.Parser.Node.Tag.prototype.canHaveChildren = function () {
  var result = true;

  if (!Foundation.HTML.Parser.Node.Tag._voidTags) {
    Foundation.HTML.Parser.Node.Tag._voidTags = {};
    Foundation.HTML.voidTags().forEach(function (voidTag) {
      Foundation.HTML.Parser.Node.Tag._voidTags[voidTag] = true;
    });
  }

  if (Foundation.HTML.Parser.Node.Tag._voidTags[this.tagName()]) {
    result = false;
  }

  return result;
};

/**
 * @return {boolean}
 */
Foundation.HTML.Parser.Node.Tag.prototype.hasRawtextContent = function () {
  return !! this.tagName().match(/^(script|style|xmp)$/);
};

/**
 * @override
 */
Foundation.HTML.Parser.Node.Tag.prototype.appendChild = function (child) {
  var foundOurClosingTag = false;
  if (child.type() === NodeType.CLOSE) {
    var closingTag = /** @type {Foundation.HTML.Parser.Node.CloseTag} */ (child);
    if (closingTag.tagName() === this.tagName()) {
      this._closeTag = closingTag;
      foundOurClosingTag = true;
    }
  }

  if (!foundOurClosingTag) {
    Node.prototype.appendChild.call(this, child);
  }

  return this;
};

/**
 * @override
 */
Foundation.HTML.Parser.Node.Tag.prototype.toString = function () {
  var inside = this._attributes ? " " + this._attributes.join(" ") : "";
  var openTag = "<" + this.tagName() + inside + ">";
  var children = this.children() ? this.children().join("") : "";
  var closingTag = this.closingTag() ? this.closingTag().toString() : "";
  return openTag + children + closingTag;
};

/**
 * @override
 * @param {Foundation.Scanner.Token} token
 */
Foundation.HTML.Parser.Node.Tag.prototype.addToken = function (token) {
  Node.prototype.addToken.call(this, token);

  if (token.type === "tagStart") {
    this.setTagName(token.value.replace(/^</, ""));
  }
};

/**
 * @return {string}
 */
Foundation.HTML.Parser.Node.Tag.prototype.tagName = function () {
  return this._tagName;
};

/**
 * @param {string} name
 */
Foundation.HTML.Parser.Node.Tag.prototype.setTagName = function (name) {
  this._tagName = name.toLowerCase();
};

/**
 * @param {Foundation.HTML.Parser.Node.Attr} attribute
 * @return {Foundation.HTML.Parser.Node.Tag}
 */
Foundation.HTML.Parser.Node.Tag.prototype.addAttribute = function (attribute) {
  if (! this._attributes) {
    this._attributes = [];
  }

  this._attributes.push(attribute);

  return this;
};

/**
 * @return {Array.<Foundation.HTML.Parser.Node.Attr>}
 */
Foundation.HTML.Parser.Node.Tag.prototype.attributes = function () {
  if (this._attributes) {
    return this._attributes.slice(0);
  }
  else {
    return [];
  }
};

/**
 * @return {Foundation.HTML.Parser.Node.CloseTag?}
 */
Foundation.HTML.Parser.Node.Tag.prototype.closingTag = function () {
  return this._closeTag;
};

/**
 * @override
 */
Foundation.HTML.Parser.Node.Tag.prototype.errors = function () {
  var errors = Node.prototype.errors.call(this);

  var attrErrors = [];
  this.attributes().forEach(function (attribute) {
    attrErrors = attrErrors.concat(attribute.errors());
  }.bind(this));

  var closingTagErrors = [];
  if (this.closingTag()) {
    closingTagErrors = this.closingTag().errors();
  }

  return attrErrors.concat(errors, closingTagErrors);
};
