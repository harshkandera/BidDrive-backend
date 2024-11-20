const ErrorHandler = require("../utils/error");
const cloudinary = require("cloudinary").v2;
const Car = require("../models/Car");
const VehicleFeature = require("../models/VehicleFeatures");
const mongoose = require("mongoose");
const Bid = require("../models/Bid");
const Meta = require("../models/MetaData");
const User = require("../models/User");

function isFileSupported(type, supportedTypes) {
  return supportedTypes.includes(type);
}



async function uploadFileToCloudinary(file, folder) {
  const options = {
    folder: folder,
    public_id: `${Date.now()}`,
    resource_type: "image",
    transformation: [
      {
        width: 1000,
        height: 800,
        crop: "fill",
        gravity: "auto",
        quality: "auto:best",
        fetch_format: "auto",
        dpr: "auto",
      },
    ],
  };
  return await cloudinary.uploader.upload(file.tempFilePath, options);
}


const updateCarListing = async (id, updateFields, step, res, message) => {
  const updatedCarListing = await Car.findByIdAndUpdate(
    id,
    {
      $set: {
        ...updateFields,
        [`step${step}`]: true,
      },
    },
    { new: true }
  );

  return res.status(200).json({
    success: true,
    message,
    updatedCarListing,
  });
};

exports.CreateListing = async (req, res, next) => {
  try {
    const { step } = req.params;
    const { id } = req.body;

    console.log(req.params);
    console.log(req.body);

    // Handle step 1: Car information
    if (step === "1") {
      const {
        name,
        description,
        price,
        startTime,
        endTime,
        minimumBidDifference,
      } = req.body;

      const missingFields = [];
      if (!name) missingFields.push("name");
      if (!description) missingFields.push("description");
      if (!price) missingFields.push("price");
      if (!startTime) missingFields.push("startTime");
      if (!endTime) missingFields.push("endTime");
      if (!minimumBidDifference) missingFields.push("minimumBidDifference");

      if (missingFields.length > 0) {
        return next(
          new ErrorHandler(
            `Missing required fields: ${missingFields.join(", ")}`,
            400
          )
        );
      }

      if (id) {
        return await updateCarListing(
          id,
          {
            name,
            description,
            price,
            startTime,
            endTime,
            minimumBidDifference,
          },
          1,
          res,
          "Car listing updated successfully"
        );
      }

      const newCarListing = await Car.create({
        name,
        description,
        price,
        startTime,
        endTime,
        minimumBidDifference,
        step1: true,
      });

      return res.status(200).json({
        success: true,
        message: "Car listing created successfully",
        newCarListing,
      });
    }

    // Handle step 2: Features
    if (step === "2") {
      const {
        vehicleInformation,
        features: optionsFeature,
        techfeatures: technicalFeature,
        damages,
      } = req.body;

      if (!id) return next(new ErrorHandler("id is required", 400));
      if (!vehicleInformation)
        return next(new ErrorHandler("vehicleInformation is required", 400));

      const car = await Car.findById(id).populate("vehicleFeatures");

      if (!car) return next(new ErrorHandler("Car not found", 404));

      if (car.vehicleFeatures) {
        // Update existing vehicle features
        car.vehicleFeatures.vehicleInformation = vehicleInformation;
        car.vehicleFeatures.optionsFeature = optionsFeature;
        car.vehicleFeatures.technicalFeature = technicalFeature;
        car.vehicleFeatures.damages = damages;
        await car.vehicleFeatures.save();

        return res.status(200).json({
          success: true,
          message: "Features updated successfully",
          car,
        });
      }

      const newFeatures = new VehicleFeature({
        vehicleInformation,
        optionsFeature,
        technicalFeature,
        damages,
      });

      await newFeatures.save();

      return await updateCarListing(
        id,
        { vehicleFeatures: newFeatures._id },
        2,
        res,
        "Features data saved successfully"
      );
    }

    // Handle step 3: Images
    if (step === "3") {
      if (!id) return next(new ErrorHandler("id is required", 400));

      let files = req.files?.images;
      const supportedTypes = ["jpg", "jpeg", "png"];
      if (!files || files.length === 0)
        return next(new ErrorHandler("No images provided", 400));

      if (!Array.isArray(files)) files = [files];

      const uploadPromises = files.map(async (file) => {
        const fileType = file.name.toLowerCase().split(".").pop();
        if (!supportedTypes.includes(fileType))
          throw new ErrorHandler(`File type ${fileType} not supported`, 400);
        const response = await uploadFileToCloudinary(file, "CarsImages");
        return { fileurl: response.secure_url };
      });

      const mergedArray = await Promise.all(uploadPromises);

      return await updateCarListing(
        id,
        { images: mergedArray },
        3,
        res,
        "Images uploaded successfully"
      );
    }
  } catch (error) {
    next(error);
  }
};

async function getAuctionHistory(carId) {
  try {
    const auctionHistory = await Bid.aggregate([
      { $match: { car_id: new mongoose.Types.ObjectId(carId) } },

      // Unwind the bids array to treat each bid as a separate document
      { $unwind: "$bids" },

      // Sort the bids in ascending order of bidAmount
      { $sort: { "bids.bidAmount": 1 } },

      // Lookup to populate user information based on user_id
      {
        $lookup: {
          from: "users", // Name of the collection that holds users
          localField: "user_id", // Field from the Bid model
          foreignField: "_id", // Field from the User model
          as: "user", // Alias for the populated user data
        },
      },

      // Project to include the fields you need
      {
        $project: {
          _id: 1,
          car_id: 1,
          bidAmount: "$bids.bidAmount",
          bidTime: "$bids.bid_time",
          status: 1,
          user: {
            id: { $arrayElemAt: ["$user._id", 0] },
            username: { $arrayElemAt: ["$user.username", 0] },
            email: { $arrayElemAt: ["$user.email", 0] },
            image: { $arrayElemAt: ["$user.image", 0] },
          },
        },
      },
    ]);

    return auctionHistory;
  } catch (error) {
    console.error("Error fetching auction history:", error);
    throw error;
  }
}

exports.GetDraftListing = async (req, res, next) => {
  try {
    const draftListings = await Car.find();

    return res.status(200).json({
      success: true,
      draftListings,
    });
  } catch (error) {
    next(error);
  }
};

exports.GetListingById = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return next(new ErrorHandler("Car listing not found", 404));
    }

    const Listing = await Car.findById({ _id: req.params.id }).populate(
      "vehicleFeatures"
    );

    const SortedBids = await getAuctionHistory(req.params.id);

    return res.status(200).json({
      success: true,
      Listing,
      SortedBids,
    });
  } catch (error) {
    next(error);
  }
};

exports.ChangeStatus = async (req, res, next) => {
  try {
    const { carIds, status } = req.body;
    console.log(req.body);
    // Validate input
    if (!carIds || !Array.isArray(carIds) || carIds.length === 0 || !status) {
      return next(new ErrorHandler("Select The Listing To Update", 400));
    }

    const idsToVerify = carIds.map((id) => new mongoose.Types.ObjectId(id));

    if (status === "live") {
      const carListings = await Car.find({ _id: { $in: idsToVerify } });

      if (carListings.length === 0) {
        return next(new ErrorHandler("Car not found", 404));
      }

      const incompleteListings = carListings.filter(
        (listing) => !listing.step1 || !listing.step2 || !listing.step3
      );

      if (incompleteListings.length > 0) {
        return next(new ErrorHandler("Complete Car Listing Details", 400));
      }
    }

    const result = await Car.updateMany(
      { _id: { $in: idsToVerify } },
      { status: status }
    );

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.FilterListings = async (req, res, next) => {
  try {
    const {
      keyword,
      make,
      model,
      fromyear,
      tillyear,
      price,
      kms_driven,
      bodyType,
      page = 1,
      limit = 32,
    } = req.body;

    const match = {};

    console.log(req.body);

    // Keyword filtering
    if (keyword) {
      match.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        {
          "vehicleFeatures.vehicleInformation.make": {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          "vehicleFeatures.vehicleInformation.model": {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          "vehicleFeatures.vehicleInformation.kms_driven": {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          "vehicleFeatures.vehicleInformation.body_type": {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          "vehicleFeatures.vehicleInformation.fuel_type": {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          "vehicleFeatures.vehicleInformation.transmission": {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          "vehicleFeatures.vehicleInformation.color": {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          "vehicleFeatures.vehicleInformation.location": {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          "vehicleFeatures.vehicleInformation.registration_year": {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          "vehicleFeatures.vehicleInformation.trim": {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          "vehicleFeatures.vehicleInformation.mileage": {
            $regex: keyword,
            $options: "i",
          },
        },
      ];
    }

    // Year range filtering (only if both fromyear and tillyear are provided)
    if (fromyear || tillyear) {
      const fromYear = fromyear ? Number(fromyear) : undefined;
      const tillYear = tillyear ? Number(tillyear) : undefined;

      if (fromYear || tillYear) {
        match["vehicleFeatures.vehicleInformation.registration_year"] = {
          ...(fromYear && { $gte: fromYear }),
          ...(tillYear && { $lte: tillYear }),
        };
      }
    }

    // Make filtering
    if (make) {
      match["vehicleFeatures.vehicleInformation.make"] = {
        $regex: make,
        $options: "i", // Case insensitive
      };
    }

    // Model filtering (case insensitive)
    if (model) {
      match["vehicleFeatures.vehicleInformation.model"] = {
        $regex: model,
        $options: "i", // Case insensitive
      };
    }

    // Price range filtering
    if (price) {
      const [minPrice, maxPrice] = price.split("-").map(Number);
      match["vehicleFeatures.vehicleInformation.price"] = {
        ...(minPrice && { $gte: minPrice }),
        ...(maxPrice && { $lte: maxPrice !== Infinity ? maxPrice : undefined }),
      };
    }

    // KMs Driven filtering
    if (kms_driven) {
      match["vehicleFeatures.vehicleInformation.kms_driven"] = {
        $lte: Number(kms_driven),
      };
    }

    // Body Type filtering (case insensitive)
    if (bodyType) {
      match["vehicleFeatures.vehicleInformation.body_type"] = {
        $regex: bodyType,
        $options: "i", // Case insensitive
      };
    }

    console.log(
      "Complete filter match object:",
      JSON.stringify(match, null, 2)
    );

    const cars = await Car.aggregate([
      {
        $lookup: {
          from: "features",
          localField: "vehicleFeatures",
          foreignField: "_id",
          as: "vehicleFeatures",
        },
      },
      {
        $unwind: {
          path: "$vehicleFeatures",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          ...match,
          status: { $nin: ["draft", "past"] }, // Exclude cars with status 'draft' and 'past'
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          images: 1,
          highestBid: 1,
          totalBids: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          price: 1,
        },
      },
      {
        $facet: {
          paginatedResults: [
            { $skip: (page - 1) * limit }, // Skip documents
            { $limit: limit }, // Limit to page size
          ],
          totalCount: [
            { $count: "count" }, // Count total documents matching the filter
          ],
        },
      },
    ]);

    // Getting the total count of cars
    const totalItems =
      cars[0].totalCount.length > 0 ? cars[0].totalCount[0].count : 0;

    const total = await Car.countDocuments({
      status: { $nin: ["draft", "past"] },
    });

    res.json({
      cars: cars[0].paginatedResults,
      totalCars: totalItems,
      total,
      pages: Math.ceil(totalItems / limit), // Calculate total pages
      page: page,
    });
  } catch (error) {
    console.error("Error fetching cars:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.GetAuctionsByStatus = async (req, res, next) => {
  try {
    const { status = "live" } = req.params;
    const { page = 1, limit } = req.query;
    const now = new Date();
    let query = {
      status: { $ne: "draft" },
    };

    // Filter by auction status
    if (status === "live") {
      query = {
        ...query,
        status: "live",
        startTime: { $lte: now },
        endTime: { $gte: now },
      };
    } else if (status === "past") {
      query = {
        ...query,
        status: "past",
        endTime: { $lt: now },
      };
    } else if (status === "upcoming") {
      query = {
        ...query,
        startTime: { $gt: now },
      };
    }

    let auctions;
    let total;

    if (status === "active") {

      const result = await Car.aggregate([
        { $match: query }, // Use the constructed query
        {
          $lookup: {
            from: "bids",
            localField: "_id",
            foreignField: "car_id",
            as: "bids",
          },
        },
        { $match: { "bids.0": { $exists: true } } }, // Ensure there is at least one bid
        {
          $lookup: {
            from: "users",
            localField: "highestBidder",
            foreignField: "_id",
            as: "highestBidderDetails",
          },
        },
        {
          $lookup: {
            from: "features",
            localField: "vehicleFeatures", // Ensure this is the correct field reference
            foreignField: "_id",
            as: "vehicleFeaturesDetails",
          },
        },
        {
          $facet: {
            auctions: [
              {
                $project: {
                  name: 1,
                  description: 1,
                  images: 1,
                  price: 1,
                  startTime: 1,
                  endTime: 1,
                  highestBid: 1,
                  totalBids: { $size: "$bids" }, // Total bids count
                  status: 1,
                  created_at: 1,
                  vehicleFeatures: {
                    vehicleInformation: {
                      registration_year: { $arrayElemAt: ["$vehicleFeaturesDetails.vehicleInformation.registration_year", 0] },
                      make: { $arrayElemAt: ["$vehicleFeaturesDetails.vehicleInformation.make", 0] },
                      model: { $arrayElemAt: ["$vehicleFeaturesDetails.vehicleInformation.model", 0] },
                    },
                  },
                    highestBidder: {
                    $cond: {
                      if: { $gt: [{ $size: "$highestBidderDetails" }, 0] },
                      then: {
                        username: { $arrayElemAt: ["$highestBidderDetails.username", 0] },
                        email: { $arrayElemAt: ["$highestBidderDetails.email", 0] },
                        image: { $arrayElemAt: ["$highestBidderDetails.image", 0] },
                        phone: { $arrayElemAt: ["$highestBidderDetails.phone", 0] },
                      },
                      else: null, // Return null if no highest bidder found
                    } 
                  }
                },
              },
              { $skip: (page - 1) * limit },
              { $limit: Number(limit) },
            ],
            totalCount: [
              { $count: "count" }, // Count total documents matching the query
            ],
          },
        },
      ]);

      auctions = result[0]?.auctions || [];
      total = result[0]?.totalCount[0]?.count || 0;

    } else {

      auctions = await Car.find(
        query,
        "name description images price startTime endTime highestBid totalBids status created_at vehicleFeatures"
      )
        .populate("highestBidder", "username email image phone")
        .populate(
          "vehicleFeatures",
          "vehicleInformation.registration_year vehicleInformation.make vehicleInformation.model"
        )
        .skip((page - 1) * limit)
        .limit(Number(limit));

      total = await Car.countDocuments(query);

    }

    const totalCars = await Car.countDocuments({
      status: { $nin: ["draft", "past"] },
    });
    

    const totalAuctions = await Car.countDocuments({
      status: { $ne: "draft" },
    });

    return res.status(200).json({
      total,
      totalCars,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
      auctions,
      totalAuctions,
    });
  } catch (error) {
    console.error("Error fetching auctions:", error);
    next(error);
  }
};



exports.GetAuctionsDetailsById = async (req, res, next) => {
  try {
    const auctionId = req.params.id;

    if (!auctionId) {
      return next(new ErrorHandler("Car listing not found", 404));
    }

    // Find the auction by ID and populate necessary fields
    const auction = await Car.findById(
      auctionId,
      "name description images price startTime endTime highestBid totalBids status created_at vehicleFeatures"
    )
      .populate("highestBidder", "username email image phone firstname lastname street city state country pincode companyName")
      .populate("vehicleFeatures", "vehicleInformation")
      .exec();

    // Check if the auction exists
    if (!auction) {
      return next(new ErrorHandler("Auction not found", 404));
    }

    // Get sorted bids from a helper function
    const SortedBids = await getAuctionHistory(auctionId);

    // Return auction details in response
    return res.status(200).json({
      success: true,
      data: {
        name: auction.name,
        _id: auction._id,
        description: auction.description,
        price: auction.price,
        images: auction.images,
        startTime: auction.startTime,
        endTime: auction.endTime,
        minimumBidDifference: auction.minimumBidDifference,
        highestBid: auction.highestBid,
        highestBidder: auction.highestBidder,
        totalBids: auction.totalBids,
        status: auction.status,
        vehicleFeatures: auction.vehicleFeatures,
        bids: auction.bids,
        createdAt: auction.created_at,
        updatedAt: auction.updated_at,
        SortedBids,
      },
    });
  } catch (error) {
    // Pass any errors to the error handler
    next(error);
  }
};

exports.createMetadata = async (req, res) => {
  try {
    const { MakesModels, BodyColors, BodyTypes } = req.body;

    const newMeta = new Meta({
      MakesModels: MakesModels,
      BodyColors: BodyColors,
      BodyTypes: BodyTypes,
    });

    // Save to database
    await newMeta.save();

    // Return success response
    res.status(201).json({
      message: "Metadata created successfully!",
      data: newMeta,
    });
  } catch (error) {
    // Handle error response
    res.status(500).json({
      message: "Failed to create metadata",
      error: error.message,
    });
  }
};

// Controller to fetch metadata
exports.getMetadata = async (req, res) => {
  try {
    const metadata = await Meta.find();

    res.status(200).json({
      message: "Metadata fetched successfully!",
      data: metadata,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch metadata",
      error: error.message,
    });
  }
};

exports.deleteCarsByIds = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { carIds } = req.body; // Expecting carIds as an array from the request body
    if (!Array.isArray(carIds) || carIds.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid or empty carIds array" });
    }

    for (const carId of carIds) {
      const car = await Car.findById(carId).session(session);
      if (!car) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(404)
          .json({ message: `Car with ID ${carId} not found` });
      }

      const bids = await Bid.find({ car_id: carId }).session(session);

      await Bid.deleteMany({ car_id: carId }).session(session);

      for (const bid of bids) {
        await User.updateMany(
          { "biddingHistory.bidId": bid._id },
          { $pull: { biddingHistory: { bidId: bid._id } } }
        ).session(session);
      }

      await User.updateMany(
        { "cart.carId": carId },
        { $pull: { cart: { carId: carId } } }
      ).session(session);

      await VehicleFeature.findOneAndDelete({
        _id: car.vehicleFeatures,
      }).session(session);

      await Car.findByIdAndDelete(carId).session(session);
    }

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json({ message: "Cars and associated data deleted successfully" });
  } catch (error) {
    console.error("Error deleting cars:", error);
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

async function uploadPdf(file, folder) {
  const options = {
    folder: folder,
    public_id: `${Date.now()}`,
    format: "pdf",
    resource_type: "auto",
    access_mode: "public",
  };
  return await cloudinary.uploader.upload(file.tempFilePath, options);
}

exports.UploadInvoice = async (req, res, next) => {
  try {
    const { userId, carId } = req.params;
    if (!userId || !carId) {
      return res
        .status(400)
        .json({ message: "User ID and Car ID are required." });
    }

    const file = req.files?.invoice;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // Upload the file to Cloudinary
    const uploadResult = await uploadPdf(file, "invoices");

    if (!uploadResult || !uploadResult.secure_url) {
      return res.status(500).json({ message: "Failed to upload the invoice." });
    }

    const updatedBid = await Bid.findOneAndUpdate(
      { user_id: userId, car_id: carId },
      { $push: { invoices: uploadResult.secure_url } },
      { new: true }
    );

    if (!updatedBid) {
      return res
        .status(404)
        .json({ message: "Bid not found for this user and car." });
    }

    // Send a success response
    res.status(200).json({
      message: "Invoice uploaded successfully.",
      bid: updatedBid,
    });
  } catch (error) {
    console.error("Error uploading invoice:", error);
    res.status(500).json({ message: "Internal server error.", error });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const { userId, carId } = req.params;

    // Validate inputs
    if (!userId || !carId) {
      return res
        .status(400)
        .json({ message: "User ID and Car ID are required." });
    }

    const bid = await Bid.findOne({ user_id: userId, car_id: carId });

    if (!bid) {
      return res
        .status(404)
        .json({ message: "No bid found for this user and car." });
    }

    if (!bid.invoices || bid.invoices.length === 0) {
      return res
        .status(404)
        .json({ message: "No invoices found for this bid." });
    }

    res.status(200).json({
      message: "Invoices retrieved successfully.",
      invoices: bid.invoices,
    });
  } catch (error) {
    console.error("Error retrieving invoices:", error);
    res.status(500).json({ message: "Internal server error.", error });
  }
};

exports.deleteBid = async (req, res) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bidId } = req.params;
    const { bidAmount } = req.body;

    const bid = await Bid.findById(bidId).session(session);

    if (!bid) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Bid not found" });
    }

    const carId = bid.car_id._id;
    const car = await Car.findById(carId).session(session);

    if (!car) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Car not found" });
    }

    const isTimeExpired = Date.now() > new Date(car.endTime);

    if (String(car.highestBidder) === String(bid.user_id)) {

      const sortedBids = await getAuctionHistory(carId);

      if (!sortedBids || sortedBids.length === 0) {
        await session.abortTransaction();
        return res.status(404).json({ message: "No other bids found" });
      }

      if (sortedBids.length < 2) {
        const updatedBid = await Bid.findByIdAndUpdate(
          bidId,
          { $pull: { bids: { bidAmount } } },
          { new: true, session }
        );

        if (!updatedBid) {
          await session.abortTransaction();
          return res.status(404).json({ message: "Bid not found" });
        }

        if (!isTimeExpired) {
          bid.status = "active";
          await bid.save({ session });
        }

        car.highestBid = null;
        car.highestBidder = null;
        car.totalBids = car.totalBids - 1;

        await car.save({ session });

        await session.commitTransaction();
        return res
          .status(200)
          .json({ message: "Bid detail removed successfully", updatedBid });

      } else {

        const secondHighestBid = sortedBids[sortedBids.length - 2];

        // Update car with new highest bidder and amount
        car.highestBid = secondHighestBid.bidAmount;
        car.highestBidder = secondHighestBid.user[0].id;
        car.totalBids = car.totalBids - 1;

        // Update second highest bid status to "winner"
        const secondBidRecord = await Bid.findOne({
          user_id: secondHighestBid.user[0].id,
          car_id: carId,
        }).session(session);

        if (!isTimeExpired) {
          bid.status = "active";
          await bid.save({ session });
        }

        if (secondBidRecord) {
          secondBidRecord.status = "winner";
          await secondBidRecord.save({ session });
        }

        await car.save({ session });
      }
    }

    // Remove the bid from the bids array
    const updatedBid = await Bid.findByIdAndUpdate(
      bidId,
      { $pull: { bids: { bidAmount } } },
      { new: true, session }
    );

    if (!updatedBid) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Bid not found" });
    }

    await session.commitTransaction();
    
    return res
      .status(200)
      .json({ message: "Bid detail removed successfully", updatedBid });

  } catch (error) {
    await session.abortTransaction();
    return res
      .status(500)
      .json({ message: "Error removing bid detail", error });
  } finally {
    session.endSession(); // Ensure session is ended
  }
};

// "SortedBids": [
//   {
//       "car_id": "66fac849c49551e74158c57d",
//       "status": "winner",
//       "user": [
//           {
//               "id": "670eb975ade16d8edacf3ab6",
//               "email": "kockoski.tose@gmail.com"
//           }
//       ],
//       "bidAmount": 7900,
//       "bidTime": "2024-10-15T18:54:11.040Z"
//   }
// ]
