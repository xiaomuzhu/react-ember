import { Config, RootState, ReducerMap } from './globe'
import { Ember } from './ember'
import { Store, AnyAction } from 'redux'

export function init<T extends ReducerMap = any>(config: Config<T>): Store<RootState, AnyAction> {
  return new Ember<T>(config).init()
}
