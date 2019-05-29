# react-ember

### Features

 - 简化 redux 编码过程中的繁琐模板,我们用类的一个方法可以同时生成 action、reducer
 - 同时支持异步 action 和同步 action
 - 与 typescript 完美集成,强大的类型提示


### Usage

```bash
npm i react-ember

```

[example](https://github.com/xiaomuzhu/react-ember-demo)

### why

本项目受 DVA 启发而来,与 DVA 一样来解决 React 开发过程中 Redux 繁琐的编码流程,但是由于 DVA 对 TypeScript 支持不够完善(dva虽然有 d.ts,但是类型提示几乎没有,在 ts 环境下开发体验糟糕),因此需要一个对 typescript 更加友好的解决方案.

### FAQ

#### 支持 Redux DevTools Extension 吗?

本项目内置了Redux DevTools Extension,可以直接使用

#### 为什么没有内置 Router等路由解决方案?

本项目旨在解决数据流管理层面的问题,只作为单纯的数据流管理框架,不涉及路由、View 等层面的东西

### API

#### getModel
本项目跟主流的redux数据管理解决方案一样是基于 model 的,`getModel`用于将一个类转化为model

如下,由于要获得良好的类型提示,所以下面代码`ActionHandlerMapFromModel`的作用是将类的方法类型映射出来,
这些被映射的类型在`getModel`内部转化的 model 也会带有这些映射,所以在开发中会有良好的类型提示

```typescript

interface InitState extends BaseActionState {
    count: number
    text?: string
}

const initState: InitState = {
    count: 0
}


export class Counter extends BaseAction<InitState> {

    @reducer()
    public increment(state: InitState, payload: number): InitState {

        return {
            ...state,
            count: state.count + payload
        }
    }

    @reducer()
    public decrement(state: InitState, payload: number): InitState {
        return {
            ...state,
            count: state.count - payload
        }
    }

    @effect()
    public async incrementAsync(payload: number) {
        await new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve()
            }, 1000)
          })
          CounterModel.action.increment(payload)
    }

}

export type ModelType = ActionHandlerMapFromModel<Counter>

export const CounterModel = getModel<InitState, ModelType>(Counter, initState, 'counter')


```

#### reducer effect

上面的例子中类的方法会被`@reducer`、 `@effect`装饰，其实这两个装饰器仅仅作为注解，标注这些方法应该在`getModel`中作为普通同步 Action 还是异步 Action,除此之外不会改变方法本身

#### init
这是本框架的初始化入口,接收一个配置对象 config,然后初始化整个 store(即 redux 的 store)

```javascript
Config{
  modules: object
  middlewares?: array
  reducers?: function
}
```

这个config 需要提供三类信息,第一个必选的modules,即 model 的集合,项目的所有 model 需要被集合到一个对象中,这个对象就是modules,如下

```
// rootModel就可以作为modules
const rootModel = {
    Counter: CounterModel
    ...
}
```
此外middlewares就是 redux 需要的中间件数组,此数组会被本框架在初始化过程中与内置的中间件合并,
reducers则是额外的reducer,也会与 model 中的 reducer 合并,比如在使用`connected-react-router`时可以将Router reducer 作为额外的 reducer 导入,这样本框架初始化后就具备的在 redux 中操作路由的能力