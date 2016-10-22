import {
  observable,
  computed,
  action,
  asReference,
} from 'mobx'
import { app } from '@mindhive/di'


export class ViewerDomain {
  @observable loading = true
  // Use atReference because we don't update the internals, only this reference,
  // and makes user pure JS (avoiding issues with Roles package thinking user.roles is not an array)
  @observable user = asReference(null)
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

  buildOfflineState(state) {
    state.user = this.user
  }

  @computed get isAuthenticated() {
    return !! this.user
  }

  hasRole = (role) =>
    app().Roles.userIsInRole(this.user, role)
}

export class ViewerWithOrgDomain extends ViewerDomain {
  @observable org = asReference(null)

  applyFromServer(user) {
    super.applyFromServer(user)
    this.org = user && app().Orgs.findOne(user.orgId)
  }

  applyFromOfflineState(state) {
    super.applyFromOfflineState(state)
    this.org = state.org
  }

  buildOfflineState(state) {
    super.buildOfflineState(state)
    state.org = this.org
  }

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
    const offlineState = {}
    viewerDomain.buildOfflineState(offlineState)
    storage.write(VIEWER_STATE_PATH, offlineState)
  }

  const readOfflineState = () =>
    storage.read(VIEWER_STATE_PATH)

  Tracker.autorun(() => {
    if (offlineEnabled && viewerDomain.loading && connectionDomain.connectionDown) {
      const offlineState = readOfflineState()
      if (offlineState) {
        viewerDomain.updateFromOfflineState(offlineState)
      }
    } else {
      if (Meteor.userId()) {
        if (Meteor.subscribe(subscription).ready()) {
          updateFromServer(Users.findOne(Meteor.userId()))
        } else {
          if (viewerDomain.loading) {
            const offlineState = readOfflineState()
            if (offlineState && offlineState.user && offlineState.user._id === Meteor.userId()) {
              viewerDomain.updateFromOfflineState(offlineState)
            }
          }
        }
      } else {
        updateFromServer(null)
      }
    }
  })
}
