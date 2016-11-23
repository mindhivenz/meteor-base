import {
  action,
  observable,
  runInAction,
  toJS,
} from 'mobx'
import { app } from '@mindhive/di'

import { meteorTracker } from './tracker'
import { LocalContext } from './localContext'

// Based on https://github.com/meteor-space/tracker-mobx-autorun

const readySubscription = {
  ready: () => true,
}

export class MongoMirror {

  // Automatically pump data from a Mongo cursor to a Mobx array or map
  // See subscriptionToDomain for something more high level
  cursorToDomain({
    actionPrefix,
    mongoCursor,
    observableArray,
    observableMap,
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
    if (observableArray) {
      if (subscription.ready()) {
        meteorTracker.nonreactive(() => {
          runInAction(`${actionPrefix}: initial fetch`, () => {
            observableArray.replace(mongoCursor.fetch())
          })
        })
        mongoCursor.observe({
          _suppress_initial: true,  // suppresses addedAt callback for documents initially fetched
          addedAt: action(`${actionPrefix}: document added`, (doc, index) => {
            observableArray.splice(index, 0, doc)
          }),
          removedAt: action(`${actionPrefix}: document removed`, (doc, index) => {
            observableArray.splice(index, 1)
          }),
          changedAt: action(`${actionPrefix}: document changed`, (doc, oldDoc, index) => {
            // REVISIT: if existing value isObservable we could be more efficient here and just assign top level fields
            // Probably using extendObservable but also handling fields disappearing
            // Or use observeChanges instead so we just get fields
            observableArray[index] = doc
          }),
          movedTo: action(`${actionPrefix}: document moved`, (doc, fromIndex, toIndex) => {
            observableArray.splice(fromIndex, 1)
            observableArray.splice(toIndex, 0, doc)
          }),
        })
      } else {
        runInAction(`${actionPrefix}: initialized`, () => {
          observableArray.clear()
        })
      }
    }
    if (observableMap) {
      if (subscription.ready()) {
        meteorTracker.nonreactive(() => {
          runInAction(`${actionPrefix}: initial fetch`, () => {
            observableMap.clear()
            mongoCursor.fetch().forEach((doc) => {
              observableMap.set(doc._id, doc)
            })
          })
        })
        mongoCursor.observeChanges({  // More efficient than observe()
          _suppress_initial: true,  // suppresses addedAt callback for documents initially fetched
          added: action(`${actionPrefix}: document added`, (id, doc) => {
            observableMap.set(id, doc)
          }),
          removed: action(`${actionPrefix}: document removed`, (id) => {
            observableMap.remove(id)
          }),
          changed: action(`${actionPrefix}: document changed`, (id, fields) => {
            // REVISIT: if existing value isObservable we could be more efficient here and just assign new fields
            // Probably using extendObservable but also handling fields disappearing (undefined in fields)
            const doc = toJS(observableMap.get(id) || {}, false)  // If was observable, toJS clones
            // Doesn't matter we may be overwriting existing object here as toJS detached it from Mobx
            Object.entries(fields).forEach(([k, v]) => {
              if (v === undefined) {
                delete doc[k]
              } else {
                doc[k] = v
              }
            })
            observableMap.set(id, doc)
          }),
        })
      } else {
        runInAction(`${actionPrefix}: initialized`, () => {
          observableMap.clear()
        })
      }
    }
  }

  _autorunWhenViewerInfoAvailableForFocusedViews(func) {
    return app().Tracker.autorun(() => {
      // Also useful to give other subscriptions a head start
      if (app().viewerDomain.isAuthenticatedLive) {
        func()
      }
    })
  }

  // What it says on the can, returns handle with stop() (from autorun) and observable property loading
  subscriptionToDomain({
    publicationName,
    subscriptionArgs,
    focusedView,
    viewSelector = {},
    observableArray,
    observableMap,
    context = `mirror:${publicationName}`,
  }) {
    const result = observable({
      loading: true,  // Don't call it ready to avoid confusion with Meteor subscription ready method
    })
    const autorunHandle = this._autorunWhenViewerInfoAvailableForFocusedViews(() => {
      const subscription = Meteor.subscribe(publicationName, subscriptionArgs)
      this.cursorToDomain({
        actionPrefix: context,
        observableArray,
        observableMap,
        subscription,
        mongoCursor: focusedView.find(new LocalContext(context), viewSelector),
      })
      if (subscription.ready()) {
        runInAction(`${context}: ready`, () => {
          result.loading = false
        })
      }
    })
    result.stop = autorunHandle.stop  // Copy stop across
    return result
  }

  subscriptionToOffline({
    publicationName,
    subscriptionArgs,
    focusedView,
    viewSelector = {},
    groundCollection,
    context = `mirror:${publicationName}`,
  }) {
    return this._autorunWhenViewerInfoAvailableForFocusedViews(() => {
      const subscription = Meteor.subscribe(publicationName, subscriptionArgs)
      if (subscription.ready()) {
        const orgProfilesCursor = focusedView.find(
          new LocalContext(context),
          viewSelector,
        )
        groundCollection.keep(orgProfilesCursor)
        groundCollection.observeSource(orgProfilesCursor)
      }
    })
  }

  subscriptionToDomainCachedOffline({
    publicationName,
    subscriptionArgs,
    focusedView,
    viewSelector = {},
    groundCollection,
    observableArray,
    observableMap,
  }) {
    this.cursorToDomain({
      actionPrefix: `mirror:(offline)${publicationName}->domain`,
      observableArray,
      observableMap,
      mongoCursor: groundCollection.find(),
      endless: true,
    })
    this.subscriptionToOffline({
      publicationName,
      subscriptionArgs,
      focusedView,
      viewSelector,
      groundCollection,
    })
  }
}
