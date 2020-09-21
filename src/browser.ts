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

import {
  Database,
  DatabaseObjectStore,
  DatabaseConnection,
  DatabaseSchemaWithoutMigration,
  DatabaseObjectStores,
  WithoutKeysOf,
  DatabaseSchemaWithMigration,
  ExcludeStrict,
  ExtractStrict,
  OmitStrict,
  isWithMutation,
  DatabaseMigration,
} from './interface';

export class IndexedDatabaseConnection extends DatabaseConnection {
  private constructor() {
    super();
  }

  static async create() {
    return new IndexedDatabaseConnection();
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
    return new Promise((resolve, reject) => {
      const databaseOpenRequest = window.indexedDB.open(name, schema.version);

      databaseOpenRequest.addEventListener('success', (event) => {
        resolve(new IndexedDatabase(databaseOpenRequest.result));
      });
      databaseOpenRequest.addEventListener('error', (event) => {
        reject(databaseOpenRequest.error);
      });
      databaseOpenRequest.addEventListener('blocked', (event) => {
        reject(new Error('database blocked'));
      });
      databaseOpenRequest.addEventListener('upgradeneeded', (event) => {
        let database = new IndexedDatabase(databaseOpenRequest.result);
        try {
          let oldVersion = event.oldVersion;

          console.log("old version: ", oldVersion)

          let outstandingMigrations = [];

          let currentMigration: DatabaseMigration<number, number, DatabaseObjectStores, DatabaseObjectStores, WithoutKeysOf<DatabaseObjectStores>, OLDSCHEMA> = schema.migration

          while (true) {
            if (currentMigration) {
              outstandingMigrations.push(currentMigration)
              console.log("added migration ", currentMigration)
              if (currentMigration.fromVersion === oldVersion) {
                break;
              }
              
              let oldState = currentMigration.baseSchema;
              if (isWithMutation(oldState)) {
                currentMigration = oldState.migration
              } else {
                throw new Error("missing migrations")
              }
            }
          }

          // TODO FIXME run and also check validity
          outstandingMigrations.reverse().forEach(migration => {
            console.log("running migration: ", migration)
            for (const [objectStoreName, objectStore] of Object.entries(migration.removedColumns)) {
              for (const [columnName, column] of Object.entries(objectStore)) {
                if (column.primaryKey) {
                  console.log("delete object store: ", objectStoreName)
                  databaseOpenRequest.result.deleteObjectStore(objectStoreName)
                } else if (column.index) {
                  console.log(`delete index without removing data: ${objectStoreName}.${columnName}`)
                  databaseOpenRequest.transaction!.objectStore(objectStoreName).deleteIndex(columnName)
                } else {
                  console.log(`delete column without removing data ${objectStoreName}.${columnName}`)
                }
              }
            }
            for (const [objectStoreName, objectStore] of Object.entries<DatabaseObjectStore>(migration.addedColumns)) { 
              for (const [columnName, column] of Object.entries(objectStore)) {
                if (column.primaryKey) {
                  console.log("create object store: ", objectStoreName)
                  databaseOpenRequest.result.createObjectStore(objectStoreName, {
                    autoIncrement: column.autoIncrement,
                    keyPath: column.keyPath
                  })
                } else if (column.index) {
                  databaseOpenRequest.transaction!.objectStore(objectStoreName).createIndex(columnName, column.keyPath, column.options)
                  console.log(`add index without adding data [WARNING: no default value can break database queries]: ${objectStoreName}.${columnName}`)
                } else {
                  console.log(`add column without adding data [WARNING: no default value can break database queries]: ${objectStoreName}.${columnName}`)
                }
              }
            }
          })
        } catch (error) {
          console.log(error);
          databaseOpenRequest.transaction!.abort();
          reject(error);
        }
        // onsuccess gets called automatically
      });
    });
  }
}

export class IndexedDatabase<FROMVERSION extends number,
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
>> extends Database<FROMVERSION, TOVERSION, OLDOBJECTSTORES, REMOVED, ADDED, AFTERREMOVED, OLDSCHEMA, SCHEMA> {
  database: IDBDatabase;

  constructor(database: IDBDatabase) {
    super();
    this.database = database;
  }

  /*createObjectStore(
    name: string,
    options: IDBObjectStoreParameters,
  ): IndexedDatabaseObjectStore {
    let objectStore = this.database.createObjectStore(name, options);
    return new IndexedDatabaseObjectStore(objectStore);
  }*/
}
/*
class IndexedDatabaseObjectStore extends DatabaseObjectStore {
  objectStore: IDBObjectStore;

  constructor(objectStore: IDBObjectStore) {
    super();
    this.objectStore = objectStore;
  }

  createIndex(
    name: string,
    keyPath: string | string[],
    options?: IDBIndexParameters,
  ) {
    return this.objectStore.createIndex(name, keyPath, options);
  }
}
*/
export const create = IndexedDatabaseConnection.create;
