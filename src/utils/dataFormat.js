import { getPool } from "../db/db.js";
const dataFormat = async(data,tableName)=>{

try{
if(tableName=='Brand_master'){
        const pool = await getPool();
        // Fetch industries from the database
        const result = await pool.query('SELECT Industry, IndustryID FROM Industry_master');
        const industryMapping = result.recordset.reduce((acc, row) => {
          acc[row.Industry.toLowerCase()] = row.IndustryID;
          return acc;
        }, {});
        // console.log(industryMapping);
        
        
         // Transform data
         const processedData = data.map(item => ({
            brand: item.brand,
            IndustryID: industryMapping[item.Industry.toLowerCase()] || null, // Get IndustryID or null if not found
            IntransitData: item.IntransitData.toLowerCase() === 'y' ? 1 : 0,
            shiplistdata: item.shiplistdata.toLowerCase() === 'y' ? 1 : 0,
            mrplabel: item.mrplabel.toLowerCase() === 'y' ? 1 : 0,
            cartoonlabel: item.cartoonlabel.toLowerCase() === 'y' ? 1 : 0,
          }));
        
        //   console.log("Processed Data:", processedData);
          return processedData;
        }
if(tableName=='Department_master'){
        const pool = await getPool();
        // Fetch industries from the database
        const result = await pool.query('SELECT Industry, IndustryID FROM Industry_master');
        const industryMapping = result.recordset.reduce((acc, row) => {
          acc[row.Industry.toLowerCase()] = row.IndustryID;
          return acc;
        }, {});
        
        
         // Transform data
         const processedData = data.map(item => ({
            DeptName: item.DeptName,
            IndustryID: industryMapping[item.Industry.toLowerCase()] || null, // Get IndustryID or null if not found
          }));
        
        //   console.log("Processed Data:", processedData);
        
          // You can now use `processedData` to insert into the `Brand_master` table or further process it
          return processedData;
        }
if(tableName=='Designation_master'){
        const pool = await getPool();
        // Fetch industries from the database
        const result = await pool.query('SELECT Industry, IndustryID FROM Industry_master');
        const industryMapping = result.recordset.reduce((acc, row) => {
          acc[row.Industry.toLowerCase()] = row.IndustryID;
          return acc;
        }, {});
        
        
         // Transform data
         const processedData = data.map(item => ({
            DesignationName: item.DesignationName,
            IndustryID: industryMapping[item.Industry.toLowerCase()] || null, // Get IndustryID or null if not found
          }));
        
        //   console.log("Processed Data:", processedData);
        
          // You can now use `processedData` to insert into the `Brand_master` table or further process it
          return processedData;
        }
if(tableName=='ProductType_master'){
        const pool = await getPool();
        // Fetch industries from the database
        const result = await pool.query('SELECT Industry, IndustryID FROM Industry_master');
        const industryMapping = result.recordset.reduce((acc, row) => {
          acc[row.Industry.toLowerCase()] = row.IndustryID;
          return acc;
        }, {});
        
        
         // Transform data
         const processedData = data.map(item => ({
            ProductType: item.ProductType,
            IndustryID: industryMapping[item.Industry.toLowerCase()] || null, // Get IndustryID or null if not found
          }));
        
        //   console.log("Processed Data:", processedData);
        
          // You can now use `processedData` to insert into the `Brand_master` table or further process it
          return processedData;
        }
if(tableName=='City_master'){
        const pool = await getPool();
        // Fetch industries from the database
        const result = await pool.query('SELECT State, stateid FROM State_master');
        // console.log(result.recordset);
        
        // Map states to their respective StateIDs
        const stateMapping = result.recordset.reduce((acc, row) => {
            acc[row.State] = row.stateid; // Fix casing for `StateID`
            return acc;
        }, {});
        // console.log(stateMapping);
        // console.log("data ",data);
        
        // Transform input data
        const processedData = data.map(item => ({
            City: item.City,
            stateid: stateMapping[item.state] || null // Map State to StateID or set to null
            
        }));

        // Log processed data for debugging (optional)
        console.log("Processed Data:", processedData);

        // Return transformed data for further use
        return processedData;
        }
if(tableName=='Pincode_master'){
        const pool = await getPool();
        // Fetch industries from the database
        const result = await pool.query('SELECT City, CityID FROM City_master');
        const cityMapping = result.recordset.reduce((acc, row) => {
          acc[row.City] = row.CityID;
          return acc;
        }, {});
        
        
         // Transform data
         const processedData = data.map(item => ({
            pincode: item.pincode,
            CityID: cityMapping[item.City] || null, // Get IndustryID or null if not found
          }));
        
        //   console.log("Processed Data:", processedData);
        
          // You can now use `processedData` to insert into the `Brand_master` table or further process it
          return processedData;
        }
if(tableName=='Dealer_master'){
    const pool = await getPool()

        // Fetch data from multiple tables
        const brandResult = await pool.query('SELECT BrandID, Brand FROM Brand_master');
        const DealerTypeResult = await pool.query('SELECT DealerTypeID, DealerType FROM DealerType_master');
        
    
        // Create mappings
        const BrandMapping = brandResult.recordset.reduce((acc, row) => {
          acc[row.Brand.toLowerCase()] = row.BrandID;
          return acc;
        }, {});
    
        const DealerTypeMapping = DealerTypeResult.recordset.reduce((acc, row) => {
          acc[row.DealerType.toLowerCase()] = row.DealerTypeID;
          return acc;
        }, {});
    
        // Transform and join data in-memory
        const processedData = data.map((item) => ({
          brandid: BrandMapping[item.Brand.toLowerCase()] || null,
          Dealer:item.Dealer,
          DealerCode:item.DealerCode,
          DealerTypeID: DealerTypeMapping[item.DealerType.toLowerCase()] || null,
        }));
    
        // console.log("Processed Data with Joins:", processedData);
    
        // You can now use `processedData` to insert into the target table or process further
        return processedData;
}
if(tableName=='Location_master'){
    const pool = await getPool()

        // Fetch data from multiple tables
        const dealerResult = await pool.query('SELECT DealerID, Dealer FROM Dealer_master');
        const locationTypeResult = await pool.query('SELECT LocationTypeID, LocationType FROM LocationType_master');
        const cityResult = await pool.query('SELECT CityID,City FROM City_master');
        const stateResult = await pool.query('SELECT stateid, State FROM State_master');
        const pincodeResult = await pool.query('SELECT pincodeid, pincode FROM Pincode_master');
        
        //  mappings
        const DealerMapping = dealerResult.recordset.reduce((acc, row) => {
          acc[row.Dealer] = row.DealerID;
          return acc;
        }, {});
        // console.log(DealerMapping);
        
        const LocationTypeMapping = locationTypeResult.recordset.reduce((acc, row) => {
          acc[row.LocationType.toLowerCase()] = row.LocationTypeID;
          return acc;
        }, {});
        // console.log("Location Type: ",LocationTypeMapping);
        
        const StateMapping = stateResult.recordset.reduce((acc, row) => {
          acc[row.State] = row.stateid;
          return acc;
        }, {});
        // console.log("State: ",StateMapping);
        
        const CityMapping = cityResult.recordset.reduce((acc, row) => {
          acc[row.City] = row.CityID;
          return acc;
        }, {});
        // console.log(CityMapping);
        
        const PincodeMapping = pincodeResult.recordset.reduce((acc, row) => {
          acc[row.pincode] = row.pincodeid;
          return acc;
        }, {});
        // console.log("Pincode:",PincodeMapping);
        
    
        // Transform and join data in-memory
        const processedData = data.map((item) => ({
          Dealerid:DealerMapping[item.Dealer] || null,
          Location : item.Location,
          LocationTypeid:LocationTypeMapping[item.LocationType?.toLowerCase()] || null,
          Cityid:CityMapping[item.City] || null,
          stateid:StateMapping[item.State?.trim()] || null,
          pincodeid:PincodeMapping[String(item.Pincode)?.trim()] || null
          
        }));
    
        // console.log("Processed Data", processedData);
    
        // You can now use `processedData` to insert into the target table or process further
        return processedData;
}
if(tableName=='warehouse_master'){
    const pool = await getPool()

        // Fetch data from multiple tables
        const brandResult = await pool.query('SELECT BrandID, Brand FROM Brand_master');
        const locationResult = await pool.query('SELECT Locationid, Location FROM Location_master');
        const cityResult = await pool.query('SELECT CityID,City FROM City_master');
        const stateResult = await pool.query('SELECT stateid, State FROM State_master');
        const pincodeResult = await pool.query('SELECT pincodeid, pincode FROM Pincode_master');
        // console.log("brand: ",brandResult.recordset);
 
        const BrandMapping = brandResult.recordset.reduce((acc, row) => {
          acc[row.Brand.toLowerCase()] = row.BrandID;
          return acc;
        }, {});
        // console.log(BrandMapping);

        const LocationMapping = locationResult.recordset.reduce((acc, row) => {
          acc[row.Location] = row.Locationid;
          return acc;
        }, {});
        // console.log("Location Type: ",LocationTypeMapping);
        
        const StateMapping = stateResult.recordset.reduce((acc, row) => {
          acc[row.State] = row.stateid;
          return acc;
        }, {});
        // console.log("State: ",StateMapping);
        
        const CityMapping = cityResult.recordset.reduce((acc, row) => {
          acc[row.City] = row.CityID;
          return acc;
        }, {});
        // console.log(CityMapping);
        
        const PincodeMapping = pincodeResult.recordset.reduce((acc, row) => {
          acc[row.pincode] = row.pincodeid;
          return acc;
        }, {});
        // console.log("Pincode:",PincodeMapping);
        
    
        // Transform and join data in-memory
        const processedData = data.map((item) => ({
          brandid: BrandMapping[item.Brand.toLowerCase()] || null,
          Warehouse : item.Warehouse,
          Locationid:LocationMapping[item.Location] || null,
          Cityid:CityMapping[item.City] || null,
          stateid:StateMapping[item.State?.trim()] || null,
          pincodeid:PincodeMapping[String(item.Pincode)?.trim()] || null 
        }));
    
        // console.log("Processed Data", processedData);
    
        // You can now use `processedData` to insert into the target table or process further
        return processedData;
}
if(tableName=='Supplier_master'){

  const pool = await getPool();
  const suppliercatgResult = await pool.query('select SupplierCategoryID , SupplierCategory from SupplierCategory_master')
  const cityResult = await pool.query('SELECT CityID,City FROM City_master');
  const stateResult = await pool.query('SELECT stateid, State FROM State_master');
  const pincodeResult = await pool.query('SELECT pincodeid, pincode FROM Pincode_master');

  const SuppliercatgMapping = suppliercatgResult.recordset.reduce((acc, row) => {
    acc[row.SupplierCategory] = row.SupplierCategoryID;
    return acc;
  }, {});
  // console.log(SuppliercatgMapping);
  
  const StateMapping = stateResult.recordset.reduce((acc, row) => {
    acc[row.State] = row.stateid;
    return acc;
  }, {});
  // console.log("State: ",StateMapping);
  
  const CityMapping = cityResult.recordset.reduce((acc, row) => {
    acc[row.City] = row.CityID;
    return acc;
  }, {});
  // console.log(CityMapping);
  
  const PincodeMapping = pincodeResult.recordset.reduce((acc, row) => {
    acc[row.pincode] = row.pincodeid;
    return acc;
  }, {});
  // console.log("Pincode:",PincodeMapping);
  const processedData = data.map((item) => ({
    Supplier : item.Supplier,
    SupplierCategoryID:SuppliercatgMapping[item.SupplierCategory] || null,
    Cityid:CityMapping[item.City] || null,
    stateid:StateMapping[item.State?.trim()] || null,
    pincodeid:PincodeMapping[String(item.Pincode)?.trim()] || null 
  }));
  // console.log("Processed Data", processedData);
  return processedData

}
if(tableName=='SupplierMapping_master'){
  const pool = await getPool();
  
  const locationResult = await pool.query('SELECT Locationid, Location FROM Location_master');
  const supplierResult = await pool.query('SELECT Supplierid, Supplier FROM Supplier_master');

  const LocationMapping = locationResult.recordset.reduce((acc, row) => {
    acc[row.Location] = row.Locationid;
    return acc;
  }, {});
    console.log(LocationMapping);
    
  const SupplierMapping = supplierResult.recordset.reduce((acc, row) => {
    acc[row.Supplier] = row.Supplierid;
    return acc;
  }, {});
  console.log(SupplierMapping);

  const processedData = data.map((item) => ({
    Supplierid:SupplierMapping[item.Supplier] || null,
    Locationid:LocationMapping[item.Location] || null
  }));
    console.log("Processed Data", processedData);
  return processedData;
      
}

    } catch (error) {
      console.error("Error processing data:", error.message);
      throw error;
}

}
export {dataFormat}