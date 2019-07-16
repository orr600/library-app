require('./db/mongoose')
const express= require("express")
const path= require("path")
const body_parser= require("body-parser")
const User= require('./src/models/user')
const Book= require('./src/models/book')
const Loan= require('./src/models/loan')
const {auth}= require('./src/auth')
const cookieSession = require('cookie-session')




const app= express()
const port=process.env.PORT || 3000

const imagesDir= path.join(__dirname,'./images')
const viewDir= path.join(__dirname,'./front') 
const cssDir= path.join(__dirname,'./css') 

app.use(express.json())
app.use(body_parser.urlencoded({extended:true}))
app.use(express.static(imagesDir))
app.use(express.static(cssDir))

app.use(cookieSession({name: 'session',
keys: ['key1', 'key2']} 
))


app.set('view engine', 'ejs')
app.set('views',viewDir )


app.get('/', async(req,res)=>{
    res.render("index.ejs")

})
app.get('/registration', async(req,res)=>{
    res.render("registration.ejs")

})
app.get('/addBook', async(req,res)=>{
    res.render("addBook.ejs")

})
app.get('/deleteBook', async(req,res)=>{
    res.render("deleteBook.ejs")

})
app.get('/login', async(req,res)=>{
    res.render("login.ejs",{active:"login"})

})

app.post('/users', async(req,res)=>{
    
    const user = new User (req.body)
    var message="We are sorry, The registration process was failed. please try again"
    try{
        var checkUser= await User.findOne({email: req.body.email})
        if(checkUser){
             message= "We are sorry, there is already user with this email, try another address"
            throw new Error()
        }
        const token = await user.generateAuthToken()
        res.status(201).render("registration.ejs")
    }
    catch(e){
        res.status(400).render("error.ejs",{
            message,
            routePrev:"/registration"
        })
    }
})

app.post('/usersLogin', async(req,res)=>{
    try{
        
        const user= await User.findByCredentials(req.body.email, req.body.password)
        
        token= await user.generateAuthToken()
        req.session.name=user.privateName+" "+user.familyName
        req.session.token=token
        res.render("libraryPage.ejs",{
            name:req.session.name
        })
    }
    catch(e){
        res.status(400).render("error.ejs",{
            message:"We are sorry, the process was failed. please try again",
            routePrev:"/login"
        })
    }
})

app.post('/books', async(req,res)=>{
    var books=[]
    var message="We are sorry, The adding process was failed. please try again"
    try{
        var checkBook= await Book.findOne({isbn: req.body.isbn})
        if(checkBook){
            var message= "We are sorry, there is already book with this isbn, try another book"
            throw new Error()
        }
        
        if(!req.body.numOfCopies){throw new Error}
        for(var i=1;i<=req.body.numOfCopies;i++){
            var book= new Book ({...req.body,numOfCopy:i})
            await book.save()
            books= books.concat(book)
        }
        res.status(200).render("addBook.ejs")
    }
    catch(e){
        res.status(400).render("error.ejs",{
            message,
            routePrev:"/addBook"
        })
    }
})

app.post('/loanBook',auth, async(req,res)=>{
    try{
        
        const book=await Book.findOne({isbn:req.body.isbn,isLoan:false})
        
        if(!book){
            throw "The process was failed"
        }
        book.isLoan=true
        await book.save()
        const userId= req.user._id
        const bookId= book._id
        
        const loan = new Loan ({user:userId,book:bookId})
        await loan.save()
        res.render("loanBook.ejs")
    }
    catch(e){
        res.status(400).render("error.ejs",{
        message:"We are sorry, The loaning process was failed. please try again",
        routePrev:"/loanBook"
    })
}
})

app.post('/deleteBook', async(req,res)=>{
    var message= "We are sorry, The deleting process was failed. please try again"
    try{
        var booksLoaned= await Book.find({isbn:req.body.isbn, isLoan: true})
        if(booksLoaned.length>0){
            message= "We are sorry, someone borrowed this book. You are not allowed to delete it"
            throw new Error()
        }
        const booksDeleted= await Book.deleteMany({isbn:req.body.isbn})
        
        if(booksDeleted.deletedCount===0){
            message= "There isn't any book with this ISBN, please try again"
            throw new Error()
        }
        res.render("deleteBook.ejs")
    }
    catch(e){
        res.status(400).render("error.ejs",{
        message,
        routePrev:"/deleteBook"
    })
  }
})
 app.get('/libraryPage',auth, async(req,res)=>{
     
    res.render("libraryPage.ejs",{
        name:req.session.name
    })
 })
 app.get('/loanBook',auth, async(req,res)=>{
    res.render("loanBook.ejs")
 })
 app.get('/returnBooks',auth, async(req,res)=>{
    
    try{
        const bookForUser=await booksForUser(req.user._id)
        
        res.render("returnBooks.ejs",{
            books:bookForUser
        })
     }
     catch(e){
        res.status(400).render("error.ejs",{
        message:"We are sorry, The returning process was failed. please try again",
        routePrev:"/libraryPage"
    })
  }
 })

 app.post('/afterReturnBooks',auth, async(req,res)=>{
    try{
       var booksForUser=[]
       booksForUser=booksForUser.concat(req.body.booksForUser) 
       for(let b of booksForUser){
           var loan= await Loan.findOneAndDelete({book:b})
           await Book.findByIdAndUpdate(b, {$set:{isLoan:false}})
       }
       console.log(req.user._id)
      //var bookForUser=await booksForUser(req.user._id)
      const books= await Book.find({})
      var bookForUser=[]
    for(var i=0; i<books.length;i++){
        var isMatch= await Loan.find({user: req.user._id, book:books[i]._id}) 
        if(isMatch.length>0){  
            bookForUser=bookForUser.concat(books[i])
        }
    }
       console.log("hhhhhhhhh")
        res.status(200).render("returnBooks.ejs",{
        books:bookForUser
    })
    }
    catch(e){
       res.status(400).render("error.ejs",{
       message:"We are sorry, The returning process was failed. please try again",
       routePrev:"/libraryPage"
   
   })
 }
})
 app.get('/searchBook',auth, async(req,res)=>{
     
    res.render("searchBook.ejs")
 })

 app.post('/resSearchBook',auth, async(req,res)=>{
     var showBooks= []
     
     try{
        req.session.keyWord= req.body.keyWord
        const books= await Book.find({})
        for(let b of books){
            
            if((b.name.toLowerCase()).includes(req.body.keyWord) || (b.author.toLowerCase()).includes(req.body.keyWord)){
              
                showBooks=showBooks.concat(b)
            }
        }

        
        res.render("showSearchBook.ejs", {
            showBooks
        })
     }
     catch(e){
        res.status(400).render("error.ejs",{
        message:"We are sorry, The searching process was failed. please try again",
        routePrev:"/libraryPage"
    
    })
   }    
 })

 

 app.post('/loanSearchBook',auth, async(req,res)=>{
     try{
         var book= await Book.findByIdAndUpdate(req.body.loanBookId, {$set:{isLoan:true}})
         var loan= new Loan({user:req.user._id, book:req.body.loanBookId})
         await loan.save()
         const books= await Book.find({})
         var showBooks= []
        for(let b of books){
            if((b.name).includes(req.session.keyWord) || (b.author).includes(req.session.keyWord)){
                showBooks=showBooks.concat(b)
            }
        }
        res.render("showSearchBook.ejs", {
            showBooks
        })
     }
     catch(e){
        res.status(400).render("error.ejs",{
        message:"We are sorry, The loaning process was failed. please try again",
        routePrev:"/libraryPage"
    
    })
  }
 })

 app.get('/logout',auth, async(req,res)=>{
     try{
        req.session=null
        res.render("index.ejs")
     }
     catch(e){
        res.status(400).render("error.ejs",{
            message:"We are sorry, The logout process was failed. please try again",
            routePrev:"/libraryPage"
        })
     }
 })


 const booksForUser= async (userId)=>{
    const books= await Book.find({})

    var bookForUser=[]
    console.log(books)
    for(var i=0; i<books.length;i++){
        console.log(i)
        var isMatch= await Loan.find({user: userId, book:books[i]._id}) 
        if(isMatch.length>0){  
            bookForUser=bookForUser.concat(books[i])
        }
    }
    console.log(bookForUser)
    return bookForUser
 }

 
     



app.listen(port, ()=>{console.log("Server is up on port "+port)})