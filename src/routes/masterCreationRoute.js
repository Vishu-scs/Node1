import {Router} from "express"
import { masterTables, getSchema,uploadExcel , insertData } from "../controller/masterCreation.js"
import { upload } from "../middlewares/multer.js"
const router = Router()





router.route('/getmasters').get(masterTables)
router.route('/getschema').post(getSchema)
router.route('/upload').post(upload.single('file'),uploadExcel);
router.route('/insert').post(insertData)



export default router