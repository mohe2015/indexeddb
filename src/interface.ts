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

//type Id<T extends object> = {} & { [P in keyof T]: T[P] }

// idea for new version: maybe add the primary key settings to the object store and put columns into "columns" child.
// then the primary key things could probably also be checked correctly

// removing a object store should maybe work using a "removeObjectStores"

// indexes maybe also in extra "addIndexes" and "removeIndexes"

// but this all would probably make type inference way more complicated

// https://github.com/microsoft/TypeScript/issues/30825
export type OmitStrict<ObjectType, KeysType extends keyof ObjectType> = Pick<
  ObjectType,
  ExcludeStrict<keyof ObjectType, KeysType>
>;

export type PickStrict<ObjectType, KeysType extends keyof ObjectType> = Pick<
  ObjectType,
  ExtractStrict<keyof ObjectType, KeysType>
>;

export type ExcludeStrict<
  ObjectKeysType,
  KeysType extends ObjectKeysType
> = ObjectKeysType extends KeysType ? never : ObjectKeysType;

export type ExtractStrict<
  ObjectKeysType,
  KeysType extends ObjectKeysType
> = ObjectKeysType extends KeysType ? ObjectKeysType : never;

// removing all columns would remove the object store (especially removing the primary key)

export type PrimaryKeyDatabaseColumn = {
  primaryKeyOptions: IDBObjectStoreParameters;
};

export type IndexDatabaseColumn = {
  //keyPath: string | string[]
  indexOptions: Omit<IDBIndexParameters, 'multiEntry'>;
};

export type BaseDatabaseColumn = {
  //keyPath?: string | string[];
};

export type DatabaseColumn =
  | PrimaryKeyDatabaseColumn
  | IndexDatabaseColumn
  | BaseDatabaseColumn;

export type DatabaseObjectStore = { [a: string]: DatabaseColumn };

export type DatabaseObjectStores = { [a: string]: DatabaseObjectStore };

export type DatabaseMigration<
  FROMVERSION extends number,
  TOVERSION extends number,
  OLDOBJECTSTORES extends DatabaseObjectStores,
  REMOVED extends DatabaseObjectStores,
  ADDED extends WithoutKeysOf<OLDOBJECTSTORES>,
  SCHEMA extends DatabaseSchemaWithoutMigration<FROMVERSION, OLDOBJECTSTORES>
> = {
  fromVersion: FROMVERSION;
  toVersion: TOVERSION;
  baseSchema: SCHEMA;
  addedColumns: ADDED;
  removedColumns: REMOVED;
};

export interface DatabaseSchemaWithoutMigration<
  VERSION extends number,
  OBJECTSTORES extends DatabaseObjectStores
> {
  version: VERSION;
  objectStores: OBJECTSTORES;
}

export interface DatabaseSchemaWithMigration<
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
  OLDSCHEMA extends DatabaseSchemaWithoutMigration<FROMVERSION, OLDOBJECTSTORES>
> extends DatabaseSchemaWithoutMigration<TOVERSION, AFTERREMOVED & ADDED> {
  migration: DatabaseMigration<
    FROMVERSION,
    TOVERSION,
    OLDOBJECTSTORES,
    REMOVED,
    ADDED,
    OLDSCHEMA
  >;
}

export function isWithMutation<
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
  B extends DatabaseSchemaWithMigration<
    FROMVERSION,
    TOVERSION,
    OLDOBJECTSTORES,
    REMOVED,
    ADDED,
    AFTERREMOVED,
    OLDSCHEMA
  >
>(schema: OLDSCHEMA | B): schema is B {
  return (schema as B).migration !== undefined;
}

const objectMap = <T, Y>(
  obj: { [a: string]: T },
  mapFn: (value: T, key: string, index: number) => Y,
) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v], i) => [k, mapFn(v, k, i)]),
  );

const objectFilter = <T>(
  obj: { [a: string]: T },
  filterFn: (value: T, key: string, index: number) => boolean,
) =>
  Object.fromEntries(
    Object.entries(obj).filter(([k, v], i) => filterFn(v, k, i)),
  );

function removeColumns<
  OLDOBJECTSTORES extends DatabaseObjectStores,
  REMOVED extends DatabaseObjectStores,
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
    }
>(objectStores: OLDOBJECTSTORES, removeObjectStores: REMOVED): AFTERREMOVED {
  return objectMap(objectStores, (value, key, index) => {
    let removeObjectStoreColumns = removeObjectStores[key];
    return objectFilter(value, (value, key, index) => {
      return (
        removeObjectStoreColumns === undefined ||
        removeObjectStoreColumns[key] === undefined
      );
    });
  }) as AFTERREMOVED;
}

function mergeObjectStores<
  A extends DatabaseObjectStores,
  B extends DatabaseObjectStores
>(state: A, migration: B): A & B {
  let copy: DatabaseObjectStores = {};
  for (const [key, value] of Object.entries(state)) {
    copy[key] = value;
  }
  for (const [key, value] of Object.entries(migration)) {
    copy[key] = Object.assign({}, state[key], value);
  }
  return copy as A & B;
}

export function migrate<
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
  OLDSCHEMA extends DatabaseSchemaWithoutMigration<FROMVERSION, OLDOBJECTSTORES>
>(
  migration: DatabaseMigration<
    FROMVERSION,
    TOVERSION,
    OLDOBJECTSTORES,
    REMOVED,
    ADDED,
    OLDSCHEMA
  >,
): DatabaseSchemaWithMigration<
  FROMVERSION,
  TOVERSION,
  OLDOBJECTSTORES,
  REMOVED,
  ADDED,
  AFTERREMOVED,
  OLDSCHEMA
> {
  return {
    migration,
    version: migration.toVersion,
    objectStores: mergeObjectStores<AFTERREMOVED, ADDED>(
      removeColumns<OLDOBJECTSTORES, REMOVED, AFTERREMOVED>(
        migration.baseSchema.objectStores,
        migration.removedColumns,
      ),
      migration.addedColumns,
    ),
  };
}

// type which doesnt contain any nested keys from the other object store (for added
export type WithoutKeysOf<A extends DatabaseObjectStores> = {
  [K in keyof A]?: {
    [K1 in keyof A[K]]?: never;
  } & {
    [propName: string]: any;
  };
} & {
  [propName: string]: any;
};

// TODO FIXME
// https://github.com/microsoft/TypeScript/pull/29317
// https://github.com/microsoft/TypeScript/issues/38254
export type WithOnlyKeysOf<A extends DatabaseObjectStores> = {
  [K in keyof A]?: {
    [K1 in keyof A[K]]?: any;
  };
};

// https://developers.google.com/closure/compiler/docs/api-tutorial3

export abstract class DatabaseConnection {
  // TODO FIXME implement deletion

  // TODO FIXME implement listing databases

  abstract database<
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
  >;

  abstract close(): Promise<void>;
}

export abstract class Database<
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
> {}
