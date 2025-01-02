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
   try {
         // const pool = await getPool();
         // console.log(req.file);
         
        // Validate file
        if (!req.file) {
          return res.status(400).send("No File Uploaded");
        }
    
        // Read the Excel file
        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Read the first sheet
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
         
      //   console.log(filePath);
      //   console.log(workbook);
      //   console.log(sheetName);
      //   console.log("Excel Data:", data);
    
        // Insert data into SQL Server
      //   await insertIntoDatabase(data);
    
        res.status(200).json(data);
      } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send("An error occurred.");
      } 
   }


export {masterTables,getSchema,uploadExcel}