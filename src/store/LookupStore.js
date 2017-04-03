import { observable, computed } from 'mobx'
import { app } from '@mindhive/di'


class ExtendedLookupStore {

  constructor(store, ids) {
    this.store = store
    this.ids = ids
  }

  get loading() {
    return this.store.loading
  }

  get(idOrDoc) {
    return this.store.get(idOrDoc)
  }

  get length() {
    return this.store.length + this._missingIds.length
  }

  @computed get _missingIds() {
    return this.ids.filter(id => id && ! this.store.idMap.has(id))
  }

  @computed get _missing() {
    return this._missingIds.map(id => this.get(id))
  }

  @computed get all() {
    return this.store.all.concat(this._missing)
  }

  map(mapper) {
    return this.all.map(mapper)
  }

  filterKnown(predicate) {
    return this.store.filter(predicate).concat(this._missing)
  }
}

export default class LookupStore {

  @observable idMap = new Map()

  constructor(DocClass, mirrorSubscriptionOptions) {
    this.DocClass = DocClass
    this.subscription = app().mongoMirror.subscriptionToObservable({
      ...mirrorSubscriptionOptions,
      observableMap: this.idMap,
    })
  }

  get loading() {
    return this.subscription.loading
  }

  get(idOrDoc) {
    const id = (idOrDoc && (typeof idOrDoc === 'string' ? idOrDoc : idOrDoc._id)) || null
    return new this.DocClass(this, id)
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
    return new ExtendedLookupStore(this, ids)
  }

  stop = () => {
    this.subscription.stop()
  }
}

