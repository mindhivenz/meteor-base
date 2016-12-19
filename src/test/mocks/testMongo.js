/* eslint-disable no-underscore-dangle */

import { app, initModules } from '@mindhive/di'


const testGroundCollections = new Map()

export const resetTestGroundCollections = () => {
  testGroundCollections.clear()
}

export const TestMongo = {}
export const TestGround = {}

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

export const withRealMongoCollection = (testModules, collectionName) =>
  () => {
    initModules([
      ({ realMongoCollectionNames }) => {
        if (realMongoCollectionNames) {
          realMongoCollectionNames.push(collectionName)
          return null
        }
        return { realMongoCollectionNames: [collectionName] }
      },
    ])
    return testModules()
  }

if (global.Mongo) {

  TestMongo.Collection = class extends global.Mongo.Collection {

    constructor(name) {
      const { realMongoCollectionNames } = app()
      const useRealMongo = realMongoCollectionNames && realMongoCollectionNames.includes(name)
      if (useRealMongo) {
        super(name, { _suppressSameNameError: true })
        this.remove({})
      } else {
        super(NAME_TO_CAUSE_MINIMONGO)
        this._name = name
      }
      this.indexes = []
    }

    _ensureIndex(keys, options) {
      const { Meteor } = app()
      const isClient = Meteor && ! Meteor.isServer
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

  if (global.Ground) {

    TestGround.Collection = class extends global.Mongo.Collection {

      constructor(name) {
        super(NAME_TO_CAUSE_MINIMONGO)
        // REVISIT: why can't this be before the super()?
        const existingCollection = testGroundCollections.get(name)
        if (existingCollection) {
          return existingCollection
        }
        testGroundCollections.set(name, this)
      }

      attachSchema() {
        throw new Error("Can't attach schemas to GroundDB collections")
      }

      once(eventName, cb) {
        if (eventName === 'loaded') {
          // Simulate it being delayed
          setTimeout(cb, 0)
        } else {
          throw new ReferenceError(`Not implemented yet event ${eventName}`)
        }
      }
    }
  }
}

