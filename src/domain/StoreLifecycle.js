import { observable, computed } from 'mobx'

import { CombinedSubscriptionHandles } from '../client/MongoMirror'


export default class StoreLifecycle {

  @observable.ref _subscriptions
  disposers = []

  @computed get loading() {
    return this._subscriptions && this._subscriptions.loading
  }

  @computed get error() {
    return this._subscriptions && this._subscriptions.error
  }

  addSubscription(...handles) {
    if (this._subscriptions) {
      this._subscriptions.push(...handles)
    } else {
      this._subscriptions = new CombinedSubscriptionHandles(...handles)
    }
  }

  addDisposer(...disposers) {
    this.disposers.push(...disposers)
  }

  stop() {
    this._subscriptions && this._subscriptions.stop()
    this.disposers.forEach((d) => { d() })
    this.disposers = []
  }

}
