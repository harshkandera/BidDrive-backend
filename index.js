const express = require("express");
require("dotenv").config()
const cors = require("cors")
const app = express()
const http = require("http"); 
const { init } = require('./config/socketConfig');


app.use(express.json())


const corsOptions = {
  origin: ['https://bid-drive.com', 'https://www.bid-drive.com','https://www.us.bid-drive.com','https://us.bid-drive.com'], // Add your allowed origins
  methods: ['GET', 'POST'], // Specify the allowed methods
  credentials: true, // Allow credentials (if needed)
};

// const corsOptions = {
//   origin:['http://localhost:3000','http://localhost:3001'],
//   methods: ['GET', 'POST'], // Specify the allowed methods
//   credentials: true,
// };



app.use(cors(corsOptions));


const dbconnection = require("./config/database")
const router = require("./routes/router")
const PORT= process.env.PORT || 3000;
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const mainrouter = require('./routes/mainrouter')

app.use(cookieParser());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir:"/tmp/"
}));
dbconnection();

const cloudinary = require('./utils/cloudinary');
cloudinary.cloudinaryConnect();


app.use("/api",router);
app.use("/api/v2",mainrouter);

app.all('*',(req,res,next)=>{
  const err = new Error(`Cant fint ${req.originalUrl} on the server `)
  err.statusCode = 404
  err.message = 'Not Found'
  next(err)
})

const errorHandler = (err, req, res, next) => {

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
  });

};

// Use the global error handler
app.use(errorHandler);


app.get('/',()=>{

  app.use(express.static(path.resolve(__dirname,'my-app','build')))
  res.sendFile(path.resolve(__dirname,'my-app','build','index.html'))

})


app.get("/", (req, res) => {
  res.send("API is working");
});



// Create HTTP server and initialize Socket.io
const server = http.createServer(app);


init(server);



server.listen(PORT,()=>{
    console.log("app is listening on port no. ",PORT)
})

