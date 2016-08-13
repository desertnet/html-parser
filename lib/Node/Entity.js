/**
 * HTML entity node
 * @constructor
 * @extends {Foundation.HTML.Parser.Node}
 */
Foundation.HTML.Parser.Node.Entity = function () {
  Foundation.HTML.Parser.Node.call(this, Foundation.HTML.Parser.Node.Type.ENT);

  /**
   * @private
   * @type {string}
   */
  this._entity = "";
};
Foundation.inherit(Foundation.HTML.Parser.Node.Entity, Foundation.HTML.Parser.Node);

/**
 * @private
 * @type {Object}
 */
Foundation.HTML.Parser.Node.Entity.namedEntities = null;

/**
 * @private
 * @param {Object} data
 */
Foundation.HTML.Parser.Node.Entity.setNamedEntitiesData = function (data) {
  Foundation.HTML.Parser.Node.Entity.namedEntities = data;
};

/**
 * @return {Foundation.Promise}
 */
Foundation.HTML.Parser.Node.Entity.loadNamedEntitiesFromServer = function () {
  if (! Foundation.HTML.Parser.Node.Entity._entitiesLoaded) {
    Foundation.HTML.Parser.Node.Entity._entitiesLoaded = new Foundation.Promise();
    jQuery.ajax("/foundation/scripts/entities.json", {"dataType": "json"}).done(function (data) {
      Foundation.HTML.Parser.Node.Entity.setNamedEntitiesData(data);
      Foundation.HTML.Parser.Node.Entity._entitiesLoaded.fulfill();
    });
  }
  return Foundation.HTML.Parser.Node.Entity._entitiesLoaded;
};

/**
 * @override
 */
Foundation.HTML.Parser.Node.Entity.prototype.canHaveChildren = function () {
  return false;
};

/**
 * @override
 * @return {string}
 */
Foundation.HTML.Parser.Node.Entity.prototype.toString = function () {
  return "&(" + this._entity + ");";
};

/**
 * @override
 */
Foundation.HTML.Parser.Node.Entity.prototype.addToken = function (token) {
  Foundation.HTML.Parser.Node.prototype.addToken.call(this, token);

  if (token.type !== "entityStart" && token.type !== "entityEnd") {
    this._entity = token.value;
  }

  if (token.type === "named" && Foundation.HTML.Parser.Node.Entity.namedEntities) {
    if (! Foundation.HTML.Parser.Node.Entity.namedEntities["&"+token.value+";"]) {
      var error = new Foundation.HTML.Parser.Error();
      error.setMessage('Invalid HTML entity name for "&' + token.value + ';".');
      error.addToken(token);
      this.addError(error);
    }
  }
};
