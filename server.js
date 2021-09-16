require("dotenv").config({path: "./config.env"})

const express = require("express")
const app = express()
const PORT = process.env.PORT || 5000

const connectDB = require("./config/db")
const errorHandler = require("./middleware/error")

app.use(express.json())

// Connect to the database
connectDB()

// If a user navigates to "/api/auth" , then they will be redirected to the auth routes in the routes folder
app.use("/api/auth", require("./routes/auth")) 
app.use("/api/private", require("./routes/private")) 

// Error Handler should be the last piece of middleware
app.use(errorHandler)

const server = app.listen(PORT, (req,res)=>{
    console.log(`Server listening op port ${PORT}`)
})

process.on("unhandledRejection", (err,promise)=>{
    console.log(`Logged Error: ${err}`)
    server.close(()=>process.exit(1))
})