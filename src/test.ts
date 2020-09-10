export 

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

let remove = {"users": {"username":null}} as const

function test<STATE extends { [a: string]: { [a: string]: any } }, REMOVE extends { [K in keyof STATE]?: { [K1 in keyof STATE[K]]?: any } }>
                (_objectStores: STATE, removeObjectStores: REMOVE): 
                {
                    [K in keyof STATE]: Pick<STATE[K], Exclude<keyof STATE[K], keyof REMOVE[K]>>
                }
                {
                    return null as any
                }

let value = test(state, remove)