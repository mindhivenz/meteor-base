import { action, observable, runInAction } from 'mobx'
import { app } from '@mindhive/di'

import { LocalContext } from './localContext'


const readySubscription = {
  ready: () => true,
}

const meteorTracker = global.Tracker

class Tracker {

  constructor(trackerMobxAutorun) {
    this.trackerMobxAutorun = trackerMobxAutorun
  }

  // Reactive to both Meteor and Mobx changes, returns object with stop() method that you should be calling!
  autorun(...args) {
    const handle = this.trackerMobxAutorun.default(...args)
    handle.start()    // Make it match the call signature of Meteor's  Tracker.autorun
    return handle
  }

  // Automatically pump data from a Mongo cursor to a Mobx array or map
  // See pumpSubscriptionToMobx for something more high level
  pumpMongoToMobx({
    actionPrefix,
    subscription = readySubscription,
    mongoCursor,
    observableArray,
    observableMap,
  }) {
    if (observableArray) {
      this.trackerMobxAutorun.observe(actionPrefix, observableArray, subscription, mongoCursor)
    }
    if (observableMap) {
      const setDocument = (document) => {
        observableMap.set(document._id, document)
      }
      if (subscription.ready()) {
        meteorTracker.nonreactive(() => {
          runInAction(`${actionPrefix}: initial fetch`, () => {
            observableMap.clear()
            mongoCursor.fetch().forEach(setDocument)
          })
        })
        mongoCursor.observe({
          _suppress_initial: true,  // suppresses addedAt callback for documents initially fetched
          addedAt: action(`${actionPrefix}: document added`, setDocument),
          changedAt: action(`${actionPrefix}: document changed`, setDocument),
          removedAt: action(`${actionPrefix}: document removed`, (oldDocument) => {
            observableMap.delete(oldDocument._id)
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
  pumpSubscriptionToMobx({
    publicationName,
    subscriptionArgs,
    focusedView,
    viewSelector = {},
    observableArray,
    observableMap,
    context = `subscription:${publicationName}`,
  }) {
    const result = observable({
      loading: true,  // Don't call it ready to avoid confusion with Meteor subscription ready method
    })
    const autorun = this.autorun(() => {
      if (app().viewerDomain.isAuthenticatedLive) {  // Otherwise focusedViews won't have the info they need
                                                     // Also useful to give other subscriptions a head start
        const subscription = Meteor.subscribe(publicationName, subscriptionArgs)
        this.pumpMongoToMobx({
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
    result.stop = autorun.stop  // Copy stop across
    return result
  }
}

export const buildTracker = () => {
  const trackerMobxAutorunPackage = global.Package && global.Package['space:tracker-mobx-autorun']
  return trackerMobxAutorunPackage ? new Tracker(trackerMobxAutorunPackage) : meteorTracker
}

