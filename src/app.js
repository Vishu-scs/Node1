import express  from 'express'
import cors from 'cors'
import userRouter from './routes/userRoute.js'
import masterCreation from './routes/masterCreationRoute.js'

const app = express()
app.use(cors())
app.use(express.json());




app.use("/api/v1/users", userRouter)
app.use("/api/v1/masters", masterCreation)



export  {app}