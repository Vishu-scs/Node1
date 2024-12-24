import {Router} from "express";
import { allUsers ,loginUser ,registerUser ,changePassword ,verifyToken,forgetPassword , verifyOTP , resetPassword} from "../controller/userController.js";
import verifyJwt from "../utils/verifyJwt.js";

const router = Router()

// router.route("/register").post(
//     // upload.fields([
//     //     {
//     //         name: "avatar",
//     //         maxCount:1
//     //     },
//     //     {
//     //         name:"coverImage",
//     //         maxCount:1
//     //     }
//     // ]),
//     registerUser)

router.route("/allUsers").get(allUsers)
router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/change-password").post(verifyJwt,changePassword)
router.route("/isValid").post(verifyToken)
router.route("/forget-password").post(forgetPassword)
router.route("/verify-otp").post(verifyOTP)
router.route("/reset-password").post(resetPassword)
export default router