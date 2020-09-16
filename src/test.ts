

export type TestMigration<FROMVERSION extends number, TOVERSION extends number> = {
    fromVersion: FROMVERSION
    toVersion: TOVERSION
    baseSchema: TestSchemaWithoutMigration<FROMVERSION>
    addedColumns: TestObjectStores
    removedColumns: TestObjectStores
}

export type TestObjectStores = { [a: string]: any; };

export type TestSchemaWithoutMigration<FROMVERSION extends number> = {
    version: FROMVERSION,
    objectStores: TestObjectStores
}

export type TestSchemaWithMigration<FROMVERSION extends number, TOVERSION extends number> = TestSchemaWithoutMigration<FROMVERSION> & {
    migration: TestMigration<FROMVERSION, TOVERSION> | null
}

let initialSchema: TestSchemaWithoutMigration<1> = {
    version: 1,
    objectStores: {}
}

let migration: TestMigration<1, 2> = {
    fromVersion: initialSchema.version,
    toVersion: 2,
    baseSchema: initialSchema,
    addedColumns: {},
    removedColumns: {},
}