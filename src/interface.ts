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

export interface DatabaseSchemaIndex {
    //objectStore: string

    autoIncrement?: boolean; // only one of this can be in a database but this simplifies merging
    //name: string
    keyPath: string | string[]
    options?: IDBIndexParameters
}

export type Migration<A, B extends keyof A> = {
    addedIndexes: { [a: string]: DatabaseSchemaIndex; }
    removedIndexes: Readonly<ExtractStrict<keyof A, B>[]>
}

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

function merge<A extends { [a: string]: DatabaseSchemaIndex; }, B extends { [a: string]: DatabaseSchemaIndex; }>(state: A, migration: B): A & B {
    return Object.assign({}, state, migration)
}

const merged = merge({}, migration1.addedIndexes)

function test<A extends { [a: string]: DatabaseSchemaIndex; }, B extends (keyof A)>(dictionary: A, remove: readonly B[]) {    
    let theEntries = entries<A>(dictionary)
    let filteredEntries = theEntries.filter(entry => !(remove as ReadonlyArray<string>).includes(entry[0])) as Entries<Pick<A, Exclude<keyof A, B>>>
    return fromEntries(filteredEntries)
}

let migration2: Migration<typeof merged, "test.name"> = {
    addedIndexes: {},
    removedIndexes: ["test.name"] as const
}

const merged1 = merge(merged, migration2.addedIndexes)

// TODO FIXME state and migration need to be connected
const removed = test(merged, migration2.removedIndexes)


const thisshouldnswork = test(merged1, migration2)