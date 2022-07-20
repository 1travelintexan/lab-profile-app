const { Schema, model } = require('mongoose');

const petSchema = new Schema({
  name: { type: String, required: true },
  animalType: {
    type: String,
    enum: ['dog', 'cat', 'bird', 'fish', 'snake', 'lizard'],
  },
  breed: String,
  age: Number,
  size: {
    type: String,
    enum: ['toy', 'small', 'medium', 'large', 'x-large'],
  },
  petImage: String,
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
});

const PetModel = model('Pet', petSchema);
module.exports = PetModel;
