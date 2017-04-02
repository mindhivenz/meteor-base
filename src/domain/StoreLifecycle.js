import {
  observable,
  computed,
  autorunAsync,
  runInAction,
} from 'mobx'
import pull from 'lodash/pull'


export default class StoreLifecycle {

  @observable initialLoading = true

  @observable _dependents
  _disposers = []

  constructor(dependents = []) {
    this._dependents = [...dependents]
    // Async so if subclass calls addDependent in it's constructor or reacts to initial dependents loading
    // by adding more, we stay initialLoading for those too
    const initialLoadingDisposer = autorunAsync('Check initialLoading', () => {
      if (this.initialLoading && ! this.loading) {
        runInAction('Initial load complete', () => {
          this.initialLoading = false
          this.disposeEarly(initialLoadingDisposer)
        })
      }
    })
    this._disposers.push(initialLoadingDisposer)
  }

  @computed get loading() {
    return this._dependents.some(h => h.loading)
  }

  @computed get error() {
    const errorDependent = this._dependents.find(h => h.error)
    return errorDependent && errorDependent.error
  }

  // Anything following the 'store protocol' (e.g. stores, SubscriptionHandles)
  addDependent(...dependents) {
    this._dependents.push(...dependents)
  }

  // Suitable for mobx disposers
  addDisposer(...disposers) {
    this._disposers.push(...disposers)
  }

  disposeEarly(disposer) {
    disposer()
    pull(this._disposers, disposer)
  }

  update(props) {
    this._dependents.forEach((d) => {
      d.update && d.update(props)
    })
  }

  stop() {
    this._dependents.forEach((d) => {
      d.stop && d.stop()
    })
    this._disposers.forEach((d) => {
      d()
    })
    this._disposers = []
  }

}
