const express = require("express");
const axios = require("axios");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();
<<<<<<< HEAD
const moment = require('moment');

=======
>>>>>>> d7955b0 (5 feb)

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let path = require('path');
const mysql = require("mysql");
const bodyParser = require('body-parser');


const CLIENT_ID = "LZyZ8tx2G2uz35EHEL1vGvIQWngPkfOf";
const CLIENT_SECRET = "lAIux0ztcWGxsRrmnWF58aS7CGSdvRmhVfe5oal3z7cxus6N9UeCtAmrWhDENwFa";
const THING_ID = "7f2fe9c1-708f-4402-8caa-c9e36b6af50a";
const PROPERTY_IDBIOZ = "43c0f0b4-551d-4679-8035-2cffa9eb5344";
const PROPERTY_IDECG = "c095a2f8-8bfa-4ce6-af02-f7b6708d002c";
const PROPERTY_IDGSR = "8944062e-46d8-4306-94ae-3f43014910ad";


let accessToken = "";
let latestDistance = 0; 
let ecgdata = 0;


<<<<<<< HEAD
=======

>>>>>>> d7955b0 (5 feb)
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));


const connection = mysql.createConnection({
   host: "localhost",
   user: "root",
   database: "Careflex",
   password: "root"
});



<<<<<<< HEAD


=======
>>>>>>> d7955b0 (5 feb)
app.get('/', (req,res) => {
   res.render("Home.ejs");
});


app.get('/doctor/:id', async (req,res) => { 
    searid = req.params;   
    console.log(searid.id); 

   try {
      connection.query("select * from patient where pat_doc_key = ?", [searid.id], (err1, result1) => {
          if (err1) throw err1;
          res.render("patientList.ejs", {data : result1});
      });
  } catch (err) {
      console.log(err);
  }
  

});

<<<<<<< HEAD
app.get('/doctor/:id/:patientid', async (req,res) => { 
  res.render("doctorpview.ejs");
=======
>>>>>>> d7955b0 (5 feb)

});

app.get('/login', async (req,res) => { 
   res.render("login.ejs");
});

app.post('/login', async (req,res) => { 
   let {email,password} = req.body;
   console.log(req.body);

   try{
      connection.query("select * from patient where pat_email = ?",req.body.email,(err1,result1) => {
              if(err1) throw err1;
              
              console.log(result1);
              if((result1 != '') && (result1[0].pat_password == req.body.password))
              {
               console.log("patient");
               res.redirect(`/patient/${result1[0].pat_key}`);
              }else if(result1 == '')
                 {
               
               connection.query("select * from doctors where email = ?",req.body.email,(err2,result2) => {
                  if(err2) throw err2;
                  if((result2 != "") && (result2[0].password == req.body.password))
                     {
                      res.redirect(`/doctor/${result2[0].doc_key}`);
                     }else 
                     {
                        console.log("patient");
                        res.redirect("/login");
                     }
                  })
               }
                     
             
           
          })
      } catch(err){
          console.log(err);
      }
});




app.get('/login/doctordata', async (req,res) => { 
   res.render("signindoc.ejs");
});

app.post('/login/doctordata', async(req,res)=>
{
   let {pat_name,pat_phone,pat_qualify,pat_email,pat_pass,pat_cpass} = req.body;
   console.log(req.body);
   const doctorKey = generateDoctorKey();

   try{
   
      await connection.query("insert into doctors(name,contact,qualification,email,password,doc_key) values (?,?,?,?,?,?)",[req.body.d_name,req.body.d_phone,req.body.d_qualify,req.body.d_email,req.body.d_pass,doctorKey],(err,result) => {
              if(err) throw err;
              // console.log(result);
              res.redirect("/login");
          })
      } catch(err){
          console.log(err);
      }
})

app.get('/login/patientdata', async (req,res) => { 
   res.render("signinpat.ejs");
});


app.post('/login/patientdata', async(req,res) =>
{
   let {pat_name,pat_phone,pat_email,pat_pass,d_cpass} = req.body;
   console.log(req.body);

   let pat_key = Math.floor(10000000 + Math.random() * 90000000);

   try{
      connection.query("select * from doctors where doc_key = ?",d_cpass,(err1,result1) => {
         if(err1) throw err1;
              console.log(result1[0].name);
       connection.query("insert into patient(pat_name,pat_contact,pat_email,pat_password,pat_doc_key,pat_doc_name,pat_key) values (?,?,?,?,?,?,?)",[req.body.pat_name,req.body.pat_phone,req.body.pat_email,req.body.pat_pass,req.body.d_cpass,result1[0].name,pat_key],(err2,result2) => {
              if(err2) throw err2;
              // console.log(result);
              res.redirect("/login");
          })
         })
      } catch(err){
          console.log(err);
      }
})


 
 // Handle WebSocket connections
function generateDoctorKey() {
   const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
   const keyLength = 12;
   let doctorKey = '';
   for (let i = 0; i < keyLength; i++) {
       const randomIndex = Math.floor(Math.random() * characters.length);
       doctorKey += characters[randomIndex];
   }
   return doctorKey;
}


io.on("connection", (socket) => {
   console.log("A user connected");

   socket.emit("distanceUpdate", latestDistance);

   socket.on("disconnect", () => {
     console.log("A user disconnected");
   });
});



// Generate a random doctor key
function generateDoctorKey() {
   const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
   const keyLength = 12;
   let doctorKey = '';
   for (let i = 0; i < keyLength; i++) {
       const randomIndex = Math.floor(Math.random() * characters.length);
       doctorKey += characters[randomIndex];
   }
   return doctorKey;
}

// Fetch access token from Arduino API
const getAccessToken = async () => {
   try {
     const responseBioz = await axios.post(
       "https://api2.arduino.cc/iot/v1/clients/token",
       new URLSearchParams({
         grant_type: "client_credentials",
         client_id: CLIENT_ID,
         client_secret: CLIENT_SECRET,
         audience: "https://api2.arduino.cc/iot",
       })
     );
     accessToken = responseBioz.data.access_token;
     console.log("New Access Token:", accessToken);
   } catch (error) {
     console.error("Error fetching token:", error.responseBioz?.data || error.message);
   }
 };



 const fetchECGData = async () => {
   try {
     if (!accessToken) await getAccessToken();

     const responseecg = await axios.get(
       `https://api2.arduino.cc/iot/v2/things/${THING_ID}/properties/${PROPERTY_IDECG}`,
       { headers: { Authorization: `Bearer ${accessToken}` }}
     );

// console.log(responseBioz);

     ecgdata = responseecg.data.last_value;

     // Emit the updated distance to all connected clients
     io.emit("distanceUpdate", {latestDistance,ecgdata, gsrdata});

   } catch (error) {
     console.error("Error fetching ultrasonic data:", error.responseecg?.data || error.message);
   }
 };


 const fetchGSRData = async () => {
   try {
     if (!accessToken) await getAccessToken();

     const responsegsr = await axios.get(
       `https://api2.arduino.cc/iot/v2/things/${THING_ID}/properties/${PROPERTY_IDGSR}`,
       { headers: { Authorization: `Bearer ${accessToken}` }}
     );

// console.log(responseBioz);

     gsrdata = responsegsr.data.last_value;

     // Emit the updated distance to all connected clients
     io.emit("distanceUpdate", {latestDistance,ecgdata, gsrdata});

   } catch (error) {
     console.error("Error fetching ultrasonic data:", error.responseecg?.data || error.message);
   }
 };
 

// Routes for patient dashboard
// app.get('/patient/:id', async (req,res) => { 
//    res.render("patientdash.ejs",{ data: latestDistance });
// }); 4

// Fetch ultrasonic data every 5 seconds
const fetchBioData = async (id) => {
     

   try {
     if (!accessToken) await getAccessToken();

     const responseBioz = await axios.get(
       `https://api2.arduino.cc/iot/v2/things/${THING_ID}/properties/${PROPERTY_IDBIOZ}`,
       { headers: { Authorization: `Bearer ${accessToken}` }}
     );

// console.log(responseBioz);

     latestDistance = responseBioz.data.last_value;
     console.log("Ultrasonic Distance Updated:", latestDistance);

     try{
   
      await connection.query("insert into Bio(id,biodata) values (?,?)",[id,latestDistance],(err,result) => {
              if(err) throw err;

          })
      } catch(err){
          console.log(err);
      }

     // Emit the updated distance to all connected clients
     io.emit("distanceUpdate", {latestDistance,ecgdata ,gsrdata});
   } catch (error) {
     console.error("Error fetching ultrasonic data:", error.responseBioz?.data || error.message);
   }
 };

<<<<<<< HEAD
 const PredictData = async (predict) => {
  try {
    // Generate current date and hour dynamically
    const currentDate = moment().format('YYYY-MM-DD');
    const currentHour = moment().hour();
 // Simulated BioZ value

    // Sending a POST request to the Python server
    const response = await axios.post('http://127.0.0.1:8000/predict', null, {
      params: {
          date: currentDate,
          hour: currentHour,
          av_bio_value: predict
      }
  });
  
    // res.json(response.data);

    return response;
  } catch (error) {
    console.error('Error occurred:', error.message);
    res.status(500).json({
      error: 'Prediction failed',
      details: error.message
    });
  }
};

app.get('/patient/:id', async (req,res) =>{
   const { id } = req.params; 
      let predicteddata = await PredictData(latestDistance)
     
   console.log(predicteddata.data);
   res.render("doctorpview.ejs",{ data1: latestDistance , result : predicteddata.data});
   setInterval(() => fetchBioData(id), 1000);
   setInterval(async () => await PredictData(latestDistance) , 1000);
=======

app.get('/patient/:id', async (req,res) =>{
   const { id } = req.params; 
   res.render("doctorpview.ejs",{ data1: latestDistance });
   setInterval(() => fetchBioData(id), 1000);
>>>>>>> d7955b0 (5 feb)
})


// Fetch ultrasonic data and update every 5 seconds

setInterval(fetchGSRData, 1000);
setInterval(fetchECGData, 1000);

getAccessToken();
setInterval(getAccessToken, 3500 * 1000);

server.listen(5500);

