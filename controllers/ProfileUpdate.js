const User = require("../models/User");
const ErrorHandler = require("../utils/error");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const bcrypt = require("bcrypt");
const axios = require("axios");
const Review = require("../models/Review");

// Function to check if the file type is supported
function isFileSupported(type, supportedTypes) {
  return supportedTypes.includes(type);
}

// Function to upload file to Cloudinary
async function uploadFileToCloudinary(file, folder) {
  const options = {
    resource_type: "auto",
    folder: folder,
    public_id: `${Date.now()}`,
  };

  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, options);
    return result.secure_url;
  } catch (err) {
    throw new Error(`Failed to upload file to Cloudinary: ${err.message}`);
  }
}

// Controller function to update the user profile

exports.ProfileUpdate = async (req, res, next) => {
  try {
    const {
      email,
      username,
      phone,
      country,
      companyName,
      street,
      state,
      pincode,
      city,
      firstname,
      lastname,
    } = req.body;

    const supportedTypes = ["jpg", "jpeg", "png"];

    const isUploadImage = req.query.updateImage === "true";

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (isUploadImage) {
      let image = req.files ? req.files.image : null;

      if (image) {
        const fileType = path.extname(image.name).toLowerCase().slice(1);

        if (!isFileSupported(fileType, supportedTypes)) {
          return res.status(400).json({
            success: false,
            message: `${image.name}: Unsupported file type.`,
          });
        }

        try {
          const imageUrl = await uploadFileToCloudinary(image, "ProfileImages");
          user.image = imageUrl;
          await user.save();

          return res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            image: imageUrl,
          });
        } catch (err) {
          console.error(`Failed to upload ${image.name} to Cloudinary:`, err);
          return res.status(500).json({
            success: false,
            message: `Failed to upload ${image.name} to Cloudinary.`,
          });
        }
      }
    }

    if (
      !email ||
      !username ||
      !phone ||
      !country ||
      !street ||
      !state ||
      !pincode ||
      !city ||
      !firstname ||
      !lastname
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    let image = req.files ? req.files.image : null;

    if (image) {
      const fileType = path.extname(image.name).toLowerCase().slice(1);

      if (!isFileSupported(fileType, supportedTypes)) {
        return res.status(400).json({
          success: false,
          message: `${image.name}: Unsupported file type.`,
        });
      }

      try {
        const imageUrl = await uploadFileToCloudinary(image, "ProfileImages");
        user.image = imageUrl;
      } catch (err) {
        console.error(`Failed to upload ${image.name} to Cloudinary:`, err);
        return res.status(500).json({
          success: false,
          message: `Failed to upload ${image.name} to Cloudinary.`,
        });
      }
    }

    // Update user information

    user.username = username;
    user.phone = phone;
    user.country = country;
    user.companyName = companyName;
    user.street = street;
    user.city = city;
    user.state = state;
    user.pincode = pincode;
    user.firstname = firstname;
    user.lastname = lastname;
    user.isProfileCompleted = true;

    const updatedProfile = await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        image: updatedProfile.image,
        username: updatedProfile.username,
        phone: updatedProfile.phone,
        country: updatedProfile.country,
        companyName: updatedProfile.companyName,
        street: updatedProfile.street,
        city: updatedProfile.city,
        state: updatedProfile.state,
        pincode: updatedProfile.pincode,
        firstname: updatedProfile.firstname,
        lastname: updatedProfile.lastname,
        isProfileCompleted: updatedProfile.isProfileCompleted,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

exports.Getuser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check if userId is provided

    const user = await User.findById(userId)

      .select("-password")
      .populate({
        path: "cart.carId", // Assuming this is correct for your cart
        select:
          "name price images description startTime endTime status highestBid totalBids minimumBidDifference",
      })
      .populate({
        path: "biddingHistory.bidId",
        select: "car_id status",
        populate: {
          path: "car_id", // Populate car_id in each bid
          select:
            "name price images description startTime endTime status highestBid totalBids minimumBidDifference",
        },
      });

    if (!user) {
      return next(new ErrorHandler("userId not found", 404));
    }

    // Successful response
    return res.status(200).json({
      success: true,
      message: "User Cart And Bidding History Data Fetched Successfully",
      data: {
        username: user.username,
        phone: user.phone,
        image: user.image,
        email: user.email,
        country: user.country,
        cart: user.cart,
        biddingHistory: user.biddingHistory,
        street: user.street,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        companyName: user.companyName,
        firstname: user.firstname,
        lastname: user.lastname,
      },
    });
  } catch (error) {
    next(error); // Pass error to the next middleware
  }
};

// exports.Getusersearch = async (req, res, next) => {
//     try {
//         let searchTerm = req.query.searchTerm;

//         console.log(searchTerm)
//         const allUsers = await User.find({
//         }).populate({
//             path: 'profile',
//             match: {
//                 $or: [
//                     { firstname: { $regex: searchTerm, $options: 'i' } },
//                     { lastname: { $regex: searchTerm, $options: 'i' } },
//                     { branch: { $regex: searchTerm, $options: 'i' } },
//                     { email: { $regex: searchTerm, $options: 'i' } },
//                     { rollnumber: { $regex: searchTerm, $options: 'i' } }

//                 ]
//             }
//         }).exec()

//         const filteredUsers = allUsers.map(user => {
//             const { password, ...filteredUser } = user.toObject();
//             return filteredUser;
//         });

//         // Filter out users whose profile does not match the search term
//         const users = filteredUsers.filter(user => user.profile !== null);

//         return res.status(200).json({
//             success: true,
//             message: "Users fetched successfully",
//             users: users
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// exports.Deleteuser = async (req, res, next) => {
//     try {
//         const deleteusers = req.body;
//         console.log(req.body)
//         console.log(typeof (req.body));
//         const idArray = [deleteusers.id];

//         const idsToDelete = idArray.map(id => new mongoose.Types.ObjectId(id));

//         const allUsers = await User.deleteMany({ _id: { $in: idsToDelete } })

//         return res.status(200).json({
//             success: true,
//             message: "Users Deleted successfully",
//             users: allUsers
//         });
//     } catch (error) {
//         next(error);
//     }
// };

exports.ChangePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const { id } = req.params;

    if (!oldPassword) {
      return next(new ErrorHandler("Old password is required", 400));
    }

    if (!newPassword || !confirmPassword) {
      return next(
        new ErrorHandler("New password and confirm password is required", 400)
      );
    }

    if (newPassword !== confirmPassword) {
      return next(
        new ErrorHandler("New password and confirm password do not match", 400)
      );
    }

    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Check if the old password matches the stored password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return next(new ErrorHandler("Invalid old password", 400));
    }

    // Hash the new password and update the user record
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Save the updated user record
    await user.save();

    // Respond with success message
    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.Translator = async (req, res, next) => {
  try {
    const { text, toLanguage } = req.body;

    if (!text || !toLanguage) {
      return res
        .status(400)
        .json({ error: "Text and target language are required." });
    }

    const endpoint = "https://api.cognitive.microsofttranslator.com/translate";
    const subscriptionKey = process.env.TRANSLATOR_KEY;
    const region = process.env.TRANSLATOR_REGION;

    const response = await axios.post(
      `${endpoint}?api-version=3.0&to=${toLanguage}`,
      [{ Text: text }],
      {
        headers: {
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "Ocp-Apim-Subscription-Region": region,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({ translatedText: response.data[0].translations[0].text });
  } catch (error) {
    next(error);
  }
};

// controllers/reviewController.js

exports.Review = async (req, res, next) => {
  try {
    const {
      name,
      location,
      rating,
      title,
      content,
      type,
      date,
      verified,
      videoUrl,
    } = req.body;

    // Validation for required fields
    if (!name || !rating || !title || !content || !type || !date || !location) {
      return res.status(400).json({
        success: false,
        error: "All required fields must be provided.",
      });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5",
      });
    }

    // Validate type
    const validTypes = ["text", "image", "video"];

    const supportedTypes = ["jpg", "jpeg", "png"];

    // Validate rating range

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid review type",
      });
    }

    let image = req.files ? req.files.media : null;

    let imageUrl = null;

    if (image) {
      const fileType = path.extname(image.name).toLowerCase().slice(1);

      if (!isFileSupported(fileType, supportedTypes)) {
        return res.status(400).json({
          success: false,
          message: `${image.name}: Unsupported file type.`,
        });
      }

      imageUrl = await uploadFileToCloudinary(image, "ReviewImages");
    }

    // Create new review object
    const reviewData = {
      name,
      location,
      rating,
      title,
      content,
      type,
      date,
      verified: verified || false,
      media: imageUrl,
      videoUrl: videoUrl || "",
    };

    const testimonial = await Review.create(reviewData);

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      testimonial,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const testimonials = await Review.find().sort({ date: -1 }); // Sort by date, newest first

    res.status(200).json({
      success: true,
      count: testimonials.length,
      testimonials,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const testimonial = await Review.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update review verification status
exports.updateReview = async (req, res) => {
  try {

    const {
      name,
      location,
      rating,
      title,
      content,
      type,
      date,
      verified,
      videoUrl,
      media
    } = req.body;
    const supportedTypes = ["jpg", "jpeg", "png"];


    // Validation for required fields
    if (!name || !rating || !title || !content || !type || !date || !location) {
      return res.status(400).json({
        success: false,
        error: "All required fields must be provided.",
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5",
      });
    }

    // Validate type
    const validTypes = ["text", "image", "video"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid review type",
      });
    }

    let image = req.files ? req.files.media : null;

    let imageUrl = null;

    if (image) {
      const fileType = path.extname(image.name).toLowerCase().slice(1);

      if (!isFileSupported(fileType, supportedTypes)) {
        return res.status(400).json({
          success: false,
          message: `${image.name}: Unsupported file type.`,
        });
      }

      imageUrl = await uploadFileToCloudinary(image, "ReviewImages");
    }

    // Create new review object
    const reviewData = {
      name,
      location,
      rating,
      title,
      content,
      type,
      date,
      verified: verified || false,
      media: imageUrl || media,
      videoUrl: videoUrl || "",
    };

    const testimonial = await Review.findByIdAndUpdate(
      req.params.id,
      reviewData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      testimonial,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
