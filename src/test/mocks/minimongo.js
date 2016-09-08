/* eslint-disable no-underscore-dangle */

import { appContext } from '@mindhive/di/test'


export const MiniMongo = {}

const NAME_TO_CAUSE_MINIMONGO = null

const removeArrayPartsFromKey = (k) => k.split('.$').join('')

const inSchema = (indexKey, schemaDoc, mustBeBlackbox = false) => {
  const schemaKey = Object.keys(schemaDoc).find(k =>
    removeArrayPartsFromKey(k) === indexKey &&
    (! mustBeBlackbox || schemaDoc[k].blackbox)
  )
  if (schemaKey) {
    return true
  }
  const parts = indexKey.split('.')
  if (parts.length <= 1) {
    return false
  }
  return inSchema(parts.slice(0, -1).join('.'), schemaDoc, true)
}

export const useRealMongoCollection = (moduleInit, collectionName) =>
  moduleInit.preModules.push(({ useRealMongoCollectionNames }) => {
    if (useRealMongoCollectionNames) {
      useRealMongoCollectionNames.unshift(collectionName)
      return null
    }
    console.log(`Creating useRealMongoCollectionNames with ${collectionName}`)
    return { useRealMongoCollectionNames: [collectionName] }
  })

if (global.Mongo) {

  MiniMongo.Collection = class MiniMongoCollection extends global.Mongo.Collection {

    constructor(name) {
      console.log(appContext.useRealMongoCollectionNames)
      const useRealMongo = appContext.useRealMongoCollectionNames &&
        appContext.useRealMongoCollectionNames.includes(name)
      if (useRealMongo) {
        super(name)
        console.log(`Using real mongo for ${name}`)
        this.remove({})
      } else {
        super(NAME_TO_CAUSE_MINIMONGO)
        console.log(`Using MINI mongo for ${name}`)
        this._name = name
      }
      this.indexes = []
    }

    _ensureIndex(keys, options) {
      const isClient = appContext.Meteor && ! appContext.Meteor.isServer
      if (isClient) {
        // MiniMongo will throw an exception
        super._ensureIndex(keys, options)
      }
      const schemaDoc = this._c2 && this._c2._simpleSchema && this._c2._simpleSchema._schema
      if (! schemaDoc) {
        throw new Error("Attach a schema before adding indexes so we can check they're valid")
      }
      Object.keys(keys).forEach(k => {
        if (! inSchema(k, schemaDoc)) {
          throw new Error(`Attempt to add an index key '${k}' which is not in the schema`)
        }
      })
      this.indexes.push(options ? { keys, options } : keys)
    }
  }
}
