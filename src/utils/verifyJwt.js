import jwt from 'jsonwebtoken'
const verifyJwt = (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        try {
        if (!token) {
          return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        
          const decoded = jwt.verify(token, process.env.SECRET_KEY);
          req.userId = decoded.userId;  
          next();
          // console.log(decoded);
          
        } catch (error) {
          return res.status(400).json({ error: 'Invalid or expired token.' });
        }
      };
export default verifyJwt