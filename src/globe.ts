import { Reducer, Middleware } from 'redux'

export interface BaseActionState {}

export interface Action<A = any> {
  type: string
  payload?: A
}

export type ActionCreator<S> = (state: S, payload?: any) => Action

export interface ActionCreatorList<S> {
  [actionName: string]: ActionCreator<S>
}

export interface ActionCreatorMap<H> {
  [moduleName: string]: ActionCreators<H>
}

export enum ActionHandlerMethod {
  reducer = 'reducer',
  effect = 'effect'
}

export type EffectsHandler = (payload?: any) => Promise<any>
export type ActionsHandler<S = any> = (state: S, payload?: any) => S

export interface ActionHandler<S> {
  item: string
  action: string
  method: ActionHandlerMethod
  fn: ActionsHandler<S> & EffectsHandler
}

export type ActionHandlerList<S> = Array<ActionHandler<S>>

export interface ActionHandlerMap<S> {
  [key: string]: ActionsHandler<S>
}
export interface ActionEffectHandlerMap<S> {
  [key: string]: ActionsHandler<S> | EffectsHandler
}

export interface EffectHandlerMap {
  [key: string]: EffectsHandler
}

// export type Module = ReturnType<typeof getModal>
export interface Module<S extends BaseActionState = any> {
  action: ActionCreators<ActionHandlerMap<any>>
  namespace: string
  state: BaseActionState
  reducer: Reducer<S>
}

export interface ReducerMap {
  [key: string]: Reducer
}

export interface Modules {
  [key: string]: Module
}

export type StateFromModels<M extends Modules> = { [modelKey in keyof M]: M[modelKey]['state'] }

export type ReducerFromModels<M extends Modules> = { [modelKey in keyof M]: M[modelKey]['reducer'] }

export type StateFromExtraReducer<Ins> = {
  [K in keyof Ins]: Ins[K] extends Reducer ? ReturnType<Ins[K]> : never
}
export type RootState<
  M extends Modules = Modules,
  T extends ReducerMap = ReducerMap
> = StateFromModels<M> & StateFromExtraReducer<T>

export type RootReducer<
  T extends ReducerMap = ReducerMap,
  M extends Modules = Modules
> = ReducerFromModels<M> & T

export interface Config<T extends ReducerMap> {
  modules: Modules
  middlewares?: Middleware[]
  reducers?: T
}
export type OmitNever<T> = Pick<T, { [P in keyof T]: T[P] extends never ? never : P }[keyof T]>
export type PickEffectsHandler<Ins> = { [K in keyof Ins]: Extract<Ins[K], EffectsHandler> }
export type PickActionsHandler<Ins> = {
  [K in keyof Ins]: Ins[K] extends EffectsHandler ? never : Ins[K]
}

type Handler<F> = F extends (state: infer S, args: infer P) => infer S
  ? (state: S, args: P) => S
  : never
export type IActions<Ins> = {
  [K in keyof Ins]: Ins[K] extends EffectsHandler ? EffectsHandler : Handler<Ins[K]>
}

type Creator<C> = C extends (state: any, args: infer P) => any
  ? (payload: P) => { type: string; payload: P }
  : never
export type ActionCreators<Han> = {
  [K in keyof Han]: Han[K] extends EffectsHandler ? EffectsHandler : Creator<Han[K]>
}
