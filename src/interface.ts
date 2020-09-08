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

import { assert as typeAssert, IsNever } from "@dev.mohe/conditional-type-checks";

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
/*
export interface DatabaseSchema {
    objectStores: DatabaseSchemaObjectStore[]
}

export interface DatabaseSchemaObjectStore {
    name: string
    options: IDBObjectStoreParameters
    indexes: DatabaseSchemaIndex[]
}

export interface DatabaseSchemaIndex {
    name: string
    keyPath: string | string[]
    options?: IDBIndexParameters
}
*/

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

export type Migration<A extends { [a: string]: DatabaseSchemaIndex; }, B extends keyof A, C extends { [a: string]: DatabaseSchemaIndex; } = { [a: string]: DatabaseSchemaIndex; }> = {
    addedIndexes: C
    removedIndexes: Readonly<ExtractStrict<keyof A, B>[]>
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

function merge<A extends { [a: string]: DatabaseSchemaIndex; } = { [a: string]: DatabaseSchemaIndex; }, B extends { [a: string]: DatabaseSchemaIndex; } = { [a: string]: DatabaseSchemaIndex; }>(state: A, migration: B): A & B {
    return Object.assign({}, state, migration)
}

function test<A extends { [a: string]: DatabaseSchemaIndex; }, B extends (keyof A)>(dictionary: A, remove: readonly B[]) {    
    let theEntries = entries<A>(dictionary)
    let filteredEntries = theEntries.filter(entry => !(remove as ReadonlyArray<string>).includes(entry[0])) as Entries<Pick<A, Exclude<keyof A, B>>>
    return fromEntries(filteredEntries)
}

function migrate<T extends IsNever<keyof A & B>, A extends { [a: string]: DatabaseSchemaIndex; } = { [a: string]: DatabaseSchemaIndex; }, B extends keyof A = keyof A, C extends { [a: string]: DatabaseSchemaIndex; } = { [a: string]: DatabaseSchemaIndex; }>(alwaysTrue: T, state: A, migration: Migration<A, B, C>): Id<Pick<A & C, Exclude<keyof A, Extract<keyof A, B>> | Exclude<keyof C, Extract<keyof A, B>>>> {
    let merged = merge(state, migration.addedIndexes)
    let removed = test(merged, migration.removedIndexes)
    return removed 
}

type test = ("sdffd" | "dfs") & ("sdfd" | "dsflsfi")

let migration1 = {
    addedIndexes: {
        "test.name": {
            keyPath: "name",
        },
        "test.value": {
            keyPath: "name",
        }
    },
    removedIndexes: []
}

let a = {}
let merged = migrate(true, a, migration1)

/*
let migration2: Migration<typeof merged, "test.name", {}> = {
    addedIndexes: {},
    removedIndexes: ["test.name"] as const
}*/

//typeAssert<IsNever<keyof typeof merged & keyof typeof migration1.addedIndexes>>(true);
//let merged1 = migrate(merged, migration1)

// TODO FIXME state and migration need to be connected
// currently they only fail when the migration is incompatible

// https://developers.google.com/closure/compiler/docs/api-tutorial3