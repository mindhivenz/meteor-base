

export const MiniMongo = {}

const NAME_TO_CAUSE_MINIMONGO = null

if (global.Mongo) {
  MiniMongo.Collection = class MiniMongoCollection extends global.Mongo.Collection {
    constructor(name) {
      super(NAME_TO_CAUSE_MINIMONGO)
      this._name = name   // eslint-disable-line no-underscore-dangle
      this.indexes = []
    }

    _ensureIndex(keys, options) {
      this.indexes.push({ keys, options })
      // MiniMongo would normally throw an exception but we ignore it
      // If this was ever used on the client it should throw still
    }
  }
}
