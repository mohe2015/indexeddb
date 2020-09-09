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

import { create } from "../browser.js";

async function run() {
    try {
        let databaseConnection = await create("localhost");

        let migration1 = {
            version: 2,
            baseSchema: {
                version: 1,
                indexes: {}
            },
            addedIndexes: {
                "test.name": {
                    keyPath: "name",
                },
                "test.value": {
                    keyPath: "name",
                }
            },
            removedIndexes: []
        }
        
        let migration2 = {
            version: 3,
            baseSchema: migrate(true, migration1),
            addedIndexes: {},
            removedIndexes: ["test.name"] as const
        }
        
        let merged1 = migrate(true, migration2)

        let migration3 = {
            version: 3,
            baseSchema: merged1,
            addedIndexes: {
                "test.valuee": {
                    keyPath: "name",
                }
            },
            removedIndexes: []
        }

        let result = migrate(true, migration3)

        //let database = await databaseConnection.database("blub", 5, merged1)
        //console.log(database)

    } catch (error) {
        console.error(error)
        alert(error)
    }

}

run()