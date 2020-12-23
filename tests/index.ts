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


SPDX-FileCopyrightText: 2020 Moritz Hedtke <Moritz.Hedtke@t-online.de>

SPDX-License-Identifier: AGPL-3.0-or-later
*/
import { create } from "../src/api.js";
import { DatabaseColumn, DatabaseColumnType, DatabaseConnection, dbtypes, TypeOfProps, TypeOfTypeOfProps } from "../src/interface.js";

// TODO FIXME maybe separate primary key storage
// or at least store the name somewhere?
const users = {
    name: {
        type: dbtypes.string,
        columnType: DatabaseColumnType.PRIMARY_KEY,
    },
    age: {
        type: dbtypes.number,
        columnType: DatabaseColumnType.DEFAULT,
    },
}

const posts = {
    title: {
        type: dbtypes.string,
        columnType: DatabaseColumnType.PRIMARY_KEY,
    },
    content: {
        type: dbtypes.string,
        columnType: DatabaseColumnType.DEFAULT,
    },
}

const objectStores = {
    users,
    posts
}

let connection: DatabaseConnection = await create();

let database = await connection.database("test12", objectStores, 1, async (transaction) => {
    //transaction.createObjectStore("posts", "title", objectStores.posts.title)
    //transaction.createColumn("posts", "content", objectStores.posts.content)
});

await database.transaction(["users", "posts"], "readwrite", async (transaction) => {

    let objectStore = transaction.objectStore("posts", "title")

    let value = await objectStore.get(["content"], "Moritz Hedtke")

    console.log(value)
});

await database.close()