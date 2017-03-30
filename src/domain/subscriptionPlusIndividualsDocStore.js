import {
  observable,
  computed,
  action,
  runInAction,
  autorun,
} from 'mobx'
import selectedState from '../client/selectedState'
import { app } from '@mindhive/di'


export default class SubscriptionPlusIndividualsDocStore {

  // REVISIT: does it 'flicker' when resolving an issue and it needs to be reloaded individually?

  @observable.shallow docs = []
  @observable subscriptions = []
  @observable individualIds = []
  @observable loading = true

  constructor({
    baseSubscription,
    individualSubscription,
    individualSubscriptionIdToArgs = id => ({ id }),
    paramName = null,
  }) {
    const { mongoMirror } = app()
    this.paramName = paramName
    const baseSub = mongoMirror.subscriptionToObservable({
      ...baseSubscription,
      observableArray: this.docs,
    })
    this._addSubscription(baseSub)
    autorun('Check loading', () => {
      if (this.loading && ! baseSub.loading && ! this._anySubscriptionLoading) {
        runInAction('Initial load complete', () => {
          this.loading = false
        })
      }
    })
    autorun('Ensure all individual IDs present', () => {
      if (! baseSub.loading) {
        const ids = new Set(this.docs.map(d => d._id))
        this.individualIds
          .filter(id => ! ids.has(id))
          .forEach((id) => {
            this._addSubscription(mongoMirror.subscriptionToLocal({
              ...individualSubscription,
              subscriptionArgs: individualSubscriptionIdToArgs(id),
            }))
          })
      }
    })
  }

  @action _addSubscription(subscription) {
    this.subscriptions.push(subscription)
  }

  @computed get _anySubscriptionLoading() {
    return this.subscriptions.some(s => s.loading)
  }

  @computed get loadingAdditional() {
    return ! this.loading && this._anySubscriptionLoading
  }

  update({ params }) {
    if (params && this.paramName) {
      this.ensureSelectedId(params[this.paramName])
    }
  }

  ensureSelectedId(selectedId) {
    const selected = selectedState(selectedId)
    this.ensureId(selected.id)
  }

  ensureId(id) {
    if (id && ! this.individualIds.includes(id)) {
      runInAction('Add new individual id', () => { this.individualIds.push(id) })
    }
  }

  stop() {
    this.subscriptions.forEach(m => m.stop())
  }
}
