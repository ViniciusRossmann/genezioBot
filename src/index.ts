import connectDB from './utils/DBConnector';
import initBot from './bot';
require('dotenv/config');

if (!process.env.DB) {
    console.log('DB connection string not found. Verify environment variables.');
    process.exit(0);
}

connectDB(process.env.DB, async (err, status) => {
    if (err) {
        console.error("Database error", err);
        process.exit(1);
    }
    console.log(status);
    if (!process.env.BOT_TOKEN) {
        console.log('Bot token not found. Verify environment variables.');
        process.exit(0);
    }
    initBot(process.env.BOT_TOKEN);
});

