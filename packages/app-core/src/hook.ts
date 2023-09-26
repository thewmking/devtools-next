import { target } from '@vue-devtools-next/shared'
import type { AppRecord } from '@vue-devtools-next/schema'
import { DevToolsHooks } from '@vue-devtools-next/schema'
import type { App } from 'vue'
import { createDevToolsContext } from './context'

 type HookAppInstance = App & { _instance: { type: { devtools: { hide: boolean } } } }

export const HOOK = target.__VUE_DEVTOOLS_GLOBAL_HOOK__

export function createDevToolsHook() {
  // override directly
  target.__VUE_DEVTOOLS_GLOBAL_HOOK__ = {
    appRecords: [],
    apps: {},
    events: new Map<DevToolsHooks, Function[]>(),
    on(event, fn) {
      if (!this.events.has(event))
        this.events.set(event, [])

      this.events.get(event)?.push(fn)
      // cleanup function
      return () => this.off(event, fn)
    },
    once(event, fn) {
      const onceFn = (...args) => {
        this.off(event, onceFn)
        fn(...args)
      }

      this.on(event, onceFn)
      return [event, onceFn] as const
    },
    off(event, fn) {
      if (this.events.has(event)) {
        const eventCallbacks = this.events.get(event)!
        const index = eventCallbacks.indexOf(fn)
        if (index !== -1)
          eventCallbacks.splice(index, 1)
      }
    },
    emit(event, ...payload) {
      if (this.events.has(event))
        this.events.get(event)!.forEach(fn => fn(...payload))
    },
  }
  return target.__VUE_DEVTOOLS_GLOBAL_HOOK__
}

function collectHookBuffer() {
  const hook = target.__VUE_DEVTOOLS_GLOBAL_HOOK__
  const hookBuffer = target.__VUE_DEVTOOLS_GLOBAL_HOOK_BUFFER__
  const collectEvents = target.__VUE_DEVTOOLS_GLOBAL_HOOK_BUFFER_COLLECT_EVENT__
  // app init hook
  const appInitCleanup = hook.on(DevToolsHooks.APP_INIT, (app: HookAppInstance, version: string) => {
    if (app?._instance?.type?.devtools?.hide)
      return

    hook.appRecords.push({
      id: app._uid,
      app,
      version,
    })
    hookBuffer.push([DevToolsHooks.APP_INIT, { app, version }])
  })

  // component added hook
  const componentAddedCleanup = hook.on(DevToolsHooks.COMPONENT_ADDED, (app: HookAppInstance) => {
    if (app?._instance?.type?.devtools?.hide)
      return

    hookBuffer.push([DevToolsHooks.COMPONENT_ADDED, {
      app,
    }])
  })

  // component updated hook
  const componentUpdatedCleanup = hook.on(DevToolsHooks.COMPONENT_UPDATED, (...args) => {
    hookBuffer.push([DevToolsHooks.COMPONENT_UPDATED, {
      ...args,
    }])
  })

  // component removed hook
  const componentRemovedCleanup = hook.on(DevToolsHooks.COMPONENT_REMOVED, (app: HookAppInstance) => {
    if (app?._instance?.type?.devtools?.hide)
      return

    hookBuffer.push([DevToolsHooks.COMPONENT_REMOVED, {
      app,
    }])
  })

  // component emit hook
  const componentEmitCleanup = hook.on(DevToolsHooks.COMPONENT_EMIT, (...args) => {
    hookBuffer.push([DevToolsHooks.COMPONENT_EMIT, {
      ...args,
    }])
  })

  collectEvents.push(...[
    appInitCleanup,
    componentAddedCleanup,
    componentUpdatedCleanup,
    componentRemovedCleanup,
    componentEmitCleanup,
  ])
  // @TODO: handle dynamic router
}

export function initDevTools() {
  createDevToolsHook()
  target.__VUE_DEVTOOLS_GLOBAL_HOOK_BUFFER__ ??= []
  target.__VUE_DEVTOOLS_GLOBAL_HOOK_BUFFER_COLLECT_EVENT__ ??= []
  target.__VUE_DEVTOOLS_CTX__ = createDevToolsContext()
  collectHookBuffer()
}

export function checkVueAppInitialized() {
  const hook = target.__VUE_DEVTOOLS_GLOBAL_HOOK__
  return new Promise<AppRecord>((resolve, reject) => {
    if (hook.appRecords.length) {
      resolve(hook.appRecords[0])
    }
    else {
      const timer = setInterval(() => {
        const hook = target.__VUE_DEVTOOLS_GLOBAL_HOOK__

        if (hook.appRecords.length) {
          clearInterval(timer)
          resolve(hook.appRecords[0])
        }
      }, 200)

      // @TODO: reject logic
    }
  })
}
