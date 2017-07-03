import isEqual from 'lodash/isEqual'
import util from 'util'

import { collectionAttachedSchema } from '../schemaHelper'


const collectionLabel = collection =>
  collection._name ? `collection named "${collection._name}"` : '#{this}'

const assetTestMongo = (collection, chai) => {
  chai.assert(
    Array.isArray(collection.indexes),
    'expected an instance of TestMongo',
    'expected not an instance of TestMongo',
  )
}

export default (chai) => {
  const Assertion = chai.Assertion

  Assertion.addProperty('schema', function schemaProperty() {
    const collection = this._obj
    assetTestMongo(collection, this)
    const label = collectionLabel(collection)
    this.assert(
      collectionAttachedSchema(collection),
      `expected ${label} to have an attached schema`,
      `expected ${label} to not have an attached schema`,
    )
  })

  Assertion.addMethod('index', function indexMethod(fields, options) {
    const collection = this._obj
    assetTestMongo(collection, this)
    const label = collectionLabel(collection)
    const matchingIndex = collection.indexes.find((idx) => {
      const keys = Object.entries(idx.keys)
      const fieldsMatch = fields.every((f, i) =>
        typeof f === 'string' ? f === keys[i][0] : isEqual(Object.entries(f)[0], keys[i])
      )
      const optionsMatch = options ? isEqual(options, idx.options) : true
      return fieldsMatch && optionsMatch
    })
    this.assert(
      matchingIndex,
      `expected ${label} to have an index #{exp} from #{act}`,
      `expected ${label} to not have an index #{exp}`,
      options ? util.inspect({ fields, options }) : util.inspect(fields),
      util.inspect(collection.indexes),
    )
  })

}
