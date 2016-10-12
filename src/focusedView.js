

export const prefixKeys = (prefix, fields) => {
  if (! fields) {
    return {}
  }
  const result = {}
  Object.entries(fields).forEach(([k, v]) => {
    result[`${prefix}.${k}`] = v
  })
  return result
}

const VIEW_SPEC_PROPERTIES = ['findSelector', 'updateSelector', 'insertDocMerge']

export class FocusedView {

  collection
  viewSpec

  constructor(collection, viewSpec = {}) {
    this.collection = collection
    this._name = collection._name
    Object.keys(viewSpec)
      .filter(k => ! VIEW_SPEC_PROPERTIES.includes(k))
      .forEach(k => { throw new Error(`Invalid viewSpec property ${k}`) })
    this.viewSpec = viewSpec
  }

  _focusSelector(apiContext, operation) {
    if (! operation.startsWith('find') && ! operation.startsWith('load') && this.viewSpec.updateSelector) {
      return this.viewSpec.updateSelector(apiContext.viewer())
    }
    return this.viewSpec.findSelector && this.viewSpec.findSelector(apiContext.viewer())
  }

  selector(apiContext, selector, operation = 'find') {
    if (selector == null) {
      apiContext.accessDenied(`${operation} selector calculation failed (use {} for all)`, {
        collection: this.collection,
      })
    }
    const viewSelector = this._focusSelector(apiContext, operation)
    if (! viewSelector) {
      return selector
    }
    const selectorObj = typeof selector === 'string' ? { _id: selector } : selector
    return {
      ...selectorObj,
      ...viewSelector,
    }
  }

  _selectorIsById(selector) {
    return (selector && selector._id) || typeof selector === 'string'
  }

  _reportAccessDeniedFindOne(apiContext, selector, operation) {

    const selectorAsFieldsOptions = (s) => {
      const result = {}
      Object.keys(s).forEach(k => {
        result[k] = 1
      })
      return { fields: result }
    }

    const selectorId = typeof selector._id === 'string' ? selector._id : undefined
    const focusSelector = this._focusSelector(apiContext, operation)
    const withoutFocusDoc = focusSelector && this.collection.findOne(selector, selectorAsFieldsOptions(focusSelector))
    if (withoutFocusDoc) {
      apiContext.accessDenied(`${operation} doc is out of focus`, {
        collection: this.collection,
        id: withoutFocusDoc._id,
        data: {
          viewFocus: focusSelector,
          foundDoc: withoutFocusDoc,
        },
      })
    } else if (selectorId) {
      const byIdDoc = this.collection.findOne(selectorId, selectorAsFieldsOptions(selector))
      if (byIdDoc) {
        apiContext.accessDenied(`${operation} by id restricted by additional passed selectors`, {
          collection: this.collection,
          id: selectorId,
          data: {
            foundDoc: byIdDoc,
          },
        })
      } else {
        apiContext.accessDenied(`${operation} non-existent id`, {
          collection: this.collection,
          id: selectorId,
        })
      }
    } else {
      apiContext.accessDenied(`${operation} found nothing`, {
        collection: this.collection,
        data: {
          selector,
        },
      })
    }
  }

  find(apiContext, selector, options) {
    return this.collection.find(this.selector(apiContext, selector, 'find'), options)
  }

  loadOne(apiContext, selector, options) {
    const doc = this.collection.findOne(this.selector(apiContext, selector, 'loadOne'), options)
    if (! doc) {
      this._reportAccessDeniedFindOne(apiContext, selector, 'loadOne')
    }
    return doc
  }

  insert(apiContext, doc) {
    return this.collection.insert(
      this.viewSpec.insertDocMerge ?
        this.viewSpec.insertDocMerge(apiContext.viewer(), doc)
        : doc
    )
  }

  updateOne(apiContext, selector, modifier) {
    const updateCount = this.collection.update(this.selector(apiContext, selector, 'updateOne'), modifier)
    if (! updateCount) {
      this._reportAccessDeniedFindOne(apiContext, selector, 'updateOne')
    }
    return updateCount
  }

  updateMaybe(apiContext, selector, modifier) {
    return this.collection.update(this.selector(apiContext, selector, 'updateMany'), modifier)
  }

  removeOne(apiContext, selector) {
    const fullSelector = this.selector(apiContext, selector, 'removeOne')
    if (! this._selectorIsById(fullSelector)) {
      throw new Error('Can only perform removeOne by id')
    }
    const removeCount = this.collection.remove(fullSelector)
    if (! removeCount) {
      this._reportAccessDeniedFindOne(apiContext, selector, 'removeOne')
    }
    return removeCount
  }

}
