const mongoose=require('mongoose')
const validator=require('validator')
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

const userSchema= new mongoose.Schema({
    privateName:{
        type:String,
        required:true,
    }, 
    familyName:{
        type:String,
        required:true,
    },
    age:{
        type: Number,
        required:true,
        validate(value){
            if(value<0){
                throw new Error("Age must be a positive num!")
            }
            if(value>120){
                throw new Error("Age must be lower than 120!")
            }
        }
    },
    gender:{
        type:String,
        required:true,
        lowercase:true,
        enum:['male','female']
    },
    email:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw "email value is illegal"
            }
        }
    },
    password:{
        type: String,
        minlength:6,
        maxlength:10,
        required:true,
    },
    tokens:[
        {
            token:{
                type:String,
                required:true
            }
        }
    ]
})


userSchema.methods.generateAuthToken= async function () {
    user=this
    const token= jwt.sign({'_id':user._id}, process.env.JWT_SECRET)
    
    user.tokens=user.tokens.concat({token})
    
    await user.save()
    return token
}

/*userSchema.pre('save' ,async function (next) {
    const user= this
    
    if(user.isModified('password')){
         user.password=await bcryptjs.hash(user.password, 8)
   }
    next()
})*/

userSchema.statics.findByCredentials = async (email, password)=> {
    const user=await User.findOne({email})
    
    if(!user){
        throw new Error ("Authentication failed")
    }
    

    //const isMatch= await bcryptjs.compare(user.password, password)
    //console.log(isMatch)
    if(user.password!==password){
    //if(!isMatch){
        throw new Error ("Authentication failed")
    }

    return user
}



const User= mongoose.model('User',userSchema)
module.exports= User