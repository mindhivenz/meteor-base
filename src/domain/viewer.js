import {
  observable,
  computed,
  action,
  asReference,
} from 'mobx'
import { app } from '@mindhive/di'
import { SUPER_USER } from '../roles'


const VIEWER_STATE_PATH = 'viewerState'

// Expects viewer data to be auto published (i.e. null publicationName)
export class ViewerDomain {
  @observable loading = true
  // Use atReference because we don't update the internals, only this reference,
  // and makes user pure JS (avoiding issues with Roles package thinking user.roles is not an array)
  @observable user = asReference(null)
  @observable isAuthenticatedLive = false

  constructor() {
    const {
      Meteor,
      Users,
      Tracker,
      storage,
      connectionDomain,
      offlineEnabled,
    } = app()

    const readOfflineState = () =>
      storage.read(VIEWER_STATE_PATH)

    Tracker.autorun(() => {
      if (offlineEnabled && this.loading && connectionDomain.connectionDown) {
        const offlineState = readOfflineState()
        if (offlineState) {
          this._updateFromOfflineState(offlineState)
        }
      } else if (Meteor.userId()) {
        const user = Users.findOne(Meteor.userId())
        if (user) {
          this._updateFromServer(user)
        } else if (this.loading) {
          const offlineState = readOfflineState()
          if (offlineState && offlineState.user && offlineState.user._id === Meteor.userId()) {
            this._updateFromOfflineState(offlineState)
          }
        } else {
          // waiting for publication to be ready, leave state in place (inconsistency with Meteor.userId for a bit)
        }
      } else {
        this._updateFromServer(null)
      }
    })
  }

  @action _updateFromServer(user) {
    const { storage } = app()
    this._applyFromServer(user)
    this.isAuthenticatedLive = !! user
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
  @observable org = asReference(null)

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
