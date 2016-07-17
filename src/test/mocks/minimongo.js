/* eslint-disable no-underscore-dangle */

export const MiniMongo = {}

const NAME_TO_CAUSE_MINIMONGO = null

const inSchema = (key, schemaDoc, mustBeBlackbox = false) => {
  if (key in schemaDoc) {
    return ! mustBeBlackbox || schemaDoc[key].blackbox
  }
  const parts = key.split('.')
  if (parts.length > 1) {
    return inSchema(parts.splice(-1, 1).join('.'), schemaDoc, true)
  }
  return false
}

if (global.Mongo) {
  MiniMongo.Collection = class MiniMongoCollection extends global.Mongo.Collection {
    constructor(name) {
      super(NAME_TO_CAUSE_MINIMONGO)
      this._name = name   // eslint-disable-line no-underscore-dangle
      this.indexes = []
    }

    _ensureIndex(keys, options) {
      if (! this._c2 || ! this._c2._simpleSchema) {
        throw new Error("Attach a schema before adding indexes so we can check they're valid")
      }
      const schemaDoc = this._c2._simpleSchema._schema
      Object.keys(keys).forEach(k => {
        if (! inSchema(k, schemaDoc)) {
          throw new Error(`Attempt to add an index key '${k}' which is not in the schema`)
        }
      })
      this.indexes.push(options ? { keys, options } : keys)
      // MiniMongo would normally throw an exception but we ignore it
      // If this was ever used on the client it should throw still
    }
  }
}
