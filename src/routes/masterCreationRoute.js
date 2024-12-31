import {Router} from "express"
import { masterTables, getSchema,uploadExcel } from "../controller/masterCreation.js"
const router = Router()


router.route('/getmasters').get(masterTables)
router.route('/getschema').get(getSchema)
router.route('/upload').post(uploadExcel)



export default router