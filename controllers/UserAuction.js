const ErrorHandler = require("../utils/error");
const Car = require("../models/Car");
const User = require("../models/User");
const mongoose = require("mongoose");
const Bid = require("../models/Bid");
const Notification = require("../models/Notification");

exports.SaveForLater = async (req, res, next) => {
  const session = await mongoose.startSession(); // Start a session for a transaction
  session.startTransaction(); // Begin transaction

  try {
    const { userId, carId } = req.params;

    // Validate ObjectIds
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(carId)) {
      return next(new ErrorHandler("Invalid user or car ID", 400));
    }

    // Fetch user in parallel
    const user = await User.findById(userId).session(session);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Check if the car is already saved by the user
    const isAlreadySaved = user.cart.some(
      (item) => item.carId.toString() === carId
    );

    if (isAlreadySaved) {
      await User.updateOne(
        { _id: userId },
        { $pull: { cart: { carId: carId } } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Car removed from saved items",
      });
    } else {
      // Save for later
      await User.updateOne(
        { _id: userId },
        { $addToSet: { cart: { carId, addedAt: Date.now() } } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Car saved for later successfully",
      });
    }
  } catch (error) {
    await session.abortTransaction(); // Rollback transaction in case of error
    session.endSession();
    next(error); // Pass the error to the error handler middleware
  }
};

exports.UserBidsForCar = async (req, res, next) => {
  try {
    const { userId, carId } = req.params;

    // Validate IDs
    if (
      !userId ||
      !mongoose.isValidObjectId(userId) ||
      !carId ||
      !mongoose.isValidObjectId(carId)
    ) {
      return next(new ErrorHandler("Invalid user and car ID", 400));
    }

    // Fetch bids
    const biddingHistory = await Bid.find({ user_id: userId, car_id: carId });

    // console.log(biddingHistory);

    // Check if bidding history exists
    if (!biddingHistory || biddingHistory.length === 0) {
      return next(new ErrorHandler("No bids found", 404));
    }

    // Send response
    return res.status(200).json({
      success: true,
      message: "User bids fetched successfully",
      biddingHistory,
    });
  } catch (err) {
    console.error(err); // Use console.error for logging errors
    next(err); // Pass the error to the error handling middleware
  }
};

exports.getDashboardData = async (req, res, next) => {
  try {
    const userId = req.user.id || req.params.userId;

    const totalBids = await Bid.countDocuments({ user_id: userId });

    const winningBids = await Bid.find({ user_id: userId, status: "winner" })
      .populate("car_id", "name price endTime images highestBid totalBids")
      .sort({ "car_id.endTime": -1 })
      .limit(3)
      .lean();

      const activeBids = await Bid.find({ user_id: userId, status: "active" })
      .populate({
        path: "car_id",
        select: "name price endTime highestBid images",
        options: { images: { $slice: 1 } },
      })
      .lean();
    

    const upcomingAuctions = await Car.find({
      startTime: { $gt: new Date() },
      status: "live",
    })
      .select("startTime images name price")
      .sort({ startTime: 1 })
      .limit(3)
      .lean();

    const user = await User.findById(userId)
      .populate({
        path: "notifications",
        options: {
          sort: { createdAt: -1 }, // Sort by the most recent
          limit: 2, // Limit to the last 5 notifications
        },
      })
      .lean();

    const notifications = user.notifications || [];

    return res.status(200).json({
      success: true,
      data: {
        totalBids,
        winningBids,
        activeBids,
        upcomingAuctions,
        notifications,
      },
    });
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler("Error fetching dashboard data", 500));
  }
};

exports.withdrawalBidding = async (req, res, next) => {
  const { userId, carId } = req.params;

  console.log("user id", userId);
  console.log("car id", carId);

  if (!userId || !carId) {
    return res
      .status(400)
      .json({ message: "User ID and Car ID are required." });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find the user and the active bid
    const user = await User.findById(userId).session(session);
    const bid = await Bid.findOne({
      user_id: userId,
      car_id: carId,
      status: "active",
    }).session(session);

    // console.log("user bid ------>", bid);

    if (!user || !bid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User or active bid not found." });
    }

    if (bid.status !== "active") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "Bid is not active. Please try again later." });
    }

    // Update the bid status to 'cancelled'
    bid.status = "cancelled";
    await bid.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: "Bid successfully withdrawn." });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error withdrawing bid:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while withdrawing the bid." });
  }
};



exports.GetAllUsers = async (req, res, next) => {
  try {

    const allusers = await User.find(
      {},
      "username phone email image accountType biddingHistory _id"
    );

    const users = allusers.reverse();



    const usersWithBids = await Promise.all(

      users.map(async (user) => {
        const activeBids = await Bid.find({
          user_id: user._id,
          status: "active",
        });
        // .sort({ updatedAt: -1 })
        // .populate('car_id', 'name');

        const lastBid = await Bid.find({
          user_id: user._id,
          status: "completed",
        });
        // .sort({ updatedAt: -1 })
        // .populate('car_id', 'name');
        // lastBid: lastBid ? {
        //     bidId: lastBid._id,
        //     bidAmount: lastBid.bids[lastBid.bids.length - 1]?.bidAmount,
        //     bid_time: lastBid.bids[lastBid.bids.length - 1]?.bid_time,
        //     carName: lastBid.car_id ? lastBid.car_id.name : null
        // } : null

        return {
          _id: user._id,
          username: user.username,
          phone: user.phone,
          email: user.email,
          image: user.image,
          accountType: user.accountType,
          activeBidsCount: activeBids.length,
          biddingHistoryCount: user.biddingHistory.length,
          completedBidsCount: lastBid.length,
        };
      })
    );

    return res.status(200).json(usersWithBids);
  } catch (error) {
    console.error(error);
    next(error);
  }
};




exports.DeleteUsers = async (req, res, next) => {
  
  const { userIds } = req.body;
  console.log(userIds);

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: "Invalid user IDs array." });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Step 1: Delete the users
    const userDeletionResult = await User.deleteMany({
      _id: { $in: userIds },
    }).session(session);

    if (userDeletionResult.deletedCount === 0) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ message: "No users found with the provided IDs." });
    }

    // Step 2: Find and delete the bids associated with those users
    const bidsToDelete = await Bid.find({ user_id: { $in: userIds } }).session(
      session
    );

    if (bidsToDelete.length > 0) {
      const bidIds = bidsToDelete.map((bid) => bid._id);

      // Step 3: Delete the bids
      const bidDeletionResult = await Bid.deleteMany({
        _id: { $in: bidIds },
      }).session(session);

      // Step 4: Remove these bidIds from the Car schema
      await Car.updateMany(
        { "bids.bidId": { $in: bidIds } },
        { $pull: { bids: { bidId: { $in: bidIds } } } },
        { multi: true }
      ).session(session);

      // Step 5: Set the `highestBidder` to null for cars where the user is the highest bidder
      await Car.updateMany(
        { highestBidder: { $in: userIds } },
        { highestBidder: null }
      ).session(session);
    }

    // Step 6: Find the remaining users after the deletion
    // const remainingUsers = await GetAllUsers(); // No need to use session here

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: `${userDeletionResult.deletedCount} user(s) deleted successfully, and associated bids and references were updated.`,
      // remainingUsers,    // Send the remaining users in the response
    });
  } catch (error) {
    // Abort the transaction if something goes wrong
    await session.abortTransaction();
    session.endSession();

    console.error(error);
    next(error);
  }
};




exports.ChangeUserRole = async (req, res, next) => {
  const { userId, newRole } = req.body;

  if (!userId || !newRole || !["Admin", "User"].includes(newRole)) {
    return res.status(400).json({ message: "Invalid user ID or role." });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { accountType: newRole },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // const users = await GetAllUsers();

    return res
      .status(200)
      .json({ message: "User role updated successfully.", user });
  } catch (error) {
    console.error(error);
    next(error);
  }
};




exports.getAdminDashboardData = async (req, res, next) => {
  try {
    const totalActiveAuctions = await Car.countDocuments({ status: "live" });
    const totalNonActiveAuctions = await Car.countDocuments({ status: { $ne: "live" } });
    const totalCarsListed = await Car.countDocuments();
    const totalBidsPlaced = await Bid.countDocuments();

    const currentDate = new Date();

    const upcomingAuctions = await Car.find({
      startTime: { $gte: currentDate }, 
      status: "live", 
    })
      .sort({ startTime: 1 }) 
      .select({
        name: 1,
        startTime: 1,
        price: 1,
        endTime: 1,
        images: { $slice: 1 },  
      })
      .limit(5)
      .lean();
  

    const DraftListings = await Car.find({status: "draft"})
      .sort({ createdAt: -1 })
      .select({
        name: 1,
        startTime: 1,
        price: 1,
        endTime: 1,
        images: { $slice: 1 },  
        step1: 1,
        step2: 1,
        step3: 1,
      })
      .limit(5)
      .lean();
      

      const recentBidsOnCar = await Car.find({
        status: "live", 
        highestBid: { $exists: true, $ne: null }, 
    })
    .sort({ updatedAt: -1 }) 
    .limit(10) 
    .select({
      name: 1,         
      highestBid: 1,    
      highestBidder: 1, 
      endTime: 1,  
      images: { $slice: 1 },  
 
    })
    .populate("highestBidder", "username email") 
    .lean();
    


    const newUsers = await User.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, 
      accountType: { $ne: "Admin" },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name email username image createdAt")
      .lean();

    const activeBids = await Bid.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$user_id",
          activeBidCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: "$userInfo.name",
          activeBidCount: 1,
        },
      },
    ]);

    const totalActiveUsers = activeBids.length;
    const activeUserIds = activeBids.map((bid) => bid.userId); 
    const totalNonActiveUsers = await User.countDocuments({
      _id: { $nin: activeUserIds }, 
      accountType: { $ne: "Admin" }, 
    });


    const RecentWinners = await Car.find({
      status: "past",
      highestBid: { $exists: true, $ne: null }, 
    })
    .sort({ endTime: -1 }) 
    .limit(15) 
    .select({
      name: 1,         
      highestBid: 1,    
      highestBidder: 1,
      images: { $slice: 1 },   
      endTime: 1,   
    })
    .populate({
      path: "highestBidder", 
      select: "username email image" , 
    })
    .lean(); 
    


    return res.status(200).json({
      success: true,
      data: {
        totalActiveAuctions,
        totalNonActiveAuctions,
        totalCarsListed,
        totalNonActiveUsers,
        totalBidsPlaced,
        totalActiveUsers,
        upcomingAuctions,
        DraftListings, 
        newUsers,
        RecentWinners,
        recentBidsOnCar
      },
    });
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler("Error fetching admin dashboard data", 500));
  }
};


