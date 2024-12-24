import express from "express"
import 'dotenv/config'
import {connectDB} from "./db/db.js"
import {app}  from "./app.js"

connectDB()
.then(()=>{
    app.listen(3000,()=>{
        console.log(`Server is runnning at PORT: 3000`)
    })
})
.catch((err)=>{
    console.log(" connection failed",err);
})

