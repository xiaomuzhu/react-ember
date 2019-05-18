import 'reflect-metadata'
import { EmberStore, ActionType } from './type'
import { Action } from 'redux'

export const METHOD_METADATA = 'method'
export const ACTION_METADATA = 'action' 

export const Actions = (name: string): ClassDecorator => target => Reflect.defineMetadata(ACTION_METADATA, name, target)

export const createMappingDecorator = (method: string) => (name?: string): MethodDecorator => 
    (target, key, descriptor) => {
        Reflect.defineMetadata(ACTION_METADATA, name, descriptor.value!)
        Reflect.defineMetadata(METHOD_METADATA, method, descriptor.value!)
    }

export const reducer = createMappingDecorator('reducer')
export const effect = createMappingDecorator('effect')

export interface BaseActionState {
    isMounted?:  boolean
}

export class BaseAction<S extends BaseActionState> {
    protected readonly store: EmberStore
    protected readonly state: S
    constructor(initState: S) {
        this.state = initState
    }

    protected dispatch(action: Action): ActionType {
        return this.store.dispatch(action)
    }

}
