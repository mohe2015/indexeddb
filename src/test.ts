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
type OmitStrict<ObjectType, KeysType extends keyof ObjectType> = Pick<ObjectType, ExcludeStrict<keyof ObjectType, KeysType>>;

type PickStrict<ObjectType, KeysType extends keyof ObjectType> = Pick<ObjectType, ExtractStrict<keyof ObjectType, KeysType>>;

type ExcludeStrict<ObjectKeysType, KeysType extends ObjectKeysType> = ObjectKeysType extends KeysType ? never : ObjectKeysType;

type ExtractStrict<ObjectKeysType, KeysType extends ObjectKeysType> = ObjectKeysType extends KeysType ? ObjectKeysType : never;

export type TestMigration<FROMVERSION extends number, TOVERSION extends number, OLDOBJECTSTORES extends TestObjectStores, REMOVED extends WithOnlyKeysOf<OLDOBJECTSTORES>, ADDED extends WithoutKeysOf<OLDOBJECTSTORES>> = {
    fromVersion: FROMVERSION
    toVersion: TOVERSION
    baseSchema: TestSchemaWithoutMigration<FROMVERSION, OLDOBJECTSTORES>
    addedColumns: ADDED
    removedColumns: REMOVED
}

export type TestObjectStores = { [a: string]: any; };

export type TestSchemaWithoutMigration<VERSION extends number, NEWOBJECTSTORES extends TestObjectStores> = {
    version: VERSION,
    objectStores: NEWOBJECTSTORES
}

export type TestSchemaWithMigration<
                                        VERSION extends number,
                                        FROMVERSION extends number,
                                        TOVERSION extends number,
                                        OLDOBJECTSTORES extends TestObjectStores,
                                        REMOVED extends WithOnlyKeysOf<OLDOBJECTSTORES>,
                                        ADDED extends WithoutKeysOf<OLDOBJECTSTORES>,
                                        NEWOBJECTSTORES extends  {
                                            [K in ExtractStrict<keyof OLDOBJECTSTORES, keyof REMOVED>]: OmitStrict<OLDOBJECTSTORES[K], keyof REMOVED[K]>
                                        }
                                        &
                                        {
                                            [K in ExcludeStrict<keyof OLDOBJECTSTORES, keyof REMOVED>]: OLDOBJECTSTORES[K]
                                        }
                                        &
                                        ADDED> =
                                    TestSchemaWithoutMigration<VERSION, NEWOBJECTSTORES> & {
        
    migration: TestMigration<FROMVERSION, TOVERSION, OLDOBJECTSTORES, REMOVED, ADDED> | null
}

let schema1: TestSchemaWithoutMigration<1, {}> = {
    version: 1,
    objectStores: {}
}

let addedColumns1 = {
    users: {
        name: {

        },
        password: {

        }
    },
    posts: {
        title: {

        },
        author: {

        },
        publishedAt: {

        },
        description: {

        },
        content: {

        }
    }
}

let migration1: TestMigration<1, 2, {}, {}, typeof addedColumns1> = {
    fromVersion: schema1.version,
    toVersion: 2,
    baseSchema: schema1,
    addedColumns: addedColumns1,
    removedColumns: {},
}

function migrate<
                    FROMVERSION extends number,
                    TOVERSION extends number,
                    OLDOBJECTSTORES extends TestObjectStores,
                    REMOVED extends WithOnlyKeysOf<OLDOBJECTSTORES>,
                    ADDED extends WithoutKeysOf<OLDOBJECTSTORES>,
                    NEWOBJECTSTORES extends {
                        [K in ExtractStrict<keyof OLDOBJECTSTORES, keyof REMOVED>]: OmitStrict<OLDOBJECTSTORES[K], keyof REMOVED[K]>
                    }
                    &
                    {
                        [K in ExcludeStrict<keyof OLDOBJECTSTORES, keyof REMOVED>]: OLDOBJECTSTORES[K]
                    }
                    &
                    ADDED>
                 (migration: TestMigration<FROMVERSION, TOVERSION, OLDOBJECTSTORES, REMOVED, ADDED>)
                 : TestSchemaWithMigration<TOVERSION, FROMVERSION, TOVERSION, OLDOBJECTSTORES, REMOVED, ADDED, NEWOBJECTSTORES> {
    return {
        migration,
        version: migration.toVersion,
        objectStores: null as any as NEWOBJECTSTORES // TODO FIXME this is actually a wrong implementation
    }
}

let schema2 = migrate<1, 2, {}, {}, typeof addedColumns1, typeof addedColumns1>(migration1)

let removedColumns2 = {
    users: {
        name: {

        },
        password: {

        },
    },
}

let addedColumns2 = {
    posts: {
        titlee: {

        }
    },
}

let migration2: TestMigration<2, 3, typeof schema2["objectStores"], typeof removedColumns2, typeof addedColumns2> = {
    fromVersion: 2,
    toVersion: 3,
    baseSchema: schema2,
    removedColumns: removedColumns2,
    addedColumns: addedColumns2
}

let schema3 = migrate<2, 3, typeof schema2["objectStores"], typeof removedColumns2, typeof addedColumns2, {
    [K in ExtractStrict<keyof typeof schema2["objectStores"], keyof typeof removedColumns2>]: OmitStrict<typeof schema2["objectStores"][K], keyof typeof removedColumns2[K]>
}
&
{
    [K in ExcludeStrict<keyof typeof schema2["objectStores"], keyof typeof removedColumns2>]: typeof schema2["objectStores"][K]
}
&
typeof addedColumns2>(migration2)



type SafeMerge<A extends TestObjectStores, B extends TestObjectStores> =
{
    [K in Exclude<keyof A, keyof B>]: A[K]
}
&
{
    [K in Exclude<keyof B, keyof A>]: B[K]
}
&
{
    [K in keyof A & keyof B]: 
        keyof A[K] & keyof B[K] extends never ?
        {
            [K1 in keyof A[K]]: A[K][K1]
        }
        &
        {
            [K1 in keyof B[K]]: B[K][K1]
        }
        : never // throw `the following additions contain already existing columns: ${K}.${typeof B[K]}}`
}

// type which doesnt contain any nested keys from the other object store (for added
type WithoutKeysOf<A extends TestObjectStores> =
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

type WithOnlyKeysOf<A extends TestObjectStores> =
{
    [K in keyof A]?: 
    {
        [K1 in keyof A[K]]?: any
    }
}

let a = {
    posts: {
        content: {

        },
        name: {}
    }
}

let b: WithOnlyKeysOf<typeof a> = {
    posts: {
        content: {
        },
        name: {

        }
    },
}
