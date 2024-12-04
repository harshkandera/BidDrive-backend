const ErrorHandler = require("../utils/error");
const cloudinary = require("cloudinary").v2;
const Car = require("../models/Car");
const VehicleFeature = require("../models/VehicleFeatures");
const Bid = require("../models/Bid");
const User = require("../models/User");
const { updateHighestBid } = require("../services/firebaseService");
const mongoose = require("mongoose");
const { notifyUsers } = require("./Notification");

exports.CreateBidding = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { bidAmount } = req.body;
    const { carId: car_id, userId: user_id } = req.params;

    if (!car_id || !user_id || !bidAmount) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    if (
      !mongoose.isValidObjectId(car_id) ||
      !mongoose.isValidObjectId(user_id)
    ) {
      return next(new ErrorHandler("Invalid car or user ID", 400));
    }

    session.startTransaction();

    const car = await Car.findById(car_id).session(session);
    const user = await User.findById(user_id).session(session);

    const isProfileCompleted = user?.isProfileCompleted;

    if (!isProfileCompleted) {
      return res.status(200).json({
        success: true,
        message: "Profile is not completed.",
        data: {
          isProfileCompleted,
        }
      });
    }

    if (car.status === "draft" || car.status === "past") {
      return next(new ErrorHandler("Car is not live", 400));
    }

    if (new Date() > new Date(car.endTime) || car.status === "past") {
      return next(new ErrorHandler("Car Auction has ended", 400));
    }

    if (new Date() < new Date(car.startTime) || car.status === "draft") {
      return next(new ErrorHandler("Car Auction has not started yet", 400));
    }

    if (!car) {
      return next(new ErrorHandler("Car not found", 404));
    }
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const activeBidsForUser = await Bid.find({
      user_id,
      status: "active",
    }).session(session);

    // Allow a maximum of 2 active bids per user
    if (activeBidsForUser.length >= 2) {
      return next(
        new ErrorHandler(
          "New clients are allowed to participate in maximum 2 auctions simultaneous.",
          400
        )
      );
    }

    // Bid validation: Minimum required bid
    const minRequiredBid = car.highestBid
      ? Number(car.highestBid) + Number(car.minimumBidDifference)
      : Number(car.price) + Number(car.minimumBidDifference);

    if (bidAmount <= minRequiredBid) {
      return next(
        new ErrorHandler(
          `Bid amount should be greater than ${minRequiredBid}`,
          400
        )
      );
    }

    // console.log(activeBidForAnotherCar);

    const activeBidForThisCar = await Bid.findOne({
      user_id,
      car_id,
      status: "active",
    }).session(session);

    // console.log(activeBidForThisCar);

    if (activeBidForThisCar) {
      activeBidForThisCar.bids.push({
        bidAmount,
        bid_time: new Date(),
      });

      activeBidForThisCar.status = "active";

      // Update the car's highest bid
      car.highestBid = bidAmount;
      car.highestBidder = user_id;
      car.totalBids += 1;

      // Update Firebase (if applicable)
      const data = {
        carId: car_id,
        bidAmount: Number(bidAmount), // Convert bidAmount to number
        userId: user_id,
      };

      await updateHighestBid(data);

      await Promise.all([
        car.save({ session }),
        activeBidForThisCar.save({ session }),
      ]);

      await notifyUsers(car_id, bidAmount, user_id, car.images[0]);

      console.log(activeBidForThisCar);

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Bid updated successfully here",
      });
    }

    // Create a new bid if no active bid exists for this car
    const newBid = await Bid.create(
      [
        {
          car_id,
          user_id,
          bids: [{ bidAmount, bid_time: new Date() }],
          status: "active",
        },
      ],
      { session }
    );

    console.log("new bids", newBid);

    const data = {
      carId: car_id,
      bidAmount: Number(bidAmount),
      userId: user_id,
    };

    await updateHighestBid(data);

    // Update car and user with the new bid details
    if (!Array.isArray(car.bids)) car.bids = [];

    car.bids.push({ bidId: newBid[0]._id }); // Ensure bidId is correct

    car.highestBid = bidAmount;
    car.highestBidder = user_id;
    car.totalBids += 1;

    if (!Array.isArray(user.biddingHistory)) user.biddingHistory = [];

    user.biddingHistory.push({ bidId: newBid[0]._id });

    await Promise.all([car.save({ session }), user.save({ session })]);

    // Notify users
    await notifyUsers(car.name, car_id, bidAmount, user_id, car.images[0]);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      data: { bid: newBid[0] ,isProfileCompleted },
    });
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// end the auction
const cron = require("node-cron");

// Cron job to check for ended auctions every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    const auctions = await Car.find({
      status: "live",
      endTime: { $lte: Date.now() },
    });

    if (auctions.length > 0) {
      await endAuctionsInBulk(auctions);
    }
  } catch (err) {
    console.error("Error during auction check:", err);
  }
});


// Function to end auctions in bulk and update bid statuses

const endAuctionsInBulk = async (auctions) => {
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const auctionIds = auctions.map((auction) => auction._id);

    await Car.updateMany(
      { _id: { $in: auctionIds } },
      { $set: { status: "past" } },
      { session }
    );

    for (const auction of auctions) {
      const { _id: carId, highestBidder } = auction;

      if (highestBidder) {
        await Bid.updateOne(
          { car_id: carId, user_id: highestBidder, status: "active" },
          { $set: { status: "winner" } },
          { session }
        );

        // Mark the remaining bids as 'completed'
        await Bid.updateMany(
          { car_id: carId, user_id: { $ne: highestBidder }, status: "active" },
          { $set: { status: "completed" } },
          { session }
        );
      } else {
        // If no highestBidder exists, just mark all active bids as 'completed'
        await Bid.updateMany(
          { car_id: carId, status: "active" },
          { $set: { status: "completed" } },
          { session }
        );
      }
    }

    await session.commitTransaction();
    session.endSession();

    console.log(
      `${auctionIds.length} auctions ended. Highest bidders marked as 'winner' and other bids marked as 'completed'.`
    );
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error ending auctions and updating bid statuses:", err);
  }
};

// cron.schedule("*/5 * * * *", async () => {
//   try {
//     const auctions = await Car.find({
//       status: "live",
//       endTime: { $lte: Date.now() },
//     });

//     if (auctions.length > 0) {
//       await endAuctionsInBulk(auctions);
//     }
//   } catch (err) {
//     console.error("Error during auction check:", err);
//   }
// });


// const endAuctionsInBulk = async (auctions) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const auctionIds = auctions.map((auction) => auction._id);

//     await Car.updateMany(
//       { _id: { $in: auctionIds } },
//       { $set: { status: "past" } },
//       { session }
//     );

//     await Bid.updateMany(
//       { car_id: { $in: auctionIds }, status: "active" },
//       { $set: { status: "completed" } },
//       { session }
//     );

//     await session.commitTransaction();
//     session.endSession();

//     console.log(
//       `${auctionIds.length} auctions ended and bids marked as 'completed'.`
//     );
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Error ending auctions and updating bid statuses:", err);
//   }
// };


// const endAuction = async (auctionId) => {
//   try{

//     const auction = await Car.findById(auctionId)

//   if (!auction) return;

//   auction.status = 'past';
//   await auction.save();

//   // If there are bids, notify the highest bidder
//   // if (auction.highestBidder) {
//   //   const winner = auction.highestBidder;

//   //   // Notify the winner via email or socket (Socket.IO example)
//   //   io.to(winner._id).emit('auctionEnded', {
//   //     message: `Congratulations, you've won the auction for ${auction.carId.name}!`,
//   //     highestBid: auction.highestBid,
//   //   });

//     // You can also send an email notification using a service like SendGrid
//   // } else {

//   //   console.log('No bids placed for this auction');
//   // }

//   }catch(err){
//     next(err)
//   }
// };
