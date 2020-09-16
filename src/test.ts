

export type TestMigration = {
    fromVersion: number
    toVersion: number
    baseSchema: TestObjectStores
    addedColumns: TestObjectStores
    removedColumns: TestObjectStores
}

export type TestObjectStores = { [a: string]: any; };

export type TestSchema = {
    version: number
    migration: TestMigration | null
    objectStores: TestObjectStores
}

let initialSchema: TestSchema = {
    version: 1,
    migration: null,
    objectStores: {}
}