import xlsx from 'xlsx'
import { getPool } from '../db/db.js'




const masterTables = async(req,res)=>{
try {
         const pool = await getPool();
         const result = await pool
         .request()
         .query(`use Scan_app SELECT object_id , name FROM sys.tables where name like '%_master';`) 
         return res.status(200).json(result.recordset)
} catch (error) {
     return res.status(500).json(error.message)
}
}

const uploadExcel = async(req,res)=>{
    const pool = getPool();
    
}


export {masterTables,uploadExcel}