/**
 * HTML tree nodes base class. Should never be called outside of 
 * subclass constructors!
 * @private
 * @param {Foundation.HTML.Parser.Node.Type} type
 * @constructor
 */
Foundation.HTML.Parser.Node = function (type) {
    /**
     * @private
     * @type {Foundation.HTML.Parser.Node.Type}
     */
    this._type = type;

    /**
     * @private
     * @type {Array.<Foundation.HTML.Parser.Node>?}
     */
    this._children = null;

    /**
     * @private
     * @type {Array.<Foundation.Scanner.Token>}
     */
    this._sourceTokens = [];

    /**
     * @private
     * @type {Array.<Foundation.HTML.Parser.Error>}
     */
    this._errors = [];
};

/**
 * Subclasses must override this.
 * @return {boolean}
 */
Foundation.HTML.Parser.Node.prototype.canHaveChildren = function () {
    throw new Foundation.HTML.Parser.Node.Error(
        "canHaveChildren not overriden in subclass", this
    );
};

/**
 * Subclasses must override this.
 * @return {string}
 */
Foundation.HTML.Parser.Node.prototype.toString = function () {
    throw new Foundation.HTML.Parser.Node.Error(
        "toString not overriden in subclass", this
    );
};

/**
 * @return {Array.<Foundation.HTML.Parser.Node>?}
 */
Foundation.HTML.Parser.Node.prototype.children = function () {
    if (this._children === null || this._children.length === 0) {
        return null;
    }

    return this._children.slice(0);
};

/**
 * @return {Foundation.HTML.Parser.Node}
 */
Foundation.HTML.Parser.Node.prototype.lastChild = function () {
    var children = this.children();
    if (children === null || children.length === 0) {
        return null;
    }
    return children[children.length - 1];
};

/**
 * @param {Foundation.Scanner.Token} token
 */
Foundation.HTML.Parser.Node.prototype.addToken = function (token) {
    this._sourceTokens.push(token);

    // Create error objects when adding a token of type error.
    if (token.type === "error") {
        var error = new Foundation.HTML.Parser.Error();
        error.setMessage("Invalid token: \"" + token.value + "\"");
        error.addToken(token);
        this.addError(error);
    }
};

/**
 * @return {Array.<Foundation.Scanner.Token>}
 */
Foundation.HTML.Parser.Node.prototype.tokens = function () {
    return this._sourceTokens.slice(0);
};

/**
 * @return {Array.<number>?}
 */
Foundation.HTML.Parser.Node.prototype.indexRange = function () {
    var tokens = this.tokens();
    if (tokens.length === 0) {
        return null;
    }

    var firstToken = tokens[0];
    var lastToken = tokens[tokens.length - 1];
    return [
        firstToken.index,
        lastToken.index + lastToken.value.length - 1
    ];
};

/**
 * @param {Foundation.HTML.Parser.Node} childNode
 * @return {Foundation.HTML.Parser.Node}
 */
Foundation.HTML.Parser.Node.prototype.appendChild = function (childNode) {
    if (! this.canHaveChildren()) {
        throw new Foundation.HTML.Parser.Node.Error(
            "attempted to call appendChild on node that can't have children", this
        );
    }

    if (! this._children) {
        this._children = [];
    }

    this._children.push(childNode);

    return this;
};

/**
 * HTML node types.
 * @enum {string}
 */
Foundation.HTML.Parser.Node.Type = {
    ROOT: "ROOT",
    TAG:  "TAG",
    ATTR: "ATTR",
    TEXT: "TEXT",
    ENT:  "ENT",
    CMNT: "CMNT",
    CLOSE: "CLOSE"
};

/**
 * @return {Foundation.HTML.Parser.Node.Type}
 */
Foundation.HTML.Parser.Node.prototype.type = function () {
    return this._type;
};

/**
 * @public
 * @return {Array.<Foundation.HTML.Parser.Error>}
 */
Foundation.HTML.Parser.Node.prototype.errors = function () {
    var childErrors = [];
    if (this.canHaveChildren()) {
        var children = this.children();
        if (children) {
            children.forEach(function (child) {
                childErrors = childErrors.concat(child.errors());
            }.bind(this));
        }
    }
    return this.ownErrors().concat(childErrors);
};

/**
 * @param {Foundation.HTML.Parser.Error} error
 */
Foundation.HTML.Parser.Node.prototype.addError = function (error) {
    this._errors.push(error);
};

/**
 * @private
 * @return {Array.<Foundation.HTML.Parser.Error>}
 */
Foundation.HTML.Parser.Node.prototype.ownErrors = function () {
    return this._errors.slice(0);
};

Foundation.HTML.Parser.Node.prototype["errors"] = Foundation.HTML.Parser.Node.prototype.errors;


/**
 * HTML node error class. This is a throwable Error object, not to be
 * confused with the Foundation.HTML.Parser.Error class which deals
 * with reporting errors found in the HTML source.
 * @constructor
 * @extends {Error}
 * @param {string} message
 * @param {Foundation.HTML.Parser.Node} node
 */
Foundation.HTML.Parser.Node.Error = function (message, node) {
    Error.call(this, message);
    this.name = "HTMLParserNodeError";
    this.node = node;
};
Foundation.inherit(Foundation.HTML.Parser.Node.Error, Error);

