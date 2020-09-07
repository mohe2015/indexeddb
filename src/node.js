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

// https://docs.mongodb.com/drivers/node/

class MongoDBDatabase extends Database {

  /**
   * @private
   * @param {string} uri
   */
  constructor(uri) {
    super();
    this.database = new MongoClient(uri);
  }

  /**
   * @param {any} uri
   * @param {any} version
   * @returns Promise<MongoDBDatabase>
   */
  static async create(uri, version) {
    let database = new MongoDBDatabase(uri);
    await database.connect();
    return database;
  }

  async connect() {
    await this.database.connect();
  }
}

export const create = MongoDBDatabase.create;