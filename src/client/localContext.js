import { app } from '@mindhive/di'


export default class LocalContext {

  constructor(contextName) {
    app().apiRegistry.enhanceApiContext(this, `local:${contextName}`)
  }
}
