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

    abstract createObjectStore(name: string, options: IDBObjectStoreParameters): DatabaseObjectStore;
}

export abstract class DatabaseObjectStore {

    abstract createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters): IDBIndex;
}

type ExtractStrict<T, U extends T> = Extract<T, U>;
type ExcludeStrict<T, U extends T> = Exclude<T, U>;

// https://github.com/microsoft/TypeScript/issues/30312
type Id<T extends object> = {} & { [P in keyof T]: T[P] }

// removing all columns would remove the object store (especially removing the primary key)
export type DatabaseSchemaColumn = {
    //objectStore: string

    primaryKey?: boolean; // only one of this can be in a database but this simplifies merging
    autoIncrement?: boolean; // only one of this can be in a database but this simplifies merging
    //name: string
    keyPath: string | string[]
    options?: IDBIndexParameters
}

export type DatabaseObjectStores = { [a: string]: DatabaseColumns; };

export type DatabaseColumns = { [a: string]: DatabaseSchemaColumn; };

export type DatabaseSchema<T extends DatabaseObjectStores> = {
    version: number
    objectStores: T
}

export type Migration<OBJECTSTORES extends DatabaseObjectStores, C extends DatabaseObjectStores, N extends number, D extends RemoveObjectStoreColumns<OBJECTSTORES>> = {
    fromVersion: number
    toVersion: N
    baseSchema: DatabaseSchema<OBJECTSTORES>
    addedColumns: C
    removedColumns: readonly D[]
}

// https://github.com/microsoft/TypeScript/issues/32771
// https://github.com/microsoft/TypeScript/issues/35101

// T is the object
type RemoveObjectStoreColumns<TEMPLATE> = Readonly<{
    [K in keyof TEMPLATE]?: readonly (keyof TEMPLATE[K])[]
}>

type Entry<T> = {
    [K in keyof T]: [key: K, value: T[K]]
}[keyof T]

type Entries<T> = Entry<T>[]
  
function entries<T>(obj: T): Entries<T> {
    return Object.entries(obj) as any;
}

function fromEntries<T>(entries: Entries<T>): T {
    return Object.fromEntries(entries) as any
}

function merge<A extends DatabaseObjectStores, B extends DatabaseObjectStores>(state: A, migration: B): A & B {
    return Object.assign({}, state, migration)
}

function test<D extends RemoveObjectStoreColumns<OBJECTSTORES>, OBJECTSTORES extends DatabaseObjectStores>
                (_objectStores: OBJECTSTORES, removeObjectStores: D): 
                {
                    [K in keyof OBJECTSTORES]: Pick<OBJECTSTORES[K], Exclude<keyof OBJECTSTORES[K], D[K]>>
                } {    
    //let objectStores = JSON.parse(JSON.stringify(_objectStores))
    //removeObjectStores.forEach(removeObjectStore => {
    //    let objectStore = objectStores[removeObjectStore[0]]
    //    removeObjectStore[1].forEach(removeColumn => delete objectStore[removeColumn])
    //})
    //return objectStores
    return null as any
}
/*
// IsNever<keyof COLUMNS & keyof C>
export function migrate<T extends boolean, B extends (keyof OBJECTSTORES), C extends DatabaseObjectStores, OBJECTSTORES extends DatabaseObjectStores, N extends number, D extends RemoveObjectStoreColumns<OBJECTSTORES>>(alwaysTrue: T, migration: Migration<OBJECTSTORES, C, N, D>): {
    version: N,
    objectStores: Id<Pick<OBJECTSTORES, Exclude<keyof OBJECTSTORES, B>> & C>
} {
    if (!alwaysTrue) {
        throw new Error("alwaysTrue needs to be true to check whether an index is added twice.")
    }
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
    posts: {
        title: {
            keyPath: "title"
        },
        content: {
            keyPath: "content"
        }
    }
} as const

let fldsjf = test(state, {"users": ["username"]} as const)

// https://developers.google.com/closure/compiler/docs/api-tutorial3