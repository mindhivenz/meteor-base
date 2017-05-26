import some from '@mindhive/some'
import { initModules, mockAppContext } from '@mindhive/di'

import { sinon } from '../mocha'

import LookupStore from './LookupStore'
import LookupDoc from './LookupDoc'
import TestMongo from '../test/mocks/TestMongo'


describe('LookupStore', () => {

  let mongoMirror
  let subscription

  beforeEach(() => {
    subscription = {
      loading: false,
      stop: sinon.spy(),
    }
    mongoMirror = {
      subscriptionToObservable: sinon.spy(() => subscription),
    }
  })

  const modules = () => {
    initModules([
      () => ({
        Mongo: TestMongo,
        mongoMirror,
      }),
    ])
  }

  const givenSubscriptionAdded = (doc = { _id: some.string() }) => {
    mongoMirror.subscriptionToObservable.firstCall.args[0].observableMap.set(doc._id, doc)
    return doc
  }

  const givenLookupStore = () => new LookupStore(LookupDoc, some.object())

  describe('constructor', () => {

    it('should call subscriptionToObservable correctly',
      mockAppContext(modules, async () => {
        const subscriptionOptions = some.object()
        const store = new LookupStore(LookupDoc, subscriptionOptions)
        const expectedDoc = givenSubscriptionAdded()

        mongoMirror.subscriptionToObservable.firstCall.args[0].should.have.properties(subscriptionOptions)
        store.idMap.entries().should.deep.equal([[expectedDoc._id, expectedDoc]])
      })
    )

  })

  describe('loading', () => {

    it('should return same from subscription',
      mockAppContext(modules, async () => {
        const expected = some.bool()
        subscription.loading = expected
        const store = givenLookupStore()

        store.loading.should.equal(expected)
      })
    )

  })

  describe('get', () => {

    it('should return LookupClass instance by doc',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const store = new LookupStore(SomeLookup, some.object())
        const doc = givenSubscriptionAdded()
        const actualLookup = store.get(doc)

        actualLookup.should.have.properties({
          _id: doc._id,
        })
        actualLookup.should.be.an.instanceof(SomeLookup)
      })
    )

    it('should return LookupClass instance by id',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const store = new LookupStore(SomeLookup, some.object())
        const doc = givenSubscriptionAdded()
        const actualLookup = store.get(doc._id)

        actualLookup.should.have.properties({
          _id: doc._id,
        })
        actualLookup.should.be.an.instanceof(SomeLookup)
      })
    )

    it('should return LookupClass even when id not found in list',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const store = new LookupStore(SomeLookup, some.object())
        const id = some.string()
        const actualLookup = store.get(id)

        actualLookup.should.have.properties({
          _id: id,
        })
        actualLookup.should.be.an.instanceof(SomeLookup)
      })
    )

    it('should return LookupClass even for missing id',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const store = new LookupStore(SomeLookup, some.object())
        const actualLookup = store.get(some.nullOrUndefined())

        actualLookup.should.have.properties({
          _id: null,
        })
        actualLookup.should.be.an.instanceof(SomeLookup)
      })
    )

  })

  describe('length', () => {

    it('should return count added',
      mockAppContext(modules, async () => {
        const store = givenLookupStore()
        const docs = some.arrayOf(givenSubscriptionAdded)

        store.length.should.equal(docs.length)
      })
    )

  })

  describe('all', () => {

    it('should return all added as LookupClass instance',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const store = new LookupStore(SomeLookup, some.object())
        const docs = some.arrayOf(givenSubscriptionAdded)

        store.all.should.have.properties(docs.map(d => ({ _id: d._id })))
        store.all.every(d => d.should.be.an.instanceOf(SomeLookup))
      })
    )

  })

  describe('map', () => {

    it('should call mapper func with each LookupClass instance',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const store = new LookupStore(SomeLookup, some.object())
        const docs = some.arrayOf(givenSubscriptionAdded, 2)
        const mapper = sinon.spy()
        store.map(mapper)

        mapper.should.have.been.calledTwice
        mapper.firstCall.args[0]._id.should.equal(docs[0]._id)
        mapper.firstCall.args[0].should.be.an.instanceOf(SomeLookup)
        mapper.secondCall.args[0]._id.should.equal(docs[1]._id)
        mapper.secondCall.args[0].should.be.an.instanceOf(SomeLookup)
      })
    )

  })

  describe('filter', () => {

    it('should call predicate func with each LookupClass instance',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const store = new LookupStore(SomeLookup, some.object())
        const docs = some.arrayOf(givenSubscriptionAdded, 2)
        const predicate = sinon.spy(() => true)
        const actual = store.filter(predicate)

        actual.should.have.lengthOf(2)
        predicate.should.have.been.calledTwice
        predicate.firstCall.args[0]._id.should.equal(docs[0]._id)
        predicate.firstCall.args[0].should.be.an.instanceOf(SomeLookup)
        predicate.secondCall.args[0]._id.should.equal(docs[1]._id)
        predicate.secondCall.args[0].should.be.an.instanceOf(SomeLookup)
      })
    )

  })

  describe('stop', () => {

    it('should call subscription stop',
      mockAppContext(modules, async () => {
        const store = givenLookupStore()
        store.stop()

        subscription.stop.should.have.been.called
      })
    )

  })

  describe('substituteLabel', () => {

    it('should return last 5 chars of ID in brackets',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const store = new LookupStore(SomeLookup, some.object())
        const id = '1a2b3c4d'
        const actualLookup = store.get(id)

        actualLookup.substituteLabel.should.equal('[b3c4d]')
      })
    )

    it('should return [?] for missing id',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const store = new LookupStore(SomeLookup, some.object())
        const actualLookup = store.get(some.nullOrUndefined())

        actualLookup.substituteLabel.should.equal('[?]')
      })
    )

    it('should return ellipsis when store loading',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        subscription.loading = true
        const store = new LookupStore(SomeLookup, some.object())
        const actualLookup = store.get(some.string())

        actualLookup.substituteLabel.should.equal('…')
      })
    )

  })

  describe('ensureContains', () => {

    beforeEach(() => {
      subscription.loading = some.bool()
    })

    it('should duck-type LookupStore with extra value when not in store list',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const store = new LookupStore(SomeLookup, some.object())
        const existingDoc = givenSubscriptionAdded()
        const expectedId = some.string()
        const actual = store.ensureContains(expectedId)

        actual.loading.should.equal(subscription.loading)
        actual.get(existingDoc).should.have.properties({ _id: existingDoc._id })
        actual.get(existingDoc).should.be.an.instanceOf(SomeLookup)
        actual.get(expectedId).should.have.properties({ _id: expectedId })
        actual.get(expectedId).should.be.an.instanceOf(SomeLookup)
        actual.length.should.equal(2)
        actual.all.should.have.properties([
          { _id: existingDoc._id },
          { _id: expectedId },
        ])
      })
    )

    it('should not add to list if id is in store list',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const store = new LookupStore(SomeLookup, some.object())
        const existingDoc = givenSubscriptionAdded()
        const actual = store.ensureContains(existingDoc._id)

        actual.loading.should.equal(subscription.loading)
        actual.get(existingDoc).should.have.properties({ _id: existingDoc._id })
        actual.get(existingDoc).should.be.an.instanceOf(SomeLookup)
        actual.length.should.equal(1)
        actual.all.should.have.properties([
          { _id: existingDoc._id },
        ])
      })
    )

    it('should handle multiple ids',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const store = new LookupStore(SomeLookup, some.object())
        const existingDoc = givenSubscriptionAdded()
        const expectedId1 = some.string()
        const expectedId2 = some.string()
        const actual = store.ensureContains(expectedId1, expectedId2)

        actual.all.should.have.properties([
          { _id: existingDoc._id },
          { _id: expectedId1 },
          { _id: expectedId2 },
        ])
      })
    )

    it('should ignore null/undefined ids',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const store = new LookupStore(SomeLookup, some.object())
        const existingDoc = givenSubscriptionAdded()
        const expectedId = some.string()
        const actual = store.ensureContains(some.nullOrUndefined(), expectedId)

        actual.all.should.have.properties([
          { _id: existingDoc._id },
          { _id: expectedId },
        ])
      })
    )

    describe('filterKnown', () => {

      it('should call predicate func with each lookup from store, not missing',
        mockAppContext(modules, async () => {
          class SomeLookup extends LookupDoc {}
          const store = new LookupStore(SomeLookup, some.object())
          const existingDoc = givenSubscriptionAdded()
          const missingId = some.string()
          const predicate = sinon.spy(() => true)
          const actual = store.ensureContains(missingId).filterKnown(predicate)

          actual.should.have.lengthOf(2)
          predicate.should.have.been.calledOnce
          predicate.firstCall.args[0]._id.should.equal(existingDoc._id)
          predicate.firstCall.args[0].should.be.an.instanceOf(SomeLookup)
        })
      )

    })

  })

})
