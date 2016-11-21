import { toJS } from 'mobx'
import sinon from 'sinon'


const docId = (doc) =>
  typeof doc === 'string' ? doc : doc._id

const sameDoc = (d1, d2) =>
  docId(d1) === docId(d2)

export class MockMongoMirror {

  addedDocs = []
  addAwaits = []

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
          this.addedDocs.push(doc)
          this.addAwaits.forEach(a => {
            if (sameDoc(a.doc, doc)) {
              a.resolve()
            }
          })
        },
        changedAt: (newDoc, oldDoc, index) => {
          observableArray[index] = newDoc
        },
        removedAt: (oldDoc, index) => {
          observableArray.splice(index, 1)
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
        },
        removed: (id) => {
          observableMap.remove(id)
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
        },
      })
    }
  }

  subscriptionToDomain = sinon.spy()

  subscriptionToOffline = sinon.spy()

  added(...findDocs) {
    return Promise.all(findDocs
      .filter(findDoc => ! this.addedDocs.find(d => sameDoc(d, findDoc)))
      .map(findDoc =>
        new Promise(resolve => {
          this.addAwaits.push({
            doc: findDoc,
            resolve,
          })
        })
      )
    )
  }

}
