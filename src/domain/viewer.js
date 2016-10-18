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

  @action change(user) {
    this.user = user
    this.loading = false
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

export const linkViewerDomainToSubscription = (viewerDomain, subscription = 'viewer') => {
  const {
    Meteor,
    Users,
    Tracker,
  } = app()
  Tracker.autorun(() => {
    if (Meteor.subscribe(subscription).ready()) {
      if (Meteor.userId()) {
        viewerDomain.change(Users.findOne(Meteor.userId()))
      } else {
        viewerDomain.change(null)
      }
    } else if (! Meteor.userId()) {
      // Be proactive, if the subscription is not ready but we know they're not logged in
      // then we can still fire viewer changed to set loading false
      viewerDomain.change(null)
    }
  })
}
