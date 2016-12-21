import { observable, asMap, asReference, computed } from 'mobx'
import { app } from '@mindhive/di'


export class LookupDoc {

  constructor(domain, id) {
    this._domain = domain
    this._id = id
  }

  @computed get _doc() {  // Dereference the observable as late as possible
    return this._id && this._domain.idMap.get(this._id)
  }

  @computed get substituteLabel() {
    return this._domain.loading ? '…' : `[${typeof this._id === 'string' ? this._id.substr(-5) : '?'}]`
  }
}

class ExtendedLookupDomain {

  constructor(domain, ids) {
    this.domain = domain
    this.ids = ids
  }

  get loading() {
    return this.domain.loading
  }

  get(idOrDoc) {
    return this.domain.get(idOrDoc)
  }

  get length() {
    return this.domain.length + this._missingIds.length
  }

  @computed get _missingIds() {
    return this.ids.filter(id => id && ! this.domain.idMap.has(id))
  }

  @computed get _missing() {
    return this._missingIds.map(id => this.get(id))
  }

  @computed get all() {
    return this.domain.all.concat(this._missing)
  }

  map(mapper) {
    return this.all.map(mapper)
  }

  filterKnown(predicate) {
    return this.domain.filter(predicate).concat(this._missing)
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

  get(idOrDoc) {
    const id = (idOrDoc && (typeof idOrDoc === 'string' ? idOrDoc : idOrDoc._id)) || null
    return new this.LookupClass(this, id)
  }

  get length() {
    return this.idMap.size
  }

  @computed get all() {
    return this.idMap.keys().map(id => this.get(id))
  }

  map(mapper) {
    return this.all.map(mapper)
  }

  filter(predicate) {
    return this.all.filter(predicate)
  }

  ensureContains(...ids) {
    return new ExtendedLookupDomain(this, ids)
  }

  stop = () => {
    this.subscription.stop()
  }
}

