# Dependency injection

We have built our own super simple DI. 

## Install

1. `npm install --save @mindhive/meteor`
2. `meteor add meteorhacks:unblock`
3. `meteor add aldeed:collection2`

## Motivations and benefits

- Prefer pure functions as they are: 
	- simpler to understand 
	- easily tested
	- make dependencies explicit
- Avoid ES6 imports as they are difficult to test
- Especially avoid Meteor package imports as most test runners don't understand Meteor's packaging
	(they can be accessed through Meteor globals but that's not a great idea either)
  	
## Lifecycle

1. Main file for the app should import all of it's modules using `initModules()` 

2. Modules should be a directory's `index.js` with a default export function

	- For example: `export default () => { return { serviceName: new Service(), ... } }`	
	- Return an object where the keys map service names to the service objects/functions to be 
		put into the app context
	- The module function is also passed the current appContext to access other services (destructing works a treat),
    	for example: `export default ({ Meteor, Mongo }) => { ... }`
    - Modules further down the list passed to `initModules()` can use services added to the appContext by 
    	earlier modules
    - Modules don't have to return anything, you can use them to perform other initialization
    - Modules are called inside `Meteor.startup` so there is no need to manage that yourself

3. To use services in the appContext wrap a function with `inject(...)`

	- Given a function that needs services form the appContext, for example: 
		`const fooFunc = ({ Tasks, Accounts }, bar) => {...}`
	- When we wrap this function: `const foo = inject(fooFunc)`
	- Then we can call the returned function as `foo(barValue)` and services will be injected 
	   automagically
	 
4. Testing is then easy and explicit

## Testing

In the example below `service` will be the only object in the appContext and available to any
code under test that uses `inject()`. 

```javascript
const service = {} 
it('should call service.foo()', 
  mockAppContext({ service }, () => {
	service.foo = sinon.spy()
	injectedFuncUnderTest()
	service.foo.should.have.been.calledOnce      	
  })
)
```		 	 
	 