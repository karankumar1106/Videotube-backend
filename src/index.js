import "dotenv/config"
import connectDB from "./db/index.js";

connectDB()
.then(()=>{
    const server=app.listen(process.env.PORT||8000, () => {
        console.log(`Server is running on port ${process.env.PORT||8000}`);
    });

    // FOR NETWORK RELATED ISSUE ON SERVER
    server.on("error", (error) => {
        console.error("Server error: ", error);
        process.exit(1); 
    });
})
.catch(error => {
    console.error("MONGO db connection failed !!!", error);
    process.exit(1); 
});