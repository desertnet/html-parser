import Instr from './Instr'
import Op from './Op'
import Scanner from '@desertnet/scanner'
import TagNode from './HTMLNode/TagNode'
import TextNode from './HTMLNode/TextNode'
import AttrNode from './HTMLNode/AttrNode'
import CloseTagNode from './HTMLNode/CloseTagNode'
import CommentNode from './HTMLNode/CommentNode'
import EntityNode from './HTMLNode/EntityNode'

export default class Compiler {
  constructor () {
    var entityStart = /&(?=[a-z0-9#]+;)/i;
    var attributeStart = /[^>=\s\/]+/i;

    /**
     * The tokenizing scanner for the input string. HTML contains
     * many contexts where the scanner needs to accept differnt
     * sets of tokens. The @desertnet/scanner module calls these
     * sets of token definitions "dialects". Below, we're initializing
     * our scanner with all these different dialects.
     * @private
     * @type {Scanner}
     */
    this._scanner = new Scanner({
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
  }


  /**
   * @param {string} html
   */
  setInput (html) {
    this._scanner.setSource(html);
    this._scanner.pushDialect("content");
  }

  /**
   * @private
   * @param {string} dialect
   */
  pushDialect (dialect) {
    this._scanner.pushDialect(dialect);
  }

  /**
   * @private
   */
  popDialect () {
    this._scanner.popDialect();
  }

  /**
   * @private
   * @return {string}
   */
  currentDialect () {
    var dialect = this._scanner.currentDialect();

    if (dialect === null) {
      throw new Error("Scanner dialect unexpectedly null.");
    }

    return dialect;
  }

  /**
   * @private
   * @param {string} tokenType
   */
  setExpectedAttributeValueEndTokenType (tokenType) {
    this._expectedAttributeValueEndTokenType = tokenType;
  }

  /**
   * @private
   * @return {string}
   */
  expectedAttributeValueEndTokenType () {
    return this._expectedAttributeValueEndTokenType;
  }

  /**
   * @private
   * @param {string} name
   */
  setExpectedRawtextClosingTagName (name) {
    this._expectedRawtextClosingTagName = name.toLowerCase();
  }

  /**
   * @private
   * @return {string}
   */
  expectedRawtextClosingTagName () {
    return this._expectedRawtextClosingTagName;
  }

  /**
   * @param {string} tagName
   */
  setRawtextModeForTag (tagName) {
    this.pushDialect("rawtext");
    this.setExpectedRawtextClosingTagName(tagName);
  }

  /**
   * @return {Array.<Op>}
   */
  generateNextCodeFragment () {
    var token = this._scanner.nextToken();

    if (token === null) {
      return null;
    }

    return this.generateCodeForTokenInDialect(token, this.currentDialect());
  }

  /**
   * Take a node and the dialect in which it was found, and tell the
   * parser what to do next.
   * @private
   * @param {Foundation.Scanner.Token} token
   * @param {string} dialect
   * @return {Array.<Op>}
   */
  generateCodeForTokenInDialect (token, dialect) {
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
  }

  /**
   * @private
   * @param {Foundation.Scanner.Token} token
   * @return {Array.<Op>}
   */
  generateCodeForContentToken (token) {
    switch (token.type) {
      case "text":
      case "error":
        return [
          new Op(Instr.PUSH_NODE, new TextNode()),
          new Op(Instr.ADD_TOKEN, token),
          new Op(Instr.POP_NODE)
        ];
      case "commentStart":
        this.pushDialect("comment");
        return [
          new Op(Instr.PUSH_NODE, new CommentNode()),
          new Op(Instr.ADD_TOKEN, token)
        ];
      case "entityStart":
        this.pushDialect("entity");
        return [
          new Op(Instr.PUSH_NODE, new EntityNode()),
          new Op(Instr.ADD_TOKEN, token)
        ];
      case "tagStart":
        this.pushDialect("tag");
        return [
          new Op(Instr.PUSH_NODE, new TagNode()),
          new Op(Instr.ADD_TOKEN, token)
        ];
      case "closeTagStart":
        this.pushDialect("closeTag");
        return [
          new Op(Instr.PUSH_NODE, new CloseTagNode()),
          new Op(Instr.ADD_TOKEN, token)
        ];
      default:
        throw unknownTokenAssertion(token);
    }
  }

  /**
   * @private
   * @param {Foundation.Scanner.Token} token
   * @return {Array.<Op>}
   */
  generateCodeForCommentToken (token) {
    switch (token.type) {
      case "text":
      case "dash":
        return [
          new Op(Instr.ADD_TOKEN, token)
        ];
      case "commentEnd":
        this.popDialect();
        return [
          new Op(Instr.ADD_TOKEN, token),
          new Op(Instr.POP_NODE)
        ];
      default:
         throw unknownTokenAssertion(token);
    }
  }

  /**
   * @private
   * @param {Foundation.Scanner.Token} token
   */
  generateCodeForEntityToken (token) {
    switch (token.type) {
      case "hex":
      case "dec":
      case "named":
        return [
          new Op(Instr.ADD_TOKEN, token)
        ];
      case "error":
      case "entityEnd":
        this.popDialect();
        return [
          new Op(Instr.ADD_TOKEN, token),
          new Op(Instr.POP_NODE)
        ];
      default:
        throw unknownTokenAssertion(token);
    }
  }

  /**
   * @private
   * @param {Foundation.Scanner.Token} token
   * @return {Array.<Op>}
   */
  generateCodeForTagToken (token) {
    switch (token.type) {
      case "tagEnd":
        this.popDialect();
        return [
          new Op(Instr.ADD_TOKEN, token),
          new Op(Instr.POP_NODE)
        ];
      case "whitespace":
      case "selfClose":
        return [
          new Op(Instr.ADD_TOKEN, token)
        ];
      case "attributeStart":
      case "error":
        this.pushDialect("attribute");
        return [
          new Op(Instr.PUSH_NODE, new AttrNode()),
          new Op(Instr.ADD_TOKEN, token)
        ];
      default:
        throw unknownTokenAssertion(token);
    }
  }

  /**
   * @private
   * @param {Foundation.Scanner.Token} token
   * @return {Array.<Op>}
   */
  generateCodeForAttributeToken (token) {
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
          new Op(Instr.ADD_TOKEN, token)
        ];
      case "tagEnd":
        this.popDialect();  // pop out of attribute dialect
        this.popDialect();  // pop out of tag dialect
        return [
          new Op(Instr.POP_NODE),
          new Op(Instr.ADD_TOKEN, token),
          new Op(Instr.POP_NODE)
        ];
      case "selfClose":
        this.popDialect();
        return [
          new Op(Instr.POP_NODE),
          new Op(Instr.ADD_TOKEN, token)
        ];
      case "attributeStart":
      case "error":
        return [
          new Op(Instr.POP_NODE),
          new Op(Instr.PUSH_NODE, new AttrNode()),
          new Op(Instr.ADD_TOKEN, token)
        ];
      default:
        throw unknownTokenAssertion(token);
    }
  }

  /**
   * @private
   * @param {Foundation.Scanner.Token} token
   * @return {Array.<Op>}
   */
  generateCodeForAttributeValueToken (token) {
    switch (token.type) {
      case "whitespace":
        this.popDialect();
        return [
          new Op(Instr.POP_NODE),
          new Op(Instr.ADD_TOKEN, token)
        ];
      case "entityStart":
        this.pushDialect("entity");
        return [
          new Op(Instr.PUSH_NODE, new EntityNode()),
          new Op(Instr.ADD_TOKEN, token)
        ];
      case "tagEnd":
        this.popDialect();  // pop out of attributeValue dialect
        this.popDialect();  // pop out of tag dialect
        return [
          new Op(Instr.POP_NODE),
          new Op(Instr.ADD_TOKEN, token),
          new Op(Instr.POP_NODE)
        ];
      case "text":
      case "error":
        return [
          new Op(Instr.ADD_TOKEN, token)
        ];
      default:
        throw unknownTokenAssertion(token);
    }
  }

  /**
   * @private
   * @param {Foundation.Scanner.Token} token
   * @return {Array.<Op>}
   */
  generateCodeForAttributeValueQuotedToken (token) {
    switch (token.type) {
      case "dquo":
      case "squo":
        if (token.type === this.expectedAttributeValueEndTokenType()) {
          this.popDialect();
          return [
            new Op(Instr.ADD_TOKEN, token),
            new Op(Instr.POP_NODE)
          ];
        }
        else {
          token.type = "text";
          return [
            new Op(Instr.ADD_TOKEN, token)
          ];
        }
      case "entityStart":
        this.pushDialect("entity");
        return [
          new Op(Instr.PUSH_NODE, new EntityNode()),
          new Op(Instr.ADD_TOKEN, token)
        ];
      case "error":
      case "text":
        return [
          new Op(Instr.ADD_TOKEN, token)
        ];
      default:
        throw unknownTokenAssertion(token);
    }
  }

  /**
   * @private
   * @param {Foundation.Scanner.Token} token
   * @return {Array.<Op>}
   */
  generateCodeForCloseTagToken (token) {
    switch (token.type) {
      case "whitespace":
      case "error":
        return [
          new Op(Instr.ADD_TOKEN, token)
        ];
      case "tagEnd":
        this.popDialect();
        return [
          new Op(Instr.ADD_TOKEN, token),
          new Op(Instr.POP_NODE)
        ];
      default:
        throw unknownTokenAssertion(token);
    }
  }

  /**
   * @private
   * @param {Foundation.Scanner.Token} token
   * @return {Array.<Op>}
   */
  generateCodeForRawtextToken (token) {
    switch (token.type) {
      case "closeTag":
        var closeTagName = token.value.toLowerCase().replace(/\W/g, "");
        if (closeTagName === this.expectedRawtextClosingTagName()) {
          this.popDialect();
          return [
            new Op(Instr.PUSH_NODE, new CloseTagNode()),
            new Op(Instr.ADD_TOKEN, token),
            new Op(Instr.POP_NODE)
          ];
        }
      case "text":
      case "lt":
        return [
          new Op(Instr.PUSH_NODE, new TextNode()),
          new Op(Instr.ADD_TOKEN, token),
          new Op(Instr.POP_NODE)
        ];
      default:
        throw unknownTokenAssertion(token);
    }
  }
}

/**
 * @private
 * @param {Foundation.Scanner.Token} token
 * @return {Error}
 */
function unknownTokenAssertion (token) {
  return new Error("failed assertion: unkown token type: " + token.type);
}
