import xlsx from 'xlsx'
import { getPool } from '../db/db.js'
import sql from 'mssql'




const masterTables = async(req,res)=>{
try {
         const pool = await getPool();
         const result = await pool
         .request()
         .query(`use Scanapp SELECT object_id , name FROM sys.tables where name like '%_master';`) 
         return res.status(200).json(result.recordset)
} catch (error) {
     return res.status(500).json(error.message)
}
}
const getSchema = async(req,res)=>{
   try {
     const {objectid} = req.body
     const pool = await getPool();
     const result = await pool.request()
     .input('objectid',sql.Int,objectid)
     .query(`SELECT name FROM sys.columns WHERE object_id = @objectid;`)
     res.status(200).json(result.recordset)
   } catch (error) {
      res.status(500).json(error.message)
   }
}
const uploadExcel = async(req,res)=>{
    const pool = getPool();
    
}


export {masterTables,getSchema,uploadExcel}