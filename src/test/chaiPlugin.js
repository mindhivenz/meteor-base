import { collectionAttachedSchema } from '../schemaHelper'


export const plugin = (chai) => {
  const Assertion = chai.Assertion

  Assertion.addProperty('schema', function schemaProperty() {
    const collectionHasName = this._obj._name && this._obj._name.length > 0
    const label = collectionHasName ? `collection named "${this._obj._name}"` : '#{this}'
    this.assert(
      collectionAttachedSchema(this),
      `expected ${label} to have an attached schema`,
      `expected ${label} to not have an attached schema`
    )
  })
}
