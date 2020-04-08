/*
 * @Author: dxy
 * @Github: https://github.com/xiaomuzhu
 * @Email: meituandxy@gmail.com
 * @Date: 2020-04-07 13:57:03
 * @LastEditors: dxy
 * @LastEditTime: 2020-04-08 18:03:55
 * @FilePath: /demo-ts/src/core/types.ts
 */

import { Observable, Subject, ReplaySubject } from 'rxjs'
import { Draft } from 'immer'
import { RootModel } from './model'

/**
 * 类似于 redux action
 */
export interface Action<T = unknown> {
  readonly type: string | symbol
  readonly payload?: T
}

/**
 * 类似于 redux-Observable 的 epic 处理副作用
 */
export type Epic<T> = (action$: Observable<Action<T>>) => Observable<Action<unknown>>

export interface StoreCreatorReturnType<S> {
  create: StoreCreator<S>
  action$: Observable<Action<unknown>>
  state$: ReplaySubject<S>
}

/**
 *
 */
export type StoreCreator<S> = {
  (defaultState: S): Store<S>
}

/**
 * 类似于 redux 的 store
 */
export type Store<S> = {
  getState: () => S
  dispatch: <T>(action: StoreAction<T>) => void
  // @internal
  state$: Subject<S>
  subscribeAction: (observer: (action: Action<unknown>) => void) => () => void
  unsubscribe: () => void
}

export interface StoreAction<T = unknown> extends Action<T> {
  readonly store?: Store<any>
}

/**
 * 利用 infer 关键字推断 effect 中的 payload 类型
 */
type GetEffectPayload<F> = F extends (action$: Observable<infer Payload>) => Observable<Action>
  ? Payload
  : never

/**
 * 利用 infer 关键字推断 reducer 中的 payload 类型
 */
type GetReducerPayload<Func, S> = Func extends (state: Draft<S>) => void
  ? void
  : Func extends (state: Draft<S>, payload: infer Payload) => void
  ? Payload
  : never

type GetPayload<F, S> = GetEffectPayload<F> extends never
  ? GetReducerPayload<F, S> extends never
    ? never
    : GetReducerPayload<F, S>
  : GetEffectPayload<F>

/**
 * 从 model 中提取出 payload 类型
 */
export type ActionFromRootModel<M extends RootModel<S>, S> = Omit<
  {
    [key in keyof M]: GetPayload<M[key], S> extends void
      ? () => void
      : (payload: GetPayload<M[key], S>) => void
  },
  keyof RootModel<S>
>

export type InstanceActionOfEffectModule<M extends RootModel<S>, S> = Omit<
  {
    [key in keyof M]: (payload: GetPayload<M[key], S>) => Action<GetPayload<M[key], S>>
  },
  keyof RootModel<S>
>

export type ActionStreamOfEffectModule<M extends RootModel<S>, S> = Omit<
  {
    [key in keyof M]: Observable<GetPayload<M[key], S>>
  },
  keyof RootModel<S>
>

/**
 * 我们的 reducer 是不可变的
 */
export type ImmerReducer<S, T> = (prevState: Draft<S>, payload: T) => void

export interface ConstructorOf<T> {
  new (...args: any[]): T
}

export type StateSelector<S, U> = {
  (state: S): U
}

export type StateSelectorConfig<S, U> = {
  selector?: StateSelector<S, U>
}
