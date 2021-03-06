

const clone = (obj) => {
  // Lazily get EJSON.clone so we can be used in environments without it
  if (! global.EJSON) {
    throw new Error('You need to `meteor add ejson`')
  }
  return global.EJSON.clone(obj)
}

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
  'writeFirewall',
  'updateSelector',
  'insertDocMerge',
]

const selectorIsById = selector =>
  (selector && selector._id) || typeof selector === 'string'

export const selectorAsObject = selector =>
  typeof selector === 'string' ? { _id: selector } : selector

export default class FocusedView {

  constructor(collection, viewSpec = {}) {
    this.collection = collection
    this._name = collection._name
    Object.keys(viewSpec)
      .filter(k => ! VIEW_SPEC_PROPERTIES.includes(k))
      .forEach((k) => { throw new Error(`Invalid viewSpec property ${k}`) })
    this.viewSpec = viewSpec
  }

  _focusSelector(apiContext, operation) {
    if (! operation.startsWith('find') && ! operation.startsWith('load') && this.viewSpec.updateSelector) {
      return this.viewSpec.updateSelector(apiContext.viewer())
    }
    if (this.viewSpec.findSelector) {
      if (operation === 'find' && ! apiContext.isAuthenticated) {
        // Short circuit force not finding it
        return { _id: null }
      }
      return this.viewSpec.findSelector(apiContext.viewer())
    }
    return null
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
    return {
      ...selectorAsObject(selector),
      ...viewSelector,
    }
  }

  _reportAccessDeniedForNotOne(count, apiContext, selector, operation, selectorOperation = operation) {

    const selectorAsFieldsOptions = (s) => {
      if (typeof s === 'string') {
        return {}
      }
      const result = {}
      Object.keys(s).forEach((k) => {
        result[k] = 1
      })
      return { fields: result }
    }

    if (count === 0) {
      const selectorId = typeof selector._id === 'string' ? selector._id : undefined
      const focusSelector = this._focusSelector(apiContext, selectorOperation)
      const withoutFocusDoc = focusSelector && this.collection.findOne(selector, selectorAsFieldsOptions(focusSelector))
      if (withoutFocusDoc) {
        apiContext.accessDenied(`${operation} doc is out of focus`, {
          collection: this.collection,
          id: withoutFocusDoc._id,
          data: {
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
    } else if (count > 1) {
      apiContext.accessDenied(`${operation} found more than one`, {
        collection: this.collection,
        data: {
          selector: this.selector(apiContext, selector, selectorOperation),
        },
      })
    }
  }

  _firewall(apiContext, selector) {
    if (this.viewSpec.firewall) {
      this.viewSpec.firewall(apiContext, selectorAsObject(selector))
    }
  }

  _writeFirewall(apiContext, selector) {
    if (this.viewSpec.writeFirewall) {
      this.viewSpec.writeFirewall(apiContext, selectorAsObject(selector))
    }
    this._firewall(apiContext, selector)
  }

  find(apiContext, selector, options) {
    this._firewall(apiContext, selector)
    return this.collection.find(this.selector(apiContext, selector, 'find'), options)
  }

  findForUpdate(apiContext, selector, options) {
    this._writeFirewall(apiContext, selector)
    return this.collection.find(this.selector(apiContext, selector, 'update'), options)
  }

  _loadOne(apiContext, selector, options, operation, selectorOperation = operation) {
    const docs = this.collection
      .find(this.selector(apiContext, selector, selectorOperation), { ...options, limit: 2 })
      .fetch()
    this._reportAccessDeniedForNotOne(docs.length, apiContext, selector, operation, selectorOperation)
    return docs[0]
  }

  loadOne(apiContext, selector, options) {
    this._firewall(apiContext, selector)
    return this._loadOne(apiContext, selector, options, 'loadOne')
  }

  loadOneForUpdate(apiContext, selector, options) {
    this._writeFirewall(apiContext, selector)
    return this._loadOne(apiContext, selector, options, 'loadOneForUpdate', 'update')
  }

  insert(apiContext, doc) {
    this._writeFirewall(apiContext, doc)
    const insertDoc = this.viewSpec.insertDocMerge ? this.viewSpec.insertDocMerge(apiContext.viewer(), doc) : clone(doc)
    insertDoc._id = this.collection.insert(insertDoc)
    return insertDoc
  }

  updateOne(apiContext, selector, modifier) {
    this._writeFirewall(apiContext, selector)
    const updateCount = this.collection.update(this.selector(apiContext, selector, 'updateOne'), modifier)
    this._reportAccessDeniedForNotOne(updateCount, apiContext, selector, 'updateOne')
    return updateCount
  }

  updateMaybe(apiContext, selector, modifier) {
    this._writeFirewall(apiContext, selector)
    return this.collection.update(this.selector(apiContext, selector, 'updateMany'), modifier)
  }

  removeOne(apiContext, selector) {
    this._writeFirewall(apiContext, selector)
    const fullSelector = this.selector(apiContext, selector, 'removeOne')
    if (! selectorIsById(fullSelector)) {
      throw new Error('Can only perform removeOne by id')
    }
    const removeCount = this.collection.remove(fullSelector)
    this._reportAccessDeniedForNotOne(removeCount, apiContext, selector, 'removeOne')
    return removeCount
  }

}
