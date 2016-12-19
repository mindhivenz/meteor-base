import { app } from '@mindhive/di'


export class LocalContext {

  constructor(contextName) {
    const { viewerDomain } = app()
    this.userId = viewerDomain.user && viewerDomain.user._id
    app().apiRegistry.enhanceApiContext(this, `local:${contextName}`)
    if (viewerDomain.user && typeof this._cacheViewer === 'function') {
      this._cacheViewer(viewerDomain.user)
    }
  }
}
