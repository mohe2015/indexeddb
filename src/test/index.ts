import type { Migration } from "../interface.js";
import { migrate } from "../interface.js";
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

import { create } from "../browser";

async function run() {
    try {
        let databaseConnection = await create("localhost");

        let objectStores = {
            users: {
                username: {
                    keyPath: "username"
                },
                password: {
                    keyPath: "password"
                }
            },
        } as const

        let baseSchema = {
            version: 1,
            objectStores
        } as const

        let addedColumns = {
            users: {
                userrdaname: {
                    keyPath: "usegrname"
                },
            },
            posts: {
                title: {
                    keyPath: "title"
                },
                content: {
                    keyPath: "content"
                }
            }
        } as const

        let removedColumns = {"users": {"username": null}} as const

        // current issue: https://github.com/microsoft/TypeScript/issues/14400
        let migration: Migration<typeof objectStores, typeof baseSchema, typeof addedColumns, typeof removedColumns, 1, 2> = {
            fromVersion: 1,
            toVersion: 2,
            baseSchema,
            addedColumns,
            removedColumns
        } as const

        let result = migrate<typeof objectStores, typeof baseSchema, typeof addedColumns, typeof removedColumns, 1, 2, typeof migration>(migration)

        console.log(result)
    } catch (error) {
        console.error(error)
        alert(error)
    }

}

run()