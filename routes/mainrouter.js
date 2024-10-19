const express = require("express");
const router = express.Router();
const {auth,isUser,isAdmin} = require("../middlewares/auth")

const {CreateListing,GetDraftListing,GetListingById,ChangeStatus,GetAuctionsByStatus,GetAuctionsDetailsById ,deleteCarsByIds,UploadInvoice,getInvoices,deleteBid}  = require('../controllers/Listing')
const {ChangeUserRole,DeleteUsers,GetAllUsers,getAdminDashboardData} = require('../controllers/UserAuction')

// post routes 
router.post('/create_listing/:step',auth,isAdmin,CreateListing);
router.post('/change_status',auth,isAdmin,ChangeStatus);
router.post('/change_role',auth,isAdmin,ChangeUserRole);
router.post('/delete_users',auth,isAdmin,DeleteUsers)
router.post('/delete_listing',auth,isAdmin,deleteCarsByIds)
router.post('/upload_invoices/:carId/:userId',auth,isAdmin,UploadInvoice);
router.post('/delete_bid/:bidId',auth,isAdmin,deleteBid);

// get routes 
router.get('/get_draft_listing',GetDraftListing);
router.get('/get_listing_by_id/:id',GetListingById);
router.get('/get_all_users',auth,isAdmin,GetAllUsers);
router.get('/get_acutions/:status',GetAuctionsByStatus)
router.get('/get_auctionsbyid/:id',auth,isAdmin,GetAuctionsDetailsById)
router.get('/admin_dashboard',getAdminDashboardData)
router.get('/get_invoices/:carId/:userId',auth,isAdmin,getInvoices);


module.exports= router;