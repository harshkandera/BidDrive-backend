const User = require("../models/User");
const ErrorHandler = require("../utils/error");
const cloudinary = require('cloudinary').v2;
const path = require('path');
const bcrypt = require("bcrypt")
const axios = require('axios');

// Function to check if the file type is supported
function isFileSupported(type, supportedTypes) {
    return supportedTypes.includes(type);
}

// Function to upload file to Cloudinary
async function uploadFileToCloudinary(file, folder) {
    const options = {
        resource_type: 'auto',
        folder: folder,
        public_id: `${Date.now()}`
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
        const { email, username, phone , country , companyName } = req.body;
        const supportedTypes = ["jpg", "jpeg", "png"];

        if (!email || !username || !phone || !country ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        let image = req.files ? req.files.image : null;

        if (image) {
            const fileType = path.extname(image.name).toLowerCase().slice(1);

            if (!isFileSupported(fileType, supportedTypes)) {
                return res.status(400).json({
                    success: false,
                    message: `${image.name}: Unsupported file type.`
                });
            }

            try {
                const imageUrl = await uploadFileToCloudinary(image, "ProfileImages");
                user.image = imageUrl;
            } catch (err) {
                console.error(`Failed to upload ${image.name} to Cloudinary:`, err);
                return res.status(500).json({
                    success: false,
                    message: `Failed to upload ${image.name} to Cloudinary.`
                });
            }
        }

        // Update user information

        user.username = username;
        user.phone = phone;
        user.country = country;
        user.companyName = companyName;

        user.isProfileCompleted= true;

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
            }
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile"
        });
    }
};




exports.Getuser = async (req, res, next) => {
    try {
      const { userId } = req.params;
  
      // Check if userId is provided
 
      const user = await User.findById(userId)
      
      .select('-password')
      .populate({
        path: 'cart.carId', // Assuming this is correct for your cart
        select: 'name price images description startTime endTime status highestBid totalBids minimumBidDifference',
      })
      .populate({
        path: 'biddingHistory.bidId', 
        select: 'car_id status', 
        populate: {
          path: 'car_id', // Populate car_id in each bid
          select: 'name price images description startTime endTime status highestBid totalBids minimumBidDifference',
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
          country:user.country,
          cart: user.cart,
          biddingHistory: user.biddingHistory,
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
      const { oldPassword, newPassword } = req.body;
      const { id } = req.params;
  
      // Check if old password is provided
      if (!oldPassword) {
        return next(new ErrorHandler("Old password is required", 400));
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
        return res.status(400).json({ error: 'Text and target language are required.' });
      }
  
      const endpoint = 'https://api.cognitive.microsofttranslator.com/translate';
      const subscriptionKey = process.env.TRANSLATOR_KEY;
      const region = process.env.TRANSLATOR_REGION;
  
      const response = await axios.post(
        `${endpoint}?api-version=3.0&to=${toLanguage}`,
        [{ Text: text }],
        {
          headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Ocp-Apim-Subscription-Region': region,
            'Content-Type': 'application/json'
          }
        }
      );
  
      return res.json({ translatedText: response.data[0].translations[0].text });
    
    } catch (error) {
      next(error);
    }
  };
  