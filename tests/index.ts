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
import { DatabaseConnection, dbtypes, TypeOfProps, TypeOfTypeOfProps } from "../src/interface.js";

// TODO FIXME maybe separate primary key storage
// or at least store the name somewhere?
const users = {
    name: {
        type: dbtypes.string,
    },
    age: {
        type: dbtypes.number,
    },
}

const posts = {
    title: {
        type: dbtypes.string,
    },
    content: {
        type: dbtypes.string
    },
}

const objectStores = {
    users,
    posts
}

let connection: DatabaseConnection = await create();

let database = await connection.database("test12", objectStores, 1, (transaction) => {
    transaction.createObjectStore("posts", {})
});

await database.transaction(["users", "users"], "readonly", (transaction) => {

    let objectStore = transaction.objectStore("users")

    let value = objectStore.get(["name"])

    value.name
});
