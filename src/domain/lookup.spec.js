import some from '@mindhive/some'
import { initModules, mockAppContext } from '@mindhive/di'

import { sinon } from '../mocha'

import { LookupDomain, LookupDoc } from './lookup'


describe('LookupDomain', () => {

  let mongoMirror
  let subscription

  const modules = () => {
    subscription = {
      loading: some.bool(),
      stop: sinon.spy(),
    }
    mongoMirror = {
      subscriptionToDomain: sinon.spy(() => subscription),
    }
    initModules([
      () => ({
        mongoMirror,
      }),
    ])
  }

  const givenSubscriptionAdded = (doc = { _id: some.string() }) => {
    mongoMirror.subscriptionToDomain.firstCall.args[0].observableMap.set(doc._id, doc)
    return doc
  }

  const givenLookupDomain = () => new LookupDomain(LookupDoc, some.object())

  describe('constructor', () => {

    it('should call subscriptionToDomain correctly',
      mockAppContext(modules, async () => {
        const subscriptionOptions = some.object()
        const domain = new LookupDomain(LookupDoc, subscriptionOptions)
        const expectedDoc = givenSubscriptionAdded()

        mongoMirror.subscriptionToDomain.firstCall.args[0].should.have.properties(subscriptionOptions)
        domain.idMap.entries().should.deep.equal([[expectedDoc._id, expectedDoc]])
      })
    )

  })

  describe('loading', () => {

    it('should return same from subscription',
      mockAppContext(modules, async () => {
        const domain = givenLookupDomain()

        domain.loading.should.equal(subscription.loading)
      })
    )

  })

  describe('get', () => {

    it('should return LookupClass instance by doc',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const domain = new LookupDomain(SomeLookup, some.object())
        const doc = givenSubscriptionAdded()
        const actualLookup = domain.get(doc)

        actualLookup.should.have.properties({
          id: doc._id,
        })
        actualLookup.should.be.an.instanceof(SomeLookup)
      })
    )

    it('should return LookupClass instance by id',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const domain = new LookupDomain(SomeLookup, some.object())
        const doc = givenSubscriptionAdded()
        const actualLookup = domain.get(doc._id)

        actualLookup.should.have.properties({
          id: doc._id,
        })
        actualLookup.should.be.an.instanceof(SomeLookup)
      })
    )

    it('should return LookupClass even when id not found in list',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const domain = new LookupDomain(SomeLookup, some.object())
        const id = some.string()
        const actualLookup = domain.get(id)

        actualLookup.should.have.properties({
          id,
        })
        actualLookup.should.be.an.instanceof(SomeLookup)
      })
    )

    it('should return LookupClass even for missing id',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const domain = new LookupDomain(SomeLookup, some.object())
        const actualLookup = domain.get(some.nullOrUndefined())

        actualLookup.should.have.properties({
          id: null,
        })
        actualLookup.should.be.an.instanceof(SomeLookup)
      })
    )

  })

  describe('length', () => {

    it('should return count added',
      mockAppContext(modules, async () => {
        const domain = givenLookupDomain()
        const docs = some.arrayOf(givenSubscriptionAdded)

        domain.length.should.equal(docs.length)
      })
    )

  })

  describe('all', () => {

    it('should return all added as LookupClass instance',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const domain = new LookupDomain(SomeLookup, some.object())
        const docs = some.arrayOf(givenSubscriptionAdded)

        domain.all.should.have.properties(docs.map(d => ({ id: d._id })))
        domain.all.every(d => d.should.be.an.instanceOf(SomeLookup))
      })
    )

  })

  describe('map', () => {

    it('should call mapper func with each LookupClass instance',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const domain = new LookupDomain(SomeLookup, some.object())
        const docs = some.arrayOf(givenSubscriptionAdded, 2)
        const mapper = sinon.spy()
        domain.map(mapper)

        mapper.should.have.been.calledTwice
        mapper.firstCall.args[0].id.should.equal(docs[0]._id)
        mapper.firstCall.args[0].should.be.an.instanceOf(SomeLookup)
        mapper.secondCall.args[0].id.should.equal(docs[1]._id)
        mapper.secondCall.args[0].should.be.an.instanceOf(SomeLookup)
      })
    )

  })

  describe('filter', () => {

    it('should call predicate func with each LookupClass instance',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const domain = new LookupDomain(SomeLookup, some.object())
        const docs = some.arrayOf(givenSubscriptionAdded, 2)
        const predicate = sinon.spy(() => true)
        const actual = domain.filter(predicate)

        actual.should.have.lengthOf(2)
        predicate.should.have.been.calledTwice
        predicate.firstCall.args[0].id.should.equal(docs[0]._id)
        predicate.firstCall.args[0].should.be.an.instanceOf(SomeLookup)
        predicate.secondCall.args[0].id.should.equal(docs[1]._id)
        predicate.secondCall.args[0].should.be.an.instanceOf(SomeLookup)
      })
    )

  })

  describe('stop', () => {

    it('should call subscription stop',
      mockAppContext(modules, async () => {
        const domain = givenLookupDomain()
        domain.stop()

        subscription.stop.should.have.been.called
      })
    )

  })

  describe('_fallbackValue', () => {

    it('should return last 5 chars of ID in brackets',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const domain = new LookupDomain(SomeLookup, some.object())
        const id = '1a2b3c4d'
        const actualLookup = domain.get(id)

        actualLookup._fallbackValue.should.equal('[b3c4d]')
      })
    )

    it('should return [?] for missing id',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const domain = new LookupDomain(SomeLookup, some.object())
        const actualLookup = domain.get(some.nullOrUndefined())

        actualLookup._fallbackValue.should.equal('[?]')
      })
    )

  })

  describe('ensureContains', () => {

    it('should duck-type LookupDomain with extra value when not in domain list',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const domain = new LookupDomain(SomeLookup, some.object())
        const existingDoc = givenSubscriptionAdded()
        const expectedId = some.string()
        const actual = domain.ensureContains(expectedId)

        actual.loading.should.equal(subscription.loading)
        actual.get(existingDoc).should.have.properties({ id: existingDoc._id })
        actual.get(existingDoc).should.be.an.instanceOf(SomeLookup)
        actual.get(expectedId).should.have.properties({ id: expectedId })
        actual.get(expectedId).should.be.an.instanceOf(SomeLookup)
        actual.length.should.equal(2)
        actual.all.should.have.properties([
          { id: existingDoc._id },
          { id: expectedId },
        ])
      })
    )

    it('should not add to list if id is in domain list',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const domain = new LookupDomain(SomeLookup, some.object())
        const existingDoc = givenSubscriptionAdded()
        const actual = domain.ensureContains(existingDoc._id)

        actual.loading.should.equal(subscription.loading)
        actual.get(existingDoc).should.have.properties({ id: existingDoc._id })
        actual.get(existingDoc).should.be.an.instanceOf(SomeLookup)
        actual.length.should.equal(1)
        actual.all.should.have.properties([
          { id: existingDoc._id },
        ])
      })
    )

    it('should handle multiple ids',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const domain = new LookupDomain(SomeLookup, some.object())
        const existingDoc = givenSubscriptionAdded()
        const expectedId1 = some.string()
        const expectedId2 = some.string()
        const actual = domain.ensureContains(expectedId1, expectedId2)

        actual.loading.should.equal(subscription.loading)
        actual.all.should.have.properties([
          { id: existingDoc._id },
          { id: expectedId1 },
          { id: expectedId2 },
        ])
      })
    )

    it('should ignore null/undefined ids',
      mockAppContext(modules, async () => {
        class SomeLookup extends LookupDoc {}
        const domain = new LookupDomain(SomeLookup, some.object())
        const existingDoc = givenSubscriptionAdded()
        const expectedId = some.string()
        const actual = domain.ensureContains(some.nullOrUndefined(), expectedId)

        actual.loading.should.equal(subscription.loading)
        actual.all.should.have.properties([
          { id: existingDoc._id },
          { id: expectedId },
        ])
      })
    )

    describe('filterKnown', () => {

      it('should call predicate func with each lookup from domain, not missing',
        mockAppContext(modules, async () => {
          class SomeLookup extends LookupDoc {}
          const domain = new LookupDomain(SomeLookup, some.object())
          const existingDoc = givenSubscriptionAdded()
          const missingId = some.string()
          const predicate = sinon.spy(() => true)
          const actual = domain.ensureContains(missingId).filterKnown(predicate)

          actual.should.have.lengthOf(2)
          predicate.should.have.been.calledOnce
          predicate.firstCall.args[0].id.should.equal(existingDoc._id)
          predicate.firstCall.args[0].should.be.an.instanceOf(SomeLookup)
        })
      )

    })

  })

})
