import { mockAppContext } from '@mindhive/di'
import some from '@mindhive/some'

import { sinon } from '../mocha'

import { audit } from './auditModule'


describe('audit', () => {

  let AuditEntries
  let connection
  let context
  let viewer
  let action
  let collectionName
  let collection
  let id
  let data

  beforeEach(() => {
    AuditEntries = {
      insert: sinon.spy(),
    }
    connection = {
      id: some.string(),
      clientAddress: some.string(),
    }
    context = some.string()
    viewer = {
      _id: some.string(),
      orgId: some.string(),
    }
    action = some.string()
    collectionName = some.string()
    collection = {
      _name: collectionName,
    }
    id = some.string()
    data = some.object()
  })

  const modules = () => ({
    AuditEntries,
  })

  it('should insert when log called',
    mockAppContext(modules, () => {
      audit.log(connection, context, viewer, { action, collection, id, data })
      const auditEntry = AuditEntries.insert.firstCall.args[0]
      auditEntry.should.have.properties({
        connectionId: connection.id,
        clientAddress: connection.clientAddress,
        context,
        viewerId: viewer._id,
        orgId: viewer.orgId,
        action,
        collection: collectionName,
        id,
        data,
      })
    })
  )

  it('should insert when log called with optional missing',
    mockAppContext(modules, () => {
      audit.log(connection, context, null, { action })
      const auditEntry = AuditEntries.insert.firstCall.args[0]
      auditEntry.should.have.properties({
        connectionId: connection.id,
        clientAddress: connection.clientAddress,
        action,
      })
    })
  )

})
