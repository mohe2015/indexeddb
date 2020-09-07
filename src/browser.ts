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
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/
// @ts-check

// https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

import { Database, DatabaseObjectStore, DatabaseConnection, DatabaseSchema } from './interface'

class IndexedDatabaseConnection extends DatabaseConnection {

    private constructor() {
        super()
    }

    static async create(uri: string) {
        return new IndexedDatabaseConnection()
    }

    async database<T extends DatabaseSchema>(name: string, version: number, onUpgrade: (database: Database<T>, oldVersion: number, newVersion: number) => void): Promise<Database<T>> {
        return new Promise((resolve, reject) => {
            const databaseOpenRequest = window.indexedDB.open(name, version);
            
            databaseOpenRequest.addEventListener("success", (event) => {
                resolve(new IndexedDatabase(databaseOpenRequest.result));
            })
            databaseOpenRequest.addEventListener("error", (event) => {
                reject(databaseOpenRequest.error)
            })
            databaseOpenRequest.addEventListener("blocked", (event) => {
                reject(new Error("database blocked"))
            })
            databaseOpenRequest.addEventListener("upgradeneeded", (event) => {                
                let database = new IndexedDatabase(databaseOpenRequest.result)
                try {
                    onUpgrade(database, event.oldVersion, event.newVersion!)
                } catch (error) {
                    console.log(error)
                    databaseOpenRequest.transaction!.abort()
                    reject(error)
                }
                // onsuccess gets called automatically
            })
        })
    }
}

class IndexedDatabase<T extends DatabaseSchema> extends Database<T> {
    database: IDBDatabase;

    constructor(database: IDBDatabase) {
        super();
        this.database = database
    }

    createObjectStore(name: string, options: IDBObjectStoreParameters): IndexedDatabaseObjectStore {
        let objectStore = this.database.createObjectStore(name, options)
        return new IndexedDatabaseObjectStore(objectStore)
    }
}

class IndexedDatabaseObjectStore extends DatabaseObjectStore {
    objectStore: IDBObjectStore;
    
    constructor(objectStore: IDBObjectStore) {
        super();
        this.objectStore = objectStore
    }

    createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters) {
        return this.objectStore.createIndex(name, keyPath, options)
    }
}

export const create = IndexedDatabaseConnection.create;