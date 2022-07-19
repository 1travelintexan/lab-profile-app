const { Schema, model } = require('mongoose');

const petSchema = new Schema({
  name: String,
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
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
});

const PetModel = model(pet, petSchema);
module.exports = PetModel;
