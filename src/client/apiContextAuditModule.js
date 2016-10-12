

export const auditEnhancer = () => ({
  auditLog() {
    // Don't log in here because assume we're inside a client
    // method simulation and so this is about to happen on the server.
    if (! this.isSimulation) {
      throw new Error('Somehow auditLog was called while not in a method simulation')
    }
  },
})

export default ({ apiRegistry, audit }) => {
  apiRegistry.apiContextEnhancer(auditEnhancer(audit))
}
