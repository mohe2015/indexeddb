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
        let database = await databaseConnection.database("blub", 5, (database, oldVersion, newVersion) => {
            let objectStore = database.createObjectStore("a", { autoIncrement: true })
            let index = objectStore.createIndex("name", "name", { unique: true })
        })
        console.log(database)

    } catch (error) {
        console.error(error)
        alert(error)
    }

}

run()