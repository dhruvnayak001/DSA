import mongoose from 'mongoose';

const oldUri = "mongodb://dhruvrnayak_db_user:iGn34BhnlcsrU8ff@ac-fu4jmuv-shard-00-00.faief4w.mongodb.net:27017,ac-fu4jmuv-shard-00-01.faief4w.mongodb.net:27017,ac-fu4jmuv-shard-00-02.faief4w.mongodb.net:27017/arogyaai?ssl=true&replicaSet=atlas-yf8sx3-shard-0&authSource=admin&retryWrites=true&w=majority";
const newUri = "mongodb://dhruvrnayak_db_user:iGn34BhnlcsrU8ff@ac-fu4jmuv-shard-00-00.faief4w.mongodb.net:27017,ac-fu4jmuv-shard-00-01.faief4w.mongodb.net:27017,ac-fu4jmuv-shard-00-02.faief4w.mongodb.net:27017/dsa_tracker?ssl=true&replicaSet=atlas-yf8sx3-shard-0&authSource=admin&retryWrites=true&w=majority";

async function migrate() {
    try {
        const oldConn = await mongoose.createConnection(oldUri).asPromise();
        const newConn = await mongoose.createConnection(newUri).asPromise();

        console.log("Connected to both databases.");

        const collections = ['questions', 'users', 'savedfilters'];

        for (const collName of collections) {
            console.log(`Migrating collection: ${collName}`);
            const oldCollection = oldConn.collection(collName);
            const newCollection = newConn.collection(collName);

            const documents = await oldCollection.find({}).toArray();
            
            if (documents.length > 0) {
                await newCollection.deleteMany({});
                await newCollection.insertMany(documents);
                console.log(`Successfully migrated ${documents.length} documents for ${collName}`);
            } else {
                console.log(`No documents found in ${collName}`);
            }
        }
        
        console.log("Migration completed successfully!");

        await oldConn.close();
        await newConn.close();

    } catch (error) {
        console.error("Migration failed:", error);
    }
}

migrate();
