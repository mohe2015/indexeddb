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

    async abstract database<T extends DatabaseSchema<COLUMNS>, COLUMNS extends DatabaseColumns>(name: string, version: number, onUpgrade: (database: Database<T, COLUMNS>, oldVersion: number, newVersion: number) => void): Promise<Database<T, COLUMNS>>;
}

export abstract class Database<T extends DatabaseSchema<COLUMNS>, COLUMNS extends DatabaseColumns> {

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
export type DatabaseSchemaColumn = Readonly<{
    //objectStore: string

    primaryKey?: boolean; // only one of this can be in a database but this simplifies merging
    autoIncrement?: boolean; // only one of this can be in a database but this simplifies merging
    //name: string
    keyPath: string | string[]
    options?: IDBIndexParameters
}>

export type DatabaseColumns = Readonly<{ [a: string]: DatabaseSchemaColumn; }>;

export type DatabaseSchema<T extends DatabaseColumns> = Readonly<{
    version: number
    columns: T
}>

export type Migration<COLUMNS extends DatabaseColumns, A extends DatabaseSchema<COLUMNS>, C extends DatabaseColumns, B extends Readonly<keyof COLUMNS>> = Readonly<{
    fromVersion: number
    toVersion: number
    baseSchema: A
    addedColumns: C
    removedColumns: Readonly<ExtractStrict<keyof COLUMNS, B>[]>
}>

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

function merge<A extends DatabaseColumns, B extends DatabaseColumns>(state: A, migration: B): A & B {
    return Object.assign({}, state, migration)
}

function test<B extends (keyof COLUMNS), COLUMNS extends DatabaseColumns>(dictionary: COLUMNS, remove: readonly B[]) {    
    let theEntries = entries<COLUMNS>(dictionary)
    let filteredEntries = theEntries.filter(entry => !(remove as ReadonlyArray<string>).includes(entry[0])) as Entries<Pick<COLUMNS, Exclude<keyof COLUMNS, B>>>
    return fromEntries(filteredEntries)
}

export function migrate<T extends IsNever<keyof COLUMNS & keyof C>, A extends DatabaseSchema<COLUMNS>, B extends keyof COLUMNS, C extends DatabaseColumns, COLUMNS extends DatabaseColumns>(alwaysTrue: T, migration: Migration<COLUMNS, A, C, B>): {
    version: number,
    columns: Id<Pick<COLUMNS, Exclude<keyof COLUMNS, ExtractStrict<keyof COLUMNS, B>>> & C>
} {
    if (!alwaysTrue) {
        throw new Error("alwaysTrue needs to be true to check whether an index is added twice.")
    }
    if (migration.baseSchema.version !== migration.fromVersion) {
        throw new Error("migration baseVersion doesn't match fromVersion!")
    }
    let removed = test(migration.baseSchema.columns, migration.removedColumns)
    let merged = merge(removed, migration.addedColumns)
    return {
        version: migration.toVersion,
        columns: merged
    } 
}

// https://developers.google.com/closure/compiler/docs/api-tutorial3