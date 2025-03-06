const express = require("express");
const axios = require("axios");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();
const moment = require('moment');
const cors = require('cors');
// const { GoogleGenerativeAI } = require("@google/generative-ai");



const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let path = require('path');
const mysql = require("mysql");
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { time } = require("console");


const CLIENT_ID = "LZyZ8tx2G2uz35EHEL1vGvIQWngPkfOf";
const CLIENT_SECRET = "lAIux0ztcWGxsRrmnWF58aS7CGSdvRmhVfe5oal3z7cxus6N9UeCtAmrWhDENwFa";
const THING_ID = "7f2fe9c1-708f-4402-8caa-c9e36b6af50a";
const PROPERTY_IDBIOZ = "43c0f0b4-551d-4679-8035-2cffa9eb5344";
const PROPERTY_IDECG = "c095a2f8-8bfa-4ce6-af02-f7b6708d002c";
const PROPERTY_IDGSR = "8944062e-46d8-4306-94ae-3f43014910ad";
const GEMINIAPIKEY = process.env.GEMINIAPIKEY;

let accessToken = "";
let latestDistance = 0; 
let ecgdata = 0;

const LANGFLOW_CONFIG = {
  baseURL: process.env.baseURL,
  applicationToken: process.env.LLMAKEY,
  flowId: process.env.llm,
  langflowId: process.env.LLMAPI_KEY 
};


const transporter = nodemailer.createTransport(
  {
      secure:true,
      host: 'smtp.gmail.com',
      port:465,
      auth:{
         user: process.env.EMAIL,
          pass: process.env.PASS
      }
  }
);

app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.json());
app.use(express.static("public"));

const connection = mysql.createConnection({
   host: process.env.DB_HOSTNAME,
   user: process.env.DB_USER,
   database: process.env.DB_DATABASE,
   password: process.env.DB_PASSWORD
});





app.get('/', (req,res) => {
   res.render("Home.ejs");
});


app.get('/doctor/:id', async (req,res) => { 
    searid = req.params;   
    console.log(searid.id); 

   try {
      connection.query("select * from patient where pat_doc_key = ?", [searid.id], (err1, result1) => {
          if (err1) throw err1;
          connection.query("select * from doctors where doc_key = ?", [searid.id], (err2, result2) => {
            if (err2) throw err2;
          res.render("patientList.ejs", {data : result1, doc_data : result2});
      });
    });
  } catch (err) {
    res.render("error.ejs");
      console.log(err);
  }
  

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
        res.render("error.ejs",{err : err});
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
        res.render("error.ejs",{err : err});
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
        res.render("error.ejs",{err : err});

          console.log(err);
      }
})

app.get('/patient/:id/report', (req, res) => {
  try {
      const currentDate = moment().subtract(5, 'days').format('YYYY-MM-DD');
      console.log("Fetching data for:", currentDate);

      connection.query("SELECT * FROM bio_permanent WHERE date = ?", [currentDate], (err, result) => {
          if (err) {
              console.error("Database error:", err);
              return res.status(500).send("Database error");
          }

          console.log("Query Result:", result); // Debugging output
          res.render("report.ejs", { result }); // Ensure it's passed correctly
      });

  } catch (err) {
    res.render("error.ejs",{err : err});

      console.error("Server error:", err);
      res.status(500).send("Internal Server Error");
  }
});

 
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

// app.get('/chatbot', (req, res) => {
//   res.sendFile(path.join(__dirname, "views", "chatbot.html"));
// });


 app.get('/chatbotmain', (req, res) => {
    res.render("chatbot");
  });

  
 app.get('/error', (req, res) => {
  res.render("error.ejs");
});

const validateChatRequest = (req, res, next) => {
  console.log('Request Body:', req.body); // Debugging

  if (!req.body || !req.body.message || typeof req.body.message !== 'string') {
      return res.status(400).json({ 
          error: 'Invalid request',
          details: 'Message is required and must be a string'
      });
  }
  next();
};


app.post('/api/chat', validateChatRequest, async (req, res) => {
  try {
      const { message } = req.body;
      console.log('Received message:', message);

      const requestUrl = `${LANGFLOW_CONFIG.baseURL}/lf/${LANGFLOW_CONFIG.langflowId}/api/v1/run/${LANGFLOW_CONFIG.flowId}`;
      console.log('Making request to:', requestUrl);

      console.log("Using Token:", LANGFLOW_CONFIG.applicationToken);

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${LANGFLOW_CONFIG.applicationToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            input_value: "you are Careflex a chatbot specifically created for answering the questions related to C-section delivery and if there is a question which are not related to topic just give a small message of what you are and what question should be asked to you" + message,
            input_type: 'chat',
            output_type: 'chat'
        })
    }).catch(error => {
        console.error("Fetch request failed:", error);
        return res.status(500).json({ error: "Fetch request failed", details: error.message });
    });
    
    if (!response || !response.ok) {
        console.error('API Error Response:', response?.statusText);
        return res.status(response?.status || 500).json({
            error: 'API request failed',
            details: response?.statusText || "No response received"
        });
    }

      const data = await response.json();
      
      // Validate response structure
      if (!data.outputs?.[0]?.outputs?.[0]?.outputs?.message?.message?.text) {
          console.error('Unexpected response structure:', data);
          return res.status(500).json({
              error: 'Invalid response structure',
              details: data
          });
      }

      const botResponse = data.outputs[0].outputs[0].outputs.message.message.text;

      function cleanText(text) {
        return `${text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*\s+/g, '')}`; 
    }
    
    const cleanedResponse = cleanText(botResponse);
    
    console.log('Bot Response:', cleanedResponse);
    
    res.json({ response: cleanedResponse });
    
  } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({
          error: 'Internal server error',
          details: error.message
      });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
  });
});


app.get('/fill_form', (req, res) => {
 res.render("formdata");
});
// app.post('/fill_form', (req, res) => {
//   const { age, healthConcern, healthcon, foodAllergies } = req.body;

//   // Process the data (e.g., store in a database, log it, etc.)
//   // console.log({ age, healthConcern, healthcon, foodAllergies });

// });



io.on("connection", (socket) => {
   console.log("A user connected");

   socket.emit("distanceUpdate", latestDistance);

   socket.on("disconnect", () => {
     console.log("A user disconnected");
   });
});



// Error handling middleware

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
    //  console.log(ecgdata);

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
   
      await connection.query("insert into bio_temp(id,bioimpedance_value) values (?,?)",[id,latestDistance],(err,result) => {
              if(err) throw err;
          })
      } catch(err){
          console.log(err);
      }

     // Emit the updated distance to all connected clients
     io.emit("distanceUpdate", {latestDistance,ecgdata ,gsrdata});
   } catch (error) {
    res.render("error.ejs",{err : err});

     console.error("Error fetching ultrasonic data:", error.responseBioz?.data || error.message);
   }
 };

const PredictData = async (predict) => {
  try {
    // Generate current date and hour dynamically
    const currentDate = moment().format('YYYY-MM-DD');
    const currentHour = moment().hour();
    const time_stamp = moment().toISOString().slice(0, 19).replace("T", " ") // Combine date and time
   

console.log(time_stamp);
    // Sending a POST request to the Python server
    const response = await axios.post('http://127.0.0.1:8000/data/24h', null, {
      params: {
        date: currentDate,
        hour: currentHour,
        av_bio_value: predict,
        time_stamp: time_stamp
      }
    });
    // console.log(response.data.analysis) ; 
    return response.data.analysis; 
  } catch (error) {
    console.error('Error occurred:', error.message);

    // Return the error object instead of using res
    return {
      error: 'Prediction failed',
      details: error.message
    };
  }
};

//  const PredictData = async (predict) => {
//   try {
//     // Generate current date and hour dynamically
//     const currentDate = moment().format('YYYY-MM-DD');
//     const currentHour = moment().hour();
//  // Simulated BioZ value

//     // Sending a POST request to the Python server
//     const response = await axios.post('http://127.0.0.1:8000/predict', null, {
//       params: {
//           date: currentDate,
//           hour: currentHour,
//           av_bio_value: predict
//       }
//   });
  
//     // res.json(response.data);

//     return response;
//   } catch (error) {
//     console.error('Error occurred:', error.message);
//     res.status(500).json({

//       error: 'Prediction failed',
//       details: error.message
//     });
//   }
// };
app.get('/patient/:id/chatbot', async (req, res) => {
 const { id } = req.params;

  try{
   
    await connection.query("select * from patient where pat_key = ?",[id],(err,result) => {
            if(err) throw err;
            console.log(result[0]);
            res.render("formdata",{datamain : result[0],GEMINIAPIKEY});
        })
    } catch(err){
      res.render("error.ejs",{err : err});
        console.log(err);
    }
});

app.get('/patient/:id', async (req, res) => {
  const { id } = req.params;

  let predicteddata = await PredictData(latestDistance);
  console.log(predicteddata);
  try {
  

      if (predicteddata.status == 'critical') {
          connection.query("SELECT * FROM patient WHERE pat_key = ?", [id], (err, result) => {
              if (err) {
                  console.error(err);
                  return res.status(500).json({ error: "Database error" });
              }

              if (result.length > 0) {
                  const patientEmail = result[0].pat_email;
                  console.log(patientEmail);

                  transporter.sendMail({
                      to: patientEmail,
                      subject: "Visit to Doctor",
                      html: `<h1> Need To visit doctor please </h1>`
                  }, (err, info) => {
                      if (err) {
                          console.error("Email error:", err);
                      } else {
                          console.log("Email sent:", info.response);
                      }
                  });
              } else {
                  console.log("No patient found with this ID.");
              }
          });
      }

      // console.log(predicteddata.data);

      res.render("doctorpview.ejs", { data1: latestDistance , result : predicteddata ,id  : id});

      // Using setTimeout instead of setInterval to prevent overlapping calls
     
      function updateData() {
        fetchBioData(id);
        setTimeout(updateData, 1000);
    }

      function updatePrediction() {
          PredictData(latestDistance);
          setTimeout(updatePrediction, 1000);
      }

      updatePrediction();
      updateData();
  } catch (err) {
      console.error("Error in GET /patient/:id:", err);
      res.status(500).send("Internal Server Error");
  }
});


app.get('/doctor/:id/:patientid', async (req,res) => { 
  const { id,patientid } = req.params; 
  let predicteddata = await PredictData(latestDistance)
 
// console.log(predicteddata.data);
res.render("doctorpview.ejs",{ data1: latestDistance ,result : predicteddata , id : patientid});
setInterval(() => fetchBioData(patientid), 1000);
setInterval(async () => await PredictData(latestDistance) , 1000);
});


// Fetch ultrasonic data and update every 5 seconds

setInterval(fetchGSRData, 1000);
setInterval(fetchECGData, 1000);

getAccessToken();
setInterval(getAccessToken, 3500 * 1000);

server.listen(5500);

