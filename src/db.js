// this module handles with database connection
import pg from "pg";

let dbClient = () => {
    let uri = process.env.DATABASE_URL || "postgres://postgres@/rs-api"
        client = new pg.Client(uri);

    client.connect();

    return client;
}();

export default dbClient;

