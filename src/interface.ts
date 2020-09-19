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

// https://github.com/microsoft/TypeScript/issues/30825
export type OmitStrict<ObjectType, KeysType extends keyof ObjectType> = Pick<ObjectType, ExcludeStrict<keyof ObjectType, KeysType>>;

export type PickStrict<ObjectType, KeysType extends keyof ObjectType> = Pick<ObjectType, ExtractStrict<keyof ObjectType, KeysType>>;

export type ExcludeStrict<ObjectKeysType, KeysType extends ObjectKeysType> = ObjectKeysType extends KeysType ? never : ObjectKeysType;

export type ExtractStrict<ObjectKeysType, KeysType extends ObjectKeysType> = ObjectKeysType extends KeysType ? ObjectKeysType : never;

// removing all columns would remove the object store (especially removing the primary key)
export type DatabaseSchemaColumn = {
    primaryKey?: boolean; // only one of this can be in a database but this simplifies merging
    autoIncrement?: boolean; // only one of this can be in a database but this simplifies merging
    //name: string
    keyPath?: string | string[]
    options?: IDBIndexParameters
}

export type ObjectStore = { [a: string]: DatabaseSchemaColumn }

export type ObjectStores = { [a: string]: ObjectStore; };

export type Migration<FROMVERSION extends number, TOVERSION extends number, OLDOBJECTSTORES extends ObjectStores, REMOVED extends WithOnlyKeysOf<OLDOBJECTSTORES>, ADDED extends WithoutKeysOf<OLDOBJECTSTORES>> = {
    fromVersion: FROMVERSION
    toVersion: TOVERSION
    baseSchema: SchemaWithoutMigration<FROMVERSION, OLDOBJECTSTORES>
    addedColumns: ADDED
    removedColumns: REMOVED
}

export type SchemaWithoutMigration<VERSION extends number, OBJECTSTORES extends ObjectStores> = {
    version: VERSION,
    objectStores: OBJECTSTORES
}

export type SchemaWithMigration<
                                        VERSION extends number,
                                        FROMVERSION extends number,
                                        TOVERSION extends number,
                                        OLDOBJECTSTORES extends ObjectStores,
                                        REMOVED extends WithOnlyKeysOf<OLDOBJECTSTORES>,
                                        ADDED extends WithoutKeysOf<OLDOBJECTSTORES>> =
                                    SchemaWithoutMigration<VERSION, OLDOBJECTSTORES> & {
        
    migration: Migration<FROMVERSION, TOVERSION, OLDOBJECTSTORES, REMOVED, ADDED> | null
}

const objectMap = <T, Y>(obj: { [a: string]: T; }, mapFn: (value: T, key: string, index: number) => Y) =>
  Object.fromEntries(
    Object.entries(obj).map(
      ([k, v], i) => [k, mapFn(v, k, i)]
    )
  )

const objectFilter = <T>(obj: { [a: string]: T; }, filterFn: (value: T, key: string, index: number) => boolean) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([k, v], i) => filterFn(v, k, i)
    )
  )

function removeColumns<OLDOBJECTSTORES extends ObjectStores, REMOVE extends WithOnlyKeysOf<OLDOBJECTSTORES>>
                (objectStores: OLDOBJECTSTORES, removeObjectStores: REMOVE): 
                {
                    [K in ExtractStrict<keyof OLDOBJECTSTORES, keyof REMOVE>]: OmitStrict<OLDOBJECTSTORES[K], keyof REMOVE[K]>
                }
                &
                {
                    [K in ExcludeStrict<keyof OLDOBJECTSTORES, keyof REMOVE>]: OLDOBJECTSTORES[K]
                } {
    return objectMap(objectStores, (value, key, index) => {
        let removeObjectStoreColumns = removeObjectStores[key]
        return objectFilter(value, (value, key, index) => {
            return removeObjectStoreColumns === undefined || removeObjectStoreColumns[key] === undefined
        })
    }) as {
        [K in ExtractStrict<keyof OLDOBJECTSTORES, keyof REMOVE>]: OmitStrict<OLDOBJECTSTORES[K], keyof REMOVE[K]>
    }
    &
    {
        [K in ExcludeStrict<keyof OLDOBJECTSTORES, keyof REMOVE>]: OLDOBJECTSTORES[K]
    }
}

function mergeObjectStores<A extends ObjectStores, B extends ObjectStores>(state: A, migration: B): A & B {
    let copy: ObjectStores = {}
    for (const [key, value] of Object.entries(state)) {
        copy[key] = value
    }
    for (const [key, value] of Object.entries(migration)) {
        copy[key] = Object.assign({}, state[key], value)
    }
    return copy as A & B
}

export function migrate<
                    FROMVERSION extends number,
                    TOVERSION extends number,
                    OLDOBJECTSTORES extends ObjectStores,
                    REMOVED extends WithOnlyKeysOf<OLDOBJECTSTORES>,
                    ADDED extends WithoutKeysOf<OLDOBJECTSTORES>>
                 (migration: Migration<FROMVERSION, TOVERSION, OLDOBJECTSTORES, REMOVED, ADDED>)
                 : SchemaWithMigration<TOVERSION, FROMVERSION, TOVERSION, OLDOBJECTSTORES, REMOVED, ADDED> {
    return {
        migration,
        version: migration.toVersion,
        objectStores: mergeObjectStores(removeColumns(migration.baseSchema.objectStores, migration.removedColumns), migration.addedColumns)
    }
}


// type which doesnt contain any nested keys from the other object store (for added
export type WithoutKeysOf<A extends ObjectStores> =
{
    [K in keyof A]?: 
    {
        [K1 in keyof A[K]]?: never
    }
    &
    {
        [propName: string]: any;
    }
}
&
{
    [propName: string]: any;
}

// TODO FIXME
// https://github.com/microsoft/TypeScript/pull/29317
// https://github.com/microsoft/TypeScript/issues/38254
export type WithOnlyKeysOf<A extends ObjectStores> =
{
    [K in keyof A]?: (
        {
            [K1 in keyof A[K]]?: any;
        }
    )
}

// https://developers.google.com/closure/compiler/docs/api-tutorial3