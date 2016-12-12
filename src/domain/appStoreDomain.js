import {
  observable,
  computed,
  runInAction,
} from 'mobx'
import { app } from '@mindhive/di'

/* eslint-disable no-console */

class AppStoreDomain {

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
        if (String(e).includes('Cordova platform or versions changed')) {
          runInAction('set needsUpdate', () => { this.needsUpdate = true })
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
  appStoreDomain: new AppStoreDomain(),
})
