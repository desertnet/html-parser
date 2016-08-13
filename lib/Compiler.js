/**
 * @constructor
 */
Foundation.HTML.Parser.Compiler = function () {
  var entityStart = /&(?=[a-z0-9#]+;)/i;
  var attributeStart = /[^>=\s\/]+/i;

  /**
   * The tokenizing scanner for the input string. HTML contains
   * many contexts where the scanner needs to accept differnt
   * sets of tokens. Foundation.Scanner calls these sets of
   * token definitions "dialects". Below, we're initializing
   * our scanner with all these different dialects.
   * @private
   * @type {Foundation.Scanner}
   */
  this._scanner = new Foundation.Scanner({
    // Starting dialect, for content "outside of a tag".
    "content": [
      {"text": /[^<>&]+/},
      {"commentStart": /<!--/},
      {"entityStart": entityStart},
      {"tagStart": /<[a-z][^\t\n\ \/\>\0\xff]*/i},
      {"closeTagStart": /<\/[a-z][^\t\n\ \/\>\0\xff]*/i},
      {"error": /[<>&]/}
    ],

    // Dialect for the inside of comment tags.
    "comment": [
      {"commentEnd": /-->/},
      {"dash": /-/},
      {"text": /[^-]+/}
    ],

    // Dialect for the inside of HTML entities.
    "entity": [
      {"entityEnd": /;/},
      {"hex": /#x[a-f0-9]+/i},
      {"dec": /#\d+/},
      {"named": /[a-z][a-z0-9]*/i},
      {"error": /[^]/}
    ],

    // Dialect for the inside of tags.
    "tag": [
      {"tagEnd": />/},
      {"whitespace": /\s+/},
      {"selfClose": /\//},
      {"error": /['"<=]/},
      {"attributeStart": attributeStart}
    ],

    // Initial dialect for attributes.
    "attribute": [
      {"whitespace": /\s+/},
      {"attributeValueQuotedStart": /=['"]/},
      {"attributeValueStart": /=/},
      {"tagEnd": />/},
      {"selfClose": /\//},
      {"error": /['"<]/},
      {"attributeStart": attributeStart}
    ],

    // Dialect for unquoted attribute values.
    "attributeValue": [
      {"whitespace": /\s+/},
      {"entityStart": entityStart},
      {"tagEnd": />/},
      {"error": /['"<=`&]/},
      {"text": /[^'"<>=`&\s]+/}
    ],

    // Dialect for quoted attribute values.
    "attributeValueQuoted": [
      {"dquo": /"/},
      {"squo": /'/},
      {"entityStart": entityStart},
      {"error": /&/},
      {"text": /[^"'&]+/}
    ],

    // Dialect for closing tags.
    "closeTag": [
      {"tagEnd": />/},
      {"whitespace": /\s+/},
      {"error": /[^\s>]+/}
    ],

    // Dialect for inside of script, style, and xmp tags
    "rawtext": [
      {"closeTag": /<\/[a-z]+\s*>/i},
      {"text": /[^<]+/},
      {"lt": /</}
    ]
  });

  /**
   * @private
   * @type {string}
   */
  this._expectedAttributeValueEndTokenType;

  /**
   * @private
   * @type {string}
   */
  this._expectedRawtextClosingTagName;
};

/**
 * @param {string} html
 */
Foundation.HTML.Parser.Compiler.prototype.setInput = function (html) {
  this._scanner.setSource(html);
  this._scanner.pushDialect("content");
};

/**
 * @private
 * @param {string} dialect
 */
Foundation.HTML.Parser.Compiler.prototype.pushDialect = function (dialect) {
  this._scanner.pushDialect(dialect);
};

/**
 * @private
 */
Foundation.HTML.Parser.Compiler.prototype.popDialect = function () {
  this._scanner.popDialect();
};

/**
 * @private
 * @return {string}
 */
Foundation.HTML.Parser.Compiler.prototype.currentDialect = function () {
  var dialect = this._scanner.currentDialect();

  if (dialect === null) {
    throw new Error("Scanner dialect unexpectedly null.");
  }

  return dialect;
};

/**
 * @private
 * @param {string} tokenType
 */
Foundation.HTML.Parser.Compiler.prototype.setExpectedAttributeValueEndTokenType = function (tokenType) {
  this._expectedAttributeValueEndTokenType = tokenType;
};

/**
 * @private
 * @return {string}
 */
Foundation.HTML.Parser.Compiler.prototype.expectedAttributeValueEndTokenType = function () {
  return this._expectedAttributeValueEndTokenType;
};

/**
 * @private
 * @param {string} name
 */
Foundation.HTML.Parser.Compiler.prototype.setExpectedRawtextClosingTagName = function (name) {
  this._expectedRawtextClosingTagName = name.toLowerCase();
};

/**
 * @private
 * @return {string}
 */
Foundation.HTML.Parser.Compiler.prototype.expectedRawtextClosingTagName = function () {
  return this._expectedRawtextClosingTagName;
};

/**
 * @param {string} tagName
 */
Foundation.HTML.Parser.Compiler.prototype.setRawtextModeForTag = function (tagName) {
  this.pushDialect("rawtext");
  this.setExpectedRawtextClosingTagName(tagName);
};

/**
 * @return {Array.<Foundation.HTML.Parser.Op>}
 */
Foundation.HTML.Parser.Compiler.prototype.generateNextCodeFragment = function () {
  var token = this._scanner.nextToken();

  if (token === null) {
    return null;
  }

  return this.generateCodeForTokenInDialect(token, this.currentDialect());
};

/**
 * Take a node and the dialect in which it was found, and tell the
 * parser what to do next.
 * @private
 * @param {Foundation.Scanner.Token} token
 * @param {string} dialect
 * @return {Array.<Foundation.HTML.Parser.Op>}
 */
Foundation.HTML.Parser.Compiler.prototype.generateCodeForTokenInDialect = function (token, dialect) {
  switch (dialect) {
    case "content":
      return this.generateCodeForContentToken(token);
    case "comment":
      return this.generateCodeForCommentToken(token);
    case "entity":
      return this.generateCodeForEntityToken(token);
    case "tag":
      return this.generateCodeForTagToken(token);
    case "attribute":
      return this.generateCodeForAttributeToken(token);
    case "attributeValue":
      return this.generateCodeForAttributeValueToken(token);
    case "attributeValueQuoted":
      return this.generateCodeForAttributeValueQuotedToken(token);
    case "closeTag":
      return this.generateCodeForCloseTagToken(token);
    case "rawtext":
      return this.generateCodeForRawtextToken(token);
    default:
      throw new Error("Called compileTokenForDialect on unsuppoted dialect.");
  }
};

/**
 * @private
 * @param {Foundation.Scanner.Token} token
 * @return {Array.<Foundation.HTML.Parser.Op>}
 */
Foundation.HTML.Parser.Compiler.prototype.generateCodeForContentToken = function (token) {
  // Shortcuts
  var Op = Foundation.HTML.Parser.Op;
  var PUSH_NODE = Foundation.HTML.Parser.Instr.PUSH_NODE;
  var POP_NODE = Foundation.HTML.Parser.Instr.POP_NODE;
  var ADD_TOKEN = Foundation.HTML.Parser.Instr.ADD_TOKEN;

  switch (token.type) {
    case "text":
    case "error":
      return [
        new Op(PUSH_NODE, new Foundation.HTML.Parser.Node.Text()),
        new Op(ADD_TOKEN, token),
        new Op(POP_NODE)
      ];
    case "commentStart":
      this.pushDialect("comment");
      return [
        new Op(PUSH_NODE, new Foundation.HTML.Parser.Node.Comment()),
        new Op(ADD_TOKEN, token)
      ];
    case "entityStart":
      this.pushDialect("entity");
      return [
        new Op(PUSH_NODE, new Foundation.HTML.Parser.Node.Entity()),
        new Op(ADD_TOKEN, token)
      ];
    case "tagStart":
      this.pushDialect("tag");
      return [
        new Op(PUSH_NODE, new Foundation.HTML.Parser.Node.Tag()),
        new Op(ADD_TOKEN, token)
      ];
    case "closeTagStart":
      this.pushDialect("closeTag");
      return [
        new Op(PUSH_NODE, new Foundation.HTML.Parser.Node.CloseTag()),
        new Op(ADD_TOKEN, token)
      ];
    default:
      throw Foundation.HTML.Parser.Compiler.unknownTokenAssertion(token);
  }
};

/**
 * @private
 * @param {Foundation.Scanner.Token} token
 * @return {Array.<Foundation.HTML.Parser.Op>}
 */
Foundation.HTML.Parser.Compiler.prototype.generateCodeForCommentToken = function (token) {
  // Shortcuts
  var Op = Foundation.HTML.Parser.Op;
  var PUSH_NODE = Foundation.HTML.Parser.Instr.PUSH_NODE;
  var POP_NODE = Foundation.HTML.Parser.Instr.POP_NODE;
  var ADD_TOKEN = Foundation.HTML.Parser.Instr.ADD_TOKEN;

  switch (token.type) {
    case "text":
    case "dash":
      return [
        new Op(ADD_TOKEN, token)
      ];
    case "commentEnd":
      this.popDialect();
      return [
        new Op(ADD_TOKEN, token),
        new Op(POP_NODE)
      ];
    default:
       throw Foundation.HTML.Parser.Compiler.unknownTokenAssertion(token);
  }
};

/**
 * @private
 * @param {Foundation.Scanner.Token} token
 */
Foundation.HTML.Parser.Compiler.prototype.generateCodeForEntityToken = function (token) {
  // Shortcuts
  var Op = Foundation.HTML.Parser.Op;
  var PUSH_NODE = Foundation.HTML.Parser.Instr.PUSH_NODE;
  var POP_NODE = Foundation.HTML.Parser.Instr.POP_NODE;
  var ADD_TOKEN = Foundation.HTML.Parser.Instr.ADD_TOKEN;

  switch (token.type) {
    case "hex":
    case "dec":
    case "named":
      return [
        new Op(ADD_TOKEN, token)
      ];
  case "error":
    case "entityEnd":
      this.popDialect();
      return [
        new Op(ADD_TOKEN, token),
        new Op(POP_NODE)
      ];
    default:
      throw Foundation.HTML.Parser.Compiler.unknownTokenAssertion(token);
  }
};

/**
 * @private
 * @param {Foundation.Scanner.Token} token
 * @return {Array.<Foundation.HTML.Parser.Op>}
 */
Foundation.HTML.Parser.Compiler.prototype.generateCodeForTagToken = function (token) {
  // Shortcuts
  var Op = Foundation.HTML.Parser.Op;
  var PUSH_NODE = Foundation.HTML.Parser.Instr.PUSH_NODE;
  var POP_NODE = Foundation.HTML.Parser.Instr.POP_NODE;
  var ADD_TOKEN = Foundation.HTML.Parser.Instr.ADD_TOKEN;

  switch (token.type) {
    case "tagEnd":
      this.popDialect();
      return [
        new Op(ADD_TOKEN, token),
        new Op(POP_NODE)
      ];
    case "whitespace":
    case "selfClose":
      return [
        new Op(ADD_TOKEN, token)
      ];
    case "attributeStart":
    case "error":
      this.pushDialect("attribute");
      return [
        new Op(PUSH_NODE, new Foundation.HTML.Parser.Node.Attr()),
        new Op(ADD_TOKEN, token)
      ];
    default:
      throw Foundation.HTML.Parser.Compiler.unknownTokenAssertion(token);
  }
};

/**
 * @private
 * @param {Foundation.Scanner.Token} token
 * @return {Array.<Foundation.HTML.Parser.Op>}
 */
Foundation.HTML.Parser.Compiler.prototype.generateCodeForAttributeToken = function (token) {
  // Shortcuts
  var Op = Foundation.HTML.Parser.Op;
  var PUSH_NODE = Foundation.HTML.Parser.Instr.PUSH_NODE;
  var POP_NODE = Foundation.HTML.Parser.Instr.POP_NODE;
  var ADD_TOKEN = Foundation.HTML.Parser.Instr.ADD_TOKEN;

  switch (token.type) {
    case "attributeValueQuotedStart":
      var isDquo = !!token.value.match(/"$/);
      this.setExpectedAttributeValueEndTokenType(isDquo ? "dquo" : "squo");
      // continue into next case...
    case "attributeValueStart":
      this.popDialect();
      this.pushDialect(token.type.replace(/Start$/, ""));
      // continue into next case...
    case "whitespace":
      return [
        new Op(ADD_TOKEN, token)
      ];
    case "tagEnd":
      this.popDialect();  // pop out of attribute dialect
      this.popDialect();  // pop out of tag dialect
      return [
        new Op(POP_NODE),
        new Op(ADD_TOKEN, token),
        new Op(POP_NODE)
      ];
    case "selfClose":
      this.popDialect();
      return [
        new Op(POP_NODE),
        new Op(ADD_TOKEN, token)
      ];
    case "attributeStart":
    case "error":
      return [
        new Op(POP_NODE),
        new Op(PUSH_NODE, new Foundation.HTML.Parser.Node.Attr()),
        new Op(ADD_TOKEN, token)
      ];
    default:
      throw Foundation.HTML.Parser.Compiler.unknownTokenAssertion(token);
  }
};

/**
 * @private
 * @param {Foundation.Scanner.Token} token
 * @return {Array.<Foundation.HTML.Parser.Op>}
 */
Foundation.HTML.Parser.Compiler.prototype.generateCodeForAttributeValueToken = function (token) {
  // Shortcuts
  var Op = Foundation.HTML.Parser.Op;
  var PUSH_NODE = Foundation.HTML.Parser.Instr.PUSH_NODE;
  var POP_NODE = Foundation.HTML.Parser.Instr.POP_NODE;
  var ADD_TOKEN = Foundation.HTML.Parser.Instr.ADD_TOKEN;

  switch (token.type) {
    case "whitespace":
      this.popDialect();
      return [
        new Op(POP_NODE),
        new Op(ADD_TOKEN, token)
      ];
    case "entityStart":
      this.pushDialect("entity");
      return [
        new Op(PUSH_NODE, new Foundation.HTML.Parser.Node.Entity()),
        new Op(ADD_TOKEN, token)
      ];
    case "tagEnd":
      this.popDialect();  // pop out of attributeValue dialect
      this.popDialect();  // pop out of tag dialect
      return [
        new Op(POP_NODE),
        new Op(ADD_TOKEN, token),
        new Op(POP_NODE)
      ];
    case "text":
    case "error":
      return [
        new Op(ADD_TOKEN, token)
      ];
    default:
      throw Foundation.HTML.Parser.Compiler.unknownTokenAssertion(token);
  }
};

/**
 * @private
 * @param {Foundation.Scanner.Token} token
 * @return {Array.<Foundation.HTML.Parser.Op>}
 */
Foundation.HTML.Parser.Compiler.prototype.generateCodeForAttributeValueQuotedToken = function (token) {
  // Shortcuts
  var Op = Foundation.HTML.Parser.Op;
  var PUSH_NODE = Foundation.HTML.Parser.Instr.PUSH_NODE;
  var POP_NODE = Foundation.HTML.Parser.Instr.POP_NODE;
  var ADD_TOKEN = Foundation.HTML.Parser.Instr.ADD_TOKEN;

  switch (token.type) {
    case "dquo":
    case "squo":
      if (token.type === this.expectedAttributeValueEndTokenType()) {
        this.popDialect();
        return [
          new Op(ADD_TOKEN, token),
          new Op(POP_NODE)
        ];
      }
      else {
        token.type = "text";
        return [
          new Op(ADD_TOKEN, token)
        ];
      }
    case "entityStart":
      this.pushDialect("entity");
      return [
        new Op(PUSH_NODE, new Foundation.HTML.Parser.Node.Entity()),
        new Op(ADD_TOKEN, token)
      ];
    case "error":
    case "text":
      return [
        new Op(ADD_TOKEN, token)
      ];
    default:
      throw Foundation.HTML.Parser.Compiler.unknownTokenAssertion(token);
  }
};

/**
 * @private
 * @param {Foundation.Scanner.Token} token
 * @return {Array.<Foundation.HTML.Parser.Op>}
 */
Foundation.HTML.Parser.Compiler.prototype.generateCodeForCloseTagToken = function (token) {
  // Shortcuts
  var Op = Foundation.HTML.Parser.Op;
  var PUSH_NODE = Foundation.HTML.Parser.Instr.PUSH_NODE;
  var POP_NODE = Foundation.HTML.Parser.Instr.POP_NODE;
  var ADD_TOKEN = Foundation.HTML.Parser.Instr.ADD_TOKEN;

  switch (token.type) {
    case "whitespace":
    case "error":
      return [
        new Op(ADD_TOKEN, token)
      ];
    case "tagEnd":
      this.popDialect();
      return [
        new Op(ADD_TOKEN, token),
        new Op(POP_NODE)
      ];
    default:
      throw Foundation.HTML.Parser.Compiler.unknownTokenAssertion(token);
  }
};

/**
 * @private
 * @param {Foundation.Scanner.Token} token
 * @return {Array.<Foundation.HTML.Parser.Op>}
 */
Foundation.HTML.Parser.Compiler.prototype.generateCodeForRawtextToken = function (token) {
  // Shortcuts
  var Op = Foundation.HTML.Parser.Op;
  var PUSH_NODE = Foundation.HTML.Parser.Instr.PUSH_NODE;
  var POP_NODE = Foundation.HTML.Parser.Instr.POP_NODE;
  var ADD_TOKEN = Foundation.HTML.Parser.Instr.ADD_TOKEN;

  switch (token.type) {
    case "closeTag":
      var closeTagName = token.value.toLowerCase().replace(/\W/g, "");
      if (closeTagName === this.expectedRawtextClosingTagName()) {
        this.popDialect();
        return [
          new Op(PUSH_NODE, new Foundation.HTML.Parser.Node.CloseTag()),
          new Op(ADD_TOKEN, token),
          new Op(POP_NODE)
        ];
      }
    case "text":
    case "lt":
      return [
        new Op(PUSH_NODE, new Foundation.HTML.Parser.Node.Text()),
        new Op(ADD_TOKEN, token),
        new Op(POP_NODE)
      ];
    default:
      throw Foundation.HTML.Parser.Compiler.unknownTokenAssertion(token);
  }
};

/**
 * @private
 * @param {Foundation.Scanner.Token} token
 * @return {Error}
 */
Foundation.HTML.Parser.Compiler.unknownTokenAssertion = function (token) {
  return new Error("failed assertion: unkown token type: " + token.type);
};