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

import { create } from '@dev.mohe/indexeddb';
import {
  DatabaseSchemaWithoutMigration,
  DatabaseMigration,
  migrate,
  OmitStrict,
  ExtractStrict,
  ExcludeStrict,
} from '@dev.mohe/indexeddb/src/interface';

async function run() {
  try {
    let schema1: DatabaseSchemaWithoutMigration<1, {}> = {
      version: 1,
      objectStores: {},
    };

    let addedColumns1 = {
      users: {
        name: {
          primaryKeyOptions: {
            autoIncrement: false,
            keyPath: "name"
          }
        },
        password: {

        },
      },
      posts: {
        _id: { // this is technically invalid and should be fixed as it is an out of line primary key
          primaryKeyOptions: {
            autoIncrement: true
          }
        },
        title: {},
        author: {},
        publishedAt: {},
        description: {},
        content: {},
      },
    };

    let migration1: DatabaseMigration<1, 2, {}, {}, typeof addedColumns1, typeof schema1> = {
      fromVersion: schema1.version,
      toVersion: 2,
      baseSchema: schema1,
      addedColumns: addedColumns1,
      removedColumns: {},
    };

    let schema2 = migrate<
      1,
      2,
      {},
      {},
      typeof addedColumns1,
      typeof addedColumns1,
      typeof schema1
    >(migration1);

    let removedColumns2 = {
      users: {
        name: {

        },
        password: {

        },
      },
    };

    let addedColumns2 = {
      posts: {
        titlee: {

        },
      },
    };

    let migration2: DatabaseMigration<
      2,
      3,
      typeof schema2['objectStores'],
      typeof removedColumns2,
      typeof addedColumns2,
      typeof schema2
    > = {
      fromVersion: 2,
      toVersion: 3,
      baseSchema: schema2,
      removedColumns: removedColumns2,
      addedColumns: addedColumns2,
    };

    let schema3 = migrate
    <
      2,
      3,
      typeof schema2['objectStores'],
      typeof removedColumns2,
      typeof addedColumns2,
      {
        [K in ExtractStrict<
          keyof typeof schema2['objectStores'],
          keyof typeof removedColumns2
        >]: OmitStrict<
          typeof schema2['objectStores'][K],
          keyof typeof removedColumns2[K]
        >;
      } &
        {
          [K in ExcludeStrict<
            keyof typeof schema2['objectStores'],
            keyof typeof removedColumns2
          >]: typeof schema2['objectStores'][K];
        } &
        typeof addedColumns2,
        typeof schema2
    >
    (migration2);

    console.log(schema3);

    let connection = await create("mongodb://idb-mongodb")

    console.log(connection)

    let database = await connection.database<
      2,
      3,
      typeof schema2['objectStores'],
      typeof removedColumns2,
      typeof addedColumns2,
      {
        [K in ExtractStrict<
          keyof typeof schema2['objectStores'],
          keyof typeof removedColumns2
        >]: OmitStrict<
          typeof schema2['objectStores'][K],
          keyof typeof removedColumns2[K]
        >;
      } &
        {
          [K in ExcludeStrict<
            keyof typeof schema2['objectStores'],
            keyof typeof removedColumns2
          >]: typeof schema2['objectStores'][K];
        } &
        typeof addedColumns2,
        typeof schema2,
        typeof schema3
    >("test12", schema3)

    console.log(database)
  } catch (error) {
    console.error(error);
    alert(error);
  }
}

run();
