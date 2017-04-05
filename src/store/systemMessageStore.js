import MessageStore from './MessageStore'


export default () => ({
  systemMessageStore: new MessageStore(),
})
