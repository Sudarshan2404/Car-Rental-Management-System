import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import env from "dotenv";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";

const app = express();
const port = 3000;
const saltrounds = 5;
env.config();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: null,
    },
  })
);

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("main"));
app.use(express.static("public"));
app.use(express.static("main/consumer"));

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "main", "consumer", "home.html"));
});

app.get("/About", (req, res) => {
  res.sendFile(path.join(__dirname, "main", "consumer", "about.html"));
});

app.get("/dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/collection");
    console.log(req.user);
  } else {
    res.redirect("/login");
  }
});

app.get("/filter", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const all = await db.query("SELECT * FROM cars");
      const cars = all.rows;
      const randindex = Math.floor(Math.random() * cars.length);
      const sugcar = all.rows[randindex];
      const cate = req.query.category || "All";
      let result;
      if (cate === "All") {
        result = cars;
      } else {
        const filteredcars = await db.query(
          "SELECT * FROM cars WHERE category=$1",
          [cate]
        );
        result = filteredcars.rows;
      }
      if (result.length === 0) {
        res.render("consumer/rent.ejs", {
          car: sugcar,
          cars: result,
          selectedCategory: cate,
          message: "No Car Available With the Selected Category",
        });
      } else {
        res.render("consumer/rent.ejs", {
          car: sugcar,
          cars: result,
          selectedCategory: cate,
          message: null,
        });
      }
    } catch (err) {
      console.log(err);
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/collection", async (req, res) => {
  if (req.isAuthenticated()) {
    const result = await db.query("SELECT * FROM cars");
    const cars = result.rows;
    const randindex = Math.floor(Math.random() * cars.length);
    const sugcar = result.rows[randindex];
    res.render("consumer/rent.ejs", {
      car: sugcar,
      cars: cars,
      selectedCategory: "All",
      message: null,
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/Account", async (req, res) => {
  if (req.isAuthenticated()) {
    const fullname = req.user.fname + " " + req.user.lname;
    try {
      const result = await db.query(
        "SELECT orders.id AS order_id, orders.*, cars.*FROM orders JOIN cars ON cars.id = orders.cars_id WHERE user_id = $1",
        [req.user.id]
      );
      const order = result.rows;
      const date = order.date;
      res.render("consumer/account.ejs", {
        fullname: fullname,
        username: req.user.username,
        email: req.user.email,
        order: order,
      });
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/book", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const car_id = req.query.carid;
      const result = await db.query("SELECT * FROM cars WHERE id=$1", [car_id]);
      const car = result.rows[0];
      const carname = car.model;
      const name = req.user.fname + " " + req.user.lname;
      const mail = req.user.email;
      const date = new Date();
      // const todayDate = date.toLocaleDateString();
      res.render("consumer/book.ejs", {
        carname: carname,
        userinfo: name,
        useremail: mail,
        carprice: car.price,
        carid: car_id,
      });
    } catch (err) {
      console.log(err);
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/book", async (req, res) => {
  if (req.isAuthenticated()) {
    const add1 = req.body.add1;
    const add2 = req.body.add2;
    const days = req.body.days;
    const date = req.body.date;
    const carid = req.body.id;
    const userid = req.user.id;
    const price = req.body.pricee;
    const bill = days * price;
    try {
      await db.query(
        "INSERT INTO orders(adress, adress2,cars_id,user_id,date,bill,days) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [add1, add2, carid, userid, date, bill, days]
      );
      res.redirect("/Account");
    } catch (err) {
      console.log(err);
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/cancelBook", async (req, res) => {
  try {
    const id = req.body.id;
    await db.query("UPDATE orders SET status = 'Cancelled' WHERE id=$1", [id]);
    res.redirect("/Account");
  } catch (error) {
    console.log(error);
  }
});

app.get("/login", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.render("consumer/login.ejs", { message: null });
  } else {
    res.redirect("/collection");
  }
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/register", (req, res) => {
  res.render("consumer/register.ejs", { message: null });
});

app.post("/register", async (req, res) => {
  const { username, email, fname, lname, password } = req.body;
  console.log(username, email, fname, lname, password);

  try {
    if (password.length < 6) {
      res.render("consumer/register.ejs", {
        message: "password should atleast consist of 6 characters",
      });
    } else {
      const checkresult = await db.query("SELECT * from users WHERE email=$1", [
        email,
      ]);
      if (checkresult.rows.length > 0) {
        res.render("consumer/register.ejs", {
          message: "User already exist, Try logging in",
        });
      } else {
        const checkuser = await db.query(
          "SELECT * FROM users WHERE username=$1",
          [username]
        );
        if (checkuser.rows.length > 0) {
          res.render("consumer/register.ejs", {
            message: "Username not available, Use different Username",
          });
        } else {
          try {
            const hashedpass = await bcrypt.hash(password, saltrounds);
            await db.query(
              "INSERT INTO users (username, email, password, fname, lname) VALUES($1,$2,$3,$4,$5)",
              [
                username.trim(),
                email.trim(),
                hashedpass,
                fname.trim(),
                lname.trim(),
              ]
            );
            res.redirect("/login");
          } catch (error) {
            console.log("ERROR HASHGING PASSWORD", error);
            res.render("consumer/register.ejs", {
              message: "There was an error registering, try again",
            });
          }
        }
      }
    }
  } catch (error) {
    res.status(500);
    console.log(error);
    res.render("consumer/register.ejs", {
      message: "There was an error registering, try again",
    });
  }
});

app.post("/login", async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      next(err);
    }
    if (!user) {
      return res.render("consumer/login.ejs", { message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/dashboard");
    });
  })(req, res, next);
});

passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE username=$1", [
        username,
      ]);
      if (result.rows.length === 0) {
        return cb(null, false, { message: "User not found, Sign-up" });
      }
      const user = result.rows[0];
      const passwordmtch = await bcrypt.compare(password, user.password);

      if (!passwordmtch) {
        return cb(null, false, { message: "Invalid Password" });
      }

      return cb(null, user);
    } catch (error) {
      console.log(error);
      return cb(error);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
