import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";
console.log(DB_NAME)
console.log(`${process.env.MONGODB_URI}/${DB_NAME}`);
const connectDB = async () => {
    try{
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}?ssl=true&replicaSet=atlas-2syrph-shard-0&authSource=admin&appName=Cluster0`)
        console.log(`\nMONGODB connected successfully !! Connection instance: ${connectionInstance}\n`);
        console.log(`\nHOST: ${connectionInstance.connection.host}`)
        console.log(`\nNAME: ${connectionInstance.connection.name}`)
        console.log(`\nPORT: ${connectionInstance.connection.port}`)
        console.log(`\nREADYSTATE: ${connectionInstance.connection.readyState}`)

    } catch(error){
        console.log("MONGODB Connection failed !! ", error);
        process.exit(1);
    }
}

export default connectDB;