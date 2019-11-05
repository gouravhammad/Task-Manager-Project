const { check, validationResult } = require('express-validator');
const connection = require('../utility/mysqlConn')
const md5 = require('md5')
const express = require('express')
const multer = require('multer')
const path = require('path')
const router = express.Router()

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images')
    },
    picName : '',
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now()+'.jpg')
      this.picName = file.fieldname + '-' + Date.now()+'.jpg';
    }
  })
   
const maxSize = 1 * 1000 * 1000

var upload = multer({ 
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {

        var filetypes = /jpeg|jpg|png/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
        if (mimetype && extname) {
          return cb(null, true);
        }
        cb({message:"Only JPEG/JPG/PNG file types are supported",code:'TYPE_ERROR'});
      } 
}).single('profilePic')


router.use('/',function(req,res,next){
    try
    {
        if(req.session.user === null)
        {
            res.render('Alert',{
                type:"error",
                title:"Login To Continue",
                text:"You have been logged out, please login",
                link:"../login"
            })
        }
        else
        {
            next()
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/logout',function(req,res){
    try
    {
        req.session.user = null;

        res.render('Alert',{
            type:"success",
            title:"Logged Out",
            text:"You have successfully logged out",
            link:"../"
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/home',function(req,res){
    try
    {
        res.render('UserHome')
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/updateProfile',function(req,res){
    try
    {
        user = {
            name: req.session.user.username,
            email: req.session.user.email,
            gender: req.session.user.gender,
            profilePic: req.session.user.profilePic
        }
        error = {nameError:null}
        res.render('UpdateProfile',{user:user,error:error})
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/updateUser', [
    check('userName','Username must be of Min 3 and Max 20 length').trim().isLength({ min: 3 , max: 20})
  ], (req, res) => {

    try
    {
        const errors = validationResult(req);
        
        user = {
            name: req.body.userName,
            email: req.body.userEmail,
            gender: req.body.gender,
            profilePic: req.body.profilePic
        }

        error = {nameError:null}

        for(i = 0; i < errors.errors.length; i++)
        {
            name =  errors.errors[i].param

            if(name === 'userName')
            {
                error.nameError = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            res.render('UpdateProfile',{user:user,error:error})
        }
        else
        {
            var sql = "update users set username = '"+user.name+"',gender = '" + user.gender + "' where email = '"+user.email+"'";
            connection.query(sql,function(error,result){

                if(error) 
                {
                    throw error
                }
                if(result.affectedRows == 1)
                {
                    req.session.user.username = user.name
                    req.session.user.gender = user.gender
                    
                    res.render('Alert',{
                        type:"success",
                        title:"Profile Updated",
                        text:"Your profile has been updated",
                        link:"home"
                    })
                }
                else
                {
                    console.log(result);
                    console.log("ERROR IN PROFILE UPDATION")
                }
            }) 
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/profile',function(req,res){
    try
    {
        res.render('Profile',{user:req.session.user})
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/changePassword',function(req,res){
    try
    {    
        values = {old:null, new:null, confirm: null}
        passError = {old:null,new:null,confirm:null}
        confirm = null
        wrong = null

        res.render('ChangePassword',{values,passError,wrong,confirm})
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/updatePassword', [
    check('oldPassword','Password must be of Min 5 and Max 10 length').trim().isLength({ min: 5 , max: 10}),
    check('newPassword','Password must be of Min 5 and Max 10 length').trim().isLength({ min: 5 , max: 10}),
    check('confirmPassword','Password must be of Min 5 and Max 10 length').trim().isLength({ min: 5 , max: 10})
  ], (req, res) => {

    try
    {
        const errors = validationResult(req);
        
        values = {
            old: req.body.oldPassword,
            new: req.body.newPassword,
            confirm: req.body.confirmPassword
        }

        passError = {old:null,new:null,confirm:null}

        for(i = 0; i < errors.errors.length; i++)
        {
            name =  errors.errors[i].param

            if(name === 'oldPassword')
            {
                passError.old = errors.errors[i].msg
            }
            else if(name === 'newPassword')
            {
                passError.new = errors.errors[i].msg
            }
            else
            {
                passError.confirm = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            res.render('ChangePassword',{passError,values,confirm:null,wrong:null})
        }
        else
        {
            password = req.session.user.password;

            if(password !== md5(values.old))
            {
                res.render('ChangePassword',{passError,values,confirm:null,wrong:'Wrong Password'})
            }
            else if(values.new !== values.confirm)
            {
                res.render('ChangePassword',{passError,values,confirm:'Password did not matched',wrong:null})
            }
            else
            {
                var sql = "update users set password = '"+md5(values.new)+"' where email = '"+req.session.user.email+"'";
                connection.query(sql,function(error,result){

                    if(error) 
                    {
                        throw error
                    }
                    if(result.affectedRows == 1)
                    {
                        req.session.user.password = values.new
                        res.render('Alert',{
                            type:"success",
                            title:"Password Changed",
                            text:"Your password has been changed",
                            link:"home"
                        }) 
                    }
                    else
                    {
                        console.log(result);
                        console.log("ERROR IN PASSWORD UPDATION")
                    }
                }) 
            }  
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/changeProfilePic',function(req,res){
    try
    {
        profilePic = req.session.user.profilePic
        res.render('ChangeProfilePic',{picError:null,profilePic})
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/updateProfilePic',function(req,res){
    try
    {
        upload(req,res,function(err) {
            if(err)
            {
                if(err.code == 'LIMIT_FILE_SIZE')
                {
                    msg = 'Upload pic upto 1 MB'
                }
                else
                {
                    msg = err.message
                }

                profilePic = req.session.user.profilePic
                res.render('ChangeProfilePic',{picError:msg,profilePic})
            }
            else
            {
                req.session.user.profilePic = storage.picName

                var sql = "update users set profilePic = '"+storage.picName+"' where email = '"+req.session.user.email+"'";
                    connection.query(sql,function(error,result){

                        if(error) 
                        {
                            throw error
                        }
                        if(result.affectedRows == 1)
                        { 
                            res.render('Alert',{
                                type:"success",
                                title:"Profile Pic Updated",
                                text:"Your profile picture has been updated",
                                link:"home"
                            })
                        }
                        else
                        {
                            console.log(result);
                            console.log("ERROR IN PROFILE PIC UPDATION")
                        }
                    }) 
            }
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/addTask',function(req,res){
    try
    {
        task = {
            email: null,
            title: null,
            status: null,
            description: null,
            dateCreated : null
        }

        error = {title:null, description:null}
        res.render('AddTask',{task,error,regError:null})
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/saveAddTask', [
    check('title','Title must be of Min 5 and Max 40 length').trim().isLength({ min: 5 , max: 40}),
    check('description','Description must be of Min 5 and Max 100 length').trim().isLength({ min: 5 , max: 100}),
  ], (req, res) => {

    try
    {
        const errors = validationResult(req);

        var date = new Date();
        date = date.toISOString().split('T')[0] + ' '+date.toTimeString().split(' ')[0]
        
        task = {
            email: req.session.user.email,
            title: req.body.title,
            status: 'false',
            description: req.body.description,
            dateCreated : date
        }

        error = {title:null, description:null}

        for(i = 0; i < errors.errors.length; i++)
        {
            name =  errors.errors[i].param

            if(name === 'title')
            {
                error.title = errors.errors[i].msg
            }
            else
            {
                error.description = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            res.render('AddTask',{task,error,regError:null})
        }
        else
        {
            var sql = "select * from tasks where email='"+task.email+"' and title='"+task.title+"'";
            connection.query(sql,function(err,result){
                if(err) throw err
                if(result.length == 1)
                {
                    res.render('AddTask',{task,error,regError:'Title already exists'})
                }
                else
                {
                    var sql = "insert into tasks value ?"
                    x = [[task.email, task.title, task.status, task.description,task.dateCreated]]
            
                    connection.query(sql,[x],function(error,result){
                        if(error) throw error
                        if(result.affectedRows == 1)
                        {
                            res.render('Alert',{
                                type:"success",
                                title:"Task Added",
                                text:"This task has been added",
                                link:"home"
                            }) 
                        }
                        else
                        {
                            console.log(result);
                            console.log("ERROR IN TASK ADDITION")
                        }
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

router.get('/allTask',function(req,res){
    try
    {
        var sql = "select * from tasks where email='"+req.session.user.email+"' order by dateCreated DESC";
        connection.query(sql,function(error,result){
            if(error) throw error
            if(result.length >= 1)
            {
                res.render('AllTask',{data:result})
            }
            else
            {
                res.render('AllTaskEmpty',{error:'No Task Added'})
            }
        }) 
    }
    catch(e)
    {
        console.log(e)
        res.redirect('/')
    }
})

router.get('/manageTask',function(req,res){
    try
    {
        var sql = "select * from tasks where email='"+req.session.user.email+"' and status='false' order by dateCreated DESC";
        connection.query(sql,function(error,result){
            if(error) throw error
            if(result.length >= 1)
            {
                res.render('ManageTask',{data:result})
            }
            else
            {
                res.render('ManageTaskEmpty',{error:'Add Task to Manage it'})
            }
        }) 
    }
    catch(e)
    {
        console.log(e)
        res.redirect('/')
    }
})

router.get('/removeTaskConfirmation',function(req,res){
    try
    {
        title = req.query.title;
        res.render('RemoveTaskConfirmation',{title})
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/removeTask',function(req,res){
    try
    {
        title = req.query.title;

        var sql = "delete from tasks where email='"+req.session.user.email+"' and title='"+title+"'";
        connection.query(sql,function(error,result){
            if(error) throw error
            if(result.affectedRows == 1)
            {
                res.render('Alert',{
                    type:"error",
                    title:"Task Removed",
                    text:"This task has been removed",
                    link:"home"
                })
            }
            else
            {
                res.send("ERROR IN TASK DELETION")
            }
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/removeAllTaskConfirmation',function(req,res){
    try
    {
        res.render('RemoveAllTaskConfirmation')
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/removeAllTask',function(req,res){
    try
    {
        var sql = "delete from tasks where email='"+req.session.user.email+"' and status='false'";
        connection.query(sql,function(error,result){
            if(error) throw error
            if(result.affectedRows >= 1)
            {
                res.render('Alert',{
                    type:"error",
                    title:"All Task Removed",
                    text:"Your all tasks has been removed",
                    link:"home"
                })
            }
            else
            {
                res.send("ERROR IN ALL TASK DELETION")
            }
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/changeTaskStatusConfirmation',function(req,res){
    try
    {
        title = req.query.title;
        res.render('ChangeTaskStatusConfirmation',{title})
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/changeTaskStatus',function(req,res){
    try
    {
        title = req.query.title;

        var sql = "update tasks set status='true' where title='"+title+"' and email='"+req.session.user.email+"'";
        connection.query(sql,function(error,result){
            if(error) throw error
            if(result.affectedRows == 1)
            {
                res.render('Alert',{
                    type:"success",
                    title:"Task Completed",
                    text:"This task is marked as complete",
                    link:"home"
                })
            }
            else
            {
                res.send("ERROR IN TASK STATUS UPDATION")
            }
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/updateTask',function(req,res){
    try
    {
        title = req.query.title;

        var sql = "select * from tasks where title='"+title+"' and email='"+req.session.user.email+"'";
        connection.query(sql,function(error,result){
            if(error) throw error
            if(result.length == 1)
            {
                task = result[0]
                error = {title:null, description:null,reg:null}
                original = result[0]

                res.render('UpdateTask',{error,task,original})
            }
            else
            {
                res.send("ERROR IN TASK UPDATION")
            }
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/saveAddTaskChanges', [
    check('title','Title must be of Min 5 and Max 40 length').trim().isLength({ min: 5 , max: 40}),
    check('description','Description must be of Min 5 and Max 100 length').trim().isLength({ min: 5 , max: 100}),
  ], (req, res) => {

    try
    {
        const errors = validationResult(req);

        var date = new Date();
        date = date.toISOString().split('T')[0] + ' '+date.toTimeString().split(' ')[0]
        
        task = {
            email: req.session.user.email,
            title: req.body.title,
            status: req.body.originalStatus,
            description: req.body.description,
            dateCreated : date
        }

        original = {
            title : req.body.originalTitle,
            status : req.body.originalStatus,
            date : req.body.originalDate
        }

        error = {title:null, description:null, reg:null}

        for(i = 0; i < errors.errors.length; i++)
        {
            name =  errors.errors[i].param

            if(name === 'title')
            {
                error.title = errors.errors[i].msg
            }
            else
            {
                error.description = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            res.render('UpdateTask',{error,task,original})
        }
        else
        {
            var sql = "select * from tasks where email='"+task.email+"' and title='"+task.title+"'";
            connection.query(sql,function(err,result){
                if(err) throw err
                if(result.length == 1)
                {
                    error.reg = 'Title already exists, Provide a new Title'
                    res.render('UpdateTask',{error,task,original})
                }
                else
                {
                    var sql = "insert into tasks value ?"
                    x = [[task.email, task.title, task.status, task.description,task.dateCreated]]
            
                    connection.query(sql,[x],function(error,result){
                        if(error) throw error
                        if(result.affectedRows == 1)
                        {
                            var sql = "delete from tasks where email='"+req.session.user.email+"' and title='"+original.title+"'";
                            connection.query(sql,function(error,result){
                                if(error) throw error
                                if(result.affectedRows == 1)
                                {
                                    res.render('Alert',{
                                        type:"success",
                                        title:"Task Updated",
                                        text:"This task has been updated",
                                        link:"home"
                                    })
                                }
                                else
                                {
                                    res.send("ERROR IN TASK DELETION")
                                }
                            }) 
                        }
                        else
                        {
                            console.log(result);
                            console.log("ERROR IN TASK UPDATION")
                        }
                    }) 
                }
            }) 
        }
    }
    catch(e)
    {
        console.log(e)
        res.redirect('/')
    }
})

router.get('/logoutConfirmation',function(req,res){
    try
    {
        res.render('LogoutConfirmation')
    }
    catch(e)
    {
        res.redirect('/')
    }
})

module.exports = router