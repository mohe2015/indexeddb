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

import { MongoClient } from 'mongodb';
import { Database, DatabaseConnection, DatabaseObjectStore } from './interface';

// https://docs.mongodb.com/drivers/node/

class MongoDatabaseConnection extends DatabaseConnection {

  /**
   * @param {MongoClient} databaseConnection
   */
  constructor(databaseConnection) {
    super();
    this.databaseConnection = databaseConnection;
  }

  /**
   * @param {string} uri
   * @returns {Promise<MongoDatabaseConnection>}
   */
  static async create(uri) {
    let database = new MongoClient(uri);
    await database.connect();
    return new MongoDatabaseConnection(database);
  }

  /**
   * 
   * @param {any} name
   * @param {any} version has to be at least 1
   * @returns {Promise<MongoDatabase>}
   */
  async database(name, version) {
    let database = this.databaseConnection.db(name)
    // TODO FIXME implement upgradeneeded manually
    return new MongoDatabase(database)
  }
}

class MongoDatabase extends Database {

  /**
   * @param {import("mongodb").Db} database
   */
  constructor(database) {
    super()
    this.database = database
  }

  /**
   * @param {string} name 
   * @param {IDBObjectStoreParameters} options 
   * @returns {Promise<DatabaseObjectStore>}
   */
  async createObjectStore(name, options) {
   // options.keyPath
    let collection = await this.database.createCollection(name, {
      autoIndexId: options.autoIncrement,
    })
    let index = await collection.createIndex(options.keyPath, {
      
    })
  }
}

export const create = MongoDatabaseConnection.create;