import {Router} from "express"
import { masterTables, uploadExcel } from "../controller/masterCreation.js"
const router = Router()


router.route('/getmasters').get(masterTables)
router.route('/upload').post(uploadExcel)



export default router