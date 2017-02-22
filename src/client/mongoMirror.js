import {
  action,
  observable,
  runInAction,
} from 'mobx'
import { app } from '@mindhive/di'
import { meteorTracker } from './tracker'

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

export const checkObservableModes = ({
  observableArray,
  observableMap,
}) => {
  const { Meteor } = app()
  if (Meteor.isDevelopment) {
    if (observableArray && observableArray.enhancer.name !== 'referenceEnhancer') {
      console.warn('observableArray does not appear to be shallow, ' +  // eslint-disable-line no-console
        'declare as: @observable.shallow array = []')
    }
    if (observableMap && observableMap.enhancer.name !== 'referenceEnhancer') {
      console.warn('observableMap does not appear to be shallow, ' +  // eslint-disable-line no-console
        'declare as: @observable.shallow map = new Map()')
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

  _ready(disposer) {
    this.disposer = disposer
    this.loading = false
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
    observableArray,  // Should be declared as observable.shallow
    observableMap,  // Should be declared as observable.shallow
  }) {
    checkObservableModes({ observableArray, observableMap })
    meteorTracker.nonreactive(() => {
      runInAction(`${context}: initial fetch`, () => {
        const initialDocs = mongoCursor.fetch()
        if (observableArray) {
          observableArray.replace(initialDocs)
        }
        if (observableMap) {
          observableMap.clear()
          initialDocs.forEach((doc) => {
            observableMap.set(doc._id, doc)
          })
        }
      })
    })
    if (observableArray) {
      return mongoCursor.observe({
        _suppress_initial: true,  // suppresses addedAt for documents initially fetched above
        addedAt: action(`${context}: document added`, (doc, index) => {
          observableArray.splice(index, 0, doc)
          if (observableMap) {
            observableMap.set(doc._id, doc)
          }
        }),
        changedAt: action(`${context}: document changed`, (doc, oldDoc, index) => {
          // REVISIT: if existing value isObservable we could be more efficient here and just assign top level fields
          // Probably using extendObservable but also need to handle fields disappearing
          // Or use observeChanges instead so we just get fields
          observableArray[index] = doc
          if (observableMap) {
            observableMap.set(doc._id, doc)
          }
        }),
        removedAt: action(`${context}: document removed`, (doc, index) => {
          observableArray.splice(index, 1)
          if (observableMap) {
            observableMap.delete(doc._id)
          }
        }),
        movedTo: action(`${context}: document moved`, (doc, fromIndex, toIndex) => {
          observableArray.splice(fromIndex, 1)
          observableArray.splice(toIndex, 0, doc)
        }),
      })
    } else if (observableMap) {
      return mongoCursor.observe({
        _suppress_initial: true,  // suppresses added for documents initially fetched above
        added: action(`${context}: document added`, (doc) => {
          observableMap.set(doc._id, doc)
        }),
        removed: action(`${context}: document removed`, (oldDoc) => {
          observableMap.delete(oldDoc._id)
        }),
        changed: action(`${context}: document changed`, (doc) => {
          observableMap.set(doc._id, doc)
        }),
      })
    }
    throw new Error('Neither observableArray, not observableMap')
  }

  subscriptionToLocal({
    publicationName,
    subscriptionArgs,
    context = `subscription:${publicationName}`,
    onReady = null,  // Can optionally return a disposer with a stop function
  }) {
    const subscriptionHandle = new SubscriptionHandle(context)
    Meteor.subscribe(publicationName, subscriptionArgs, () => {
      if (subscriptionHandle.stopped) {
        return
      }
      let disposer = null
      if (onReady) {
        disposer = onReady()
      }
      runInAction(`${context}: ready`, () => {
        console.log(`ready ${publicationName}`)
        subscriptionHandle._ready(disposer)
      })
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
    context = `subscription:${publicationName}->${observableName({ observableArray, observableMap })}`,
  }) {
    checkFindOptions({ findOptions, observableArray })
    return this.subscriptionToLocal({
      publicationName,
      subscriptionArgs,
      context,
      onReady: () => this.cursorToObservable({
        context,
        observableArray,
        observableMap,
        mongoCursor: collection.find(findSelector, findOptions),
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
    context = `offline:${groundCollectionName(groundCollection)}->${
      observableName({ observableArray, observableMap })}`,
  }) {
    return this.cursorToObservable({
      context,
      observableArray,
      observableMap,
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
