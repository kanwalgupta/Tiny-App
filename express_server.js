var express = require("express");
var app = express();
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
var PORT = 8080; // default port 8080

var urlDatabase = {
  "b2xVn2": { shortURL : "b2xVn2", longURL :"http://www.lighthouselabs.ca" , userID : "sabrina" },
   "9sm5xK": { shortURL : "9sm5xK", longURL : "http://www.google.com" , userID : "sapnagoel" }
};
const users = {
  "sabrina": {
    id: "sabrina",
    email: "sabrinasandhu@google.com",
    password: "purple-monkey-dinosaur"
  },
 "sapnagoel": {
    id: "sapnagoel",
    email: "sapna@sangrur.com",
    password: "dishwasher-funk"
  }
}

function isValidUser(email,password,res){
  let userFound = false ;
  Object.keys(users).forEach(key => {
    if(users[key].email === email && users[key].password === password){
      userFound = true;
      res.cookie("user_id",key);
      return;
    }
  });
  return userFound;
}

function isExistingUser(email){
  let userFound = false ;
  Object.keys(users).forEach(key => {
    if(users[key].email === email){
      userFound = true;
      return;
    }
  });
  return userFound;
}

function userOwnsShortURL(shortURL,req){
  let urlFound = false;
  Object.keys(urlDatabase).forEach(key => {
      if(urlDatabase[key].userID === req.cookies["user_id"]){
        if(shortURL === urlDatabase[key].shortURL){
          urlFound = true;
          return;
        }
     }
   });
  return urlFound;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
   let templateVars ={ urls : "" , user : ""};
  let userFound = false;
  if(req.cookies["user_id"]){
    let templateVars = { urls: urlDatabase ,  user: users[req.cookies["user_id"]] };
    res.render("urls_index", templateVars);
   Object.keys(urlDatabase).forEach(key => {
      if(urlDatabase[key].userID === req.cookies["user_id"]){
       userFound = true;
       templateVars  = { urls: urlDatabase[key] ,  user: users[req.cookies["user_id"]] };
       return;
     }
   });
    if(userFound){
      res.render("urls_index", templateVars);
    }else{
      templateVars = { urls: " " ,  user: users[req.cookies["user_id"]] };
      res.render("urls_new",templateVars);
    }
  }else{
    res.render('user_login');
  }
});

app.get("/urls/new", (req, res) => {
  if(req.cookies["user_id"]){
    let templateVars = { user: users[req.cookies["user_id"]] };
    res.render("urls_new", templateVars);
  }else{
    res.render('/login');
  }
});

app.get("/login", (req, res) => {
  console.log("Login page");
  res.render("user_login");
 });

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  // TODO : condition checks for login by users and if shorturl belongs to particular user
  if(req.cookies["user_id"] && userOwnsShortURL(req.params.id,req)){
    let templateVars = { shortURL: req.params.id , longURL : urlDatabase[req.params.id].longURL,  user: users[req.cookies["user_id"]] };
    res.render("urls_show", templateVars);
  }else{
    res.status(401).send("This request is unauthorized or the URL doesn't exist");
  }
});

app.get("/register", (req, res) => {
  res.render("user_registration");
});

app.post("/urls", (req, res) => {
  let shortId = generateRandomString();
  let url = { shortURL : "" , longURL : "" , userID : ""};
  url.shortURL=shortId;
  url.longURL = req.body.longURL;
  url.userID = req.cookies["user_id"];
  urlDatabase[shortId] = url;
  res.redirect("http://localhost:8080/urls/"+shortURL);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL=req.body.newLongURL;
  res.redirect("/urls");;
});

app.post("/urls/:id/delete", (req, res) => {
  console.log(req.params.id);
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  if(isValidUser(req.body.email , req.body.password,res)){
    res.redirect('/urls');
  }else{
    res.sendStatus(403);
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
 });

app.post("/register", (req, res) => {
  let user_id = generateRandomString();
 if(req.body.email === "" || req.body.password === "" || isExistingUser(req.body.email)){
    res.sendStatus(400);
  }else{
    users[user_id] = {
      id: user_id ,
      email: req.body.email,
      password: req.body.password
    }
    res.cookie('user_id',user_id);
    res.redirect('/urls');
   }
});

function generateRandomString() {
  let randomString = Math.random().toString(36).replace('0.', '').substring(0,6);
  return randomString;
}