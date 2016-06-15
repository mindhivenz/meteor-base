/* eslint-disable no-underscore-dangle, func-names */

export const plugin = (chai) => {
  const Assertion = chai.Assertion

  Assertion.addProperty('schema', function () {
    const collectionHasName = this._obj.collectionName && this._obj.collectionName.length > 0
    const label = collectionHasName ? `collection named "${this._obj.collectionName}` : '#{this}'
    this.assert(
      this._obj && this._obj._c2 && this._obj._c2._simpleSchema,
      `expected ${label} to have an attached schema`,
      `expected ${label} to not have an attached schema`
    )
  })
}
