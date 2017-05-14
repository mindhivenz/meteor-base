import {
  observable,
  computed,
  action,
  runInAction,
  autorun,
} from 'mobx'
import difference from 'lodash/difference'
import StoreLifecycle from '@mindhive/mobx/StoreLifecycle'

import selectedState from '../client/selectedState'
import { app } from '@mindhive/di'


export default class SubscriptionDocStore extends StoreLifecycle {

  // REVISIT: does it 'flicker' when an individualId is removed from base and has to be re-added?

  @observable docs = []
  @observable individualIds = []
  @observable.ref selected = selectedState(null)

  constructor({
    baseSubscription,
    individualSubscription,
    individualSubscriptionIdToArgs = id => ({ id }),
    selectedParamName = null,
  }) {
    super()
    const { mongoMirror } = app()
    this.selectedParamName = selectedParamName
    const baseSub = this.addDependent(
      mongoMirror.subscriptionToObservable({
        ...baseSubscription,
        observableArray: this.docs,
      })
    )
    this.addDisposer(
      autorun('Ensure all individual IDs present', () => {
        if (! baseSub.loading) {
          const missingIds = difference(this.individualIds, this.docs.map(d => d._id))
          missingIds.forEach((id) => {
            this.addDependent(
              mongoMirror.subscriptionToLocal({
                ...individualSubscription,
                subscriptionArgs: individualSubscriptionIdToArgs(id),
              })
            )
          })
        }
      }),
    )
  }

  _loading() {
    return this.initialLoading
  }

  @computed get selectedId() {
    return this.selected && this.selected.id
  }

  findById(id) {
    return id && this.docs.find(d => d._id === id)
  }

  @computed get selectedDoc() {
    return this.findById(this.selectedId)
  }

  update({ params }) {
    if (params && this.selectedParamName) {
      this.setSelected(params[this.selectedParamName])
    }
  }

  @action setSelected(selectedId) {
    this.selected = selectedState(selectedId)
    this.ensureId(this.selected.id)
  }

  ensureId(id) {
    if (id && ! this.individualIds.includes(id)) {
      runInAction('Add new individual id', () => {
        this.individualIds.push(id)
      })
    }
  }
}
