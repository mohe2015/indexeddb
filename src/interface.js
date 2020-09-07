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
// @ts-check

// https://jsdoc.app/

/**
 * @abstract
 */
export class DatabaseConnection {

    /**
     * 
     * @abstract
     * @param {string} uri
     * @returns {Promise<DatabaseConnection>}d
     */
    static async create(uri) {
        throw new Error("not implemented")
    }

    /**
     * 
     * @abstract
     * @param {any} name the name of the database
     * @param {any} version has to be at least 1
     * @returns {Promise<Database>}
     */
    async database(name, version) {
        throw new Error("not implemented")
    }
}

/**
 * @abstract
 */
export class Database {

    /**
     * @name createObjectStore
     * @abstract
     * @param {string} name 
     * @param {IDBObjectStoreParameters} options 
     * @returns DatabaseObjectStore
     */
    createObjectStore(name, options) {
        throw new Error("not implemented")
    }
}

/**
 * @abstract
 */
export class DatabaseObjectStore {

}