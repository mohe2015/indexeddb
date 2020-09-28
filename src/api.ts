import type { DatabaseConnection } from "./interface";

export async function create(uri: string): Promise<DatabaseConnection> {
    if (global) {
        return (await import("./node.js")).create(uri!)
    } else {
        return (await import("./browser.js")).create(uri!)
    }
}