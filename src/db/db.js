import sql from 'mssql'
import "dotenv/config"
const config = {
    server: process.env.SERVER,    // SQL Server hostname or IP address
    database: process.env.DATABASE,    // Your database name
    user: process.env.USER,                // SQL Server login username
    password: process.env.PASSWORD,         // SQL Server login password
    options: {
        encrypt: false,           // Disable encryption for local servers
        enableArithAbort: true    // Helps with certain SQL Server errors
    }
};
 

let pool;
const connectDB = async()=>{
pool = await new sql.ConnectionPool(config)
.connect()
.then(pool => {
    console.log('Connected to SQL Server');
    return pool;
})
.catch(err => {
    console.error('Database connection failed!', err);
    throw err;
});
};

const getPool = () => {
  if (!pool) {
      throw new Error("Database connection is not established yet");
  }
  return pool;
};
export {connectDB,getPool};