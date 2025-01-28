const express = require("express");
const app = express();
let path = require('path');
const mysql = require("mysql");
const bodyParser = require('body-parser');

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

app.get('/', (req,res) => {
   res.render("Home.ejs");
});


app.get('/doctor/:id', async (req,res) => { 
   res.render("doctorReport.ejs");
});

app.get('/patient/:id', async (req,res) => { 
   res.render("patientList.ejs");
});


app.get('/login', async (req,res) => { 
   res.render("login.ejs");
});

app.post('/login/go', async (req,res) => { 
   let {email,password} = req.body;
   console.log(req.body);

   try{
      connection.query("select * from patient where pat_email = ?",req.body.email,(err1,result1) => {
              if(err1) throw err1;
              
              console.log(result1);
              if((result1 != '') && (result1[0].pat_password == req.body.password))
              {
               res.redirect(`/patient/${result1[0].pat_key}`);
              }else if(result1 == '')
                 {
               
               connection.query("select * from doctors where email = ?",req.body.email,(err2,result2) => {
                  if(err2) throw err2;
                  if((result2 != "") && (result2[0].password == req.body.password))
                     {
                      res.redirect(`/doctor/${result2[0].doc_key}`);
                     }else if(result2 == '')
                     {
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



app.listen(5500);

