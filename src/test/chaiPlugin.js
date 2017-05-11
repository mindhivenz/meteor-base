import isEqual from 'lodash/isEqual'

import { collectionAttachedSchema } from '../schemaHelper'


const collectionLabel = collection =>
  collection._name ? `collection named "${collection._name}"` : '#{this}'

export const plugin = (chai) => {
  const Assertion = chai.Assertion

  Assertion.addProperty('schema', function schemaProperty() {
    const collection = this._obj
    const label = collectionLabel(collection)
    this.assert(
      collectionAttachedSchema(collection),
      `expected ${label} to have an attached schema`,
      `expected ${label} to not have an attached schema`,
    )
  })

  Assertion.addMethod('index', function indexProperty(fields) {
    const collection = this._obj
    const label = collectionLabel(collection)
    const matchingIndex = collection.indexes.find((idx) => {
      const keys = Object.entries(idx.keys)
      return fields.every((f, i) => typeof f === 'string' ? f === keys[i][0] : isEqual(Object.entries(f)[0], keys[i]))
    })
    this.assert(
      matchingIndex,
      `expected ${label} to have an index #{exp} from #{act}`,
      `expected ${label} to not have an index #{exp}`,
      fields,
      collection.indexes.map(idx => idx.keys),
    )
  })

}
