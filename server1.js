const { static } = require("express"); // very important to upload files
var express = require("express");
const sessions = require('express-session');
var app = express();
var path = require("path");
var fileup = require("express-fileupload");
var nodemailer = require('nodemailer');

// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;

// Using session middleware

app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false,
    
}));

// Variable to maintain session

var session;
app.use(express.static("public"));//to serve css and js files to client....
app.use(fileup());
app.use(express.urlencoded({ extended: true }));//to convert Binary to JSON Object

var dbcon=require('./dbConnection'); // Importing dbcon module
const port=3004;


// -------------------------App Listens On-------------------------------
app.listen(port, function () {

    console.log(`Server Started at port : ${port}`);
    
})





// -------------Route 1 : get home(to Serve Landing Page)-------------------------------------

app.get("/home", function (req, resp) {
    
    resp.sendFile(__dirname + "/public/index.html");

})

// ------------------User SignUp On Index Page-----------------------------------

app.post("/signup", function (req, resp) {
    
    var {email,password,type}=req.body;

    var data=[email,password,type];
   

    dbcon.query("insert into users values(?,?,?,current_date())",data,(err)=>{

        if(err)
          resp.send(err);
        else
          resp.send("Record Saved Successfully");

    })

    

})


// -------------------Check User Type To propogate to specific Dashboard (AJAX)-------------------------

app.get("/chko-user", function (req, resp) {

    
        dbcon.query("select type from users where email=?", [req.query.thisuser], function (err, result) {


            if (err)
                resp.send(err.message);
            else {
    
                session=req.session;
                session.userid=req.query.thisuser;
                console.log(req.session);
    
                resp.send(result);
            }
    
    
        })
    

    
})

//-----------------Route : To Save Client Profile--------------------------------------
app.post("/client-signup", function (req, resp) {

    console.log(req.files);
 
     if (req.files == null) {
         req.body.picname = "user.png";
     }
     else {
         req.body.picname = req.files.ppic.name;
         console.log(req.body.picname);
         var uploadsFolder = path.join(path.resolve(), "public", "upload", req.files.ppic.name);
         console.log(uploadsFolder);
         req.files.ppic.mv(uploadsFolder);
 
     }
 
     var curd=new Date();
     var dos=curd.getFullYear()+"-"+(curd.getMonth()+1)+"-"+curd.getDate();
     var tos=curd.getHours()+":"+curd.getMinutes()+":"+curd.getSeconds();
     req.body.tos=tos;
     req.body.dos=dos;
 
 
     var data = [req.body.email, req.body.txtname, req.body.txtaddress, req.body.txtcity, req.files.ppic.name
         , req.body.txtno,req.body.dos,req.body.tos];
     dbcon.query("insert into client values(?,?,?,?,?,?,?,?)", data, function (err, result) {
         if (err)
             resp.send(err.message);
         else
             resp.send(result.affectedRows + "Record Saved");
 
     })
 
     
 })


//     -----------------Route : To Update Client Profile---------------------------------------

app.post("/update", (req, resp) => {
    console.log(req.files);
    var files = "";
    if (req.files == null) {
        files = req.body.jasoos;

    }
    else {
        req.body.picname = req.files.ppic.name;
        var fileupload = path.join(path.resolve(), "public", "upload", req.files.ppic.name);
        req.files.ppic.mv(fileupload);
        files = req.files.ppic.name;

    }
    
    var data = [req.body.txtname, req.body.txtaddress, req.body.txtcity, files, req.body.txtno, req.body.email];
    dbcon.query("update client set name=?,address=?,city=?,picname=?,contact=? where email=?", data, function (err, result) {
        if (err)
            resp.send(err.message);
        else
            resp.send(result.affectedRows + "Record Updated");

    })
})

// ---------------Route : to check existence of client------------------------------------

app.get("/chk-user-in-table", function (req, resp) {
    
    session=req.session;
    if(session.userid)
    {
        dbcon.query("select * from client where email=?", [req.query.thisuser], function (err, result) {
            if (err)
                resp.send(err.message);
            else
                resp.send(result);
        })
    }
    else{
        resp.status(403).send({
            message: 'Access Forbidden'
         });
    }

    
})

//----------------------------------------------------Client-panel---------------------------------------------------------------------------------

// --------------Route : To fetch Client Table At Admin Dashboard-------------------------
app.get("/fetch-client", function (req, resp) {

    session=req.session;
    if(session.userid)
    {
        dbcon.query("select * from client", function (err, result) {
            if (err)
                resp.send(err.message);
            else {
    
                resp.send(result);
            }
    
    
        })
    }
    else{

        resp.status(403).send({
            message: 'Access Forbidden'
         });

    }
})

// -----------Route : To delete a client at Admin Dashboard------------------------
app.get("/user-del", function (req, resp) {

    session=req.session;
    if(session.userid){

        var data = [req.query.uidx];
        dbcon.query("delete from client where email=?", data, function (err, res) {
            if (err)
                resp.send(err.message);
            else
                resp.send(res.affectedRows + "Record Deleted");
        })

    }
    else{
        resp.status(403).send({
            message: 'Access Forbidden'
         });
    }
   
})

// -----------------------------End Of Client Panel Routes---------------------------------



//---------------------------------END ----------------------------------------------------------------------------------



//-------------------------------VENDOR PROFILE URL------------------------------------------------------------------------

// ------------------Route : Vendor Profile Save----------------------

app.post("/vendor-profile-save", function (req, resp) {
    
    console.log(req.files);
    if (req.files == null) {
        req.body.filename = "user.png";
    }
    else {
        req.body.filename = req.files.upfile.name;
        var fileloade = path.join(path.resolve(), "public", "proofupload", req.files.upfile.name);
        req.files.upfile.mv(fileloade);

    }
    // resp.send(req.body);

    var data = [req.body.txtmail, req.body.txtnames, req.body.txtnumber, req.body.txtfirm, req.body.txtest, req.body.txtadhaar, req.body.txtservice, req.body.txtserve, req.body.txtinfo, req.files.upfile.name, req.body.loc];
    dbcon.query("insert into vendor values(?,?,?,?,?,?,?,?,?,?,?)", data, function (err, result) {
        if (err)
            resp.send(err.message);
        else
            resp.send(result.affectedRows + "Record Saved");
    })


})

// ----------------Route : Vendor Profile Update------------------------------------------------
app.post("/vendor-profile-update", function (req, resp) {
    var filo = "";
    if (req.files == null) {
        filo = req.body.jasoos;
    }
    else {
        req.body.filename = req.files.upfile.name;
        var fileloade = path.join(path.resolve(), "public", "proofupload", req.files.upfile.name);
        req.files.upfile.mv(fileloade);
        filo = req.files.upfile.name;

    }
    // resp.send(req.files.upfile.name);
    var data = [req.body.txtnames, req.body.txtnumber, req.body.txtfirm, req.body.txtest, req.body.txtadhaar, req.body.txtservice, req.body.txtserve, req.body.txtinfo, filo, req.body.loc, req.body.txtmail];
    dbcon.query("update vendor set name=?,contact=?,firm=?,estd=?,adhaar_no=?,service=?,selected_service=?,other_info=?,id_proof=?,city=? where email=?", data, function (err, result) {
        if (err) {
            resp.send(err.message);

        }
        else
            resp.send(result.affectedRows + "Record Updated");

    })
})


// ----------------------Vendor Panel Routes-----------------------------------------------------

// -------------------Route : to fetch Vendor table at Admin Dashboard------------------------------

app.get("/fetch-user", function (req, resp) {

    session=req.session;
    if(session.userid)
    {
        dbcon.query("select * from vendor", function (err, result) {
            if (err)
                resp.send(err.message);
            else {
    
                resp.send(result);
            }
        })
    }
    

    else{
        resp.status(403).send({
            message: 'Access Forbidden'
         });
    }
})

// -------------------Route : to delete Vendor At Admin Dashboard-----------------------------------------


app.get("/user-delete", function (req, resp) {

    session=req.session;
    if(session.userid){

        dbcon.query("delete from vendor where emailid=?", [req.query.uidm], function (err, res) {
            if (err)
                resp.send(err.message);
            else
                resp.send(res.affectedRows + "Record Deleted");
        })

    }
    

    else{
        resp.status(403).send({
            message: 'Access Forbidden'
         });
    }
})

// ---------------------End Of Vendor Panel Routes----------------------------------------------

//------------------------------------------------end-------------------------------------------------------------------

app.post("/signup-1", function (req, resp) {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'pushkargoyal9417@gmail.com',
            pass: 'pugapa3338'
        }
    });

    var mailOptions = {
        from: 'pushkargoyal9417@gmail.com',
        to: req.body.email,
        subject: 'Welcome To We Organize',
        text: 'Thanks for signing up!  WELCOME USER! Your email : '+req.body.email+' Password : '+req.body.password
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    // resp.send(req.body);
    var data = [req.body.mail, req.body.pass, req.body.type];
    dbcon.query("insert into users values(?,?,?)", data, function (err, result) {
        if (err) {
            resp.send(err.message);

        }
        else {
            resp.send(result.affectedRows + "Record Saved Successfully");
        }
    })
})



app.get("/chou-user-in-table", function (req, resp) {
    
   if(session.userid)
   {
    dbcon.query("select * from vendor where email=?", [req.query.thisusers], function (err, result) {

        if (err)
            resp.send(err.message);
        else {

            resp.send(result);
        }


    })
   }

   else
   {
    resp.status(403).send({
        message: 'Access Forbidden'
     });
   }

    

})



// ---------------Route : Admin DashBoard-------------------------------------------------

app.get("/admin/:id", function (req, resp) {
    
    if(req.params.id==="Wo2315")
    {
        resp.sendFile(__dirname + "/public/dash-admin.html");
    }
    else{

        resp.status(403).send({
            message: 'Access Forbidden'
         });

    }

})

// -------------------------------------------------------------------------------------------

// -----------------------Route : To fetch Cities for Planning Function------------------------------

app.get("/fetch-cities", function (req, resp) {

    session=req.session;
    if(session.userid)
    {
        dbcon.query("select distinct city from vendor", function (err, result) {
            if (err)
                resp.send(err.message);
            else {
                resp.send(result);
            }
        })
    }
    
    else
   {
    resp.status(403).send({
        message: 'Access Forbidden'
     });
   }

})

//-----------------------Route : To fetch selected services from vendor table---------------------

app.get("/take-selected-services", function (req, resp) {

    session=req.session;
    if(session.userid)
    {
        dbcon.query("select selected_service from vendor", function (err, result) {
            if (err)
                resp.send(err.message);
            else {
    
                resp.send(result);
            }
        })
    }
    
    else
    {
      resp.status(403).send({
        message: 'Access Forbidden'
      });
    }

})

// -----------------Route : To Fetch Vendor Using City And Service-------------------------
app.get("/pick-vendor", function (req, resp) {

    session=req.session;
    if(session.userid)
    {
        var data = [req.query.thiscity, "%" + req.query.thisserv + "%"];
        dbcon.query("select * from vendor where city=? and selected_service like ?", data, function (err, result) {
            if (err)
                resp.send(err.message);
            else {
    
                resp.send(result);
            }
        })
    }
    

    else
    {
      resp.status(403).send({
        message: 'Access Forbidden'
      });
    }


})

app.get('/vendor-Detail',(req,res)=>{

    session=req.session;
    if(session.userid)
    {
        dbcon.query("select * from vendor where email=?",[req.query.thisid],function(err,result)
        {
            if(err)
            {
                console.log(err);
            }
            else{
                res.send(result);
            }
        })
    }
    else{

        res.status(403).send({
            message: 'Access Forbidden'
          });

    }

})



// ---------------------------------------COMMON ROUTES---------------------------------------

// -------------Common Route for Both Client And Vendor To Find User Password Through Email----------------------------

app.get("/Find-user", function (req, resp) {

    session=req.session;

    if(session.userid)
    {
        dbcon.query("select password from users where email=?", [req.query.thisone], function (err, result) {
            if (err)
                resp.send(err.message);
            else {
    
                resp.send(result);
            }
    
    
        })
    }

    else{
        resp.status(403).send({
            message: 'Access Forbidden'
          });
    }
    
})

// ---------Common Route To Both Client And Vendor To Update Password-----------------

app.post("/update-password",function(req,resp){
    var data=[req.body.pass,req.body.mail];
    dbcon.query("update users set password=? where email=?",data,function(err,result){
        if (err)
            resp.send(err.message);
        else {

            resp.send("Password Updated Successfully");
        }


    })
})

//--------Common Route To Both Client And Vendor To Log Out----------------------
app.get('/logout',(req,res)=>{

    req.session.destroy((err)=>{
        if(err)
          console.error(err);
        else
          res.send("done");
    });
     
      
})
