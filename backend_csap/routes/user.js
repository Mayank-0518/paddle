

const {Router}=require('express');
const {UserModel, purchaseModel}=require('../db')
const{JWT_SECRET_USER} = require('../config');

const bcrypt=require('bcrypt');
const zod=require('zod');
const jwt=require('jsonwebtoken');
const { userMiddleware } = require('../middleware/user');




const userRouter=Router();


userRouter.post('/signup' ,async function(req,res){
    const requiredBody = zod.object({email: zod.string().min(3).max(100).email(), 
            password: zod.string().min(5).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/), 
            first_name: zod.string().min(3).max(100),
            last_name: zod.string().min(3).max(100)})
    
            const parseDataWithSuccess = requiredBody.safeParse(req.body);
    
        if (!parseDataWithSuccess.success) {
            return res.json({
                message: "Incorrect data format",
                error: parseDataWithSuccess.error,
            });
        }
    const {email,password,first_name,last_name}=req.body;
     const hashedPassword = await bcrypt.hash(password, 5);

    try{
        await UserModel.create({
            email:email,
            password:hashedPassword,
            first_name:first_name,
            last_name:last_name
        })
    }catch(error){
        return res.json({
            message:"User already exists"
        })
    }

    res.json({
        message:"You are signed up"
    })
})



userRouter.post('/signin',async function(req,res){

const requiredBody = zod.object({
    email: zod.string().min(3).max(100).email(),
    password: zod.string().min(5).max(100),
});

const parseDataWithSuccess = requiredBody.safeParse(req.body);

if (!parseDataWithSuccess.success) {
    return res.json({
        message: "Incorrect data format",
        error: parseDataWithSuccess.error,
    }); 
}

const email = req.body.email;
const user = await UserModel.findOne({ email: email });

if(!user){
    return response.status(400).json({ message:"Bruhh! user doesnt exist" });
}
const passwordMatch = await bcrypt.compare(req.body.password, user.password);
if(passwordMatch){
    const token=jwt.sign({id:user._id},JWT_SECRET_USER);
    
    return res.json({message:"You are logged in",token:token,first_name:user.first_name});
}
else{
    return res.status(403).json({message:"Incorrect password"});

}
})



userRouter.get('/purchases',userMiddleware,async function(req,res){
   const userId=req.userId;

   const purchases=await purchaseModel.find({userId:userId}).populate('courseId');
   res.json({
       purchases:purchases
   })
})




module.exports={
    userRouter: userRouter
}