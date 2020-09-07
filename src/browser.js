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
     * @returns {Promise<IndexedDatabase>}
     */
    async database(name, version) {
        return new Promise((resolve, reject) => {
            const databaseOpenRequest = window.indexedDB.open(name, version);
            
            databaseOpenRequest.addEventListener("success", (event) => {
                resolve(new IndexedDatabase(databaseOpenRequest.result));
            })
            databaseOpenRequest.addEventListener("error", (event) => {
                console.error(event)
                reject("failed to open database")
            })
            databaseOpenRequest.addEventListener("blocked", (event) => {
                // TODO FIXME
                console.error(event)
                reject("database blocked")
            })
            databaseOpenRequest.addEventListener("upgradeneeded", (event) => {
                // TODO FIXME
                console.error(event)
                reject("upgrade needed")
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
}

export const create = IndexedDatabaseConnection.create;