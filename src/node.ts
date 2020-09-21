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

import { Db, MongoClient } from 'mongodb';
import { Database, DatabaseConnection, DatabaseObjectStore, DatabaseObjectStores, DatabaseSchemaWithMigration, DatabaseSchemaWithoutMigration, ExcludeStrict, ExtractStrict, OmitStrict, WithoutKeysOf } from './interface';

// https://docs.mongodb.com/drivers/node/

class MongoDatabaseConnection extends DatabaseConnection {
  databaseConnection: MongoClient;

  constructor(databaseConnection: MongoClient) {
    super();
    this.databaseConnection = databaseConnection;
  }

  static async create(uri: string): Promise<MongoDatabaseConnection> {
    let database = new MongoClient(uri);
    await database.connect();
    return new MongoDatabaseConnection(database);
  }

  async database<
    FROMVERSION extends number,
    TOVERSION extends number,
    OLDOBJECTSTORES extends DatabaseObjectStores,
    REMOVED extends DatabaseObjectStores,
    ADDED extends WithoutKeysOf<OLDOBJECTSTORES>,
    AFTERREMOVED extends {
      [K in ExtractStrict<keyof OLDOBJECTSTORES, keyof REMOVED>]: OmitStrict<
        OLDOBJECTSTORES[K],
        keyof REMOVED[K]
      >;
    } &
      {
        [K in ExcludeStrict<
          keyof OLDOBJECTSTORES,
          keyof REMOVED
        >]: OLDOBJECTSTORES[K];
      },
    OLDSCHEMA extends DatabaseSchemaWithoutMigration<FROMVERSION, OLDOBJECTSTORES>,
    SCHEMA extends DatabaseSchemaWithMigration<
      FROMVERSION,
      TOVERSION,
      OLDOBJECTSTORES,
      REMOVED,
      ADDED,
      AFTERREMOVED,
      OLDSCHEMA
    >
  >(
    name: string, schema: SCHEMA
  ): Promise<Database<FROMVERSION, TOVERSION, OLDOBJECTSTORES, REMOVED, ADDED, AFTERREMOVED, OLDSCHEMA, SCHEMA>> {
    let database = this.databaseConnection.db(name);
    // TODO FIXME implement upgradeneeded manually
    return new MongoDatabase(database);
  }
}

class MongoDatabase<
  FROMVERSION extends number,
  TOVERSION extends number,
  OLDOBJECTSTORES extends DatabaseObjectStores,
  REMOVED extends DatabaseObjectStores,
  ADDED extends WithoutKeysOf<OLDOBJECTSTORES>,
  AFTERREMOVED extends {
    [K in ExtractStrict<keyof OLDOBJECTSTORES, keyof REMOVED>]: OmitStrict<
      OLDOBJECTSTORES[K],
      keyof REMOVED[K]
    >;
  } &
    {
      [K in ExcludeStrict<
        keyof OLDOBJECTSTORES,
        keyof REMOVED
      >]: OLDOBJECTSTORES[K];
    },
    OLDSCHEMA extends DatabaseSchemaWithoutMigration<FROMVERSION, OLDOBJECTSTORES>,
    SCHEMA extends DatabaseSchemaWithMigration<
      FROMVERSION,
      TOVERSION,
      OLDOBJECTSTORES,
      REMOVED,
      ADDED,
      AFTERREMOVED,
      OLDSCHEMA
    >
  > extends Database<FROMVERSION, TOVERSION, OLDOBJECTSTORES, REMOVED, ADDED, AFTERREMOVED, OLDSCHEMA, SCHEMA> {
  database: Db;

  constructor(database: Db) {
    super();
    this.database = database;
  }

  async createObjectStore(
    name: string,
    options: IDBObjectStoreParameters,
  ): Promise<DatabaseObjectStore> {
    let collection = await this.database.createCollection(name, {
      autoIndexId: options.autoIncrement,
    });
    let index = await collection.createIndex(options.keyPath, {});
    throw new Error('not implemented');
  }
}

export const create = MongoDatabaseConnection.create;
