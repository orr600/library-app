const mongoose=require('mongoose')
const validator=require('validator')

const loanSchema= new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },
    book:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Book'
    }
},{timestamps:true}
)


const Loan= mongoose.model('Loan',loanSchema)
module.exports= Loan
    


