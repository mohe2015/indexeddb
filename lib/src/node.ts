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

import MongoDB from 'mongodb';
import { Database, DatabaseConnection, DatabaseObjectStore, DatabaseObjectStores, DatabaseSchemaWithMigration, DatabaseSchemaWithoutMigration, ExcludeStrict, ExtractStrict, OmitStrict, WithoutKeysOf } from './interface.js';
import { getOutstandingMigrations } from './utils.js';

// https://docs.mongodb.com/drivers/node/

// TODO FIXME https://docs.mongodb.com/manual/core/schema-validation/

export class MongoDatabaseConnection extends DatabaseConnection {
  databaseConnection: MongoDB.MongoClient;

  constructor(databaseConnection: MongoDB.MongoClient) {
    super();
    this.databaseConnection = databaseConnection;
  }

  static async create(uri: string): Promise<MongoDatabaseConnection> {
    let database = new MongoDB.MongoClient(uri, { useUnifiedTopology: true });
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

    let migrations = database.collection("_config")

    await this.databaseConnection.withSession(async (session) => {
      session.withTransaction(async () => {
       // try {
          let version = (await migrations.findOne<{value: number}>({ key: "version" }))?.value || 1
      
          if (version < schema.version) {
            let migrations = getOutstandingMigrations(schema, version)

            // this could should be really similar to the one in browser.ts
            for (const migration of migrations) {
              console.log("running migration: ", migration)
              for (const [objectStoreName, objectStore] of Object.entries(migration.removedColumns)) {
                for (const [columnName, column] of Object.entries(objectStore)) {
                  if ("primaryKeyOptions" in column) {
                    console.log("delete object store: ", objectStoreName)
                    database.dropCollection(objectStoreName)
                  } else if ("indexOptions" in column) {
                    console.log(`delete index without removing data: ${objectStoreName}.${columnName}`)
                    database.collection(objectStoreName).dropIndex(columnName)
                  } else {
                    //if (!(await database.collections()).some(collection => collection.collectionName === objectStoreName)) {
                    //  throw new Error(`tried deleting column ${objectStoreName}.${columnName} but object store ${objectStoreName} does not exist!`)
                    //}
                    console.log(`delete column without removing data ${objectStoreName}.${columnName}`)
                  }
                }
              }
              for (const [objectStoreName, objectStore] of Object.entries<DatabaseObjectStore>(migration.addedColumns)) { 
                for (const [columnName, column] of Object.entries(objectStore)) {
                  if ("primaryKeyOptions" in column) {
                    console.log(`create object store: ${objectStoreName}`, column.primaryKeyOptions)
                    if (column.primaryKeyOptions.autoIncrement) {
                      if (columnName !== "_id") {
                        throw new Error("mongodb only supports autoincrement primary keys named _id")
                      }
                    } else {
                      await database.createCollection(objectStoreName)
                      await database.collection(objectStoreName).createIndex(columnName, { unique: true })
                    }
                  } else if ("indexOptions" in column) {
                    console.log(`add index without adding data [WARNING: no default value can break database queries]: ${objectStoreName}.${columnName}`, column.indexOptions)
                    await database.collection(objectStoreName).createIndex(columnName, {
                      unique: column.indexOptions.unique,
                      
                    });
                  } else {
                    //if (!(await database.collections()).some(collection => collection.collectionName === objectStoreName)) {
                    //  throw new Error(`tried adding column ${objectStoreName}.${columnName} but object store ${objectStoreName} does not exist!`)
                    //}
                    console.log(`add column without adding data [WARNING: no default value can break database queries]: ${objectStoreName}.${columnName}`)
                  }
                }
              }
            }
          }

          await migrations.updateOne({ key: "version" }, { value: schema.version }, { upsert: true })
        /*} catch (error) {
          if (error instanceof MongoDB.MongoError) {
            console.log("mongodb error while migrating ", error)
          } else {
            console.log("unknown error while migrating ", error)
          }
          console.log("aborting transaction...")
          await session.abortTransaction()
        }*/
      })
    })
    
    return new MongoDatabase(database);
  }
}

export class MongoDatabase<
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
  database: MongoDB.Db;

  constructor(database: MongoDB.Db) {
    super();
    this.database = database;
  }

  /*async createObjectStore(
    name: string,
    options: IDBObjectStoreParameters,
  ): Promise<DatabaseObjectStore> {
    let collection = await this.database.createCollection(name, {
      autoIndexId: options.autoIncrement,
    });
    let index = await collection.createIndex(options.keyPath, {});
    throw new Error('not implemented');
  }*/
}

export const create = MongoDatabaseConnection.create;
