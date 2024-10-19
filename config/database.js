const mongoose = require("mongoose");
require("dotenv").config();
const dbconnection = ()=>{
mongoose.connect(process.env.MONOGODB_URL,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
})
.then(()=>{
    console.log("Db connection is successfully")
}).catch((error)=>{
    console.log(error);
    console.log("Db connection failed");
    process.exit(1);
})
}
module.exports = dbconnection;