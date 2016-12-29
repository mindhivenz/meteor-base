import { app } from '@mindhive/di'


export class LocalContext {

  constructor(contextName) {
    app().apiRegistry.enhanceApiContext(this, `local:${contextName}`)
  }
}
