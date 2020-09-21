import type { DatabaseConnection } from './interface.js'
// https://github.com/kevinpollet/typescript-es-modules-node-example

export async function create(...args: any[]): Promise<DatabaseConnection>{
    if (window) {
        return await (await import('./browser.js')).create()
    } else {
        return await (await import('./node.js')).create(args[0])
    }
}