const mongoose=require('mongoose')
const validator=require('validator')

const bookSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    author:{
        type:String,
        required:true
    },
    releaseYear:{
        type:Number,
        required:true
    },
    isbn:{
        type:Number,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    numOfCopy:{
        type:Number
    },
    isLoan:{
        type:Boolean,
        default:false
    },
    imgSrc:{
        type:String,
        default:undefined
    }
})



const Book= mongoose.model('Book',bookSchema)
module.exports= Book