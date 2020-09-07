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

import { Database, DatabaseObjectStore, DatabaseConnection } from './interface'

class IndexedDatabaseConnection extends DatabaseConnection {

    /**
     * @private
     */
    constructor() {
        super()
    }

    /**
     * @param {string} uri
     * @returns {Promise<IndexedDatabaseConnection>}
     */
    static async create(uri) {
        return new IndexedDatabaseConnection()
    }

    /**
     * 
     * @param {any} name
     * @param {any} version has to be at least 1
     * @param {(database: IndexedDatabase, oldVersion: number, newVersion: number) => void} onUpgrade
     * @returns {Promise<IndexedDatabase>}
     */
    async database(name, version, onUpgrade) {
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
                    onUpgrade(database, event.oldVersion, event.newVersion)
                } catch (error) {
                    console.log(error)
                    databaseOpenRequest.transaction.abort()
                    reject(error)
                }
                // onsuccess gets called automatically
            })
        })
    }
}

class IndexedDatabase extends Database {

    /**
     * @param {IDBDatabase} database
     */
    constructor(database) {
        super();
        this.database = database
    }

    /**
     * @param {string} name
     * @param {IDBObjectStoreParameters} options
     * @returns {IndexedDatabaseObjectStore}
     */
    createObjectStore(name, options) {
        let objectStore = this.database.createObjectStore(name, options)
        return new IndexedDatabaseObjectStore(objectStore)
    }
}

class IndexedDatabaseObjectStore extends DatabaseObjectStore {
    
    /**
     * @param {IDBObjectStore} objectStore
     */
    constructor(objectStore) {
        super();
        this.objectStore = objectStore
    }

    /**
     * 
     * @param {string} name 
     * @param {string | string[]} keyPath 
     * @param {IDBIndexParameters} [options]
     * @returns {IDBIndex}
     */
    createIndex(name, keyPath, options) {
        return this.objectStore.createIndex(name, keyPath, options)
    }
}

export const create = IndexedDatabaseConnection.create;