const express = require("express");
const app = express();
const morgan = require("morgan");
require('dotenv').config()

const cors = require("cors");
const Person = require('./models/person')
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static("dist"));
app.use(morgan("tiny"));


morgan.token("req-body", (req) => {
  if (req.method === "POST") {
    return JSON.stringify(req.body);
  }
  return "";
});


app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :req-body"
  )
);




app.get("/api/persons", (req, res, next) => {
  Person.find({}).then((persons) => {
    if (persons) {
    res.json(persons);
    } else {
      res.status(404).end();
    }
  }).catch((error) => next(error));
});


app.get("/api/persons/:id", (req, res, next) => {
  Person.findById(req.params.id).then((person) => {
    if (person) {
      res.json(person);
    } else {
      res.status(404).end();
    }
  }).catch((error) => next(error));
});



app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'name or number is missing'
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number
  })

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
  .catch(error => next(error))

  morgan('tiny')
})


app.delete("/api/persons/:id", (req, res, next) => {
  Person.findByIdAndDelete(req.params.id)
    .then(() => {
      res.status(204).end();
    }).catch((error) => next(error));
});

const errorHandler = (error, req, res, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message })
  }

  next(error)
}

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'name or number is missing'
    })
  }
  console.log(request.params.id)

  Person.findByIdAndUpdate(
    request.params.id,
    { name: body.name, number: body.number },
    { new: true, runValidators: true, context: 'query' }
  )
  .then(updatedPerson => response.json(updatedPerson))
  .catch(error => next(error))
})


app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
