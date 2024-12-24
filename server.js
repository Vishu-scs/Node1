import express from "express"
import sql from "mssql"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
// import { OAuth2Client } from "google-auth-library"
import crypto from "crypto"
import nodemailer from "nodemailer"
import 'dotenv/config'

const app = express();
app.use(express.json());

// const CLIENT_ID = '940424350865-bv65q5hq4i6svvtr03r18l310tqsk7pl.apps.googleusercontent.com';
// const client = new OAuth2Client(CLIENT_ID);

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

// let pool;
// const connectDB=async ()=>{

//     try {
//          pool = await sql.connect(config);
//         console.log("Connection Created");
//         return pool
//     } catch (error) {
//         console.log("Error in Connection- ",error);
        
//     }

// };
// connectDB()
// .then((pool) => {
//     console.log("Database is ready for queries.");
    
// })
// .catch((error) => {
//     console.error("Failed to connect to the database:", error);
//     process.exit(1); 
// });
const poolPromise = new sql.ConnectionPool(config)
.connect()
.then(pool => {
    console.log('Connected to SQL Server');
    return pool;
})
.catch(err => {
    console.error('Database connection failed!', err);
    throw err;
});

async function getDBPool() {
    try {
        return await poolPromise;
    } catch (err) {
        console.error("Failed to get database pool", err);
        throw new Error("Database connection failed");
    }
}

const verifyToken = (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        
        try {
          const decoded = jwt.verify(token, process.env.SECRET_KEY);
          req.userId = decoded.userId;  
          next();
          console.log(decoded);
          
        } catch (error) {
          return res.status(400).json({ error: 'Invalid or expired token.' });
        }
      };
    
const otps = {}
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAILID,
    pass: process.env.EMAILPASSWORD,
  },
});
app.get('/', (req, res) => {
    res.send('Hello World!')
     })
//------------Get ALL Users
app.get('/allUsers', async (req, res) => {

        try {
            const pool = await getDBPool();
            const result = await pool
                .request()
                .query("SELECT * from UserTable");

            // console.log(result.recordset);
            
    
            res.status(200).json({ message: "Query successful", data: result.recordset });
        } catch (error) {
            // console.error("Error in Getting Dealers:", error.message);
            res.status(500).json({ error: "Database query failed", details: error.message });
        }
      })
//--------------Signup API
app.post('/register', async (req, res) => {
    try {
      const pool = await getDBPool();
        const { id, email, firstName, lastName, middleName, DOB, Contact, password } = req.body;

        if (!id || !email || !firstName || !lastName || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        // Parameterized query
        const query = `
            INSERT INTO UserTable (id, firstName, middleName, lastName, DOB, email, contact, password)
            VALUES (@id, @firstName, @middleName, @lastName, @DOB,@email, @contact, @password)
        `;

        // Execute the query
        await pool
        .request()
        .input('id', sql.Int, id)
        .input('firstName', sql.VarChar(50), firstName)
        .input('middleName', sql.VarChar(50), middleName)
        .input('lastName', sql.VarChar(50), lastName)
        .input('DOB', sql.Date, DOB)
        .input('email', sql.VarChar(100), email)
        .input('contact', sql.VarChar(15), Contact)
        .input('password', sql.VarChar(255), hashedPassword)
        .query(query);
        
        res.status(201).json({ message: "User created successfully" });
      } catch (error) {
        console.error("Error signing up:", error);
        
        // Check for specific errors, e.g., duplicate key violations
        if (error.code === 'EREQUEST') {
          return res.status(400).json({ error: "Database error: likely a duplicate key or constraint violation" });
        }
        
        res.status(500).json({ error: "Error signing up" });
      }
    });
    //--------------Login API
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = await getDBPool();   ///Helper Function 
    // Query the database for the user with the given username
    const result = await pool.request()
    .input('email', sql.NVarChar, email)
    .query('SELECT email, password FROM UserTable WHERE email = @email');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Email not Registered' });
    }
    
    const user = result.recordset[0];
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    
    // Generate a JWT token
    const token = jwt.sign({ userId: user.email }, process.env.SECRET_KEY, { expiresIn: '9hr' });
    console.log(token);
    
    
    // Respond with a success message and the token
    res.json({ message: 'Login successful', token });
    
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: 'Unable to login' });
  } 
});
app.post('/isValid',async(req,res)=>{
  const {token} = req.body
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    res.status(200).json({ success: true, message: 'Token is valid', decoded });
    
  } catch (error) {
    return res.status(400).json({ error: 'Invalid or expired token.' });
  }

})
//---------------- API to change password
app.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required.' });
    }
    
    // Check if new password meets the security criteria (you can customize this)
    //   if (newPassword.length < 6) {
      //     return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    //   }
  
      // Query to get the user's current password from the database
      const pool = await getDBPool();
      const result = await pool.request()
        .input('userId', sql.NVarChar, req.userId)
        .query('SELECT email, password FROM UserTable WHERE email = @userId');
        console.log(result);
        
  

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
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Unable to change password.' });
    }
  });
  app.post('/forget-password', async(req,res)=>{
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }
  
      const pool = await getDBPool();
      const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .query('SELECT email FROM UserTable WHERE email = @email');
  
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      const otp = crypto.randomInt(100000, 999999); 
      const expiresAt = Date.now() + 2 * 60 * 1000; 
  
      otps[email] = { otp, expiresAt };
      // console.log(otp);
      
      const mailOptions = {
        from: process.env.EMAILID,
        to: email,
        subject: 'Password Reset OTP',
        text: `Here is your OTP: ${otp}
To authenticate, please use the following code.
This OTP is valid for 3 Minutes. Do not share your credentials or OTP with anyone on call, email or SMS.
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
  )
  app.post('/verify-otp',async(req,res)=>{
  try {
      const {userOtp,email} = req.body
      if(!userOtp || !email){
        res.status(400).json({message:"otp is required"})
      }
      const savedOtp = otps[email]
        if(!savedOtp){
          res.status(400).json({message:"Otp is not requested"})
        }
        const { otp: correctOtp, expiresAt } = savedOtp;
  
        if (parseInt(userOtp) !== correctOtp || Date.now() > expiresAt) {
          return res.status(400).json({ error: 'Invalid or expired OTP.' });
        }
    
        // Clear OTP after successful validation
        delete otps[email];
    
        // Generate a temporary JWT token for password reset
        const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: '3m' });
        const tokenExpireTime = Date.now() + 3 * 60 * 1000; 
        res.status(200).json({ message: 'OTP validated successfully.', token, tokenExpireTime});
    } catch (error) {
      console.error('Error validating OTP:', error);
      res.status(500).json({ error: 'Unable to validate OTP.' });
    }
  }
  )
  app.post('/reset-password',async(req,res)=>{
try {
      const {password,token} = req.body
      if(!password ){
        res.status(400).json({message:"Password is required"})
      }
      if(!token){
        res.status(400).json({message:"Token is required"})
      }
    
      let email
      try {
        const decoded = jwt.verify(token,process.env.SECRET_KEY)
        email = decoded.email
      } catch (error) {
        res.status(500).json({message:"Invalid or Expired token is passed"})
      }
  
      const hashedPassword = await bcrypt.hash(password,10)
      const pool = await getDBPool();
     await pool.request()
      .input('email', sql.VarChar(100), email)
      .input('password', sql.VarChar(255), hashedPassword)
      .query(`Update UserTable set password = @password where email = @email`)
      res.status(200).json({message:"Password changed Successfully"})
} catch (error) {
  console.log(error);
  
   res.status(500).json({message:"Error in resetting password: ",error})
}
  })
//--------------API for verifing Google ID Token  
//   app.post('/auth/google', async (req, res) => {
//     const { token } = req.body;

//     try {
//         const ticket = await client.verifyIdToken({
//             idToken: token,
//             audience: CLIENT_ID,
//         });
//         const payload = ticket.getPayload();
//         const userId = payload['sub']; // Google user ID
//         const email = payload['email']; // User's email
//         const name = payload['name']; // User's name

//         res.status(200).json({ userId, email, name });
//     } catch (error) {
//         console.error('Error verifying token:', error);
//         res.status(401).json({ error: 'Invalid token' });
//     }
// });



app.listen(3000,()=>{
    console.log("Listening on 3000")

})