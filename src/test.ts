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

let remove = {"users": ["username"]} as const


function test<STATE extends { [a: string]: { [a: string]: any } }, REMOVE extends { [a: string]: readonly string[] }>
                (_objectStores: STATE, removeObjectStores: REMOVE): 
                {
                    [K in keyof STATE]: Pick<STATE[K], Exclude<keyof STATE[K], REMOVE[K]>>
                }
                {
                    return null as any
                }

let value = test(state, remove)