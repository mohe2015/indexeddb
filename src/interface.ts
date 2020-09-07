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
     * @abstract
     * @param {any} name the name of the database
     * @param {any} version has to be at least 1
     * @param {(database: Database, oldVersion: number, newVersion: number) => void} onUpgrade
     * The problem is that the indexeddb update handler has to be synchronous and is the only place to change the schema.
     * The mongodb database needs promises so we can't run a custom update handler as these would be incompatible
     * The idea would be to create an array of the migrations per version / easier would be to specify a schema (then renames are probably not possible)
     * @template T
     * @returns {Promise<Database<T>>}
     */
    async database(name, version, onUpgrade) {
        throw new Error("not implemented")
    }
}

/**
 * @abstract
 * @template T {DatabaseSchema}
 */
export class Database {


}

/**
 * @abstract
 */
export class DatabaseObjectStore {

}

/**
 * 
 * @typedef DatabaseSchema
 * @property {DatabaseSchemaObjectStore[]} objectStores
 */

 /**
  * 
  * @typedef DatabaseSchemaObjectStore
  * @property {string} name
  * @property {IDBObjectStoreParameters} options
  * @property {DatabaseSchemaIndex[]} indexes
  */

  /**
   * @typedef DatabaseSchemaIndex
   * @property {string} name 
   * @property {string | string[]} keyPath 
   * @property {IDBIndexParameters} [options]
   */