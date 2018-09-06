var express = require("express");
var app = express();
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
var PORT = 8080; // default port 8080

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  if(req.cookies["user_id"]){
    let templateVars = { urls: urlDatabase ,  user: users[req.cookies["user_id"]] };
    res.render("urls_index", templateVars);
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
  let longURL =urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  // TODO : condition checks for login by users and if shorturl belongs to particular user
  let templateVars = { shortURL: req.params.id , longURL : urlDatabase[req.params.id],  user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  res.render("user_registration");
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL]=req.body.longURL;
  res.redirect("http://localhost:8080/urls/"+shortURL);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id]=req.body.newLongURL;
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