const { check, validationResult } = require('express-validator');
const express = require('express')
const router = express.Router()
const connection = require('../utility/mysqlConn')
const mail = require('../utility/mail')
const getOTP = require('../utility/otpGen')
const md5 = require('md5')

router.get('/',function(req,res){
    try
    {
        res.render('Home')
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/signup',function(req,res){
    try
    {
        user = {name:'',password:'',email:'',gender:'',profilePic:'defaultUser.jpg'}
        error = {nameError:null, passwordError:null, emailError:null}
        res.render('Signup',{user:user,error:error,regError:null})
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/login',function(req,res){
    try
    {
        user = {
            name: null,
            password: null,
            email: null,
            gender: null,
            profilePic: null
        }

        error = {nameError:null, passwordError:null, emailError:null}

        res.render('Login',{user,error})
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/about',function(req,res){
    try
    {
        res.render('About')
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/saveUser', [
    check('userEmail','Email must be valid and Min 6, Max 30 length').trim().isEmail().isLength({ min: 6 , max: 30}),
    check('userName','Username must be of Min 3 and Max 20 length').trim().isLength({ min: 3 , max: 20}),
    check('userPassword','Password must be of Min 5 and Max 10 length').trim().isLength({ min: 5 , max: 10})
  ], (req, res) => {

    try
    {
        const errors = validationResult(req);
        
        user = {
            name: req.body.userName,
            password: req.body.userPassword,
            email: req.body.userEmail,
            gender: req.body.gender,
            profilePic:'defaultUser.jpg'
        }

        error = {nameError:null, passwordError:null, emailError:null}

        for(i = 0; i < errors.errors.length; i++)
        {
            name =  errors.errors[i].param

            if(name === 'userName')
            {
                error.nameError = errors.errors[i].msg
            }
            else if(name === 'userEmail')
            {
                error.emailError = errors.errors[i].msg
            }
            else
            {
                error.passwordError = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            res.render('Signup',{user,error,regError:null})
        }
        else
        {
            var sql = "select * from users where email = ?"
            x = [[user.email]]
    
            connection.query(sql,[x],function(err,result){
                if(err) throw err
                if(result.length == 1)
                {
                    res.render('Signup',{user,error,regError:'Email already Registered'})
                }
                else
                {
                    user.password = md5(user.password)
                    otpNumber = getOTP()
                    req.session.user = user
                    req.session.optNumber = otpNumber
                    mail.sendMail(user.email,otpNumber)
                    res.render('OtpForm',{email:user.email,alert:false})
                }
            }) 
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/OTPVerify',function(req,res){
    try
    {
        userOTP = parseInt(req.body.otpNumber)
        optNumber = req.session.optNumber

        if(userOTP === otpNumber)
        {
            var sql = "insert into users value ?"
            x = [[user.name, user.email, user.password, user.gender, user.profilePic]]
    
            connection.query(sql,[x],function(error,result){
                if(error) throw error
                if(result.affectedRows == 1)
                {
                    res.render('Alert',{
                        type:"success",
                        title:"Account Created",
                        text:"Account Verified, Please login to continue",
                        link:"login"
                    })
                }
                else
                {
                    console.log(result);
                    console.log("ERROR IN INSERTION")
                }
            }) 
        }
        else
        {
            req.session.user = null
            req.session.optNumber = null

            res.render('Alert',{
                type:"error",
                title:"Wrong OTP",
                text:"Account Not Verified, Please try again",
                link:"signup"
            })
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/resendOTP',function(req,res){
   try
   {
        var email = req.session.user.email
        otpNumber = getOTP()
        req.session.optNumber = otpNumber
        mail.sendMail(email,otpNumber)
        res.render('OtpForm',{email:email,alert:true})
   }
   catch(e)
   {
      res.redirect('/')
   }
})

router.post('/loginVerify', [
    check('userEmail','Email must be valid and Min 6, Max 30 length').trim().isEmail().isLength({ min: 6 , max: 30}),
    check('userPassword','Password must be of Min 5 and Max 10 length').trim().isLength({ min: 5 , max: 10})
  ], (req, res) => {

    try
    {
        const errors = validationResult(req);
        
        user = {
            password: req.body.userPassword,
            email: req.body.userEmail,
        }

        error = {passwordError:null, emailError:null}

        for(i = 0; i < errors.errors.length; i++)
        {
            name =  errors.errors[i].param

            if(name === 'userEmail')
            {
                error.emailError = errors.errors[i].msg
            }
            else
            {
                error.passwordError = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            res.render('Login',{user:user,error:error})
        }
        else
        {
             var sql = "select * from users where email='"+user.email+"' and password='"+md5(user.password)+"'";
             connection.query(sql,function(error,result){
                    if(error) throw error
                    if(result.length == 1)
                    {
                        user = result[0]
                        req.session.user = user
                        res.redirect('/user/home')
                    }
                    else
                    {
                        res.render('Alert',{
                            type:"error",
                            title:"Oops...",
                            text:"Invalid Username/Password",
                            link:"login"
                        })
                    }
             }) 
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/forgotPassword',function(req,res){
    try
    {
        res.render('ForgotPassword',{error:null,email:null});
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/verifyForgotPassword', [
    check('userEmail','Email must be valid and Min 6, Max 30 length').trim().isEmail().isLength({ min: 6 , max: 30})
  ], (req, res) => {

    try
    {
        const errors = validationResult(req);
        
        email = req.body.userEmail

        for(i = 0; i < errors.errors.length; i++)
        {
            name =  errors.errors[i].param

            if(name === 'userEmail')
            {
                error = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            res.render('ForgotPassword',{email,error})
        }
        else
        {
            var sql = "select * from users where email='"+email+"'";
            var newPassword = getOTP().toString()
            connection.query(sql,function(error,result){
                if(error) throw error
                if(result.length == 1)
                {
                    var newsql = "update users set password = '"+md5(newPassword)+"' where email = '"+email+"'";
                    connection.query(newsql,function(error,result){
                        if(error) throw error
                        if(result.affectedRows == 1)
                        {
                            mail.sendPassword(email,newPassword)
                          
                            res.render('Alert',{
                                type:"success",
                                title:"Forgot Password",
                                text:"New Password has been send to your email",
                                link:"login"
                            })
                        }
                        else
                        {
                            console.log(result);
                            console.log("ERROR IN FORGOT PASSWORD UPDATION")
                        }
                    }) 
                }
                else
                {
                res.render('ForgotPassword',{error:'Email not registered',email})
                }
            }) 
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

module.exports = router