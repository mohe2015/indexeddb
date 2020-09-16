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

export type TestMigration<FROMVERSION extends number, TOVERSION extends number, ADDED extends TestObjectStores, REMOVED extends TestObjectStores, OBJECTSTORES extends TestObjectStores> = {
    fromVersion: FROMVERSION
    toVersion: TOVERSION
    baseSchema: TestSchemaWithoutMigration<FROMVERSION, OBJECTSTORES>
    addedColumns: ADDED
    removedColumns: REMOVED
}

export type TestObjectStores = { [a: string]: any; };

export type TestSchemaWithoutMigration<VERSION extends number, OBJECTSTORES extends TestObjectStores> = {
    version: VERSION,
    objectStores: OBJECTSTORES
}

export type TestSchemaWithMigration<VERSION extends number, FROMVERSION extends number, TOVERSION extends number, ADDED extends TestObjectStores, REMOVED extends TestObjectStores, OBJECTSTORES extends TestObjectStores> = TestSchemaWithoutMigration<VERSION, OmitStrict<OBJECTSTORES, keyof REMOVED> & ADDED> & {
    migration: TestMigration<FROMVERSION, TOVERSION, ADDED, REMOVED, OBJECTSTORES> | null
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

function migrate<FROMVERSION extends number, TOVERSION extends number, ADDED extends TestObjectStores, REMOVED extends TestObjectStores, OBJECTSTORES extends TestObjectStores>(migration: TestMigration<FROMVERSION, TOVERSION, ADDED, REMOVED, OBJECTSTORES>): TestSchemaWithMigration<TOVERSION, FROMVERSION, TOVERSION, ADDED, REMOVED, OBJECTSTORES> {
    return {
        migration,
        version: migration.toVersion,
        objectStores: null as any as OmitStrict<OBJECTSTORES, keyof REMOVED> & ADDED // TODO FIXME this is actually a wrong implementation
    }
}

let schema2 = migrate(migration1)

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

let schema3 = migrate(migration2)

schema3.objectStores.posts

type fs = OmitStrict<{users: {}}, "usersf"> & {}