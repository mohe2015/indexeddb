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


SPDX-FileCopyrightText: 2020 Moritz Hedtke <Moritz.Hedtke@t-online.de>

SPDX-License-Identifier: AGPL-3.0-or-later
*/
// @ts-check

// https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

import {
  Database,
  DatabaseSchemaObjectStore,
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
  DatabaseTransaction,
  DatabaseObjectStore,
  DatabaseObjectStoreOrIndex,
} from './interface';
import { getOutstandingMigrations } from './utils';

export class IndexedDatabaseConnection extends DatabaseConnection {
  private constructor() {
    super();
  }

  static async create(_: any) {
    return new IndexedDatabaseConnection();
  }

  async close() {
    // no-op
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
    OLDSCHEMA extends DatabaseSchemaWithoutMigration<
      FROMVERSION,
      OLDOBJECTSTORES
    >,
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
    name: string,
    schema: SCHEMA,
  ): Promise<
    Database<
      FROMVERSION,
      TOVERSION,
      OLDOBJECTSTORES,
      REMOVED,
      ADDED,
      AFTERREMOVED,
      OLDSCHEMA,
      SCHEMA
    >
  > {
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
          if (oldVersion === 0) oldVersion = 1; // this is a bug in firefox - if the initial creation aborts firefox still sets the version to 1

          console.log('old version: ', oldVersion);

          let outstandingMigrations = getOutstandingMigrations(
            schema,
            oldVersion,
          );

          // this could should be really similar to the one in node.ts
          outstandingMigrations.forEach((migration) => {
            console.log('running migration: ', migration);
            for (const [objectStoreName, objectStore] of Object.entries(
              migration.removedColumns,
            )) {
              for (const [columnName, column] of Object.entries(objectStore)) {
                if ('primaryKeyOptions' in column) {
                  console.log('delete object store: ', objectStoreName);
                  databaseOpenRequest.result.deleteObjectStore(objectStoreName);
                } else if ('indexOptions' in column) {
                  console.log(
                    `delete index without removing data: ${objectStoreName}.${columnName}`,
                  );
                  databaseOpenRequest
                    .transaction!.objectStore(objectStoreName)
                    .deleteIndex(columnName);
                } else {
                  if (
                    !databaseOpenRequest.result.objectStoreNames.contains(
                      objectStoreName,
                    )
                  ) {
                    throw new Error(
                      `tried deleting column ${objectStoreName}.${columnName} but object store ${objectStoreName} does not exist!`,
                    );
                  }
                  console.log(
                    `delete column without removing data ${objectStoreName}.${columnName}`,
                  );
                }
              }
            }
            for (const [objectStoreName, objectStore] of Object.entries<
              DatabaseSchemaObjectStore
            >(migration.addedColumns)) {
              for (const [columnName, column] of Object.entries(objectStore)) {
                if ('primaryKeyOptions' in column) {
                  console.log(
                    `create object store: ${objectStoreName}`,
                    column.primaryKeyOptions,
                  );
                  databaseOpenRequest.result.createObjectStore(
                    objectStoreName,
                    column.primaryKeyOptions,
                  );
                } else if ('indexOptions' in column) {
                  console.log(
                    `add index without adding data [WARNING: no default value can break database queries]: ${objectStoreName}.${columnName}`,
                    column.indexOptions,
                  );
                  databaseOpenRequest
                    .transaction!.objectStore(objectStoreName)
                    .createIndex(columnName, columnName, column.indexOptions);
                } else {
                  if (
                    !databaseOpenRequest.result.objectStoreNames.contains(
                      objectStoreName,
                    )
                  ) {
                    throw new Error(
                      `tried adding column ${objectStoreName}.${columnName} but object store ${objectStoreName} does not exist!`,
                    );
                  }
                  console.log(
                    `add column without adding data [WARNING: no default value can break database queries]: ${objectStoreName}.${columnName}`,
                  );
                }
              }
            }
          });
        } catch (error) {
          databaseOpenRequest.transaction!.abort();
          reject(error);
        }
        // onsuccess gets called automatically
      });
    });
  }
}

export class IndexedDatabase<
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
  OLDSCHEMA extends DatabaseSchemaWithoutMigration<
    FROMVERSION,
    OLDOBJECTSTORES
  >,
  SCHEMA extends DatabaseSchemaWithMigration<
    FROMVERSION,
    TOVERSION,
    OLDOBJECTSTORES,
    REMOVED,
    ADDED,
    AFTERREMOVED,
    OLDSCHEMA
  >
> extends Database<
  FROMVERSION,
  TOVERSION,
  OLDOBJECTSTORES,
  REMOVED,
  ADDED,
  AFTERREMOVED,
  OLDSCHEMA,
  SCHEMA
> {
  database: IDBDatabase;

  constructor(database: IDBDatabase) {
    super();
    this.database = database;
  }

  // Transactions are started when the transaction is created, not when the first request is placed; for example consider this:
  // Requests are executed in the order in which they were made against the
  // transaction, and their results are returned in the same order.
  async transaction(objectStores: string[], mode: "readonly" | "readwrite"): Promise<IndexedDatabaseTransaction> {
    /*
const tx = db.transaction('keyval', 'readwrite');
const store = tx.objectStore('keyval');
const val = (await store.get('counter')) || 0;
await store.put(val + 1, 'counter');
await tx.done;
*/

    const transaction: IDBTransaction = this.database.transaction(
      objectStores,
      mode,
    );
    return new IndexedDatabaseTransaction(transaction)
  }
}

class IndexedDatabaseTransaction extends DatabaseTransaction {
  transaction: IDBTransaction;
  done: Promise<void>

  constructor(transaction: IDBTransaction) {
    super()
    this.transaction = transaction

    this.done = new Promise((resolve, reject) => {
      this.transaction.addEventListener('abort', (event) => {
        reject(event)
      })
      this.transaction.addEventListener('complete', (event) => {
        resolve(/*event*/)
      })
      this.transaction.addEventListener('error', (event) => {
        reject(event)
      })
    })
  }

  objectStore(name: string): DatabaseObjectStore {
    return new IndexedDatabaseObjectStore(this.transaction.objectStore(name))
  }
}

function handleRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener('error', (event) => {
      reject(event)
    })
    request.addEventListener('success', (event) => {
      resolve(request.result)
    })
  })
}

export class IndexedDatabaseObjectStoreOrIndex extends DatabaseObjectStoreOrIndex {
  objectStoreOrIndex: IDBObjectStore | IDBIndex

  constructor(objectStoreOrIndex: IDBObjectStore | IDBIndex) {
    super()
    this.objectStoreOrIndex = objectStoreOrIndex
  }

  async count(key?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey): Promise<any> {
    return handleRequest(this.objectStoreOrIndex.count(key))
  }

  async get(key: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey): Promise<any> {
    return handleRequest(this.objectStoreOrIndex.get(key))
  }

  async getKey(key: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey): Promise<IDBValidKey | undefined> {
    return handleRequest(this.objectStoreOrIndex.getKey(key))
  }

  async getAll(key?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey, count?: number): Promise<any[]> {
    return handleRequest(this.objectStoreOrIndex.getAll(key, count))
  }

  async getAllKeys(key?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey, count?: number): Promise<IDBValidKey[]> {
    return handleRequest(this.objectStoreOrIndex.getAllKeys(key, count))
  }

  async openCursor(key?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange, direction?: "next" | "nextunique" | "prev" | "prevunique"): Promise<IDBCursorWithValue | null> {
    return new IndexedDatabaseCursor(this.objectStoreOrIndex.openCursor(key, direction)).get()
  }

  async openKeyCursor(key?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange, direction?: "next" | "nextunique" | "prev" | "prevunique"): Promise<IDBCursor | null> {
    return handleRequest(this.objectStoreOrIndex.openKeyCursor(key, direction))
  }
}

export class IndexedDatabaseObjectStore extends IndexedDatabaseObjectStoreOrIndex {
  objectStore: IDBObjectStore

  constructor(objectStore: IDBObjectStore) {
    super(objectStore)
    this.objectStore = objectStore
  }

  async add(key: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | undefined, value: any): Promise<any> {
    return handleRequest(this.objectStore.add(value, key))
  }

  async clear(): Promise<void> {
    return handleRequest(this.objectStore.clear())
  }

  async delete(key: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey): Promise<any> {
    return handleRequest(this.objectStore.delete(key))
  }

  // TODO FIXME depending on mongodb this could be synchronous
  // TODO FIXME index class
  async index(name: string): Promise<IDBIndex> {
    return this.objectStore.index(name)
  }

  async put(key: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | undefined, value: any): Promise<any> {
    return handleRequest(this.objectStore.put(value, key))
  }
}

export class IndexedDatabaseCursor {
  cursorRequest: IDBRequest<IDBCursorWithValue | null>;

  constructor(cursorRequest: IDBRequest<IDBCursorWithValue | null>) {
    this.cursorRequest = cursorRequest
  }

  async get() {
    new Promise<IDBCursorWithValue | null>((resolve, reject) => {
      this.cursorRequest.addEventListener('error', (event) => {
        reject(event)
      }, {
        once: true
      })
      this.cursorRequest.addEventListener('success', (event) => {
        resolve(this.cursorRequest.result)
      }, {
        once: true
      })
    })
  }

  async continue(key?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | undefined): Promise<IDBCursorWithValue | null> {
    return new Promise<IDBCursorWithValue | null>((resolve, reject) => {

      this.cursorRequest.addEventListener('error', (event) => {
        reject(event)
      }, {
        once: true
      })

      this.cursorRequest.addEventListener('success', (event) => {
        resolve(this.cursorRequest.result)
      }, {
        once: true
      })

      this.cursorRequest.result!.continue(key)
    })
  }
}

export const create = IndexedDatabaseConnection.create;
