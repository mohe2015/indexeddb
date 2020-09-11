/*
@dev.mohe/indexeddb - Make a database interface available that works in the browser and in nodejs
Copyright (C) 2020 Moritz Hedtke <Moritz.Hedtke@t-online.de>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General -Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

import type { IsNever } from "@dev.mohe/conditional-type-checks";

/**
 * @abstract
 */
export abstract class DatabaseConnection {

    static async create(uri: string): Promise<DatabaseConnection> {
        throw new Error("not implemented")
    }

    async abstract database<T extends DatabaseSchema<OBJECTSTORES>, OBJECTSTORES extends DatabaseObjectStores>(name: string, version: number, onUpgrade: (database: Database<T, OBJECTSTORES>, oldVersion: number, newVersion: number) => void): Promise<Database<T, OBJECTSTORES>>;
}

export abstract class Database<T extends DatabaseSchema<OBJECTSTORES>, OBJECTSTORES extends DatabaseObjectStores> {
}

export abstract class DatabaseObjectStore {

}

type ExtractStrict<T, U extends T> = Extract<T, U>;
type ExcludeStrict<T, U extends T> = Exclude<T, U>;

// removing all columns would remove the object store (especially removing the primary key)
export type DatabaseSchemaColumn = {
    //objectStore: string

    primaryKey?: boolean; // only one of this can be in a database but this simplifies merging
    autoIncrement?: boolean; // only one of this can be in a database but this simplifies merging
    //name: string
    keyPath: string | string[]
    options?: IDBIndexParameters
}

export type DatabaseColumns = { [a: string]: DatabaseSchemaColumn; };

export type DatabaseObjectStores = { [a: string]: DatabaseColumns; };

export type DatabaseSchema = {
    version: number
    objectStores: DatabaseObjectStores // maybe generic
}
/*
export type Migration<OBJECTSTORES extends DatabaseObjectStores, C extends DatabaseObjectStores, N extends number, D extends RemoveObjectStoreColumns<OBJECTSTORES>> = {
    fromVersion: number
    toVersion: N
    baseSchema: DatabaseSchema<OBJECTSTORES>
    addedColumns: C
    removedColumns: readonly D[]
}
*/
function mergeObjectStores<T extends IsNever<{ [K in keyof A]: keyof A[K] } & { [K in keyof B]: keyof B[K] }>, A extends DatabaseObjectStores, B extends DatabaseObjectStores>(alwaysTrue: T, state: A, migration: B): A & B {
    if (!alwaysTrue) {
        throw new Error("alwaysTrue needs to be true to check whether a nonexistent column was removed.")
    }
    return Object.assign({}, state, migration)
}

function removeColumns<STATE extends DatabaseObjectStores, REMOVE extends { [K in keyof STATE]?: { [K1 in keyof STATE[K]]?: DatabaseSchemaColumn | null } }, T extends IsNever<Exclude<keyof REMOVE, keyof STATE>>>
                (alwaysTrue: T, objectStores: STATE, removeObjectStores: REMOVE): 
                {
                    [K in keyof STATE]: Pick<STATE[K], Exclude<keyof STATE[K], keyof REMOVE[K]>>
                } {
    if (!alwaysTrue) {
        throw new Error("alwaysTrue needs to be true to check whether a nonexistent column was removed.")
    }
    return null as any // TODO FIXME
}

/*
// 
export function migrate<T extends boolean, B extends (keyof OBJECTSTORES), C extends DatabaseObjectStores, OBJECTSTORES extends DatabaseObjectStores, N extends number, D extends RemoveObjectStoreColumns<OBJECTSTORES>>(alwaysTrue: T, migration: Migration<OBJECTSTORES, C, N, D>): {
    version: N,
    objectStores: Id<Pick<OBJECTSTORES, Exclude<keyof OBJECTSTORES, B>> & C>
} {
    
    if (migration.baseSchema.version !== migration.fromVersion) {
        throw new Error("migration baseVersion doesn't match fromVersion!")
    }
    let removed = test(migration.baseSchema.objectStores, migration.removedColumns)
    let merged = merge(removed, migration.addedColumns)
    return {
        version: migration.toVersion,
        objectStores: merged
    } 
}*/

let state = {
    users: {
        username: {
            keyPath: "username"
        },
        password: {
            keyPath: "password"
        }
    },
} as const

let addedColumns = {
    users: {
        usegrname: {
            keyPath: "username"
        },
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

let newState = mergeObjectStores(true, state, addedColumns)

let removedColumns = {"users": {"username": null}} as const

let fldsjf = removeColumns(true, newState, removedColumns)



// https://developers.google.com/closure/compiler/docs/api-tutorial3