import {
  toJS,
  observable as mobxObservable,
  isObservableArray,
  isObservableMap,
  asReference,
  ValueMode,
} from 'mobx'
import sinon from 'sinon'


const docId = (docOrId) =>
  typeof docOrId === 'string' ? docOrId : docOrId._id

class AwaitDocs {

  processedIds = []
  awaits = []

  process(docOrId) {
    const id = docId(docOrId)
    this.processedIds.push(id)
    this.awaits.forEach(a => {
      if (a.id === id) {
        a.resolve()
      }
    })
  }

  awaitAll(docsOrIds) {
    return Promise.all(docsOrIds
      .map(docId)
      .filter(id => ! this.processedIds.includes(id))
      .map(id =>
        new Promise((resolve) => {
          this.awaits.push({
            id,
            resolve,
          })
        })
      )
    )
  }

  reset() {
    this.processedIds = []
  }
}

export class MockMongoMirror {

  awaitAdded = new AwaitDocs()
  awaitUpdated = new AwaitDocs()
  awaitRemoved = new AwaitDocs()

  cursorToDomain({
    observable,
    mongoCursor,
  }) {
    if (isObservableArray(observable)) {
      if (observable.$mobx.mode !== ValueMode.Reference) {
        console.warn('observable array does not appear to be using asFlat')  // eslint-disable-line no-console
      }
      observable.replace(mongoCursor.fetch())
      mongoCursor.observe({
        _suppress_initial: true,  // _suppress_initial suppresses addedAt callback for docs initially fetched
        addedAt: (doc, index) => {
          observable.splice(index, 0, doc)
          this.awaitAdded.process(doc)
        },
        changedAt: (newDoc, oldDoc, index) => {
          observable[index] = newDoc
          this.awaitUpdated.process(newDoc)
        },
        removedAt: (oldDoc, index) => {
          observable.splice(index, 1)
          this.awaitRemoved.process(oldDoc)
        },
        movedTo: (doc, fromIndex, toIndex) => {
          observable.splice(fromIndex, 1)
          observable.splice(toIndex, 0, doc)
        },
      })
    } else if (isObservableMap(observable)) {
      if (observable._valueMode !== ValueMode.Reference) {
        console.warn('observable map does not appear to be using asReference')  // eslint-disable-line no-console
      }
      observable.clear()
      mongoCursor.fetch().forEach((doc) => {
        observable.set(doc._id, doc)
      })
      mongoCursor.observeChanges({  // More efficient than observe()
        _suppress_initial: true,  // suppresses addedAt callback for documents initially fetched
        added: (id, doc) => {
          observable.set(id, { _id: id, ...doc })
          this.awaitAdded.process(id)
        },
        removed: (id) => {
          observable.delete(id)
          this.awaitRemoved.process(id)
        },
        changed: (id, fields) => {
          const doc = toJS(observable.get(id) || {}, false)  // If was observable, toJS clones
          // Doesn't matter we may be overwriting existing object here, as we know it's not observable
          Object.entries(fields).forEach(([k, v]) => {
            if (v === undefined) {
              delete doc[k]
            } else {
              doc[k] = v
            }
          })
          observable.set(id, doc)
          this.awaitUpdated.process(id)
        },
      })
    } else {
      throw new Error('observable appears to be neither observable array or map')
    }
  }

  subscribe() {
    return mobxObservable({
      loading: true,
      stop: asReference(sinon.spy()),
    })
  }

  subscriptionToDomain = this.subscribe

  subscriptionToOffline = this.subscribe

  offlineToDomain({
    groundCollection,
    observable,
    context = 'context',
  }) {
    this.cursorToDomain({
      context,
      observable,
      mongoCursor: groundCollection.find(),
      endless: true,
    })
  }

  subscriptionToDomainCachedOffline({
    groundCollection,
    observable,
  }) {
    this.offlineToDomain({
      groundCollection,
      observable,
    })
  }

  added(...docsOrIds) {
    return this.awaitAdded.awaitAll(docsOrIds)
  }

  updated(...docsOrIds) {
    return this.awaitUpdated.awaitAll(docsOrIds)
  }

  removed(...docsOrIds) {
    return this.awaitRemoved.awaitAll(docsOrIds)
  }

  resetAwaitDocs() {
    [this.awaitAdded, this.awaitRemoved, this.awaitUpdated].forEach(a => {
      a.reset()
    })
  }

}
