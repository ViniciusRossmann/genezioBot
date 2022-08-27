const mongoose = require("mongoose");

function connectDB(uri: string, callback: (error: Error | null, status: string) => void) {
    console.log("db: ", uri)
    return mongoose
        .connect(uri)
        .then(() => {
            callback(null, "Database connected");
        })
        .catch((error: Error) => {
            callback(error, "Database connection fail");
        });
}

export default connectDB;