import { app } from '@mindhive/di'
import SimpleSchema from 'simpl-schema'


const AuditEntrySchema = new SimpleSchema({
  timestamp: {
    type: Date,
    autoValue() {
      if (! this.isInsert) {
        return undefined
      }
      return new Date()
    },
  },
  connectionId: String,
  clientAddress: String,
  context: String,
  viewerId: { type: String, optional: true },
  orgId: { type: String, optional: true },
  action: String,
  collection: { type: String, optional: true },
  id: {
    type: String,
    optional: true,
    custom() {
      if (this.value && ! this.field('collection').value) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
      return null
    },
  },
  data: { type: Object, optional: true, blackbox: true },
  fromClient: { type: Boolean, optional: true },
})

export const audit = {

  log(
    connection,
    context,
    viewer,
    {
      action,
      collection,
      id,
      data,
    },
    { fromClient = false } = {},
  ) {
    const { AuditEntries } = app()
    const entry = {
      connectionId: connection.id,
      clientAddress: connection.clientAddress,
      context,
      action,
      collection: collection && collection._name,
      id,
      data,
    }
    if (viewer) {
      entry.viewerId = viewer._id
      if (viewer.orgId) {
        entry.orgId = viewer.orgId
      }
    }
    if (fromClient) {
      entry.fromClient = true
    }
    if (process.env.NODE_ENV === 'development') {  // specifically avoid 'test' stage
      console.dir(entry)  // eslint-disable-line no-console
    }
    AuditEntries.insert(entry)
  },
}

const registerApi = (apiRegistry) => {
  apiRegistry.method('audit.log', {
    server:
      (
        appContext,
        methodInvocation,
        {
          context,
          entry,
        },
      ) => {
        audit.log(
          methodInvocation.connection,
          context,
          methodInvocation.viewer(),
          entry,
          { fromClient: true },
        )
      },
  })
}

export default ({ Mongo, apiRegistry }) => {
  const AuditEntries = new Mongo.Collection('auditEntries')

  if (AuditEntries.attachSchema) {
    AuditEntries.attachSchema(AuditEntrySchema)
  }

  AuditEntries._ensureIndex({ connectionId: 1 })
  AuditEntries._ensureIndex({ clientAddress: 1 })
  AuditEntries._ensureIndex({ viewerId: 1 })
  AuditEntries._ensureIndex({ orgId: 1 })
  AuditEntries._ensureIndex({ collection: 1, id: 1 })

  registerApi(apiRegistry)

  return {
    AuditEntries,
    audit,
  }
}
