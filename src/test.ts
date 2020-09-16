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
type OmitStrict<ObjectType, KeysType extends keyof ObjectType> = Pick<ObjectType, Exclude<keyof ObjectType, KeysType>>;

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
                                        NEWOBJECTSTORES extends OmitStrict<OLDOBJECTSTORES, keyof REMOVED> & ADDED = OmitStrict<OLDOBJECTSTORES, keyof REMOVED> & ADDED
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
                    NEWOBJECTSTORES extends OmitStrict<OLDOBJECTSTORES, keyof REMOVED> & ADDED = OmitStrict<OLDOBJECTSTORES, keyof REMOVED> & ADDED
                 >
                 (migration: TestMigration<FROMVERSION, TOVERSION, ADDED, REMOVED, OLDOBJECTSTORES>)
                 : TestSchemaWithMigration<TOVERSION, FROMVERSION, TOVERSION, ADDED, REMOVED, OLDOBJECTSTORES> {
    return {
        migration,
        version: migration.toVersion,
        objectStores: null as any as NEWOBJECTSTORES // TODO FIXME this is actually a wrong implementation
    }
}

let schema2 = migrate<1, 2, typeof addedColumns1, {}, {}>(migration1)

let removedColumns2 = {
    users: {
        name: {

        },
        passwordd: { // TODO FIXME misspelling not detected

        }
    }
}

let migration2: TestMigration<2, 3, {}, typeof removedColumns2, typeof schema2["objectStores"]> = {
    fromVersion: 2,
    toVersion: 3,
    baseSchema: schema2,
    removedColumns: removedColumns2,
    addedColumns: {}
}

let schema3 = migrate<2, 3, {}, typeof removedColumns2, typeof schema2["objectStores"]>(migration2)







// WHY

let a = {
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

let b = {
    userrs: {
        name: {

        },
        passwordd: { // TODO FIXME misspelling not detected

        }
    }
}

// I'm pretty sure this means typescript doesnt check hidden types as error location reporting would be hard then and it could possibly be valid
let test = function<OBJECTSTORES extends TestObjectStores, REMOVED extends TestObjectStores>(objectStores: OBJECTSTORES, removed: REMOVED): OmitStrict<OBJECTSTORES, keyof REMOVED> {
    return null as any as OmitStrict<OBJECTSTORES, keyof REMOVED>
}

let test1 = function<OBJECTSTORES extends TestObjectStores, REMOVED extends TestObjectStores, NEW extends OmitStrict<OBJECTSTORES, keyof REMOVED>>(objectStores: OBJECTSTORES, removed: REMOVED): NEW {
    return null as any as NEW
}

// THIS IS PROBABLY THE ONLY FEASIBLE WAY
let c = test1<typeof a, typeof b, OmitStrict<typeof a, keyof typeof b>>(a, b)

// THIS IS GETTING CLOSER
type fs = OmitStrict<typeof a, keyof typeof b>

type fdsfs = OmitStrict<typeof schema2["objectStores"], "users">

type fsdf = keyof typeof removedColumns2