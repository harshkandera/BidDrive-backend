const express = require("express");
const router = express.Router();
const {auth,isUser,isAdmin, } = require("../middlewares/auth")
const {SendOTP , Signup, login ,RegisterToken}=require("../controllers/Auth")
const {ProfileUpdate, Getuser ,ChangePassword} = require ("../controllers/ProfileUpdate")
const  {SaveForLater,UserBidsForCar,withdrawalBidding,getDashboardData} = require("../controllers/UserAuction")
const {CreateBidding} = require("../controllers/NewAuctionCar")
const {FilterListings,createMetadata, getMetadata} =require('../controllers/Listing')
const {GetUserNotifications,MarkNotificationAsRead,DeleteNotification}=require('../controllers/Notification')
// const {NewAssignment} = require('../controllers/NewAuctionCar')
// const {NewAssessment,Getsubmission,GetselfAssessment,PeerAssessment,PeerSubmission,TeacherSubmission,FinalSubmission,FinalTask} = require("../controllers/Submission")

// authroutes
router.post("/signup",Signup);
router.post("/sendotp",SendOTP);
router.post("/login",login);
router.post("/profileupdate",ProfileUpdate);
router.post("/register_token",auth,RegisterToken);

router.post('/save_for_later/:userId/:carId',auth,isUser,SaveForLater);
router.post('/create_bidding/:userId/:carId',auth,isUser,CreateBidding);
router.post('/withdrawal_bidding/:userId/:carId',auth,isUser,withdrawalBidding);
router.post("/change_password/:id",auth,ChangePassword)
router.post('/filter',FilterListings)
router.post("/mark_notifications_read/:userId",auth ,isUser ,MarkNotificationAsRead);
router.post('/delete_notifications/:userId',auth ,isUser ,DeleteNotification);

router.get("/get_user_notifications/:userId",auth,isUser,GetUserNotifications);
router.get('/user_bids/:userId/:carId',auth,UserBidsForCar);
router.get('/get_users_detail/:userId',auth,Getuser)
router.get('/get_user_dashboard/:userId', auth ,isUser,getDashboardData)

router.post("/metadata",auth,isAdmin,createMetadata);

router.get("/metadata",getMetadata);


router.get("/user",auth, (req, res) => {
 res.status(200).json({success:true
,message:"welcome to protected route"});
});

// router.post("/new_assignment",NewAssignment);




module.exports= router;