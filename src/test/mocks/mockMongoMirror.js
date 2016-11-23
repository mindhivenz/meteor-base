import { toJS } from 'mobx'
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
}

export class MockMongoMirror {

  awaitAdded = new AwaitDocs()
  awaitUpdated = new AwaitDocs()
  awaitRemoved = new AwaitDocs()

  cursorToDomain({
    observableArray,  // Should be declared as: array = asFlat([])
    observableMap,    // Should be declared as: map = asMap([], asReference)
    mongoCursor,
  }) {
    if (observableArray) {
      observableArray.replace(mongoCursor.fetch())
      mongoCursor.observe({
        _suppress_initial: true,  // _suppress_initial suppresses addedAt callback for docs initially fetched
        addedAt: (doc, index) => {
          observableArray.splice(index, 0, doc)
          this.awaitAdded.process(doc)
        },
        changedAt: (newDoc, oldDoc, index) => {
          observableArray[index] = newDoc
          this.awaitUpdated.process(newDoc)
        },
        removedAt: (oldDoc, index) => {
          observableArray.splice(index, 1)
          this.awaitRemoved.process(oldDoc)
        },
        movedTo: (doc, fromIndex, toIndex) => {
          observableArray.splice(fromIndex, 1)
          observableArray.splice(toIndex, 0, doc)
        },
      })
    }
    if (observableMap) {
      observableMap.clear()
      mongoCursor.fetch().forEach((doc) => {
        observableMap.set(doc._id, doc)
      })
      mongoCursor.observeChanges({  // More efficient than observe()
        _suppress_initial: true,  // suppresses addedAt callback for documents initially fetched
        added: (id, doc) => {
          observableMap.set(id, doc)
          this.awaitAdded.process(id)
        },
        removed: (id) => {
          observableMap.remove(id)
          this.awaitRemoved.process(id)
        },
        changed: (id, fields) => {
          const doc = toJS(observableMap.get(id) || {}, false)  // If was observable, toJS clones
          // Doesn't matter we may be overwriting existing object here, as we know it's not observable
          Object.entries(fields).forEach(([k, v]) => {
            if (v === undefined) {
              delete doc[k]
            } else {
              doc[k] = v
            }
          })
          observableMap.set(id, doc)
          this.awaitUpdated.process(id)
        },
      })
    }
  }

  subscriptionToDomain = sinon.spy()

  subscriptionToOffline = sinon.spy()

  subscriptionToDomainCachedOffline = ({
    publicationName,
    groundCollection,
    observableArray,
    observableMap,
  }) => {
    this.cursorToDomain({
      actionPrefix: `mirror:(offline)${publicationName}->domain`,
      observableArray,
      observableMap,
      mongoCursor: groundCollection.find(),
      endless: true,
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

}
