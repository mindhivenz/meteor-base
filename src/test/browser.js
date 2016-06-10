/* global browser */

/*
 Sets the userId on a browser connection in a webdriver test to appear as tho you're logged in
 */
export const login = (userId) => {
  browser.execute(id => {
    Meteor.call('backdoor.setUserId', id, function () {  // eslint-disable-line
      Meteor.connection.setUserId(id)
    })
  }, userId)
}
