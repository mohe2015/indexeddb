import { Any, Database, DatabaseColumn, DatabaseConnection, DatabaseObjectStore, DatabaseTransaction } from "./interface";


class IndexedDatabaseConnection<SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }> extends DatabaseConnection<SCHEMA> {
    
    database(name: string, schema: SCHEMA): Database<SCHEMA> {
        throw new Error("Method not implemented.");
    }
}

class IndexedDatabase<SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }> extends Database<SCHEMA> {
    
    transaction<ALLOWEDOBJECTSTORES extends keyof SCHEMA>(objectStores: ALLOWEDOBJECTSTORES[], mode: "readonly" | "readwrite"): Promise<DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES>> {
        throw new Error("Method not implemented.");
    }

}

class IndexedDatabaseTransaction<SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }, ALLOWEDOBJECTSTORES extends keyof SCHEMA> extends DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES> {
    objectStore<NAME extends ALLOWEDOBJECTSTORES>(name: NAME): DatabaseObjectStore<SCHEMA[NAME]> {
        throw new Error("Method not implemented.");
    }

}