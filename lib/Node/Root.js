/**
 * @constructor
 * @extends {Foundation.HTML.Parser.Node}
 */
Foundation.HTML.Parser.Node.Root = function () {
    Foundation.HTML.Parser.Node.call(this, Foundation.HTML.Parser.Node.Type.ROOT);
};
Foundation.inherit(Foundation.HTML.Parser.Node.Root, Foundation.HTML.Parser.Node);

/**
 * @override
 */
Foundation.HTML.Parser.Node.Root.prototype.canHaveChildren = function () {
    return true;
}

/**
 * @override
 */
Foundation.HTML.Parser.Node.Root.prototype.toString = function () {
    return this.children() ? this.children().join("") : "";
};

