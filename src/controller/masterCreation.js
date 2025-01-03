import xlsx from 'xlsx'
import { getPool } from '../db/db.js'
import sql from 'mssql'
import { excelDateToJSDate } from '../utils/exceldateConvert.js'   


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
         data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);   //declared Globally -> to be used in insertdata
         
      //   console.log(filePath);
      //   console.log(workbook);
      //   console.log(sheetName);
        console.log("Excel Data:", data);
         

      // data.forEach(item => {
      //    if(item.Addedon){
      //    item.Addedon = excelDateToJSDate(item.Addedon); // Convert and update
      //           }});

          // Insert data into SQL Server
         //   await insertIntoDatabase(data);
    
        res.status(200).json(data);
      } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send("An error occurred.");
      } 
}
const insertData = async(req, res)=>{
   try {
      const pool = await getPool();
  
      let dataInsert = data;
      // console.log("Accessing data: ",dataInsert);

      // Validate the uploaded data
      if (!dataInsert || !Array.isArray(dataInsert) || dataInsert.length === 0) {
        return res
          .status(500) 
          .send("Something went wrong fetching data from the uploaded file. Please upload the Excel file again.");
      }
      const addedBy = 1;
      
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
      
      // dataInsert.forEach(item => {
      //    if(item.Addedon){
      //       item.Addedon = excelDateToJSDate(item.Addedon); // Convert and update
      //    }});
         // console.log(dataInsert);
      // Validate table name
      const { tableName } = req.body;
      if (!tableName) {
        return res.status(400).send("Table name is required to be passed in the body.");
      }
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
  
      res.status(201).json({message:"Data inserted successfully!",dataInsert});
      dataInsert=[]
      // console.log("Data inserted successfully!",dataInsert);
    } catch (err) {
      console.error("Database Error:", err.message);
  
      if (err.message.includes("Conversion failed")) {
        return res
          .status(400)
          .send(
            "Data type mismatch: Ensure that the data from the uploaded file matches the table's expected column types."
          );
      }
  
      res.status(500).send("An error occurred while inserting data.");
    }
 
}


export {masterTables,getSchema,uploadExcel,insertData}