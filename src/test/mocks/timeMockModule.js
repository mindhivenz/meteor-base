

export default () => {
  let testTime = new Date()
  const clock = () => testTime
  clock.adjust = (func) => {
    testTime = func(testTime)
    return testTime
  }
  return {
    clock,
  }
}
