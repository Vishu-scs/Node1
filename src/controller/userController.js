import sql from "mssql"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import validator  from "validator"
import 'dotenv/config'
import { getPool } from "../db/db.js"
import { transporter} from "../utils/emailTransporter.js"


    
const otps = {}
const { isEmail , isStrongPassword } = validator


//------------Get ALL Users
 const allUsers = async (req, res) => {

        try {
            const pool = await getPool();
            const result = await pool
                .request()
                .query("SELECT * from UserTable");

            // console.log(result.recordset);
            
    
            res.status(200).json({ message: "Query successful", data: result.recordset });
        } catch (error) {
            // console.error("Error in Getting Dealers:", error.message);
            res.status(500).json({ error: "Database query failed", details: error.message });
        }
      }
//--------------Signup API
const registerUser = async (req, res) => {
    try {
      const pool = await getPool();
        const { email, firstName, lastName, middleName, DOB, contact, password } = req.body;

        if ( !email || !firstName || !lastName || !password || !contact) {
            return res.status(400).json({error:"Required missing fields"});
        }
        //check user already exist or not
        const checkQuery = `
            SELECT COUNT(*) AS count 
            FROM UserTable 
            WHERE email = @Email OR contact = @Contact
        `;

        const checkResult = await pool
            .request()
            .input('Email', sql.NVarChar(255), email)
            .input('Contact', sql.NVarChar(255), contact)
            .query(checkQuery);

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({success:"false", error: "User already exists with the provided email or contact" });
        }


        const hashedPassword = await bcrypt.hash(password, 10);
         // Convert DOB to YYYY-MM-DD format
         const dobDate = new Date(DOB);
         const formattedDOB = dobDate.toISOString().split('T')[0]; 
        // Parameterized query
        const query = `
            INSERT INTO UserTable (firstName, middleName, lastName, DOB, email, contact, password)
            VALUES ( @firstName, @middleName, @lastName, @DOB,@email, @contact, @password)
        `;

        // Execute the query
        await pool
        .request()
        // .input('id', sql.Int, id)
        .input('firstName', sql.VarChar(50), firstName)
        .input('middleName', sql.VarChar(50), middleName)
        .input('lastName', sql.VarChar(50), lastName)
        .input('DOB', sql.Date, formattedDOB)
        .input('email', sql.VarChar(100), email)
        .input('contact', sql.VarChar(15), contact)
        .input('password', sql.VarChar(255), hashedPassword)
        .query(query);
        
        res.status(201).json({ message: "User created successfully" });
      } catch (error) {
        console.error("Error signing up:", error);
        
        // Check for specific errors, e.g., duplicate key violations
        if (error.code === 'EREQUEST') {
          return res.status(400).json({ error: "Database error: likely a duplicate key or constraint violation",error });
        }
        
        res.status(500).json({ error: "Error signing up",message:error.message });
      }
    };
    //--------------Login API
const loginUser = async (req, res) => {
  try {
    const {email,password} = req.body;
    if(!isEmail(email)){
      res.status(400).json({message:"Enter a Valid Email"})
    }
    // if(!isStrongPassword(password)){
    //   res.status(400).json({message:"Enter a Strong Password"})
    // }
   
    // console.log(req);
    
    const pool = await getPool();   //Helper Function 
    // Query the database for the user with the given username
    const result = await pool.request()
    .input('email', sql.NVarChar, email)
    .query('SELECT email, password FROM UserTable WHERE email = @email');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Email Not Registered' });
    }
    
    const user = result.recordset[0];
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({success:false, error: 'Invalid credentials' });
    }
    
    
    // Generate a JWT token
    const token = jwt.sign({ userId: user.email }, process.env.SECRET_KEY, { expiresIn: '9hr' });
    // console.log(token);
    
    
    // Respond with a success message and the token
    res.json({ message: 'Login successful', token });
    
  } catch (error) {
    // console.error("Error logging in:", error);
    res.status(500).json({success:false, error: 'Unable to login' });
    // console.log(error.message)
  } 
};
const verifyToken = async(req,res)=>{
  const {token} = req.body
  if (!token) {
    return res.status(401).json({ success:false,error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    res.status(200).json({ success: true, message: 'Token is valid', decoded });
    
  } catch (error) {
    return res.status(400).json({ success:false,error: 'Invalid or expired token.' });
  }

}
//---------------- API to change password
const changePassword =  async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required.' });
    }
    if(oldPassword == newPassword){
      return res.status(400).json({success:false , message:"Old and New Password must be different"})
    }
    if(!isStrongPassword(newPassword)){
      res.status(400).json({message:`Password Should contain minLength= "8", minLowercase= 1, minUppercase= 1, minNumbers= 1, minSymbols= 1`})
    }
    
    if(!req.userId){
      return res.status(500).json({success:false , message:"Error in getting Userid from jwt"})
      
    }
      // Query to get the user's current password from the database
      const pool = await getPool();
      const result = await pool.request()
        .input('userId', sql.NVarChar, req.userId)
        .query('SELECT email, password FROM UserTable WHERE email = @userId');
        // console.log(result);
        
  

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      const user = result.recordset[0];
  
      // Compare the old password provided by the user with the stored hashed password
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Old password is incorrect.' });
      }
  
      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  
      // Update the password in the database
      await pool.request()
        .input('userId', sql.NVarChar, req.userId)
        .input('newPassword', sql.NVarChar, hashedNewPassword)
        .query('UPDATE UserTable SET password = @newPassword WHERE email = @userId');
  
      // Send a success response
      res.json({ message: 'Password updated successfully.' });
      
    } catch (error) {
      // console.error('Error changing password:', error);
      res.status(500).json({ error: 'Unable to change password.' });
    }
  };
 const forgetPassword = async(req,res)=>{
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }
      if(!isEmail(email)){
        res.status(400).json({message:"Enter a Valid Email"})
      }
      const pool = await getPool();
      const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .query('SELECT email FROM UserTable WHERE email = @email');
  
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      const otp = crypto.randomInt(100000, 999999); 
      const expiresAt = Date.now() + 2 * 60 * 1000; 
  
      otps[email] = { otp, expiresAt };
      
      const mailOptions = {
        from: process.env.EMAILID,
        to: email,
        subject: 'Password Reset OTP',
        text: `Here is your OTP: ${otp}
To authenticate, please use the following code.
This OTP is valid for 2 Minutes. Do not share your credentials or OTP with anyone on call, email or SMS.
Remember, we're always an email or call away when you need help. Till next time, ciao!
Regards,
Team SpareCare`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ error: 'Failed to send OTP.' });
        }
        // console.log(expiresAt);
        
        res.status(200).json({ message: 'OTP sent successfully.' ,expiresAt});
      });
    } catch (error) {
      console.error('Error in forgot password:', error);
      res.status(500).json({ error: 'Unable to process request.' });
    }
  }
const verifyOTP = async(req,res)=>{
  try {
      const {userOtp,email} = req.body
      if(!userOtp || !email){
        res.status(400).json({message:"Otp is required"})
      }
      if(!isEmail(email)){
        res.status(400).json({message:"Enter a Valid Email"})
      }
      const savedOtp = otps[email]
        if(!savedOtp){
          res.status(400).json({success:false,message:"Otp is not Existed Request Otp again "})
        }
        const { otp: correctOtp, expiresAt } = savedOtp;
  
        if (parseInt(userOtp) !== correctOtp) {
          return res.status(400).json({ error: 'Invalid  OTP' });
        }        
        if(Date.now() > expiresAt){
          return res.status(400).json({success:false, message:"Expired OTP"})
        }    
        // Clear OTP after successful validation
        delete otps[email];
    
        // Generate a temporary JWT token for password reset
        const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: '2m' });
        const tokenExpireTime = Date.now() + 2 * 60 * 1000; 
        res.status(200).json({ message: 'OTP validated successfully.', token , tokenExpireTime});
    } catch (error) {
      console.error('Error validating OTP:', error);
      res.status(500).json({ error: 'Unable to validate OTP.' });
    }
  }

const resetPassword = async(req,res)=>{
try {
      const {password,token} = req.body
      if(!password ){
        res.status(400).json({message:"Password is required"})
      }
      if(!token){
        res.status(400).json({message:"Token is required"})
      }
      if(!isStrongPassword(password)){
        res.status(400).json({message:`Password Should contain minLength= "8", minLowercase= 1, minUppercase= 1, minNumbers= 1, minSymbols= 1`})
      }
    
      let email
      try {
        const decoded = jwt.verify(token,process.env.SECRET_KEY)
        email = decoded.email
      } catch (error) {
        res.status(500).json({message:"Invalid or Expired token is passed"})
      }
  
      const hashedPassword = await bcrypt.hash(password,10)
      const pool = await getPool();
     await pool.request()
      .input('email', sql.VarChar(100), email)
      .input('password', sql.VarChar(255), hashedPassword)
      .query(`Update UserTable set password = @password where email = @email`)
      res.status(200).json({message:"Password changed Successfully"})
} catch (error) {
  console.log(error);
  
   res.status(500).json({message:"Error in resetting password: ",error})
}
}




export {allUsers , loginUser , verifyToken,registerUser ,changePassword , forgetPassword , verifyOTP ,resetPassword}