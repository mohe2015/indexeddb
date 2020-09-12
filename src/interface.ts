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

    async abstract database<OBJECTSTORES extends DatabaseObjectStores, T extends DatabaseSchema<OBJECTSTORES>>(name: string, version: number, onUpgrade: (database: Database<OBJECTSTORES, T>, oldVersion: number, newVersion: number) => void): Promise<Database<OBJECTSTORES, T>>;
}

export abstract class Database<OBJECTSTORES extends DatabaseObjectStores, T extends DatabaseSchema<OBJECTSTORES>> {
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

export type DatabaseSchema<OBJECTSTORES extends DatabaseObjectStores> = {
    version: number
    objectStores: OBJECTSTORES // maybe generic
}

export type RemoveColumns<STATE> = { [K in keyof STATE]?: { [K1 in keyof STATE[K]]?: DatabaseSchemaColumn | null } }

export type Migration<
                    OBJECTSTORES extends DatabaseObjectStores = DatabaseObjectStores,
                    STATE extends DatabaseSchema<OBJECTSTORES> = DatabaseSchema<OBJECTSTORES>,
                    ADD extends DatabaseObjectStores = DatabaseObjectStores,
                    REMOVE extends RemoveColumns<OBJECTSTORES> = RemoveColumns<OBJECTSTORES>,
                    T extends IsNever<{ [K in keyof OBJECTSTORES]: keyof OBJECTSTORES[K] } & { [K in keyof ADD]: keyof ADD[K] }> = IsNever<{ [K in keyof OBJECTSTORES]: keyof OBJECTSTORES[K] } & { [K in keyof ADD]: keyof ADD[K] }>,
                    U extends IsNever<Exclude<keyof REMOVE, keyof OBJECTSTORES>> = IsNever<Exclude<keyof REMOVE, keyof OBJECTSTORES>>> = {
    noDuplicateColumnsAlwaysTrue: T // HACK this is a typescript hack - please help me removing it
    noNonexistentRemovesAlwaysTrue: U // HACK this is a typescript hack - please help me removing it
    fromVersion: number
    toVersion: number
    baseSchema: STATE
    addedColumns: ADD
    removedColumns: REMOVE
}

function mergeObjectStores<A extends DatabaseObjectStores, B extends DatabaseObjectStores, T extends IsNever<{ [K in keyof A]: keyof A[K] } & { [K in keyof B]: keyof B[K] }>>(alwaysTrue: T, state: A, migration: B): A & B {
    if (!alwaysTrue) {
        throw new Error("alwaysTrue needs to be true to check whether a nonexistent column was removed.")
    }
    return Object.assign({}, state, migration)
}

function removeColumns<OBJECTSTORES extends DatabaseObjectStores, REMOVE extends RemoveColumns<OBJECTSTORES>, T extends IsNever<Exclude<keyof REMOVE, keyof OBJECTSTORES>>>
                (alwaysTrue: T, objectStores: OBJECTSTORES, removeObjectStores: REMOVE): 
                {
                    [K in keyof OBJECTSTORES]: Pick<OBJECTSTORES[K], Exclude<keyof OBJECTSTORES[K], keyof REMOVE[K]>>
                } {
    if (!alwaysTrue) {
        throw new Error("alwaysTrue needs to be true to check whether a nonexistent column was removed.")
    }
    return null as any // TODO FIXME
}

export function migrate<T extends IsNever<{ [K in keyof OBJECTSTORES]: keyof OBJECTSTORES[K] } & { [K in keyof ADD]: keyof ADD[K] }>, U extends IsNever<Exclude<keyof REMOVE, keyof OBJECTSTORES>>, OBJECTSTORES extends DatabaseObjectStores, STATE extends DatabaseSchema<OBJECTSTORES>, ADD extends DatabaseObjectStores, REMOVE extends RemoveColumns<OBJECTSTORES>, MIGRATION extends Migration<OBJECTSTORES, STATE, ADD, REMOVE, T, U>>(migration: MIGRATION) {
    if (migration.baseSchema.version !== migration.fromVersion) {
        throw new Error("migration baseVersion doesn't match fromVersion!")
    }
    let removed = removeColumns(migration.noNonexistentRemovesAlwaysTrue, migration.baseSchema.objectStores, migration.removedColumns)
    let merged = mergeObjectStores(migration.noDuplicateColumnsAlwaysTrue, removed, migration.addedColumns)
    return {
        version: migration.toVersion,
        objectStores: merged
    } 
}

let state = {
    version: 1,
    objectStores: {
        users: {
            username: {
                keyPath: "username"
            },
            password: {
                keyPath: "password"
            }
        },
    }
} as const

let migration: Migration = {
    noDuplicateColumnsAlwaysTrue: true,
    noNonexistentRemovesAlwaysTrue: true,
    fromVersion: 1,
    toVersion: 2,
    baseSchema: state,
    addedColumns: {
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
    },
    removedColumns: {"users": {"username": null}, "posts": {"title": null}}
} as const

let result = migrate(migration)

// https://developers.google.com/closure/compiler/docs/api-tutorial3