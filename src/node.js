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
import { Database } from './interface';

// https://docs.mongodb.com/drivers/node/

class MongoDBDatabase extends Database {

  /**
   * @param {MongoClient} database
   */
  constructor(database) {
    super();
    this.database = database;
  }

  /**
   * @param {any} uri
   * @param {any} version
   * @returns Promise<MongoDBDatabase>
   */
  static async create(uri, version) {
    let database = new MongoClient(uri);
    await database.connect();
    return new MongoDBDatabase(database);
  }
}

export const create = MongoDBDatabase.create;