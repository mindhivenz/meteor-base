import { app } from '@mindhive/di'
import SimpleSchema from 'simpl-schema'
import LogLevel from '../LogLevel'

/* eslint-disable no-console */

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
  level: { type: String, allowedValues: LogLevel.enumValues.map(s => s.name) },
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
      level = LogLevel.INFO,
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
      level: level.name || String(level),
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
    if (process.env.NODE_ENV !== 'test') {
      if (level === LogLevel.ERROR) {
        console.error(action)
      } else if (level === LogLevel.WARN) {
        console.warn(action)
      } else if (process.env.NODE_ENV === 'development') {
        console.info(action)
      }
      if (level.ordinal >= LogLevel.WARN || process.env.NODE_ENV === 'development') {
        console.dir(entry, { colors: process.env.NODE_ENV === 'development' })
      }
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
