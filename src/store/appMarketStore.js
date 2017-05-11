import {
  observable,
  computed,
  runInAction,
} from 'mobx'
import { app } from '@mindhive/di'

/* eslint-disable no-console */

const NEEDS_UPDATE_ERROR_MESSAGE = 'Skipping downloading new version because the Cordova platform version' +
  ' or plugin versions have changed and are potentially incompatible'

class AppMarketStore {

  packageName
  @observable needsUpdate = false

  constructor() {
    if (app().Meteor.isCordova) {
      if (! global.device) {
        throw new Error('You need to install the cordova:cordova-plugin-device')
      }
      if (! global.navigator.appInfo) {
        throw new Error('You need to install the cordova:cordova-plugin-appinfo')
      }
      if (! global.cordova || ! global.cordova.plugins || ! global.cordova.plugins.market) {
        throw new Error('You need to install the cordova:cordova-plugin-market')
      }
      this.packageName = global.navigator.appInfo.identifier
      global.WebAppLocalServer.onError((e) => {
        if (String(e).includes(NEEDS_UPDATE_ERROR_MESSAGE)) {
          runInAction('needsUpdate', () => { this.needsUpdate = true })
        }
      })
    }
  }

  @computed get storeName() {
    switch (global.device.platform) {
      case 'Android': return 'GooglePlay'
      case 'iOS': return 'AppStore'
      default: {
        console.warn('Returning generic storeName on unsupported platform')
        return 'app store'
      }
    }
  }

  openInMarket() {
    if (global.device.platform === 'Android') {
      global.cordova.plugins.market.open(this.packageName)
    } else {
      console.warn('Cannot open market on unsupported platform')
    }
  }
}

export default () => ({
  appMarketStore: new AppMarketStore(),
})
