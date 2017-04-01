import { observable } from 'mobx'
import sinon from 'sinon'
import { checkFindOptions } from '../../client/MongoMirror'


const docId = docOrId =>
  typeof docOrId === 'string' ? docOrId : docOrId._id

class AwaitDocs {

  processedIds = new Set()
  awaits = []

  process(docOrId) {
    const id = docId(docOrId)
    this.processedIds.add(id)
    this.awaits.forEach((a) => {
      if (a.id === id) {
        a.resolve()
      }
    })
  }

  awaitAll(docsOrIds) {
    return Promise.all(docsOrIds
      .map(docId)
      .filter(id => ! this.processedIds.has(id))
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
    this.processedIds.clear()
  }
}

export default class MockMongoMirror {

  awaitAdded = new AwaitDocs()
  awaitUpdated = new AwaitDocs()
  awaitRemoved = new AwaitDocs()

  cursorToObservable({
    observableArray,
    observableMap,
    mongoCursor,
  }) {
    const initialFetch = mongoCursor.fetch()
    if (observableArray) {
      observableArray.replace(initialFetch)
    }
    if (observableMap) {
      observableMap.clear()
      initialFetch.forEach((doc) => {
        observableMap.set(doc._id, doc)
      })
    }
    if (observableArray) {
      mongoCursor.observe({
        _suppress_initial: true,  // suppresses added(At) for documents initially fetched above
        addedAt: (doc, index) => {
          observableArray.splice(index, 0, doc)
          if (observableMap) {
            observableMap.set(doc._id, doc)
          }
          this.awaitAdded.process(doc)
        },
        changedAt: (newDoc, oldDoc, index) => {
          observableArray[index] = newDoc
          if (observableMap) {
            observableMap.set(newDoc._id, newDoc)
          }
          this.awaitUpdated.process(newDoc)
        },
        removedAt: (oldDoc, index) => {
          observableArray.splice(index, 1)
          if (observableMap) {
            observableMap.delete(oldDoc._id)
          }
          this.awaitRemoved.process(oldDoc)
        },
        movedTo: (doc, fromIndex, toIndex) => {
          observableArray.splice(fromIndex, 1)
          observableArray.splice(toIndex, 0, doc)
        },
      })
    } else if (observableMap) {
      mongoCursor.observe({
        _suppress_initial: true,  // suppresses added(At) for documents initially fetched above
        added: (doc) => {
          observableMap.set(doc._id, doc)
          this.awaitAdded.process(doc._id)
        },
        changed: (doc) => {
          observableMap.set(doc._id, doc)
          this.awaitUpdated.process(doc._id)
        },
        removed: (oldDoc) => {
          observableMap.delete(oldDoc._id)
          this.awaitRemoved.process(oldDoc._id)
        },
      })
    }
  }

  subscribe() {
    return observable({
      loading: true,
      stop: sinon.spy(),
    })
  }

  subscriptionToObservable(options) {
    checkFindOptions(options)
    this.subscribe()
  }

  subscriptionToOffline() {
    this.subscribe()
  }

  offlineToObservable({
    groundCollection,
    observableArray,
    observableMap,
    context = 'context',
  }) {
    this.cursorToObservable({
      context,
      observableArray,
      observableMap,
      mongoCursor: groundCollection.find(),
      endless: true,
    })
  }

  subscriptionToObservableCachedOffline({
    groundCollection,
    viewOptions,
    observableArray,
    observableMap,
  }) {
    checkFindOptions({ viewOptions, observableArray })
    this.offlineToObservable({
      groundCollection,
      observableArray,
      observableMap,
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
    [this.awaitAdded, this.awaitRemoved, this.awaitUpdated].forEach((a) => {
      a.reset()
    })
  }

}
