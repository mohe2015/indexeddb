import type { DatabaseMigration, DatabaseObjectStores, WithoutKeysOf, ExtractStrict, OmitStrict, ExcludeStrict, DatabaseSchemaWithoutMigration, DatabaseSchemaWithMigration } from "./interface";
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
    OLDSCHEMA extends DatabaseSchemaWithoutMigration<FROMVERSION, OLDOBJECTSTORES>,
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

    let currentMigration: DatabaseMigration<number, number, DatabaseObjectStores, DatabaseObjectStores, WithoutKeysOf<DatabaseObjectStores>, OLDSCHEMA> = schema.migration

    while (true) {
        if (currentMigration) {
            outstandingMigrations.push(currentMigration)
            console.log("added migration ", currentMigration)
            if (currentMigration.fromVersion === oldVersion) {
                break;
            }
            
            let oldState = currentMigration.baseSchema;
            if (isWithMutation(oldState)) {
                currentMigration = oldState.migration
            } else {
                throw new Error("missing migrations")
            }
        }
    }

    return outstandingMigrations.reverse()
}