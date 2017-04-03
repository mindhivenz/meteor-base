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
    const initialLoadingDisposer = this.addDisposer(
      autorunAsync('Check initialLoading', () => {
        if (this.initialLoading && ! this.loading) {
          runInAction('Initial load complete', () => {
            this.initialLoading = false
            this.disposeEarly(initialLoadingDisposer)
          })
        }
      })
    )
  }

  _loading() {
    return this._dependents.some(h => h.loading)
  }

  @computed get loading() {
    // @computed properties cannot be overwritten, therefore defer to a method that can
    return this._loading()
  }

  @computed get error() {
    const errorDependent = this._dependents.find(h => h.error)
    return errorDependent && errorDependent.error
  }

  // Anything following the 'store protocol' (e.g. stores, SubscriptionHandles)
  addDependent(...dependents) {
    this._dependents.push(...dependents)
    if (dependents.length === 1) {
      return dependents[0]
    }
    return undefined
  }

  // Suitable for mobx disposers
  addDisposer(...disposers) {
    this._disposers.push(...disposers)
    if (disposers.length === 1) {
      return disposers[0]
    }
    return undefined
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
