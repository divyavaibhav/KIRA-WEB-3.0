const { Client } = require("discord-cross-hosting");
const express = require("express");
const app = express();
const session = require("express-session");
const { Strategy } = require("passport-discord");
const passport = require("passport");
const path = require("path");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const User = require("./models/User.js");
const { fetch } = require("undici");
const config = require("./config.json");
const { isAuthorized } = require("./function/auth.js");

const client = new Client({
  agent: "dashboard",
  host: config.Host,
  port: config.Port,
  authToken: config.AuthToken,
});
client.on("debug", (d) => {
  console.log(`[DASHBOARD MANAGER] => ${d}`);
});
client.connect();
client.on("ready", () => {
  console.log("[CLIENT] => [DASHBOARD MANAGER] => ready now");
});

//Login system
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  if (user) done(null, user);
});

passport.use(new Strategy({
  clientID: config.clientID,
  clientSecret: config.clientSecret,
  callbackURL: config.callbackURL,
  scope: ["identify", "guilds"],
},
async (accessToken, refreshToken, profile, done) => {
try {
const user = await User.findOne({ discordId: profile.id });
if (user) return done(null, user);
const newUser = new User({
discordId: profile.id,
user: profile,
guilds: profile.guilds,
});
const savedUser = await newUser.save();
done(null, savedUser);
} catch (error) {
  console.error(error);
  return done(err, null);
}
}));

//Application Configration
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, './views'));
app.use(express.static(path.join(__dirname, './public')));
app.use('/images', express.static(path.join(__dirname, './images')));

app.use(session({
secret: "IAMDUMBLIKEYOUNOOBX100LOLXDHAHAAH#5642540780BNIJIPSRJBIRSJIJ",
cookie: {
  maxAge: 60000 * 60 * 24,
},
saveUninitialized: false,
resave: false,
name: "Kira-Oauth2",
store: MongoStore.create({
mongoUrl: config.mongoURI,
  }),
}));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  app.locals.user = req.user;
  next();
});

//Application
app.get('/', (req, res) => {
  res.render('index', {
    user: req.user ? req.user.user[0] : null,
    bot: client,
  });
});
app.get('/login', passport.authenticate("discord"));
app.get('/redirect', passport.authenticate("discord", {
failureRedirect: '/',
successRedirect: '/dashboard',
}));
app.get('/logout', async (req, res) => {
if (req.user) {
req.logout(function(err) {
if (err) {
return next(err);
}
res.redirect('/');
  });
}
});
app.get('/dashboard', isAuthorized, async(req, res) => {
const guilds = req.user.guilds.filter(g => g.permissions & 8);
const data = await Promise.all(guilds.map(async (guild) => {
const x = await client.requestToGuild({ guildId: guild.id, checkifIn: true }, { timeout: 15000 });
return x.data;
}));
  res.render('dashboard', {
    user: req.user.user[0],
    guilds,
    client: client,
    check: data,
  });
});
app.get('/dashboard/:guildId', isAuthorized, async(req, res) => {
  const ID = req.params.guildId;
  if (!ID) return res.redirect('/dashboard');
  const datax = await client.requestToGuild({ guildId: ID, guildData: true }, { timeout: 45000 });
  const userVcIn = await client.requestToGuild({ guildId: ID, userId: req.user.user[0].id, userData: true }, { timeout: 45000 });
  res.render('setting', {
    user: req.user.user[0],
    client: client,
    guild: datax,
    userIn: userVcIn.data,
   });
});
app.get('/premium', (req, res) => {
res.render('premium', {
  user: req.user ? req.user.user[0] : null,
  bot: client,
  });
});
app.get('/policy', (req, res) => {
  res.render('policy');
});
app.get('/contact', (req, res) => {
  res.render('contact');
});
app.get('/status', async (req, res) => {
  try {
    let info = await fetch(config.statusApi);
    info = await info.json();
    res.render('status', {
      user: req.user ? req.user.user[0] : null,
      Data: info,
    });
  } catch (err) {
    res.render('status', {
      user: req.user ? req.user.user[0] : null,
      Data: null,
    });
  }
});
app.get('/invite', (req, res) => {
  res.render('invite');
});
app.get('/support', (req, res) => {
  res.render('support');
});
app.get('/vote', (req, res) => {
  res.render('vote');
});
app.get('*', (req, res) => {
  res.render('404');
});

//Database
mongoose.set('strictQuery', false);
mongoose.connect(config.mongoURI);
mongoose.connection.on("connected", () => {
console.log("[DASHBOARD DATABASE] => connected now");
});
mongoose.connection.on('disconnected', () => {
console.log("[DAHBOARD DATABASE] => disconnected now");
});

//Application Listener
app.listen(config.appPort, () => {
  console.log("[DASHBOARD] => deploy now");
});

//Error Handler
process.on("unhandledRejection", (reason, promise) => {
console.log("[DASHBOARD ERROR] => Unhandled Rejection");
console.log(reason, promise);
});
process.on("uncaughtException", (err, origin) => {
console.log("[DASHBOARD ERROR] => Uncaught Exception");
console.log(err, origin);
});
process.on("uncaughtExceptionMonitor", (err, origin) => {
console.log("[DASHBOARD ERROR] => Uncaught Exception Monitor");
console.log(err, origin);
});
