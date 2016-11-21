import { autorun as mobxAutorun } from 'mobx'


export class MockTracker {
  autorun = mobxAutorun
}
