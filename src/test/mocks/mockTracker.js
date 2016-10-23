import * as mobx from 'mobx'


const docId = (doc) =>
  typeof doc === 'string' ? doc : doc._id

const sameDoc = (d1, d2) =>
  docId(d1) === docId(d2)

export class MockTracker {

  addedDocs = []
  addAwaits = []

  autorun = mobx.autorun

  pumpMongoToMobx({
    observableArray,
    mongoCursor,
  }) {
    observableArray.replace(mongoCursor.fetch())
    mongoCursor.observe({
      // _suppress_initial suppresses addedAt callback for docs initially fetched
      _suppress_initial: true,
      addedAt: (doc, atIndex) => {
        observableArray.splice(atIndex, 0, doc)
        this.addedDocs.push(doc)
        this.addAwaits.forEach(a => {
          if (sameDoc(a.doc, doc)) {
            a.resolve()
          }
        })
      },
      changedAt: (newDoc, oldDoc, atIndex) => {
        observableArray.splice(atIndex, 1, newDoc)
      },
      removedAt: (oldDoc, atIndex) => {
        observableArray.splice(atIndex, 1)
      },
      movedTo: (doc, fromIndex, toIndex) => {
        observableArray.splice(fromIndex, 1)
        observableArray.splice(toIndex, 0, doc)
      },
    })
  }

  pumpAdded = (...findDocs) =>
    Promise.all(findDocs
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
