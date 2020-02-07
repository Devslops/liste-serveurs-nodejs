var mongoose = require('mongoose')

const usersSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    required: true
  }
})

let usersModel = mongoose.model('users', usersSchema)
module.exports = usersModel