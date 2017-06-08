import { computed } from 'mobx'


export default class LookupDoc {

  constructor(store, id) {
    this._store = store
    this._id = id
  }

  @computed get _doc() {  // Dereference the observable as late as possible
    return this._id && this._store.idMap.get(this._id)
  }

  @computed get exists() {
    return Boolean(this._doc)
  }

  @computed get substituteLabel() {
    return this._store.loading ? '…' : `[${typeof this._id === 'string' ? this._id.substr(-5) : '?'}]`
  }
}
