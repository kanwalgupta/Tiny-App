var express = require("express");
var app = express();
app.set("view engine", "ejs");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
var cookieSession = require('cookie-session');
var methodOverride = require('method-override');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
var PORT = 8080; // default port 8080

app.use(cookieSession({
  name: 'session',
  keys: ['dagebaaz','kudian'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

var urlDatabase = {
  "b2xVn2": { shortURL : "b2xVn2", longURL :"http://www.lighthouselabs.ca" , userID : "sabrina" },
   "9sm5xK": { shortURL : "9sm5xK", longURL : "http://www.google.com" , userID : "sapnagoel" }
};
const users = {
  "sabrina": {
    id: "sabrina",
    email: "sabrinasandhu@google.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10) // Hashed password for hard coded user , Login page needs to fill the actual password supplied inside function hashSync
  },
 "sapnagoel": {
    id: "sapnagoel",
    email: "sapna@sangrur.com",
    password: bcrypt.hashSync("dishwasher-funk", 10) // Hashed password for hard coded user , Login page needs to fill the actual password supplied inside function hashSync
  }
}

function isValidUser(email,password,req){
  let userFound = false ;
  Object.keys(users).forEach(key => {
    if(users[key].email === email && bcrypt.compareSync(password, users[key].password)){
      userFound = true;
      req.session.user_id = key;
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
      if(urlDatabase[key].userID === req.session.user_id){
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

app.get("/urls", (req, res) => {
  let templateVars ={ urls : "" , user : ""};
  let userFound = false;
  let urlDatabaseforUser = [];
  if(req.session.user_id){
   Object.keys(urlDatabase).forEach(key => {
      if(urlDatabase[key].userID === req.session.user_id){
       urlDatabaseforUser.push(urlDatabase[key]);
       userFound = true;
       return;
     }
   });
    if(userFound){
      templateVars  = { urls: urlDatabaseforUser ,  user: users[req.session.user_id] };
      res.render("urls_index", templateVars);
    }else{
      templateVars = { urls: " " ,  user: users[req.session.user_id] };
      res.render("urls_new",templateVars);
    }
  }else{
    res.render('user_login');
  }
});

app.get("/urls/new", (req, res) => {
  if(req.cookies["user_id"]){
    let templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }else{
    res.render('/login');
  }
});

app.get("/login", (req, res) => {
  res.render("user_login");
 });

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  // TODO : condition checks for login by users and if shorturl belongs to particular user
  if(req.session.user_id && userOwnsShortURL(req.params.id,req)){
    let templateVars = { shortURL: req.params.id , longURL : urlDatabase[req.params.id].longURL,  user: users[req.session.user_id] };
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
  url.userID = req.session.user_id;
  urlDatabase[shortId] = url;
  res.redirect("http://localhost:8080/urls/"+shortId);
});

// Functionality for PUT (Updating long URL for existing short URL)
app.put("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL=req.body.newLongURL;
  res.redirect("/urls");;
});

// Functionality for delete using method override
app.delete("/urls/:id", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  if(isValidUser(req.body.email , req.body.password,req)){
    res.redirect('/urls');
  }else{
    res.sendStatus(403);
  }
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect('/urls');
 });

app.post("/register", (req, res) => {
  let user_id = generateRandomString();
 if(req.body.email === "" || req.body.password === "" || isExistingUser(req.body.email)){
    res.sendStatus(400);
  }else{
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[user_id] = {
      id: user_id ,
      email: req.body.email,
      password: hashedPassword
    }
    req.session.user_id = user_id;
    res.redirect('/urls');
   }
});

function generateRandomString() {
  let randomString = Math.random().toString(36).replace('0.', '').substring(0,6);
  return randomString;
}