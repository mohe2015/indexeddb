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


SPDX-FileCopyrightText: 2020 Moritz Hedtke <Moritz.Hedtke@t-online.de>

SPDX-License-Identifier: AGPL-3.0-or-later
*/

import type {
  DatabaseMigration,
  DatabaseObjectStores,
  WithoutKeysOf,
  ExtractStrict,
  OmitStrict,
  ExcludeStrict,
  DatabaseSchemaWithoutMigration,
  DatabaseSchemaWithMigration,
} from './interface';
import { isWithMutation } from './interface';

export function getOutstandingMigrations<
  FROMVERSION extends number,
  TOVERSION extends number,
  OLDOBJECTSTORES extends DatabaseObjectStores,
  REMOVED extends DatabaseObjectStores,
  ADDED extends WithoutKeysOf<OLDOBJECTSTORES>,
  AFTERREMOVED extends {
    [K in ExtractStrict<keyof OLDOBJECTSTORES, keyof REMOVED>]: OmitStrict<
      OLDOBJECTSTORES[K],
      keyof REMOVED[K]
    >;
  } &
    {
      [K in ExcludeStrict<
        keyof OLDOBJECTSTORES,
        keyof REMOVED
      >]: OLDOBJECTSTORES[K];
    },
  OLDSCHEMA extends DatabaseSchemaWithoutMigration<
    FROMVERSION,
    OLDOBJECTSTORES
  >,
  SCHEMA extends DatabaseSchemaWithMigration<
    FROMVERSION,
    TOVERSION,
    OLDOBJECTSTORES,
    REMOVED,
    ADDED,
    AFTERREMOVED,
    OLDSCHEMA
  >
>(schema: SCHEMA, oldVersion: number) {
  let outstandingMigrations = [];

  let currentMigration: DatabaseMigration<
    number,
    number,
    DatabaseObjectStores,
    DatabaseObjectStores,
    WithoutKeysOf<DatabaseObjectStores>,
    OLDSCHEMA
  > = schema.migration;

  while (true) {
    if (currentMigration) {
      outstandingMigrations.push(currentMigration);
      console.log('added migration ', currentMigration);
      if (currentMigration.fromVersion === oldVersion) {
        break;
      }

      let oldState = currentMigration.baseSchema;
      if (isWithMutation(oldState)) {
        currentMigration = oldState.migration;
      } else {
        throw new Error('missing migrations');
      }
    }
  }

  return outstandingMigrations.reverse();
}
