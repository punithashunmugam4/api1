// shunmugam
// pw - punitha

const express = require("express");
const { v4: uuid4 } = require("uuid");
const mysql = require("mysql2");

const app = express();

var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
});

con.connect((err) => {
  if (err) throw err;
  console.log("Connected!");
  con.query(`use employees;`, function (err, result) {
    console.log(result);
    if (err) {
      con.query(`CREATE DATABASE employees;`, function (err, result) {
        console.log(result);
        if (err) {
          throw err;
        }
        console.log("Database created");
      });
    }
    console.log("Database connected");
  });
});

app.listen(3500, (err) => {
  if (err) console.log("error starting server");
  console.log("server is listening to port: 3500");
});
app.use(express.json());

const users = [];
const sessions = [];
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (username == "" || password == "") {
    res.status(400).json("Error");
  } else {
    con.query(
      `CREATE TABLE IF NOT EXISTS usercreds(
PersonID int NOT NULL AUTO_INCREMENT,
username varchar(255) NOT NULL,
password varchar(255) NOT NULL,
PRIMARY KEY (PersonID)
);`,
      function (err, result) {
        if (err) {
          throw err;
        }
        console.log("Table created");
      }
    );
    con.query(
      `insert into usercreds (username, password) values('${username.toLowerCase()}', '${password.toLowerCase()}');`,
      (err, result) => {
        if (err) {
          throw err;
        }
        console.log("user added to db");
      }
    );
    console.log(username.toLowerCase() + " " + password.toLowerCase());
    res.status(201).json("Registration success");
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  let userfound = false;
  con.query(
    `select * from usercreds where username = '${username}';`,
    (err, result) => {
      if (err) throw err;
      let temp = result;
      if (
        temp[0].password == password.toLowerCase() &&
        temp[0].username == username.toLowerCase()
      ) {
        userfound = true;
      }
      // console.log(result);
      if (userfound) {
        const sessionToken = uuid4();
        sessions[sessionToken] = { username };
        res.set("Set-Cookie", `session=${sessionToken}`);
        res.send("Login Successfull");
      } else {
        res.sendStatus(401);
      }
    }
  );
});

app.get("/getall", (req, res) => {
  const sessionToken = req.headers.cookie.split("=")[1];
  if (sessions[sessionToken]) {
    const username = sessions[sessionToken].username;
    con.query(`select * from employeedetails`, function (err, result) {
      console.log(result);
      if (result.length == 0) {
        result.push({ message: "No result found" });
      }
      result.push({ username: username });
      res.json(result);
      if (err) throw err;
      console.log("All details fetched");
    });
  } else {
    res.sendStatus(401);
  }
});

app.get("/filter", (req, res) => {
  const sessionToken = req.headers.cookie.split("=")[1];
  if (sessions[sessionToken]) {
    const username = sessions[sessionToken].username;
    const data = req.body;
    let queries = Object.keys(req.body)[0];

    con.query(
      `select * from employeedetails where ${queries} = '${
        data[`${queries}`]
      }'`,
      function (err, result) {
        if (err) throw err;
        console.log(result.length);
        if (result.length == 0) {
          result.push({ message: "No result found" });
        }
        result.push({ username: username });
        res.json(result);
      }
    );
  } else {
    res.sendStatus(401);
  }
});

app.post("/add", (req, res) => {
  const sessionToken = req.headers.cookie.split("=")[1];
  // console.log("sessioToken  is  " + sessions[sessionToken].username);
  if (sessions[sessionToken]) {
    const username = sessions[sessionToken].username;

    const {
      name,
      contactPerson,
      address,
      city,
      zipCode,
      country,
      emergencyContact,
      phone,
      bloodGroup,
      dob,
    } = req.body;
    let data = req.body;
    let keys = [
      "name",
      "contactPerson",
      "address",
      "city",
      "zipCode",
      "country",
      "emergencyContact",
      "phone",
      "bloodGroup",
      "dob",
    ];
    let missingfield = keys.filter((a) => {
      // console.log(data[a]);
      if (!data[a]) {
        return true;
      }
    });
    let missingresult = "";
    missingfield.forEach((element) => {
      missingresult += `${element} field is missing\n`;
    });
    console.log(missingresult);
    let alreadyexist = false;

    const insertdata = () => {
      if (missingfield.length > 0) {
        res.status(400).send(missingresult);
      } else if (alreadyexist == true) {
        res.status(400).json("Employee Details already present");
      } else {
        con.query(
          `insert into employeedetails ( name, contactPerson, address, city, zipCode, country, emergencyContact, phone, bloodGroup,dob)
  VALUES ('${name}', '${contactPerson}', '${address}', '${city}', '${zipCode}', '${country}', '${emergencyContact}', '${phone}', '${bloodGroup}', '${dob}');`,
          function (err, result) {
            if (err) throw err;
            else {
              console.log("Insert result is  " + result);
              // result.push({ username: username });
              console.log(req.body);
              res.json(req.body);
              console.log("details added");
            }
          }
        );
      }
    };
    con.query(
      `CREATE TABLE IF NOT EXISTS employeedetails(
PersonID int NOT NULL AUTO_INCREMENT,
name varchar(25) NOT NULL,
contactPerson varchar(25) NOT NULL,
address varchar(25) NOT NULL,
city varchar(10) NOT NULL,
zipCode varchar(9) NOT NULL,
country varchar(10) NOT NULL,
emergencyContact varchar(15) NOT NULL,
phone varchar(15) NOT NULL,
bloodGroup varchar(5) NOT NULL,
dob DATE NOT NULL,
PRIMARY KEY (PersonID)
);`,
      function (err, result) {
        if (err) {
          throw err;
        }
        console.log("Table created");
      }
    );
    con.query(
      `select * from employeedetails where name = '${name}'`,
      function (err, result) {
        console.log(result.length);
        if (result.length > 0) {
          alreadyexist = true;
          console.log("Already exist");
        }
        insertdata();
        if (err) throw err;
      }
    );
  } else {
    res.sendStatus(401);
  }
});

app.put("/update", (req, res) => {
  const sessionToken = req.headers.cookie.split("=")[1];
  if (sessions[sessionToken]) {
    const username = sessions[sessionToken].username;
    let data = req.body;
    let entry = Object.entries(data);

    con.query(
      `select * from employeedetails where name = '${data["name"]}' and dob ='${data["dob"]}'`,
      function (err, result) {
        if (err) throw err;
        console.log(result);
        if (result.length > 0) {
          let temp = "";
          entry.forEach((e, i) => {
            if (i == entry.length - 1) {
              temp += `${e[0]}='${e[1]}'`;
            } else {
              temp += `${e[0]}='${e[1]}',`;
            }
          });

          con.query(
            `update employeedetails set ${temp} where dob='${data["dob"]}' and name='${data["name"]}' ;`,
            function (err, result) {
              if (err) throw err;
              console.log("details updated");
              console.log(result);
              res.json(req.body);
            }
          );
        } else {
          res.status(400).json("Employee details does not exist");
        }
      }
    );
  } else {
    res.sendStatus(401);
  }
});

app.delete("/remove", (req, res) => {
  const sessionToken = req.headers.cookie.split("=")[1];
  if (sessions[sessionToken]) {
    const username = sessions[sessionToken].username;
    const { name, dob } = req.body;

    con.query(
      `select * from employeedetails where name = '${name}' and dob ='${dob}'`,
      function (err, result) {
        if (err) throw err;
        console.log(result);
        if (result > 0) {
          result.forEach((e) => {
            con.query(
              `delete from employeedetails where id=${e["id"]};`,
              function (err, result) {
                if (err) throw err;
                console.log("Employee details deleted");
              }
            );
          });
          res.json("Employee details deleted:");
        } else {
          res.status(400).json("Employee details does not exist");
        }
      }
    );
  } else {
    res.sendStatus(401);
  }
});
