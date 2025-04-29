CREATE TABLE cars (
id SERIAL PRIMARY KEY,
model TEXT UNIQUE NOT NULL,
seats INT,
average INT,
category TEXT,
image TEXT
);


CREATE TABLE users(
id SERIAL NOT NULL,
username TEXT UNIQUE NOT NULL,
email TEXT,
password TEXT
fname TEXT,
lname TEXT
);

CREATE TABLE admins(
id SERIAL PRIMARY KEY,
username TEXT UNIQUE NOT NULL,
email TEXT,
password TEXT,
fname TEXT,
lname TEXT
);

CREATE TABLE orders(
id SERIAL PRIMARY KEY,
adress TEXT,
adress2 TEXT,
cars_id INTEGER REFERENCES cars(id),
user_id INTEGER REFERENCES users(id),
date DATE,
bill INTEGER,
days INTEGER,
status TEXT
)