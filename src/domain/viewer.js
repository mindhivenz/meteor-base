import {
  observable,
  computed,
  action,
  toJS,
  asStructure,
} from 'mobx'
import { app } from '@mindhive/di'


export class ViewerDomain {
  @observable loading = true
  @observable user = asStructure(null)
  @observable isAuthenticatedLive = false

  @action updateFromServer(user) {
    this.applyFromServer(user)
    this.isAuthenticatedLive = !! user
    this.loading = false
  }

  applyFromServer(user) {
    this.user = user
  }

  @action updateFromOfflineState(state) {
    this.applyFromOfflineState(state)
    this.loading = false
  }

  applyFromOfflineState(state) {
    this.user = state.user
  }

  buildOfflineState() {
    return {
      user: this.userJson,
    }
  }

  @computed get isAuthenticated() {
    return !! this.user
  }

  get userJson() {
    return toJS(this.user)
  }

  hasRole = (role) =>
    app().Roles.userIsInRole(this.userJson, role)
}

const VIEWER_STATE_PATH = 'viewerState'

export const linkViewerDomainToSubscription = (viewerDomain, subscription = 'viewer') => {
  const {
    Meteor,
    Users,
    Tracker,
    storage,
    connectionDomain,
    offlineEnabled,
  } = app()

  const updateFromServer = (user) => {
    viewerDomain.updateFromServer(user)
    if (offlineEnabled) {
      storage.write(VIEWER_STATE_PATH, JSON.stringify(viewerDomain.buildOfflineState()))
    }
  }

  Tracker.autorun(() => {
    if (offlineEnabled && viewerDomain.loading && connectionDomain.connectionDown) {
      storage.read(VIEWER_STATE_PATH)
        .then(state => {
          // Check we're still in the same state
          if (viewerDomain.loading && connectionDomain.connectionDown) {
            viewerDomain.updateFromOfflineState(JSON.parse(state))
          }
        })
    } else {
      if (Meteor.subscribe(subscription).ready()) {
        if (Meteor.userId()) {
          updateFromServer(Users.findOne(Meteor.userId()))
        } else {
          updateFromServer(null)
        }
      } else if (! Meteor.userId()) {
        // Be proactive, if the subscription is not ready but we know they're not logged in
        // then we can still fire viewer changed to set loading false
        updateFromServer(null)
      }
    }
  })
}
