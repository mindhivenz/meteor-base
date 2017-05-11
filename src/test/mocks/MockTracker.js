import { autorun as mobxAutorun } from 'mobx'


export default class MockTracker {
  autorun = mobxAutorun
}
