/*
 * @Author: dxy
 * @Github: https://github.com/xiaomuzhu
 * @Email: meituandxy@gmail.com
 * @Date: 2020-04-07 13:48:08
 * @LastEditors: dxy
 * @LastEditTime: 2020-04-08 00:24:17
 * @FilePath: /situ/src/core/decorators.ts
 */
import { Observable } from 'rxjs'
import { Draft } from 'immer'
import { Injectable } from '@asuka/di'

import { REDUCER_DECORATOR_SYMBOL, EFFECT_DECORATOR_SYMBOL } from './symbols'
import { Action } from './types'

interface DecoratorReturnType<V> {
  (target: any, propertyKey: string, descriptor: { value?: V }): PropertyDescriptor
}

function createActionDecorator(decoratorSymbol: symbol) {
  return () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor
    const decoratedActionNames: string[] = Reflect.getMetadata(decoratorSymbol, constructor) || []
    Reflect.defineMetadata(decoratorSymbol, [...decoratedActionNames, propertyKey], constructor)
    return descriptor
  }
}

export const Reducer: <S = any>() => DecoratorReturnType<
  (state: Draft<S>, params: any) => undefined | void
> = createActionDecorator(REDUCER_DECORATOR_SYMBOL)

export const Effect: <A = any>() => DecoratorReturnType<
  (action: Observable<A>) => Observable<Action<unknown>>
> = () => {
  const effect = createActionDecorator(EFFECT_DECORATOR_SYMBOL)
  return effect()
}

const configSets = new Set<string>()

export const Module = (name: string) => {
  if (typeof name !== 'string') {
    throw new TypeError('Module name should be string')
  }
  if (configSets.has(name)) {
    throw new Error(`Duplicated Module name: ${name}`)
  }
  configSets.add(name)

  return (target: any) => {
    target.prototype.moduleName = name
    return Injectable()(target)
  }
}
