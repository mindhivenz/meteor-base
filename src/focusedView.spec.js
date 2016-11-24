import some from '@mindhive/some'

import { should, sinon } from './mocha'

import { FocusedView } from './focusedView'


describe('focusedView', () => {

  let collectionName
  let Collection
  let viewSelector
  let findSelector
  let updateSelector
  let selector
  let options
  let modifier
  let expectedId
  let expectedDoc
  let viewer
  let apiContext
  let focusedViewer

  const someSelector = () =>
    some.bool() ? some.string() : some.object()

  beforeEach(() => {
    collectionName = some.string()
    Collection = {
      _name: collectionName,
      find: sinon.stub(),
      findOne: sinon.stub(),
      insert: sinon.stub(),
      update: sinon.stub(),
      remove: sinon.stub(),
    }
    selector = someSelector()
    viewSelector = someSelector()
    expectedId = some.string()
    expectedDoc = {
      ...some.object(),
      _id: expectedId,
    }
    options = some.object()
    modifier = some.object()
    viewer = some.object()
    apiContext = {
      viewer: () => viewer,
      accessDenied: sinon.spy(r => { throw new Error(r) }),
    }
  })

  const givenFocusedViewer = (viewSpec) => {
    focusedViewer = new FocusedView(Collection, viewSpec)
  }

  const givenFindSelector = () => {
    findSelector = sinon.spy(() => viewSelector)
    givenFocusedViewer({
      findSelector,
    })
  }

  const givenUpdateSelector = () => {
    updateSelector = sinon.spy(() => viewSelector)
    givenFocusedViewer({
      updateSelector,
    })
  }

  const builtSelector = (operation) =>
    focusedViewer.selector(apiContext, selector, operation)

  describe('constructor', () => {

    it('should have _name so it can be treated like a collection in audit.log', () => {
      const focusedView = new FocusedView(Collection, {})
      focusedView._name.should.equal(collectionName)
    })

    it('should throw if unknown properties in viewSpec', () => {
      should.throw(() => {
        new FocusedView(Collection, {    // eslint-disable-line no-new
          [some.string()]: () => {
          },
        })
      })
    })

  })

  describe('selector', () => {

    it('should return passed selector unaltered if no view selector', () => {
      givenFocusedViewer({})
      const actual = focusedViewer.selector(apiContext, selector)
      actual.should.deep.equal(selector)
    })

    it('should return passed selector unaltered if view returns null or undefined', () => {
      givenFocusedViewer({
        findSelector: () => some.nullOrUndefined(),
      })
      const actual = focusedViewer.selector(apiContext, selector)
      actual.should.deep.equal(selector)
    })

    it('should return view selector and passed selector merged', () => {
      selector = some.object()
      viewSelector = some.object()
      givenFindSelector()
      const actual = focusedViewer.selector(apiContext, selector)
      actual.should.deep.equal({
        ...selector,
        ...viewSelector,
      })
      findSelector.should.have.been.calledWith(viewer)
    })

    it('should choose view selector over passed selector', () => {
      selector = { _id: some.string() }
      viewSelector = { _id: some.string() }
      givenFindSelector()
      const actual = focusedViewer.selector(apiContext, selector)
      actual.should.deep.equal(viewSelector)
    })

    it('should convert passed selector from string into _id selector', () => {
      selector = some.string()
      viewSelector = some.object()
      givenFocusedViewer({
        findSelector: () => viewSelector,
      })
      const actual = focusedViewer.selector(apiContext, selector)
      actual.should.deep.equal({
        _id: selector,
        ...viewSelector,
      })
    })

    it('should throw when selector does not exist to avoid subtle bugs (calc result is undefined for example)', () => {
      givenFocusedViewer({})
      should.throw(() => {
        focusedViewer.selector(apiContext, some.nonExistentReference())
      }, /use \{} for all/)
    })

  })

  describe('find', () => {

    it('should call find with built selector', () => {
      givenFindSelector()
      Collection.find.returns(expectedDoc)
      const actual = focusedViewer.find(apiContext, selector, options)
      actual.should.equal(expectedDoc)
      Collection.find.should.have.been.calledWith(builtSelector('find'), options)
    })

    it('should throw if firewall does', () => {
      const reason = some.string()
      givenFocusedViewer({
        firewall(ac) { ac.accessDenied(reason) },
      })
      should.throw(() => {
        focusedViewer.find(apiContext, selector, options)
      }, reason)
    })

  })

  describe('loadOne', () => {

    it('should call findOne with built selector', () => {
      givenFindSelector()
      Collection.findOne.returns(expectedDoc)
      const actual = focusedViewer.loadOne(apiContext, selector, options)
      actual.should.equal(expectedDoc)
      Collection.findOne.should.have.been.calledWith(builtSelector('loadOne'), options)
    })

    it('should throw if firewall does', () => {
      const reason = some.string()
      givenFocusedViewer({
        firewall(ac) { ac.accessDenied(reason) },
      })
      should.throw(() => {
        focusedViewer.loadOne(apiContext, selector, options)
      }, reason)
    })

    it('should accessDenied if no matching doc', () => {
      givenFindSelector()
      Collection.findOne.returns(null)
      should.throw(() => {
        focusedViewer.loadOne(apiContext, selector, options)
      })
      apiContext.accessDenied.should.have.been.calledWith(
        'loadOne found nothing',
        {
          collection: Collection,
          data: {
            selector,
          },
        }
      )
    })

    it('should accessDenied when focus was reason for not finding doc', () => {
      givenFindSelector()
      viewSelector = { a: some.primitive(), b: some.primitive() }
      Collection.findOne.withArgs(builtSelector('loadOne')).returns(null)
      Collection.findOne.withArgs(selector).returns(expectedDoc)
      should.throw(() => {
        focusedViewer.loadOne(apiContext, selector, options)
      })
      apiContext.accessDenied.should.have.been.calledWith(
        'loadOne doc is out of focus',
        {
          collection: Collection,
          id: expectedId,
          data: {
            viewFocus: viewSelector,
            foundDoc: expectedDoc,
          },
        }
      )
      Collection.findOne.withArgs(selector).should.have.been.calledWith(selector, { fields: { a: 1, b: 1 } })
    })

    it('should accessDenied when _id passed and other passed selectors were reason for not finding doc', () => {
      givenFindSelector()
      selector = { _id: expectedId, a: some.primitive(), b: some.primitive() }
      Collection.findOne.withArgs(builtSelector('loadOne')).returns(null)
      Collection.findOne.withArgs(selector).returns(null)
      Collection.findOne.withArgs(selector._id).returns(expectedDoc)
      should.throw(() => {
        focusedViewer.loadOne(apiContext, selector, options)
      })
      apiContext.accessDenied.should.have.been.calledWith(
        'loadOne by id restricted by additional passed selectors',
        {
          collection: Collection,
          id: selector._id,
          data: {
            foundDoc: expectedDoc,
          },
        },
      )
      Collection.findOne.withArgs(selector._id).should.have.been.calledWith(
        selector._id,
        { fields: { _id: 1, a: 1, b: 1 } },
      )
    })

    it('should accessDenied when _id not found', () => {
      const wrongId = some.mongoId()
      givenFindSelector()
      Collection.findOne.returns(null)
      should.throw(() => {
        focusedViewer.loadOne(apiContext, { _id: wrongId }, options)
      })
      apiContext.accessDenied.should.have.been.calledWith(
        'loadOne non-existent id',
        {
          collection: Collection,
          id: wrongId,
        },
      )
    })

  })

  describe('insert', () => {

    it('should call insert and return doc with _id and any SimpleSchema changes, leaving original untouched', () => {
      const withinSchemaFields = some.object()
      const originalDoc = {
        ...withinSchemaFields,
        simpleSchemaCleanedField: some.primitive(),
      }
      Collection.insert = sinon.spy((d) => {
        d.should.deep.equal(originalDoc)
        delete d.simpleSchemaCleanedField
        return expectedId
      })
      givenFocusedViewer()
      const actual = focusedViewer.insert(apiContext, originalDoc)
      actual.should.deep.equal({
        _id: expectedId,
        ...withinSchemaFields,
      })
      originalDoc.should.have.any.key('simpleSchemaCleanedField')
    })

    it('should insert merged doc and return', () => {
      const originalDoc = some.object()
      const mergedDoc = some.object()
      const insertDocMerge = sinon.spy(() => (mergedDoc))
      Collection.insert = sinon.spy((d) => {
        d.should.deep.equal(mergedDoc)
        return expectedId
      })
      givenFocusedViewer({
        insertDocMerge,
      })
      const actual = focusedViewer.insert(apiContext, originalDoc)
      actual.should.deep.equal({
        _id: expectedId,
        ...mergedDoc,
      })
      insertDocMerge.should.have.been.calledWith(viewer, originalDoc)
    })

    it('should insert unmerged doc if no viewSpec', () => {
      const originalDoc = some.object()
      Collection.insert = sinon.spy((d) => {
        d.should.deep.equal(originalDoc)
        return expectedId
      })
      givenFocusedViewer({})
      focusedViewer.insert(apiContext, originalDoc)
    })

    it('should throw if updateFirewall does', () => {
      const reason = some.string()
      givenFocusedViewer({
        updateFirewall(ac) { ac.accessDenied(reason) },
      })
      should.throw(() => {
        focusedViewer.insert(apiContext, some.object())
      }, reason)
    })

    it('should throw if firewall does', () => {
      const reason = some.string()
      givenFocusedViewer({
        firewall(ac) { ac.accessDenied(reason) },
      })
      should.throw(() => {
        focusedViewer.insert(apiContext, some.object())
      }, reason)
    })

  })

  describe('updateOne', () => {

    it('should update doc using updateSelector', () => {
      givenUpdateSelector()
      Collection.update.returns(1)
      const actual = focusedViewer.updateOne(apiContext, selector, modifier)
      actual.should.equal(1)
      Collection.update.should.have.been.calledWith(builtSelector('updateOne'), modifier)
    })

    it('should accessDenied if no matching doc', () => {
      givenUpdateSelector()
      Collection.update.returns(0)
      Collection.findOne.returns(null)
      should.throw(() => {
        focusedViewer.updateOne(apiContext, selector, modifier)
      })
      apiContext.accessDenied.should.have.been.calledWith(
        'updateOne found nothing',
        {
          collection: Collection,
          data: {
            selector,
          },
        },
      )
    })

    it('should use findSelector if no updateSelector', () => {
      givenFindSelector()
      Collection.update.returns(1)
      const actual = focusedViewer.updateOne(apiContext, selector, modifier)
      actual.should.equal(1)
      Collection.update.should.have.been.calledWith(builtSelector('updateOne'), modifier)
    })

    it('should throw if updateFirewall does', () => {
      const reason = some.string()
      givenFocusedViewer({
        updateFirewall(ac) { ac.accessDenied(reason) },
      })
      should.throw(() => {
        focusedViewer.updateOne(apiContext, selector, modifier)
      }, reason)
    })

    it('should throw if firewall does', () => {
      const reason = some.string()
      givenFocusedViewer({
        firewall(ac) { ac.accessDenied(reason) },
      })
      should.throw(() => {
        focusedViewer.updateOne(apiContext, selector, modifier)
      }, reason)
    })

  })

  describe('updateMaybe', () => {

    it('should call update with updateSelector and return updated count', () => {
      givenUpdateSelector()
      Collection.update.returns(1)
      const actual = focusedViewer.updateMaybe(apiContext, selector, modifier)
      actual.should.equal(1)
      Collection.update.should.have.been.calledWith(builtSelector('updateMaybe'), modifier)
    })

    it('should not throw if nothing to update', () => {
      givenUpdateSelector()
      Collection.update.returns(0)
      const actual = focusedViewer.updateMaybe(apiContext, selector, modifier)
      actual.should.equal(0)
      Collection.update.should.have.been.calledWith(builtSelector('updateMaybe'), modifier)
    })

    it('should use findSelector if no updateSelector', () => {
      givenFindSelector()
      Collection.update.returns(0)
      const actual = focusedViewer.updateMaybe(apiContext, selector, modifier)
      actual.should.equal(0)
      Collection.update.should.have.been.calledWith(builtSelector('updateMaybe'), modifier)
    })

    it('should throw if updateFirewall does', () => {
      const reason = some.string()
      givenFocusedViewer({
        updateFirewall(ac) { ac.accessDenied(reason) },
      })
      should.throw(() => {
        focusedViewer.updateMaybe(apiContext, selector, modifier)
      }, reason)
    })

    it('should throw if firewall does', () => {
      const reason = some.string()
      givenFocusedViewer({
        firewall(ac) { ac.accessDenied(reason) },
      })
      should.throw(() => {
        focusedViewer.updateMaybe(apiContext, selector, modifier)
      }, reason)
    })

  })

  describe('removeOne', () => {

    beforeEach(() => {
      selector = some.string()
    })

    it('should remove doc', () => {
      givenUpdateSelector()
      Collection.remove.returns(1)
      const actual = focusedViewer.removeOne(apiContext, selector)
      actual.should.equal(1)
      Collection.remove.should.have.been.calledWith(builtSelector('removeOne'))
    })

    it('should accessDenied if not passed id selector because Meteor will always remove random server ', () => {
      selector = some.object()
      givenUpdateSelector()
      Collection.remove.returns(1)
      should.throw(() => {
        focusedViewer.removeOne(apiContext, selector)
      }, /by id/)
      apiContext.accessDenied.should.not.have.been.called
    })

    it('should work with id from view', () => {
      viewSelector = { _id: some.string() }
      selector = {}
      givenUpdateSelector()
      Collection.remove.returns(1)
      focusedViewer.removeOne(apiContext, selector)
      Collection.remove.should.have.been.calledWith(builtSelector('removeOne'))
    })

    it('should handle string id when no view selector', () => {
      selector = some.string()
      givenFocusedViewer({})
      Collection.remove.returns(1)
      const actual = focusedViewer.removeOne(apiContext, selector)
      actual.should.equal(1)
      Collection.remove.should.have.been.calledWith(selector)
    })

    it('should accessDenied if no matching doc', () => {
      givenUpdateSelector()
      Collection.remove.returns(0)
      Collection.findOne.returns(null)
      should.throw(() => {
        focusedViewer.removeOne(apiContext, selector)
      })
      Collection.remove.should.have.been.calledWith(builtSelector('removeOne'))
      apiContext.accessDenied.should.have.been.calledWith(
        'removeOne found nothing',
        {
          collection: Collection,
          data: {
            selector,
          },
        },
      )
    })

    it('should throw if updateFirewall does', () => {
      const reason = some.string()
      givenFocusedViewer({
        updateFirewall(ac) { ac.accessDenied(reason) },
      })
      should.throw(() => {
        focusedViewer.removeOne(apiContext, selector)
      }, reason)
    })

    it('should throw if firewall does', () => {
      const reason = some.string()
      givenFocusedViewer({
        firewall(ac) { ac.accessDenied(reason) },
      })
      should.throw(() => {
        focusedViewer.removeOne(apiContext, selector)
      }, reason)
    })

  })

})
