

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

const VIEW_SPEC_PROPERTIES = [
  'firewall',
  'findSelector',
  'updateFirewall',
  'updateSelector',
  'insertDocMerge',
]

const selectorIsById = selector =>
  (selector && selector._id) || typeof selector === 'string'

export class FocusedView {

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

  _reportAccessDeniedForNotFound(apiContext, selector, operation) {

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

  _firewall(apiContext) {
    if (this.viewSpec.firewall) {
      this.viewSpec.firewall(apiContext)
    }
  }

  _updateFirewall(apiContext) {
    if (this.viewSpec.updateFirewall) {
      this.viewSpec.updateFirewall(apiContext)
    }
    this._firewall(apiContext)
  }

  find(apiContext, selector, options) {
    this._firewall(apiContext)
    return this.collection.find(this.selector(apiContext, selector, 'find'), options)
  }

  loadOne(apiContext, selector, options) {
    this._firewall(apiContext)
    const doc = this.collection.findOne(this.selector(apiContext, selector, 'loadOne'), options)
    if (! doc) {
      this._reportAccessDeniedForNotFound(apiContext, selector, 'loadOne')
    }
    return doc
  }

  insert(apiContext, doc) {
    this._updateFirewall(apiContext)
    return this.collection.insert(
      this.viewSpec.insertDocMerge ?
        this.viewSpec.insertDocMerge(apiContext.viewer(), doc)
        : doc
    )
  }

  updateOne(apiContext, selector, modifier) {
    this._updateFirewall(apiContext)
    const updateCount = this.collection.update(this.selector(apiContext, selector, 'updateOne'), modifier)
    if (! updateCount) {
      this._reportAccessDeniedForNotFound(apiContext, selector, 'updateOne')
    }
    return updateCount
  }

  updateMaybe(apiContext, selector, modifier) {
    this._updateFirewall(apiContext)
    return this.collection.update(this.selector(apiContext, selector, 'updateMany'), modifier)
  }

  removeOne(apiContext, selector) {
    this._updateFirewall(apiContext)
    const fullSelector = this.selector(apiContext, selector, 'removeOne')
    if (! selectorIsById(fullSelector)) {
      throw new Error('Can only perform removeOne by id')
    }
    const removeCount = this.collection.remove(fullSelector)
    if (! removeCount) {
      this._reportAccessDeniedForNotFound(apiContext, selector, 'removeOne')
    }
    return removeCount
  }

}
