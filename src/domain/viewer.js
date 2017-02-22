import {
  observable,
  computed,
  action,
} from 'mobx'
import { app } from '@mindhive/di'
import { SUPER_USER } from '../roles'


const VIEWER_STATE_PATH = 'viewerState'

// Expects viewer data to be auto published (i.e. null publicationName)
export class ViewerDomain {
  @observable loading = true
  // Use shallow because we don't update the internals, only the reference,
  // and makes user pure JS (avoiding issues with Roles package thinking user.roles is not an array)
  @observable.ref user = null
  @observable isAuthenticatedLive = false

  constructor() {
    const {
      Meteor,
      Users,
      Tracker,
      storage,
    } = app()
    let firstRun = true
    Tracker.autorun(() => {
      const userId = Meteor.userId()
      if (userId) {
        const user = Users.findOne(userId)
        if (user) {
          this._updateFromServer(user)
        } else if (firstRun) {
          const offlineState = storage.read(VIEWER_STATE_PATH)
          if (offlineState && offlineState.user && offlineState.user._id === userId) {
            // Assume user hasn't changed so we can work offline, and get a head start even if online
            this._updateFromOfflineState(offlineState)
          }
          // OK to leave all other state as-is, because initialised values are correct (we're firstRun)
        } else {
          this._waitingForViewerSubscription()
        }
      } else {
        this._updateFromServer(null)
      }
      firstRun = false
    })
  }

  @action _waitingForViewerSubscription() {
    this.isAuthenticatedLive = false
    this.loading = true
    this._applyFromServer(null)
  }

  @action _updateFromServer(user) {
    const { storage } = app()
    this.isAuthenticatedLive = !! user
    this._applyFromServer(user)
    this.loading = false
    if (user) {
      const offlineState = {}
      this._buildOfflineState(offlineState)
      storage.write(VIEWER_STATE_PATH, offlineState)
    } else {
      storage.write(VIEWER_STATE_PATH, null)
    }
  }

  _applyFromServer(user) {
    this.user = user
  }

  @action _updateFromOfflineState(state) {
    this._applyFromOfflineState(state)
    this.loading = false
  }

  _applyFromOfflineState(state) {
    this.user = state.user
  }

  _buildOfflineState(state) {
    state.user = this.user
  }

  @computed get isAuthenticated() {
    return !! this.user
  }

  hasRole(role) {
    return app().Roles.userIsInRole(this.user, role)
  }

  @computed get isSuperUser() {
    return this.hasRole(SUPER_USER)
  }
}

export class ViewerWithOrgDomain extends ViewerDomain {
  @observable.ref org = null

  _applyFromServer(user) {
    super._applyFromServer(user)
    this.org = user && app().Orgs.findOne(user.orgId)
  }

  _applyFromOfflineState(state) {
    super._applyFromOfflineState(state)
    this.org = state.org
  }

  _buildOfflineState(state) {
    super._buildOfflineState(state)
    state.org = this.org
  }

}
