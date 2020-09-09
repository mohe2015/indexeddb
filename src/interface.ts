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

    async abstract database<T extends DatabaseSchema>(name: string, version: number, onUpgrade: (database: Database<T>, oldVersion: number, newVersion: number) => void): Promise<Database<T>>;
}

export abstract class Database<T extends DatabaseSchema> {

    abstract createObjectStore(name: string, options: IDBObjectStoreParameters): DatabaseObjectStore;
}

export abstract class DatabaseObjectStore {

    abstract createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters): IDBIndex;
}

type ExtractStrict<T, U extends T> = Extract<T, U>;
type ExcludeStrict<T, U extends T> = Exclude<T, U>;

// https://github.com/microsoft/TypeScript/issues/30312
type Id<T extends object> = {} & { [P in keyof T]: T[P] }

export interface DatabaseSchemaIndex {
    //objectStore: string

    autoIncrement?: boolean; // only one of this can be in a database but this simplifies merging
    //name: string
    keyPath: string | string[]
    options?: IDBIndexParameters
}

export type DatabaseIndexes = { [a: string]: DatabaseSchemaIndex; };

export type DatabaseSchema = {
    version: number
    indexes: DatabaseIndexes
}

export type Migration<A extends DatabaseSchema, C extends DatabaseIndexes, B extends keyof A["indexes"]> = {
    version: number
    baseSchema: A
    addedIndexes: C
    removedIndexes: Readonly<ExtractStrict<keyof A["indexes"], B>[]>
}

// https://github.com/microsoft/TypeScript/issues/32771
// https://github.com/microsoft/TypeScript/issues/35101

type Entries<T> = {
    [K in keyof T]: [K, T[K]]
}[keyof T][]
  
function entries<T>(obj: T): Entries<T> {
    return Object.entries(obj) as any;
}

function fromEntries<T>(entries: Entries<T>): T {
    return Object.fromEntries(entries) as any
}

function merge<A extends DatabaseIndexes, B extends DatabaseIndexes>(state: A, migration: B): A & B {
    return Object.assign({}, state, migration)
}

function test<A extends DatabaseSchema, B extends (keyof A["indexes"])>(dictionary: A, remove: readonly B[]) {    
    let theEntries = entries<A["indexes"]>(dictionary.indexes)
    let filteredEntries = theEntries.filter(entry => !(remove as ReadonlyArray<string>).includes(entry[0])) as Entries<Pick<A["indexes"], Exclude<keyof A["indexes"], B>>>
    return fromEntries(filteredEntries)
}

export function migrate<T extends IsNever<keyof A["indexes"] & keyof C>, A extends DatabaseSchema, B extends keyof A["indexes"], C extends DatabaseIndexes>(alwaysTrue: T, migration: Migration<A, C, B>): {
    version: number,
    indexes: Id<Pick<A["indexes"], Exclude<keyof A["indexes"], Extract<keyof A["indexes"], B>>> & C>
} {
    if (!alwaysTrue) {
        throw new Error("alwaysTrue needs to be true to check whether an index is added twice.")
    }
    let removed = test(migration.baseSchema, migration.removedIndexes)
    let merged = merge(removed, migration.addedIndexes)
    return {
        version: migration.version,
        indexes: merged
    } 
}

// https://developers.google.com/closure/compiler/docs/api-tutorial3