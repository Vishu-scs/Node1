import xlsx from 'xlsx'
import { getPool } from '../db/db.js'
import sql from 'mssql'
import { dataFormat} from '../utils/dataFormat.js'   
import fs from 'fs'


let data= []  //Globally Declared -> Used in "uploadExcel" and "insertData"

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
         const pool = await getPool();
         // console.log(req.file);

         const{tableName} = req.body
        // Validate file
        if (!req.file) {
          return res.status(400).send("No File Uploaded");
        }
        if (!tableName) {
          return res.status(400).send("Table name is required to be passed in the body.");
        }
    
        // Read the Excel file
        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Read the first sheet
         data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);   //declared Globally -> to be used in insertdata
         console.log("before: ",data);
         
          if(tableName=='Brand_master'||tableName=='Dealer_master'||tableName=='Location_master'||tableName=='Supplier_master'||tableName=='WareHouse_master'||tableName=='Department_master'||tableName=='Designation_master'||tableName=='ProductType_master'||tableName=='City_master'||tableName=='Pincode_master')
          {data =await dataFormat(data,tableName);}
         
        
          console.log("Excel Data:", data);
              // console.log(filePath);
              
          // Insert data into SQL Server  
          await insertData(data,tableName,res);
           
          //  res.status(200).json({"Data Uploaded SuccessFully":data});
          fs.unlinkSync(filePath)
      } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({"An error occurred.":error.message});
      } 
}
const insertData = async(dataInsert,tableName,res)=>{
  const pool = await getPool();
  // const transaction = new sql.Transaction()
   try {

      // console.log("transaction",transaction);
      
        // await transaction.begin()
        // console.log("Transaction State:", transaction);

        // console.log(transaction.begin());
        
      // Validate the uploaded data
      if (!dataInsert || !Array.isArray(dataInsert) || dataInsert.length === 0) {
        return res.status(400) 
          .send("Data not found. Please upload the Excel file again.");
      }
      const addedBy = 2;
      
      // Convert current date to a number representing days since 1900-01-01 (Excel-like format)
      const currentDate = Math.floor((new Date() - new Date('1900-01-01')) / (1000 * 60 * 60 * 24));   //getting current date in serial
      const daysOffset = 25567;                                           // Changing serial(current date)
      let date = new Date((currentDate - daysOffset) * 86400000);         // to datetime format in 
      date = date.toISOString().split('T')[0];                            // date
      
      
      // Add properties to each object in the array with current date in datetime format
       dataInsert = dataInsert.map((item) => ({
        ...item,
        Addedby: addedBy,
        Addedon: date,
        status: 1
      }));


      console.log("Table name:", tableName);
  
      // Loop through the data and insert into SQL Server
      for (const row of dataInsert) {
        const columns = Object.keys(row).join(", ");
        const values = Object.keys(row)
          .map((_, idx) => `@val${idx}`)
          .join(", ");
  
        const query = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`;
         
        const request = pool.request();
  
        // Bind parameters
        Object.values(row).forEach((val, idx) => {
          request.input(`val${idx}`, val);
        });
  
        await request.query(query);
      }
      // await transaction.commit()
      // console.log(transaction.commit());
      
      console.log(`Data Inserted`,dataInsert);
      
      res.status(201).json({message:"Data inserted successfully!",dataInsert});
      // dataInsert=[]
      // console.log("Data inserted successfully!",dataInsert);
    } catch (err) {
      // if (transaction._aborted) {
      //   console.error("Transaction was already aborted.");
      // } else {
      //   console.log("Rolling back transaction...");
      //   await transaction.rollback(); // Rollback the transaction on error
      // }
  
      
      console.error("Database Error:", err.message);
      return res.status(500).send(err.message)

    }
 
}


export {masterTables,getSchema,uploadExcel}