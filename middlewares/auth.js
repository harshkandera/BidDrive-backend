const jwt = require("jsonwebtoken");
require("dotenv").config();




// auth

exports.auth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.body?.token ||
      req.header("authorization")?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not found",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    console.log("Error in authentication middleware:", error.message);
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};


// students
exports.isUser = async (req,res,next) => {
try {
    if(req.user.accountType !=="User"){
return    res.status(401).json({
    success: false,
    message:"This is protected route for USers"
})


    }


next()

} catch (error) {
    return    res.status(401).json({
        success: false,
        message:"user role cannot be verified"
    })

}

}


// expert
exports.isAdmin = async (req,res,next) => {
    try {
        if(req.user.accountType !=="Admin"){
    return   res.status(401).json({
        success: false,
        message:"This is protected route for Admins"
    })
    
    
        }
    
    
    
        next()

    } catch (error) {
        return    res.status(401).json({
            success: false,
            message:"user role cannot be verified"
        })
    
    }
    
    }

    
