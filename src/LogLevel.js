import { Enum } from 'enumify'


export default class LogLevel extends Enum {}

LogLevel.initEnum([
  'INFO',
  'WARN',
  'ERROR',
])
