'use strict';

const bodyParser = require('body-parser');
const express = require('express');
let fs = require('fs');
const morgan = require('morgan');
const path = require('path');
const petsPATH = path.join(__dirname, 'pets.json');

const app = express();

app.use(morgan('short'));
app.use(bodyParser.json());

app.get('/pets', (req, res, next) => {
  fs.readFile(petsPATH, 'utf8', (err, petsJSON) => {
    if (err) {
      res.status(500);
      return next(err);
    }

    let pets = JSON.parse(petsJSON);
    res.send(pets);
  });
});

app.get('/pets/:id', (req, res, next) => {
  fs.readFile(petsPATH, 'utf8', (err, petsJSON) => {
    if (err) {
      res.status(500);
      return next(err);
    }

    let id = Number.parseInt(req.params.id);
    const pets = JSON.parse(petsJSON);
    const pet = pets[id];

    if (id < 0 || id >= pets.length || Number.isNaN(id) ) {
      res.status(404);
      return next(err);
    };

    res.send(pet);
  });
});

app.post('/pets', (req, res, next, err) => {
  const age = req.body.age;
  const name = req.body.name;
  const kind = req.body.kind;

  if (!age || !name || !kind || Number.isNaN(age)) {
    res.status(404);
    return next(err);
  }

  fs.readFile(petsPATH, 'utf8', (err, petsJSON) => {
    if (err) {
      res.status(500);
      return next(err);
    }

    let pets = JSON.parse(petsJSON);
    const newPet = {
      age: age,
      name: name,
      kind: kind
    };
    pets.push(newPet);
    pets = JSON.stringify(pets);

    fs.writeFile(petsPATH, pets, (err) => {
      if (err) {
        res.status(500);
        return next(err);
      };
      res.send(newPet);
    });

  });
});

app.patch('/pets/:id', (req, res, next) => {
  fs.readFile(petsPATH, 'utf8', (err, petsJSON) => {
    if (err) {
      return next({statusCode: 500, message:"There's been a server error."});
    };

    const id = Number.parseInt(req.params.id);
    let pets = JSON.parse(petsJSON);

    if (id < 0 || id >= pets.length || Number.isNaN(id)) {
      res.status(404);

      return next({statusCode:404, message: "Not Found"})
    }
    const updatedPetInfo = req.body;
    const petToChange = pets[id];

//check to see whether any new information was submitted; if not, send a bad request error.
    if (Object.keys(updatedPetInfo) === 0) {
      return next({statusCode: 400, message:"Bad Request"})
    }

//compare new info submitted with the designated pet in pets; update any new information
    for (let key in updatedPetInfo) {
      if (petToChange.hasOwnProperty(key)) {
        if (key === "age" && Number.isNaN(Number.parseInt(updatedPetInfo[key]))) {
          return next({statusCode: 400, message:"Bad Request"})
        }
        petToChange[key] = updatedPetInfo[key];
      }
    }

    pets[id] = petToChange;

    const newPetsJSON = JSON.stringify(pets);

    fs.writeFile(petsPATH, newPetsJSON, (writeErr) => {
      if (writeErr) {
        res.status(500);
        return next(writeErr)
      };

      res.send(petToChange);
    });
  });

});

app.use((req, res, next) => {
  res.status(404);
  let err = {message: "Not Found"};
  next(err);
})

app.use((err, req, res, next) => {
  res.set({'Content-Type':'text/plain'})
  console.log(err);
  res.send(err.message)
});

const port = process.env.port || 8000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

module.exports = app;
