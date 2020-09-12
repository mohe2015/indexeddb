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

import type { IsExact, IsNever } from "@dev.mohe/conditional-type-checks";

/**
 * @abstract
 */
export abstract class DatabaseConnection {

    static async create(uri: string): Promise<DatabaseConnection> {
        throw new Error("not implemented")
    }

    async abstract database<OBJECTSTORES extends DatabaseObjectStores, VERSION extends number, T extends DatabaseSchema<OBJECTSTORES, VERSION>>(name: string, version: number, onUpgrade: (database: Database<OBJECTSTORES, VERSION, T>, oldVersion: number, newVersion: number) => void): Promise<Database<OBJECTSTORES, VERSION, T>>;
}

export abstract class Database<OBJECTSTORES extends DatabaseObjectStores, VERSION extends number, T extends DatabaseSchema<OBJECTSTORES, VERSION>> {
}

export abstract class DatabaseObjectStore {

}

export type ExtractStrict<T, U extends T> = Extract<T, U>;
export type ExcludeStrict<T, U extends T> = Exclude<T, U>;

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

export type DatabaseSchema<OBJECTSTORES extends DatabaseObjectStores, VERSION extends number> = {
    version: VERSION
    objectStores: OBJECTSTORES // maybe generic
}

export type RemoveColumns<OBJECTSTORES> = { [K in keyof OBJECTSTORES]?: { [K1 in keyof OBJECTSTORES[K]]?: DatabaseSchemaColumn | null } }

type keyValuesInBoth<A, B> = { [K in (keyof A & keyof B)]: keyof B[K] }

type dictionaryIntersection<A, B> = keyValuesInBoth<A, B> & keyValuesInBoth<B, A>

type magicNeverToEmpty<ccc, B> = IsExact<Pick<ccc, Extract<keyof ccc, B>>, {}>

export type Migration<
                    OBJECTSTORES extends DatabaseObjectStores,
                    STATE extends DatabaseSchema<OBJECTSTORES, FROMVERSION>,
                    ADD extends DatabaseObjectStores,
                    REMOVE extends RemoveColumns<OBJECTSTORES>,
                    T extends magicNeverToEmpty<dictionaryIntersection<OBJECTSTORES, ADD>, keyof OBJECTSTORES & keyof ADD>,
                    U extends IsNever<Exclude<keyof REMOVE, keyof OBJECTSTORES>>,
                    FROMVERSION extends number,
                    TOVERSION extends number> = {
    noDuplicateColumnsAlwaysFalse: T // HACK this is a typescript hack - please help me removing it
    noNonexistentRemovesAlwaysTrue: U // HACK this is a typescript hack - please help me removing it
    fromVersion: FROMVERSION
    toVersion: TOVERSION
    baseSchema: STATE
    addedColumns: ADD
    removedColumns: REMOVE
}

function mergeObjectStores<A extends DatabaseObjectStores, B extends DatabaseObjectStores>(state: A, migration: B): A & B {
    let copy: DatabaseObjectStores = {}
    for (const [key, value] of Object.entries(state)) {
        copy[key] = value
    }
    for (const [key, value] of Object.entries(migration)) {
        copy[key] = Object.assign({}, state[key], value)
    }
    return copy as A & B
}

const objectMap = <T, Y>(obj: { [a: string]: T; }, mapFn: (value: T, key: string, index: number) => Y) =>
  Object.fromEntries(
    Object.entries(obj).map(
      ([k, v], i) => [k, mapFn(v, k, i)]
    )
  )

const objectFilter = <T>(obj: { [a: string]: T; }, filterFn: (value: T, key: string, index: number) => boolean) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([k, v], i) => filterFn(v, k, i)
    )
  )

function removeColumns<OBJECTSTORES extends DatabaseObjectStores, REMOVE extends RemoveColumns<OBJECTSTORES>>
                (objectStores: OBJECTSTORES, removeObjectStores: REMOVE): 
                {
                    [K in keyof OBJECTSTORES]: Pick<OBJECTSTORES[K], Exclude<keyof OBJECTSTORES[K], keyof REMOVE[K]>>
                } {
    return objectMap(objectStores, (value, key, index) => {
        let removeObjectStoreColumns = removeObjectStores[key]
        return objectFilter(value, (value, key, index) => {
            return removeObjectStoreColumns === undefined || removeObjectStoreColumns[key] === undefined
        })
    }) as { [K in keyof OBJECTSTORES]: Pick<OBJECTSTORES[K], Exclude<keyof OBJECTSTORES[K], keyof REMOVE[K]>>; }
}

export function migrate<OBJECTSTORES extends DatabaseObjectStores,
                        STATE extends DatabaseSchema<OBJECTSTORES, FROMVERSION>,
                        ADD extends DatabaseObjectStores,
                        REMOVE extends RemoveColumns<OBJECTSTORES>,
                        T extends magicNeverToEmpty<dictionaryIntersection<OBJECTSTORES, ADD>, keyof OBJECTSTORES & keyof ADD>,
                        U extends IsNever<Exclude<keyof REMOVE, keyof OBJECTSTORES>>,
                        FROMVERSION extends number,
                        TOVERSION extends number,
                        MIGRATION extends Migration<OBJECTSTORES, STATE, ADD, REMOVE, T, U, FROMVERSION, TOVERSION>>(migration: MIGRATION) {
    if (migration.noDuplicateColumnsAlwaysFalse) {
        throw new Error("noDuplicateColumnsAlwaysFalse needs to be false to check whether a duplicate column was added.")
    }
    if (!migration.noNonexistentRemovesAlwaysTrue) {
        throw new Error("noNonexistentRemovesAlwaysTrue needs to be true to check whether a nonexistent column was removed.")
    }
    let removed = removeColumns(migration.baseSchema.objectStores, migration.removedColumns)
    console.log(removed)
    let merged = mergeObjectStores(removed, migration.addedColumns)
    return {
        version: migration.toVersion,
        objectStores: merged
    } 
}

let objectStores = {
    users: {
        username: {
            keyPath: "username"
        },
        password: {
            keyPath: "password"
        }
    },
} as const

let baseSchema = {
    version: 1,
    objectStores
} as const

let addedColumns = {
    users: {
        usegrname: {
            keyPath: "usegrname"
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

let removedColumns = {"users": {"username": null}} as const

let migration: Migration<typeof objectStores, typeof baseSchema, typeof addedColumns, typeof removedColumns, false, true, 1, 2> = {
    noDuplicateColumnsAlwaysFalse: false,
    noNonexistentRemovesAlwaysTrue: true,
    fromVersion: 1,
    toVersion: 2,
    baseSchema,
    addedColumns,
    removedColumns
} as const

let result = migrate<typeof objectStores, typeof baseSchema, typeof addedColumns, typeof removedColumns, false, true, 1, 2, typeof migration>(migration)

console.log(result)

// https://developers.google.com/closure/compiler/docs/api-tutorial3