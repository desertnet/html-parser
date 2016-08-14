import Node, {NodeType} from './Node'

/**
 * @type {Object}
 */
let _namedEntities = null;

/**
 * HTML entity node
 */
export default class EntityNode extends Node {
  constructor () {
    super(NodeType.ENT);

    /**
     * @private
     * @type {string}
     */
    this._entity = "";
  }

  /**
   * @private
   * @type {Object}
   */
  static get namedEntities () { return _namedEntities }

  /**
   * @private
   * @param {Object} data
   */
  static setNamedEntitiesData (data) {
    _namedEntities = data;
  }

  /**
   * @return {Foundation.Promise}
   */
  static loadNamedEntitiesFromServer () {
    if (! EntityNode._entitiesLoaded) {
      EntityNode._entitiesLoaded = new Foundation.Promise();
      jQuery.ajax("/foundation/scripts/entities.json", {"dataType": "json"}).done(function (data) {
        EntityNode.setNamedEntitiesData(data);
        EntityNode._entitiesLoaded.fulfill();
      });
    }
    return EntityNode._entitiesLoaded;
  }

  /**
   * @override
   */
  canHaveChildren () {
    return false;
  }

  /**
   * @override
   * @return {string}
   */
  toString () {
    return "&(" + this._entity + ");";
  }

  /**
   * @override
   */
  addToken (token) {
    super.addToken(token);

    if (token.type !== "entityStart" && token.type !== "entityEnd") {
      this._entity = token.value;
    }

    if (token.type === "named" && EntityNode.namedEntities) {
      if (! EntityNode.namedEntities["&"+token.value+";"]) {
        var error = new Foundation.HTML.Parser.Error();
        error.setMessage('Invalid HTML entity name for "&' + token.value + ';".');
        error.addToken(token);
        this.addError(error);
      }
    }
  }
}
