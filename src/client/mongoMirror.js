import {
  action,
  observable as mobxObservable,
  isObservableArray,
  isObservableMap,
  runInAction,
  toJS,
  ValueMode,
} from 'mobx'
import { app } from '@mindhive/di'
import { meteorTracker } from './tracker'
import { LocalContext } from './localContext'

// Based on https://github.com/meteor-space/tracker-mobx-autorun

const readySubscription = {
  ready: () => true,
}

const observableName = (observable) => {
  if (isObservableMap(observable)) {
    return observable.name
  } else if (isObservableArray(observable)) {
    return observable.$mobx.atom.name
  }
  return 'observable'
}

const groundCollectionName = groundCollection =>
  groundCollection.storage._config.name

export class MongoMirror {

  // Automatically pump data from a Mongo cursor to a Mobx array or map
  // See subscriptionToDomain for something more high level
  cursorToDomain({
    context = 'cursorToDomain',
    mongoCursor,
    observable,  // Should be declared as: array = asFlat([]), or map = asMap([], asReference)
    subscription = readySubscription,  // Pass subscription handle if from a subscription
    endless = false,
  }) {
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
    if (subscription.ready()) {
      if (isObservableArray(observable)) {
        if (app().Meteor.isDevelopment && observable.$mobx.mode !== ValueMode.Reference) {
          console.warn('observable array does not appear to be using asFlat')  // eslint-disable-line no-console
        }
        meteorTracker.nonreactive(() => {
          runInAction(`${context}: initial fetch`, () => {
            observable.replace(mongoCursor.fetch())
          })
        })
        mongoCursor.observe({
          _suppress_initial: true,  // suppresses addedAt callback for documents initially fetched
          addedAt: action(`${context}: document added`, (doc, index) => {
            observable.splice(index, 0, doc)
          }),
          removedAt: action(`${context}: document removed`, (doc, index) => {
            observable.splice(index, 1)
          }),
          changedAt: action(`${context}: document changed`, (doc, oldDoc, index) => {
            // REVISIT: if existing value isObservable we could be more efficient here and just assign top level fields
            // Probably using extendObservable but also handling fields disappearing
            // Or use observeChanges instead so we just get fields
            observable[index] = doc
          }),
          movedTo: action(`${context}: document moved`, (doc, fromIndex, toIndex) => {
            observable.splice(fromIndex, 1)
            observable.splice(toIndex, 0, doc)
          }),
        })
      } else if (isObservableMap(observable)) {
        if (app().Meteor.isDevelopment && observable._valueMode !== ValueMode.Reference) {
          console.warn('observable map does not appear to be using asReference')  // eslint-disable-line no-console
        }
        meteorTracker.nonreactive(() => {
          runInAction(`${context}: initial fetch`, () => {
            observable.clear()
            mongoCursor.fetch().forEach((doc) => {
              observable.set(doc._id, doc)
            })
          })
        })
        mongoCursor.observeChanges({  // More efficient than observe()
          _suppress_initial: true,  // suppresses addedAt callback for documents initially fetched
          added: action(`${context}: document added`, (id, doc) => {
            const completeDoc = doc._id ? doc : { _id: id, ...doc }
            observable.set(id, completeDoc)
          }),
          removed: action(`${context}: document removed`, (id) => {
            observable.delete(id)
          }),
          changed: action(`${context}: document changed`, (id, fields) => {
            // REVISIT: if existing value isObservable we could be more efficient here and just assign new fields
            // Probably using extendObservable but also handling fields disappearing (undefined in fields)
            const doc = toJS(observable.get(id) || {}, false)  // If was observable, toJS clones
            // Doesn't matter we may be overwriting existing object here as toJS detached it from Mobx
            Object.entries(fields).forEach(([k, v]) => {
              if (v === undefined) {
                delete doc[k]
              } else {
                doc[k] = v
              }
            })
            observable.set(id, doc)
          }),
        })
      } else {
        throw new Error('observable appears to be neither observable array or map')
      }
    } else {
      runInAction(`${context}: initialized`, () => {
        observable.clear()
      })
    }
  }

  subscribe({
    publicationName,
    subscriptionArgs,
    context = `subscription:${publicationName}`,
    onReady,
  }) {
    const result = mobxObservable({
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
  subscriptionToDomain({
    publicationName,
    subscriptionArgs,
    focusedView,
    viewSelector = {},
    observable,
    context = `subscription:${publicationName}->${observableName(observable)}`,
  }) {
    return this.subscribe({
      publicationName,
      subscriptionArgs,
      context,
      onReady: (subscription) => {
        this.cursorToDomain({
          context,
          observable,
          subscription,
          mongoCursor: focusedView.find(new LocalContext(context), viewSelector),
        })
      },
    })
  }

  subscriptionToOffline({
    publicationName,
    subscriptionArgs,
    focusedView,
    viewSelector = {},
    groundCollection,
    context = `subscription:${publicationName}->offline:${groundCollectionName(groundCollection)}`,
  }) {
    // REVISIT: this could be more efficient and not go through minimongo
    return this.subscribe({
      publicationName,
      subscriptionArgs,
      context,
      onReady: () => {
        const cursor = focusedView.find(new LocalContext(context), viewSelector)
        groundCollection.keep(cursor)
        groundCollection.observeSource(cursor)
      },
    })
  }

  offlineToDomain({
    groundCollection,
    observable,
    context = `offline:${groundCollectionName(groundCollection)}->${observableName(observable)}`,
  }) {
    this.cursorToDomain({
      context,
      observable,
      mongoCursor: groundCollection.find(),
      endless: true,
    })
  }

  subscriptionToDomainCachedOffline({
    publicationName,
    subscriptionArgs,
    focusedView,
    viewSelector = {},
    groundCollection,
    observable,
  }) {
    this.offlineToDomain({
      groundCollection,
      observable,
    })
    return this.subscriptionToOffline({
      publicationName,
      subscriptionArgs,
      focusedView,
      viewSelector,
      groundCollection,
    })
  }
}
