import { app } from '@mindhive/di'


export const auditEnhancer = () => ({
  auditLog(entry) {
    // Don't log if is simulation because this is about to happen on the server
    if (! this.isSimulation) {
      app().api.optimisticCall(
        'audit.log',
        {
          context: this.apiName,
          entry,
        },
        { notifyViewerPending: false },
      )
    }
  },
})

export default ({ apiRegistry, audit }) => {
  apiRegistry.apiContextEnhancer(auditEnhancer(audit))
}
