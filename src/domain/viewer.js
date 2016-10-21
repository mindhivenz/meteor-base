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

  buildOfflineState(state) {
    state.user = this.userJson
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

export class ViewerWithOrgDomain extends ViewerDomain {
  @observable org = asStructure(null)

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
    state.org = toJS(this.org)
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
    if (offlineEnabled) {
      const offlineState = {}
      viewerDomain.buildOfflineState(offlineState)
      storage.write(VIEWER_STATE_PATH, offlineState)
    }
  }

  Tracker.autorun(() => {
    if (offlineEnabled && viewerDomain.loading && connectionDomain.connectionDown) {
      const offlineState = storage.read(VIEWER_STATE_PATH)
      if (offlineState) {
        viewerDomain.updateFromOfflineState(offlineState)
      }
    } else {
      if (Meteor.userId()) {
        if (Meteor.subscribe(subscription).ready()) {
          updateFromServer(Users.findOne(Meteor.userId()))
        }
      } else {
        updateFromServer(null)
      }
    }
  })
}