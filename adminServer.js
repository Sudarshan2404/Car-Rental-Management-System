import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import env from "dotenv";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";

const app = express();
const port = 4000;
const saltrounds = 10;
env.config();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.redirect("/admin/dashboard");
});

app.get("/admin/dashboard", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const users = await db.query("SELECT * FROM users");
      const ttlorders = await db.query(
        "SELECT * FROM orders WHERE status='Pending' OR status='Confirmed' "
      );
      const complete = await db.query(
        "SELECT * FROM orders WHERE status='Completed'"
      );
      const result = await db.query(
        "SELECT orders.id AS order_id, orders.*, cars.*, users.* FROM orders JOIN cars ON orders.cars_id = cars.id JOIN users ON orders.user_id = users.id ORDER BY orders.id ASC;"
      );
      const orders = result.rows;
      const ttluser = users.rows.length;
      // console.log(total, complete, ttluser);
      res.render("admin.ejs", {
        orders: orders,
        order: ttlorders.rows.length,
        users: ttluser,
        complete: complete.rows.length,
      });
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/admin/login");
  }
});

app.get("/admin/collection", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      let cars = [];
      const result = await db.query("SELECT * FROM cars");
      res.render("collection.ejs", { cars: result.rows });
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/admin/login");
  }
});

app.get("/add", (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(path.join(__dirname, "main", "addcar.html"));
  } else {
    res.redirect("/admin/login");
  }
});

app.post("/addcar", upload.single("image"), async (req, res) => {
  const name = req.body.name;
  const seats = req.body.seats;
  const average = req.body.aver;
  const cate = req.body.carType;
  const price = req.body.price;
  const image = req.file ? "/uploads/" + req.file.filename : null;
  try {
    await db.query(
      "INSERT INTO cars(model, seats, average, category, image, price) VALUES($1, $2, $3, $4, $5, $6)",
      [name, seats, average, cate, image, price]
    );
    console.log(name, cate, seats, average, image, price);
    res.redirect("/admin/collection");
  } catch (error) {
    console.log(error);
  }
});

app.get("/edit", async (req, res) => {
  if (req.isAuthenticated()) {
    const id = req.query.id;
    const result = await db.query("SELECT * FROM cars WHERE id=$1", [id]);
    const car = result.rows[0];
    res.render("edit.ejs", { cate: car.category, car: car });
  } else {
    res.redirect("/admin/login");
  }
});

app.post("/edit", async (req, res) => {
  const id = req.body.id;
  const name = req.body.model;
  const price = req.body.price;
  const aver = req.body.aver;
  const cate = req.body.carType;
  try {
    await db.query(
      "UPDATE cars SET model=$1, average=$2, category=$3, price=$4 WHERE id=$5",
      [name, aver, cate, price, id]
    );
    res.redirect("/admin/collection");
  } catch (error) {
    console.log(error);
  }
});

// app.get("/admins/manage", async (req, res) => {
//   if (req.isAuthenticated()) {
//     res.sendFile(path.join(__dirname, "main", "managead.html"));
//   } else {
//     res.redirect("/admin/login");
//   }
// });

app.post("/updatestatus", async (req, res) => {
  const status = req.body.status;
  const id = req.body.orderid;
  console.log(status, id);
  try {
    await db.query("UPDATE orders SET status=$1 WHERE id=$2", [status, id]);
    res.redirect("/");
  } catch (error) {
    res.status(500).console.log(error);
  }
});

app.post("/delete", async (req, res) => {
  const id = req.body.id;
  console.log(id);
  try {
    await db.query("DELETE FROM cars WHERE id=$1", [id]);
    res.send(`
      <script>
        alert("Item deleted successfully!");
        window.location.href = "/admin/collection"; // Redirect to collection page
      </script>
    `);
  } catch (error) {
    console.log(error);
  }
});

app.get("/register", (req, res) => {
  res.render("authentication/register.ejs", { message: null });
});

app.post("/register", async (req, res) => {
  if (req.isAuthenticated()) {
    const { username, email, fname, lname, password } = req.body;
    console.log(username, email, fname, lname, password);

    try {
      if (password.length < 6) {
        res.render("authentication/register.ejs", {
          message: "password should atleast consist of 6 characters",
        });
      } else {
        const checkresult = await db.query(
          "SELECT * from admins WHERE email=$1",
          [email]
        );
        if (checkresult.rows.length > 0) {
          res.render("authentication/register.ejs", {
            message: "admin already exist",
          });
        } else {
          const checkuser = await db.query(
            "SELECT * FROM admins WHERE username=$1",
            [username]
          );
          if (checkuser.rows.length > 0) {
            res.render("authentication/register.ejs", {
              message: "Username not available, Use different Username",
            });
          } else {
            try {
              const hashedpass = await bcrypt.hash(password, saltrounds);
              await db.query(
                "INSERT INTO admins (username, email, password, fname, lname) VALUES($1,$2,$3,$4,$5)",
                [
                  username.trim(),
                  email.trim(),
                  hashedpass,
                  fname.trim(),
                  lname.trim(),
                ]
              );
              res.redirect("/");
            } catch (error) {
              console.log("ERROR HASHGING PASSWORD", error);
              res.render("authentication/register.ejs", {
                message: "There was an error registering, try again",
              });
            }
          }
        }
      }
    } catch (error) {
      res.status(500);
      console.log(error);
      res.render("authentication/register.ejs", {
        message: "There was an error registering, try again",
      });
    }
  } else {
    res.redirect("/admin/login");
  }
});

app.get("/admin/login", (req, res) => {
  res.render("authentication/login.ejs", { message: null });
});

app.post("/login", async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      next(err);
    }
    if (!user) {
      return res.render("authentication/login.ejs", { message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/");
    });
  })(req, res, next);
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM admins WHERE username=$1", [
        username,
      ]);
      if (result.rows.length === 0) {
        return cb(null, false, {
          message: "admin not found, please tell the owner to register you",
        });
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
  console.log(`listening on http://localhost:${port}`);
});
