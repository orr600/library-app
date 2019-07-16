const jwt= require("jsonwebtoken")
const User=require('./models/user.js')

const auth= async (req,res,next)=>{
    try{
        const code= jwt.verify(req.session.token, process.env.JWT_SECRET)
        
        const user= await User.findOne({'_id':code._id, 'tokens.token':token})
        
        if(!user){
            throw new Error()
        }
           req.user=user
           next()
    }

    catch(e){
        res.status(401).render("error.ejs",{
            message: 'Log in failed ,Please authenticate',
            routePrev:"/login"
        })
    }


}


module.exports= {auth}
