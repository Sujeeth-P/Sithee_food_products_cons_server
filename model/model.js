import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const SignupSchema = new mongoose.Schema({
  name: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  phone: {type: String}, // Add phone field to user model
  role: {type: String, required: true, default: 'user', enum: ['user', 'admin']}
}, {
  timestamps: true
})


//pass encry
SignupSchema.pre("save", async function(next) {
  if ((!this.isModified("password"))) return next()
  const salt = await bcrypt.genSalt(10); 
  this.password = await bcrypt.hash(this.password, salt)
  next();
});

//pass will be matched
SignupSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
} 



const SignupCollection = mongoose.model("signups", SignupSchema)


// const LoginSchema = new mongoose.Schema({
//   email: {type: String,require: true},
//   password: {type: String,require: true}
// })

// const LoginCollection = mongoose.model("logins", LoginSchema)

export default SignupCollection