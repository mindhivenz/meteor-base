import {
  action,
  observable,
  runInAction,
  extendShallowObservable,
} from 'mobx'
import { app } from '@mindhive/di'
import { meteorTracker } from './tracker'
import difference from 'lodash/difference'

import devError from '../devError'

// Originally based on https://github.com/meteor-space/tracker-mobx-autorun 0.2.0

const observableName = ({ observableArray, observableMap }) => {
  const names = []
  if (observableArray) {
    names.push(observableArray.$mobx.atom.name)
  }
  if (observableMap) {
    names.push(observableMap.name)
  }
  return names.join('+')
}

const groundCollectionName = groundCollection =>
  groundCollection.storage._config.name

export const checkFindOptions = ({
  findOptions,
  observableArray,
}) => {
  const { Meteor } = app()
  if (Meteor.isDevelopment) {
    if (findOptions && findOptions.sort && ! observableArray) {
      console.warn('sort findOptions does not make sense when not observing an array')  // eslint-disable-line no-console
    }
  }
}

let uniqueNameCounter = 0

const generateUniqueId = () => {
  uniqueNameCounter += 1
  return uniqueNameCounter
}

class SubscriptionHandle {

  stopped = false

  @observable loading = true
  @observable.ref error = null

  _ready(disposer) {
    this.disposer = disposer
    this.loading = false
  }

  _setError(err) {
    this.error = err
  }

  stop() {
    this.stopped = true
    if (this.disposer) {
      this.disposer.stop()
      this.disposer = null
    }
  }
}

export class MongoMirror {

  // Automatically pump data from a Mongo cursor to a Mobx array or map
  // See subscriptionToObservable for something more high level
  cursorToObservable({
    context = `cursorToObservable@${generateUniqueId()}`,
    mongoCursor,
    observableArray,
    observableMap,
    schema,
    arrayIsOrdered = true,
  }) {
    const mapError = (message) => { devError(`${message}\nobservableMap keys: ${Array.from(observableMap.keys())}`) }
    const arrayError = (message) => { devError(`${message}\nobservableArray keys: ${observableArray.map(d => d._id)}`) }
    const topLevelSchemaKeys = typeof schema === 'object' ?
      Object.keys(schema).filter(k => k.indexOf('.') === -1)
      : []
    const asShallowObservable = (id, fields) => {
      const missingKeys = difference(topLevelSchemaKeys, Object.keys(fields))
      const undefinedFields = {}
      missingKeys.forEach((k) => { undefinedFields[k] = undefined })
      return extendShallowObservable({ _id: id }, fields, undefinedFields)
    }
    meteorTracker.nonreactive(() => {
      runInAction(`${context}: initial fetch`, () => {
        const initialDocs = mongoCursor.fetch()
          .map(({ _id, ...fields }) => asShallowObservable(_id, fields))
        if (observableArray) {
          observableArray.replace(initialDocs)
        }
        if (observableMap) {
          observableMap.replace(initialDocs.map(d => [d._id, d]))
        }
      })
    })
    const arrayIndexOfId = id => observableArray.findIndex(d => d._id === id)
    const observer = {
      _suppress_initial: true,  // suppresses addedAt for documents initially fetched above
      changed: action(`${context}: document changed`, (id, fields) => {
        let doc
        if (observableMap) {
          doc = observableMap.get(id)
          if (! doc) {
            mapError(`${id} not found for change in map`)
          }
          return // as we've modified the object itself, no need to change in array, finding by map more efficient
        } else if (observableArray) {
          doc = observableArray.find(d => d._id === id)
          if (! doc) {
            arrayError(`${id} not found for change in array`)
          }
        }
        if (doc) {
          extendShallowObservable(doc, fields)
        }
      }),
      removed: action(`${context}: document removed`, (id) => {
        if (observableMap) {
          const removed = observableMap.delete(id)
          if (! removed) {
            mapError(`Id ${id} to be removed not found`)
          }
        }
        if (observableArray) {
          const index = arrayIndexOfId(id)
          if (index !== -1) {
            observableArray.splice(index, 1)
          } else {
            arrayError(`Id ${id} to be removed not found`)
          }
        }
      }),
    }
    if (observableArray && arrayIsOrdered) {
      observer.addedBefore = action(`${context}: document added`, (id, fields, before) => {
        const doc = asShallowObservable(id, fields)
        const index = before != null ? arrayIndexOfId(before) : observableArray.length
        if (index !== -1) {
          observableArray.splice(index, 0, doc)
        } else {
          devError(`Id ${before} not found when adding ${id}`)
        }
        if (observableMap) {
          observableMap.set(id, doc)
        }
      })
      observer.movedBefore = action(`${context}: document moved`, (id, before) => {
        const fromIndex = arrayIndexOfId(id)
        if (fromIndex !== -1) {
          const doc = observableArray[fromIndex]
          const toIndex = before != null ? arrayIndexOfId(before) : observableArray.length
          if (toIndex !== -1) {
            observableArray.splice(fromIndex, 1)
            observableArray.splice(toIndex, 0, doc)
          } else {
            devError(`Id ${before} not found when moving ${id}`)
          }
        } else {
          devError(`Id ${id} not found trying to move it`)
        }
      })
    } else {
      observer.added = action(`${context}: document added`, (id, fields) => {
        const doc = asShallowObservable(id, fields)
        if (observableArray) {
          observableArray.push(doc)
        }
        if (observableMap) {
          observableMap.set(id, doc)
        }
      })
    }
    return mongoCursor.observeChanges(observer)
  }

  subscriptionToLocal({
    publicationName,
    subscriptionArgs,
    context = `subscription:${publicationName}`,
    onReady = null,  // Can optionally return a disposer with a stop function
  }) {
    const subscriptionHandle = new SubscriptionHandle(context)
    Meteor.subscribe(publicationName, subscriptionArgs, {
      onReady() {
        if (subscriptionHandle.stopped) {
          return
        }
        let disposer = null
        if (onReady) {
          disposer = onReady()
        }
        runInAction(`${context}: ready`, () => {
          subscriptionHandle._ready(disposer)
        })
      },
      onStop(err) {
        if (err) {
          runInAction(`${context}: error`, () => {
            subscriptionHandle._setError(err)
          })
        }
      },
    })
    return subscriptionHandle
  }

  // What it says on the can, returns handle with stop() (from autorun) and observable property loading
  subscriptionToObservable({
    publicationName,
    subscriptionArgs,
    collection,
    findSelector = {},
    findOptions = {},
    observableArray,
    observableMap,
    arrayIsOrdered = typeof findOptions.sort === 'object',
    schema = collection._c2 && collection._c2._simpleSchema && collection._c2._simpleSchema.mergedSchema(),
    context = `subscription:${publicationName}->${observableName({ observableArray, observableMap })}`,
  }) {
    checkFindOptions({ findOptions, observableArray })
    return this.subscriptionToLocal({
      publicationName,
      subscriptionArgs,
      context,
      onReady: () => this.cursorToObservable({
        context,
        mongoCursor: collection.find(findSelector, findOptions),
        observableArray,
        observableMap,
        arrayIsOrdered,
        schema,
      }),
    })
  }

  subscriptionToOffline({
    publicationName,
    subscriptionArgs,
    collection,
    findSelector = {},
    findOptions = {},
    groundCollection,
    context = `subscription:${publicationName}->${groundCollectionName(groundCollection)}(offline)`,
  }) {
    // REVISIT: this could be more efficient and not go through minimongo
    return this.subscriptionToLocal({
      publicationName,
      subscriptionArgs,
      context,
      onReady: () => {
        const cursor = collection.find(findSelector, findOptions)
        groundCollection.keep(cursor)
        return groundCollection.observeSource(cursor)
      },
    })
  }

  offlineToObservable({
    groundCollection,
    observableArray,
    observableMap,
    schema,
    context = `offline:${groundCollectionName(groundCollection)}->${
      observableName({ observableArray, observableMap })}`,
  }) {
    return this.cursorToObservable({
      context,
      observableArray,
      observableMap,
      schema,
      mongoCursor: groundCollection.find(),
    })
  }

  subscriptionToObservableCachedOffline({
    publicationName,
    subscriptionArgs,
    collection,
    findSelector = {},
    findOptions = {},
    groundCollection,
    observableArray,
    observableMap,
  }) {
    // REVISIT: this will have 3 copies in memory (groundCollection._collection, subscription collection, observable(s))
    checkFindOptions({ findOptions, observableArray })
    this.offlineToObservable({
      groundCollection,
      observableArray,
      observableMap,
    })
    return this.subscriptionToOffline({
      publicationName,
      subscriptionArgs,
      collection,
      findSelector,
      findOptions,
      groundCollection,
    })
  }
}
