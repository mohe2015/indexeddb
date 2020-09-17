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

/*
type Foo = {
	a: number;
	b: string;
	c: boolean;
};
type FooWithoutA = OmitStrict<Foo, 'd' | 'c'>;
*/

export type TestMigration<FROMVERSION extends number, TOVERSION extends number, ADDED extends TestObjectStores, REMOVED extends TestObjectStores, OLDOBJECTSTORES extends TestObjectStores> = {
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
                                        ADDED extends TestObjectStores,
                                        REMOVED extends TestObjectStores,
                                        OLDOBJECTSTORES extends TestObjectStores,
                                        NEWOBJECTSTORES extends {
                                            [K in ExtractStrict<keyof OLDOBJECTSTORES, keyof REMOVED>]: OmitStrict<OLDOBJECTSTORES[K], keyof REMOVED[K]>
                                        }
                                        &
                                        {
                                            [K in ExcludeStrict<keyof OLDOBJECTSTORES, keyof REMOVED>]: OLDOBJECTSTORES[K]
                                        }
                                        &
                                        ADDED
                                    > =
                                    TestSchemaWithoutMigration<VERSION, NEWOBJECTSTORES> & {
        
    migration: TestMigration<FROMVERSION, TOVERSION, ADDED, REMOVED, OLDOBJECTSTORES> | null
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

let migration1: TestMigration<1, 2, typeof addedColumns1, {}, {}> = {
    fromVersion: schema1.version,
    toVersion: 2,
    baseSchema: schema1,
    addedColumns: addedColumns1,
    removedColumns: {},
}

function migrate<
                    FROMVERSION extends number,
                    TOVERSION extends number,
                    ADDED extends TestObjectStores,
                    REMOVED extends TestObjectStores,
                    OLDOBJECTSTORES extends TestObjectStores,
                    NEWOBJECTSTORES extends {
                        [K in ExtractStrict<keyof OLDOBJECTSTORES, keyof REMOVED>]: OmitStrict<OLDOBJECTSTORES[K], keyof REMOVED[K]>
                    }
                    &
                    {
                        [K in ExcludeStrict<keyof OLDOBJECTSTORES, keyof REMOVED>]: OLDOBJECTSTORES[K]
                    }
                    &
                    ADDED
                 >
                 (migration: TestMigration<FROMVERSION, TOVERSION, ADDED, REMOVED, OLDOBJECTSTORES>)
                 : TestSchemaWithMigration<TOVERSION, FROMVERSION, TOVERSION, ADDED, REMOVED, OLDOBJECTSTORES, NEWOBJECTSTORES> {
    return {
        migration,
        version: migration.toVersion,
        objectStores: null as any as NEWOBJECTSTORES // TODO FIXME this is actually a wrong implementation
    }
}

let schema2 = migrate<1, 2, typeof addedColumns1, {}, {}, typeof addedColumns1>(migration1)

let removedColumns2 = {
    users: {
        name: {

        },
        password: { // TODO FIXME misspelling not detected

        }
    }
}

let addedColumns2 = {
    users: {
        content: {

        }
    }
}

let migration2: TestMigration<2, 3, {}, typeof removedColumns2, typeof schema2["objectStores"]> = {
    fromVersion: 2,
    toVersion: 3,
    baseSchema: schema2,
    removedColumns: removedColumns2,
    addedColumns: addedColumns2
}

let schema3 = migrate<2, 3, {}, typeof removedColumns2, typeof schema2["objectStores"], { // TODO FIXME extractstrict removes objectstores that need to be added again
    [K in ExtractStrict<keyof typeof schema2["objectStores"], keyof typeof removedColumns2>]: OmitStrict<typeof schema2["objectStores"][K], keyof typeof removedColumns2[K]>
}
&
{
    [K in ExcludeStrict<keyof typeof schema2["objectStores"], keyof typeof removedColumns2>] : typeof schema2["objectStores"][K]
}
&
typeof addedColumns2>(migration2)


let a = {
    posts: {
        content: {

        },
        name: {}
    }
}

let b = {
    posts: {
        content: {
            
        },
        namfe: {}
    }
}

type SafeMerge<A, B> =
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
        : throw `the following additions contain already existing columns: ${K}.${typeof B[K]}}`
}

let fdsfione: SafeMerge<typeof a, typeof b> = null as any

fdsfione.posts
