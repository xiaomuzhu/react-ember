import _ from 'lodash'
import { BaseAction, METHOD_METADATA, ACTION_METADATA } from './action'
import { dispatch } from './middleware'
import {
  BaseActionState,
  Action,
  ActionHandlerList,
  ActionHandler,
  ActionHandlerMap,
  ActionCreatorMap,
  ActionHandlerMethod,
  EffectHandlerMap,
  EffectsHandler,
  ActionEffectHandlerMap,
  PickEffectsHandler,
  OmitNever,
  PickActionsHandler,
  ActionCreators
} from './globe'

export const SEP = '/'

export const rootActions: ActionCreatorMap<any> = {}
export const rootEffects: EffectHandlerMap = {}

export function getModal<S extends BaseActionState, T extends ActionEffectHandlerMap<S>>(
  instance: new (initState: S) => BaseAction<S>,
  initState: S,
  name: string
) {
  const actionInstance = new instance(initState)
  const actions = mapReducers(actionInstance)
  const { reducers, effect, namespace } = getOptions(actions)

  if (reducers.length || effect.length) {
    rootActions[namespace] = rootActions[namespace] || ({} as ActionCreators<T>)
  }
  const subReducers: ActionHandlerMap<S> = {}
  each(reducers, (actionItem: ActionHandler<S>) => {
    const { action, fn } = actionItem

    subReducers[`${namespace}${SEP}${action}`] = fn
    rootActions[namespace][action] = actionCreator(namespace, action)
  })

  const reducer = getReducer(subReducers, initState)

  const subEffects: EffectHandlerMap = {}

  each(effect, actionItem => {
    const { action, fn } = actionItem
    subEffects[action] = fn
    rootActions[namespace][action] = actionCreator(namespace, action)
  })

  return {
    action: rootActions[namespace] as ActionCreators<OmitNever<PickActionsHandler<T>>>,
    namespace,
    state: initState,
    reducer,
    effect: subEffects as ActionCreators<OmitNever<PickEffectsHandler<T>>>
  }
}

function getOptions<S extends BaseActionState>(actions: ActionHandlerList<S>) {
  const namespace = actions[0].fn.name
  const reducers = actions.filter(action => action.method === ActionHandlerMethod.reducer)
  const effect = actions.filter(action => action.method === ActionHandlerMethod.effect)

  return {
    namespace,
    reducers,
    effect
  }
}

function each<S extends BaseActionState>(
  arr: Array<ActionHandler<S>>,
  cb: (value: ActionHandler<S>, index: number, array: Array<ActionHandler<S>>) => void
) {
  return arr.forEach(cb)
}

function getReducer<S extends BaseActionState>(reducers: ActionHandlerMap<S>, initialState: S) {
  return (state: S = initialState, action: Action): S => {
    if (typeof reducers[action.type] === 'function') {
      return reducers[action.type](state, action.payload)
    }
    return state
  }
}

export function resolveReducers<S extends BaseActionState>(
  namespace: string,
  reducerList: ActionHandlerList<S>
) {
  const reducers: ActionHandlerMap<S> = {}
  reducerList.map(actionItem => {
    const { fn, action } = actionItem

    reducers[`${namespace}${SEP}${action}`] = fn
  })

  return reducers
}

function actionCreator(namespace: string, actionName: string) {
  return (payload: any) => {
    return dispatch({
      type: `${namespace}${SEP}${actionName}`,
      payload
    })
  }
}

export function mapReducers<S extends BaseActionState>(
  instance: BaseAction<S>
): ActionHandlerList<S> {
  const prototype = Object.getPrototypeOf(instance)
  const methodsNames = Object.getOwnPropertyNames(prototype).filter(item =>
    _.isFunction(prototype[item])
  )

  return methodsNames.map(item => {
    const fn: ActionHandler<S>['fn'] = prototype[item]

    const action: string = Reflect.getMetadata(ACTION_METADATA, fn)
      ? Reflect.getMetadata(ACTION_METADATA, fn)
      : item
    const method: ActionHandlerMethod = Reflect.getMetadata(METHOD_METADATA, fn)

    return {
      item,
      action,
      method,
      fn
    }
  })
}
