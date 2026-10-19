require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const port =  process.env.PORT || 3000 ;

const lancerServeur = async ()=>{
    try{
        if(!process.env.JWT_SECRET){
            console.error("JWT_SECRET n'est pas défini dans le fichier .env");
            process.exit(1);
        }
        await connectDB()

        app.listen(port, ()=>{
            console.log(`Server is running on port ${port}`);
        } )
    }catch(error){
        console.error("Failed to start the server:", error.message);
        process.exit(1); // Exit the process with an error code
    }
}

lancerServeur();