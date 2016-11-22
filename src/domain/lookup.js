import { observable, asMap, asReference, computed } from 'mobx'
import { app } from '@mindhive/di'


export class Lookup {

  constructor(domain, id) {
    this._domain = domain
    this.id = id
  }

  @computed get _doc() {  // Dereference the observable as late as possible
    return this.id && this._domain.idMap.get(this.id)
  }
}

export class LookupDomain {

  @observable idMap = asMap([], asReference)

  constructor(LookupClass, mirrorSubscriptionOptions) {
    this.LookupClass = LookupClass
    this.subscription = app().mongoMirror.subscriptionToDomain({
      ...mirrorSubscriptionOptions,
      observableMap: this.idMap,
    })
  }

  get loading() {
    return this.subscription.loading
  }

  get = idOrDoc => new this.LookupClass(this, typeof idOrDoc === 'string' ? idOrDoc : idOrDoc._id)

  map = (...args) => this.idMap.values().map(...args)

  filter = (...args) => this.idMap.values().filter(...args)

  get size() {
    return this.idMap.size
  }

  stop = () => {
    this.subscription.stop()
  }
}
