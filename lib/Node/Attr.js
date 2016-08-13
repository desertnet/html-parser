/**
 * HTML attribute node
 * @constructor
 * @extends {Foundation.HTML.Parser.Node}
 */
Foundation.HTML.Parser.Node.Attr = function () {
    Foundation.HTML.Parser.Node.call(this, Foundation.HTML.Parser.Node.Type.ATTR);

    /**
     * @private
     * @type {string}
     */
    this._name;

    /**
     * @private
     * @type {string}
     */
    this._value = "";
};
Foundation.inherit(Foundation.HTML.Parser.Node.Attr, Foundation.HTML.Parser.Node);

/**
 * @override
 */
Foundation.HTML.Parser.Node.Attr.prototype.canHaveChildren = function () {
    return false;
};

/**
 * @override
 */
Foundation.HTML.Parser.Node.Attr.prototype.toString = function () {
    return this._name.toLowerCase() + "='" + this._value + "'";
};

/**
 * @override
 */
Foundation.HTML.Parser.Node.Attr.prototype.addToken = function (token) {
    Foundation.HTML.Parser.Node.prototype.addToken.call(this, token);

    // TODO: this needs considerably more logic
    if (token.type === "attributeStart") {
        this._name = token.value;
    }
    else if (token.type === "text" || token.type === "error") {
        this._value += token.value;
    }
};
