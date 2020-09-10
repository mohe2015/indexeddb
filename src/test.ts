type Id<T extends object> = {} & { [P in keyof T]: T[P] }

let state = {
    users: {
        username: {
            keyPath: "username"
        },
        password: {
            keyPath: "password"
        }
    },
    posts: {
        title: {
            keyPath: "title"
        },
        content: {
            keyPath: "content"
        }
    }
} as const

let remove = {"users": {"username":null, "password": null}, "posts": {"title": null}} as const

function test<STATE extends { [a: string]: { [a: string]: any } }, REMOVE extends { [K in keyof STATE]?: { [K1 in keyof STATE[K]]?: any } }>
                (_objectStores: STATE, removeObjectStores: REMOVE): 
                Id<{
                    [K in keyof STATE]: Pick<STATE[K], Exclude<keyof STATE[K], keyof REMOVE[K]>>
                }>
                {
                    return null as any
                }

export let value = test(state, remove)