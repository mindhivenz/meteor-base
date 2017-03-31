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

  @observable docs = []
  @observable subscriptions = []
  @observable individualIds = []
  @observable loading = true
  @observable.ref selected = selectedState(null)

  constructor({
    baseSubscription,
    individualSubscription,
    individualSubscriptionIdToArgs = id => ({ id }),
    selectedParamName = null,
  }) {
    const { mongoMirror } = app()
    this.selectedParamName = selectedParamName
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

  @computed get selectedDoc() {
    return this.selected && this.selected.id && this.docs.find(d => d._id === this.selected.id)
  }

  @action setSelected(selectedId) {
    this.selected = selectedState(selectedId)
    this.ensureId(this.selected.id)
  }

  ensureId(id) {
    if (id && ! this.individualIds.includes(id)) {
      runInAction('Add new individual id', () => { this.individualIds.push(id) })
    }
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
    if (params && this.selectedParamName) {
      this.setSelected(params[this.selectedParamName])
    }
  }

  stop() {
    this.subscriptions.forEach(m => m.stop())
  }
}
