const express = require("express");
const router = express.Router();
const {auth,isUser,isAdmin} = require("../middlewares/auth")

const {CreateListing,GetDraftListing,GetListingById,ChangeStatus,GetAuctionsByStatus,GetAuctionsDetailsById ,deleteCarsByIds,UploadInvoice,getInvoices,deleteBid,EditBiddingDate,GetAuctionsByStatusForUsa}  = require('../controllers/Listing')
const {ChangeUserRole,DeleteUsers,GetAllUsers,getAdminDashboardData} = require('../controllers/UserAuction')
const {Review,deleteReview,updateReview,getAllReviews} = require('../controllers/ProfileUpdate')

// post routes 
router.post('/create_listing/:step',auth,isAdmin,CreateListing);
router.post('/change_status',auth,isAdmin,ChangeStatus);
router.post('/change_role',auth,isAdmin,ChangeUserRole);
router.post('/delete_users',auth,isAdmin,DeleteUsers)
router.post('/delete_listing',auth,isAdmin,deleteCarsByIds)
router.post('/upload_invoices/:carId/:userId',auth,isAdmin,UploadInvoice);
router.post('/delete_bid/:bidId',auth,isAdmin,deleteBid);
router.post('/edit_listing_date',auth,isAdmin,EditBiddingDate);
router.post('/review',auth,isAdmin,Review);
router.post('/delete_review/:id',auth,isAdmin,deleteReview);
router.post('/update_review/:id',auth,isAdmin,updateReview);


// get routes 
router.get('/get_draft_listing',GetDraftListing);
router.get('/get_listing_by_id/:id',GetListingById);
router.get('/get_all_users',auth,isAdmin,GetAllUsers);
router.get('/get_acutions/:status/:category',GetAuctionsByStatus)
router.get('/get_acutions/usa/:status/:category',GetAuctionsByStatusForUsa)

router.get('/get_auctionsbyid/:id',auth,isAdmin,GetAuctionsDetailsById)
router.get('/admin_dashboard',getAdminDashboardData)
router.get('/get_invoices/:carId/:userId',auth,isAdmin,getInvoices);
router.get('/get_reviews',getAllReviews);

module.exports= router;