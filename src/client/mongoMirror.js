import {
  action,
  observable,
  runInAction,
  ValueMode,
} from 'mobx'
import { app } from '@mindhive/di'
import { meteorTracker } from './tracker'
import { LocalContext } from './localContext'

// Originally based on https://github.com/meteor-space/tracker-mobx-autorun 0.2.0

const readySubscription = {
  ready: () => true,
}

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

export const checkViewOptions = ({
  viewOptions,
  observableArray,
}) => {
  const { Meteor } = app()
  if (Meteor.isDevelopment) {
    if (viewOptions && viewOptions.sort && ! observableArray) {
      console.warn('sort viewOptions does not make sense when not observing an array')  // eslint-disable-line no-console
    }
  }
}

export const checkObservableModes = ({
  observableArray,
  observableMap,
}) => {
  if (observableArray && observableArray.$mobx.mode !== ValueMode.Reference) {
    console.warn('observableArray does not appear to be using asFlat, ' +  // eslint-disable-line no-console
      'declare as: @observable array = asFlat([])')
  }
  if (observableMap && observableMap._valueMode !== ValueMode.Reference) {
    console.warn('observableMap does not appear to be using asReference, ' +  // eslint-disable-line no-console
      'declare as: @observable map = asMap([], asReference)')
  }
}

export class MongoMirror {

  // Automatically pump data from a Mongo cursor to a Mobx array or map
  // See subscriptionToObservable for something more high level
  cursorToObservable({
    context = 'cursorToObservable',
    mongoCursor,
    observableArray,  // Should be declared as: @observable array = asFlat([])
    observableMap,  // Should be declared as: @observable map = asMap([], asReference)
    subscription = readySubscription,  // Pass subscription handle if from a subscription
    endless = false,
  }) {
    const { Meteor } = app()
    if (Meteor.isDevelopment) {
      if (! meteorTracker.active) {
        if (endless) {
          if (! subscription.ready()) {
            // If we wanted to handle this we could with slightly more complicated code below
            console.error('When using endless pump outside a Tracker.autorun() ' +  // eslint-disable-line no-console
              'the subscription must be ready as we cannot react to it changing')
          }
        } else {
          console.warn('You are setting up a mirror outside of a Tracker.autorun().\n' +  // eslint-disable-line no-console
            'observe/observeChanges cannot be stopped and cannot follow subscription.ready() changes.\n' +
            'If that is what you intended then specify endless.')
        }
      }
      checkObservableModes({ observableArray, observableMap })
    }
    if (subscription.ready()) {
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
        mongoCursor.observe({
          _suppress_initial: true,  // suppresses added(At) for documents initially fetched above
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
        mongoCursor.observe({
          _suppress_initial: true,  // suppresses added(At) for documents initially fetched above
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
    } else {
      runInAction(`${context}: initialized empty`, () => {
        if (observableArray) {
          observableArray.clear()
        }
        if (observableMap) {
          observableMap.clear()
        }
      })
    }
  }

  subscriptionToLocal({
    publicationName,
    subscriptionArgs,
    context = `subscription:${publicationName}`,
    onReady,
  }) {
    const result = observable({
      loading: true,  // Don't call it ready to avoid confusion with Meteor subscription ready which is a method
    })
    const autorunHandle = meteorTracker.autorun(() => {
      const subscription = Meteor.subscribe(publicationName, subscriptionArgs)
      if (subscription.ready()) {
        if (onReady) {
          onReady(subscription)
        }
        runInAction(`${context}: ready`, () => {
          result.loading = false
        })
      }
    })
    result.stop = () => {     // intentionally set after making result observable so that this is not computed
      autorunHandle.stop()
    }
    return result
  }

  // What it says on the can, returns handle with stop() (from autorun) and observable property loading
  subscriptionToObservable({
    publicationName,
    subscriptionArgs,
    focusedView,
    viewSelector = {},
    viewOptions = {},
    observableArray,
    observableMap,
    context = `subscription:${publicationName}->${observableName({ observableArray, observableMap })}`,
  }) {
    checkViewOptions({ viewOptions, observableArray })
    return this.subscriptionToLocal({
      publicationName,
      subscriptionArgs,
      context,
      onReady: (subscription) => {
        this.cursorToObservable({
          context,
          observableArray,
          observableMap,
          subscription,
          mongoCursor: focusedView.find(new LocalContext(context), viewSelector, viewOptions),
        })
      },
    })
  }

  subscriptionToOffline({
    publicationName,
    subscriptionArgs,
    focusedView,
    viewSelector = {},
    viewOptions = {},
    groundCollection,
    context = `subscription:${publicationName}->offline:${groundCollectionName(groundCollection)}`,
  }) {
    // REVISIT: this could be more efficient and not go through minimongo
    return this.subscriptionToLocal({
      publicationName,
      subscriptionArgs,
      context,
      onReady: () => {
        const cursor = focusedView.find(new LocalContext(context), viewSelector, viewOptions)
        groundCollection.keep(cursor)
        groundCollection.observeSource(cursor)
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
    this.cursorToObservable({
      context,
      observableArray,
      observableMap,
      mongoCursor: groundCollection.find(),
      endless: true,
    })
  }

  subscriptionToObservableCachedOffline({
    publicationName,
    subscriptionArgs,
    focusedView,
    viewSelector = {},
    viewOptions = {},
    groundCollection,
    observableArray,
    observableMap,
  }) {
    // REVISIT: this will have 3 copies in memory (groundCollection._collection, subscription collection, observable(s))
    checkViewOptions({ viewOptions, observableArray })
    this.offlineToObservable({
      groundCollection,
      observableArray,
      observableMap,
    })
    return this.subscriptionToOffline({
      publicationName,
      subscriptionArgs,
      focusedView,
      viewSelector,
      viewOptions,
      groundCollection,
    })
  }
}
