import {
  action,
  observable,
  runInAction,
  autorun as mobxAutorun,
  toJS,
} from 'mobx'
import { app } from '@mindhive/di'

import { LocalContext } from './localContext'


// Based on https://github.com/meteor-space/tracker-mobx-autorun

const readySubscription = {
  ready: () => true,
}

const meteorTracker = global.Tracker

const autorun = (func) => {
  let mobxDisposer = null
  let computation = null
  let isFirstRun = true
  computation = meteorTracker.autorun(() => {
    if (mobxDisposer) {
      mobxDisposer()
      isFirstRun = true
    }
    mobxDisposer = mobxAutorun(() => {
      if (isFirstRun) {
        func()
      } else {
        computation.invalidate()
      }
      isFirstRun = false
    })
  })
  return {
    stop() {
      computation.stop()
      mobxDisposer()
    },
  }
}

// Automatically pump data from a Mongo cursor to a Mobx array or map
// See pumpSubscriptionToMobx for something more high level
const pumpMongoToMobx = ({
  actionPrefix,
  subscription = readySubscription,
  mongoCursor,
  observableArray,
  observableMap,
}) => {
  if (! meteorTracker.active) {
    console.warn('You are setting up a pump outside of a Tracker.autorun().\n' +  // eslint-disable-line no-console
      'Cannot follow subscription.ready() changes, and observe/observeChanges will not be stopped')
  }
  if (observableArray) {
    if (subscription.ready()) {
      meteorTracker.nonreactive(() => {
        runInAction(`${actionPrefix}: initial fetch`, () => {
          observableArray.replace(mongoCursor.fetch())
        })
      })
      mongoCursor.observe({  // More efficient than observe()
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
        observableMap.clear()
      })
    }
  }
  if (observableMap) {
    if (subscription.ready()) {
      meteorTracker.nonreactive(() => {
        runInAction(`${actionPrefix}: initial fetch`, () => {
          observableMap.clear()
          mongoCursor.fetch().forEach((doc) => { observableMap.set(doc._id, doc) })
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
          // Doesn't matter we may be overwriting existing object here, as we know it's not observable
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

// What it says on the can, returns handle with stop() (from autorun) and observable property loading
const pumpSubscriptionToMobx = ({
  publicationName,
  subscriptionArgs,
  focusedView,
  viewSelector = {},
  observableArray,
  observableMap,
  context = `subscription:${publicationName}`,
}) => {
  const result = observable({
    loading: true,  // Don't call it ready to avoid confusion with Meteor subscription ready method
  })
  const autorunHandle = autorun(() => {
    if (app().viewerDomain.isAuthenticatedLive) {  // Otherwise focusedViews won't have the info they need
      // Also useful to give other subscriptions a head start
      const subscription = Meteor.subscribe(publicationName, subscriptionArgs)
      pumpMongoToMobx({
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
    }
  })
  result.stop = autorunHandle.stop  // Copy stop across
  return result
}

export const Tracker = {
  autorun,
  pumpSubscriptionToMobx,
  pumpMongoToMobx,
}
