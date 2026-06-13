import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";


const connectDB = async () => {
    try{
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}?ssl=true&replicaSet=atlas-2syrph-shard-0&authSource=admin&appName=Cluster0`)
        console.log(`\nMONGODB connected successfully !!`);
    } catch(error){
        console.log("MONGODB Connection failed !! ", error);
        process.exit(1);
    }
}

export default connectDB;