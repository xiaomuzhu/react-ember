/*
 * @Author: dxy
 * @Github: https://github.com/xiaomuzhu
 * @Email: meituandxy@gmail.com
 * @Date: 2020-04-07 21:23:26
 * @LastEditors: dxy
 * @LastEditTime: 2020-04-08 18:04:12
 * @FilePath: /demo-ts/src/core/model.ts
 */

import { Observable, merge, identity } from 'rxjs'
import { map, filter, publish, refCount, skip } from 'rxjs/operators'
import { Reducer } from 'react'
import produce, { Draft } from 'immer'

import {
  InstanceActionOfEffectModule,
  Action,
  Epic,
  Store,
  StoreCreator,
  ImmerReducer,
  ActionStreamOfEffectModule
} from './types'
import { REDUCER_DECORATOR_SYMBOL, EFFECT_DECORATOR_SYMBOL, EffectSymbol } from './symbols'
import { createStore } from './store'

type Effect<T> = (payload$: Observable<T>) => Observable<Action<unknown>>

export abstract class RootModel<S> {
  abstract readonly defaultState: S

  readonly moduleName!: string

  // @internal
  readonly _actionKeys: string[] = []

  // @internal
  store: Store<S> | null = null

  state$: Observable<S>

  private storeCreator!: StoreCreator<S>

  private readonly _actions!: any

  private readonly _actionStreams!: any

  private _defineActionKeys!: string[]

  private readonly action$: Observable<Action<unknown>>

  private readonly effect: Epic<unknown>
  private readonly reducer: Reducer<S, Action<unknown>>

  constructor() {
    this.effect = this.combineEffects()
    this.reducer = this.combineReducers()

    const { create, action$, state$ } = createStore(this.reducer, this.effect)
    this.storeCreator = create
    this.action$ = action$
    this.state$ = state$

    this._actions = this._actionKeys.reduce((acc, key) => {
      acc[key] = (payload: unknown) => {
        const action = {
          type: key,
          payload
        }
        Object.defineProperty(action, 'store', {
          value: this.store,
          enumerable: false,
          configurable: false,
          writable: false
        })
        return action
      }
      return acc
    }, Object.create(null))

    this._actionStreams = this._actionKeys.reduce((acc, key) => {
      acc[key] = this.action$.pipe(
        filter(({ type }) => type === key),
        map(({ payload }) => payload)
      )

      return acc
    }, Object.create(null))
  }

  getActions<M extends RootModel<S>>(
    this: M
  ): M extends RootModel<infer State> ? InstanceActionOfEffectModule<M, State> : never {
    return this._actions
  }

  getAction$<M extends RootModel<S>>(
    this: M
  ): M extends RootModel<infer State>
    ? ActionStreamOfEffectModule<M, State>
    : ActionStreamOfEffectModule<M, S> {
    return this._actionStreams
  }

  protected createNoopAction(): Action<null> {
    return {
      type: 'NOOP_ACTION',
      payload: null
    }
  }

  createStore() {
    if (this.store) return this.store

    let preloadState: S | undefined

    this.store = this.storeCreator(preloadState ?? this.defaultState)
    if (process.env.NODE_ENV !== 'production') {
      Object.defineProperty(this.store, 'name', {
        value: this.moduleName,
        configurable: false,
        enumerable: false,
        writable: false
      })
    }
    return this.store
  }

  private combineReducers(): Reducer<S, Action<unknown>> {
    const reducerKeys =
      (Reflect.getMetadata(REDUCER_DECORATOR_SYMBOL, this.constructor) as string[]) || []
    this._actionKeys.push(...reducerKeys)
    const reducers = reducerKeys.reduce((acc, property) => {
      acc[property] = (this as any)[property].bind(this)
      return acc
    }, {} as { [index: string]: ImmerReducer<S, unknown> })

    return (prevState, action) => {
      const { type } = action
      if (typeof type === 'string') {
        if (reducers[type]) {
          return produce(prevState, (draft: Draft<S>) => reducers[type](draft, action.payload))
        }
      }
      return prevState
    }
  }

  private combineEffects() {
    const effectKeys =
      (Reflect.getMetadata(EFFECT_DECORATOR_SYMBOL, this.constructor) as string[]) || []
    this._actionKeys.push(...effectKeys)
    const effects: Effect<unknown>[] = effectKeys.map(property => {
      const effect = (this as any)[property].bind(this)
      Object.defineProperty(effect, EffectSymbol, {
        value: property,
        enumerable: false,
        configurable: false,
        writable: false
      })
      return effect
    })

    return (action$: Observable<Action<unknown>>) => {
      return merge(
        ...effects.map(effect => {
          const effectActionType: string = (effect as any)[EffectSymbol]

          const payload$ = action$.pipe(
            filter(({ type }) => type === effectActionType),
            map(({ payload }) => payload)
          )
          return effect(payload$)
        })
      )
    }
  }
}
