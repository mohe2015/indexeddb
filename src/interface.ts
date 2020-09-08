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

function merge<A extends { [a: string]: DatabaseSchemaIndex; }, B extends { [a: string]: DatabaseSchemaIndex; }>(state: A, migration: B): A & B {
    return Object.assign({}, state, migration)
}

const merged = merge({}, migration1.addedIndexes)

function test<A extends Record<string, DatabaseSchemaIndex>, B extends (keyof A)>(dictionary: A, remove: B[]): Record<ExcludeStrict<keyof A, B>, DatabaseSchemaIndex> {
    let entries: [keyof A, DatabaseSchemaIndex][] = Object.entries(dictionary)
    let filteredEntries = entries.filter(entry => !(remove as Array<string>).includes(entry[0])) as [ExcludeStrict<keyof A, B>, DatabaseSchemaIndex][]
    return Object.fromEntries(filteredEntries) as Record<ExcludeStrict<keyof A, B>, DatabaseSchemaIndex>
}

const removed = test(merged, ["test.name"])


/*
let migration3: Migration<typeof merged, "test.name"> = {
    addedIndexes: {},
    removedIndexes: ["test.name"] as const
}

function keyInKeys<A extends Record<string, any>>(dictionary: A) {
    return function (key: keyof A): key is keyof A {
        return Object.keys(dictionary).includes(key)
    }
}
*/