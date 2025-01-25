const express = require("express");
const app = express();

// app.use(express.urlencoded({extended: true}));
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));
// app.use(express.static(path.join(__dirname, "/public")));

app.get('/', (req,res) => {
   req.flash("Hello There");
});
   
app.get('/main', async (req,res) => { 
   res.render("index.ejs");
});


app.listen(5500);

