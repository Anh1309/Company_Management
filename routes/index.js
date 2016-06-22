var express = require('express');
var router = express.Router();
//var flash = require('req-flash');
var mongoose = require('mongoose');
mongoose.connect('localhost:27017/test');
var Schema = mongoose.Schema;

var userDataSchema = new Schema({
    username: {type: String, required: true},
    password: {type: String, required: true}
},{collection: 'user'});
var UserData = mongoose.model('UserData', userDataSchema);

var departmentDataSchema = new Schema({
    name: {type: String, required: true},
    description: {type: String, required: false}
},{collection: 'department'});
var DepartmentData = mongoose.model('DepartmentData', departmentDataSchema);

var employeeDataSchema = new Schema({
    depart_id: {type: Schema.Types.ObjectId, ref: 'DepartmentData'},
    employeename: {type: String, required: true},
    gender: {type: String, required: true},
    email: {type: String, required: true},
    position: {type: String, required: true}
},{collection: 'employee'});
var EmployeeData = mongoose.model('EmployeeData', employeeDataSchema);

/* GET home page. */
router.get('/showLogin', function(req, res){
    if(typeof req.session.login !== "undefined"){
        res.redirect("/home");
    }
    res.render('login',{
        title: "Login",
        messages: req.flash()
    });
});

router.post('/login', function(req, res){
    var email = req.body.email;
    var password = req.body.password;
    req.check('email', 'Please enter the email').notEmpty();
    req.check('password', 'Please enter the password').notEmpty();
    var errors = req.validationErrors();
    if (errors){
        req.flash('errors', errors);
        res.redirect('/showLogin');
        return;
    }
    else{
        UserData.findOne({
            email: email,
            password: password
        }, function(err, docs){
            if (docs !== null){
                var login = {
                    email: email,
                    password: password
                };
                req.session.login = login;
                res.redirect('/home');
            }
            else{
                res.redirect('/showLogin');
            }
        });
    }
});

router.post('/logout', function(req, res){
    req.session.destroy(function(){
        res.redirect('/home');
    });
});

router.get('/home', function(req,res){
    res.render('home',{
        login:req.session.login,
        title: "Home"
    });
});

router.get('/employee', function(req, res, next) {
    if (typeof req.session.login === 'undefined'){
        req.flash('errors', [{ param: 'user-pass', msg: 'You have not login!', value: '' }]);
        res.redirect('/showLogin');
    }
    else{
        EmployeeData.find({})
                .populate('depart_id')
                .exec(function (err, docs){
                    res.render('employee',{
                        employeelist: docs,
                        title: "Employee management",
                        messages: req.flash(),
                        login: req.session.login
                    });

                });
    }
});

router.get('/showAddEmployee', function(req,res){
    if(typeof req.session.login === "undefined"){
        res.redirect("/showLogin");
    }
    else{
        DepartmentData.find({}, function(err, docs){
            res.render('addEmployee',{
                title: "Add employee",
                departmentlist: docs,
                login:req.session.login,
                messages:req.flash()
            });
        });
    }
});
router.post('/addEmployee', function(req, res, next) {
    if(typeof req.session.login === "undefined"){
        //req.flash('errors', [{ param: 'user-pass', msg: 'You have not login!', value: '' }]);
        res.redirect("/showLogin");
    }
    else{
        var employeename = req.body.employeename;
        var email = req.body.email;
        var gender = req.body.gender;
        var position = req.body.position;
        var did =  mongoose.mongo.ObjectId(req.body.department);
        req.check('employeename', 'Please enter the name').notEmpty();
        req.check('email', 'Please enter the email').notEmpty();
        var errors = req.validationErrors();
        if (errors){
            req.flash('errors', errors);
            res.redirect('/showAddEmployee');
            return;
        }
        else{
            EmployeeData.collection.insert({
                employeename: employeename, 
                email: email,
                gender: gender,
                position: position,
                depart_id: did
            },function(err, docs){
                res.redirect('/employee');
            });
        }
    }
});

router.get('/deleteEmployee/:id', function(req, res){
    if(typeof req.session.login === "undefined"){
        res.redirect("/showLogin");
    }
    else{
        EmployeeData.find({
            _id: req.params.id
        }).remove(function(err, docs){
            res.redirect('/employee');
        });

    }
});

router.get('/showEditEmployee/:id', function(req, res){
    if(typeof req.session.login === "undefined"){
        res.redirect("/showLogin");
    }
    else{
        EmployeeData.find({
            _id: req.params.id
        }, function(err, docs){
            DepartmentData.find({}, function(err, list){
                res.render('editEmployee',{
                    title: "Edit employee",
                    employee: docs[0],
                    departmentlist: list,
                    login: req.session.login,
                    messages: req.flash()
                });
            });
    });
}
});
router.post('/editEmployee/:id', function(req, res){
    if(typeof req.session.login === "undefined"){
        res.redirect("/showLogin");
    }
    else{
        var employeename = req.body.employeename;
        var email = req.body.email;
        var gender = req.body.gender;
        var position = req.body.position;
        var department = req.body.department;
        req.check('employeename', 'Please enter the name').notEmpty();
        req.check('email', 'Please enter the email').notEmpty();
        var errors = req.validationErrors();
        if (errors){
            req.flash('errors', errors);
            res.redirect('/showEditEmployee/'+req.params.id);
            return;
        }
        else{
            EmployeeData.findOneAndUpdate({
                _id: req.params.id
            },{
                employeename: employeename,
                email: email,
                gender: gender,
                position:position,
                department:department
            },{
                multi: false,
                upsert: false
            }, function(err, docs){
                res.redirect('/employee');
            });
        }
    }
});

router.post('/searchEmployee', function(req, res, next){
    if (typeof req.session.login === 'undefined'){
        res.redirect('/showLogin');
    }
    else{
        var employeename = req.body.searchEmployee;
        EmployeeData.find({
            employeename: {'$regex': employeename}
        }, function(err, docs){
            res.render('employee',{
                title: "Search employee",
                employeelist: docs,
                login: req.session.login
            });
        });
    }
});

router.get('/viewEmployee/:id', function(req, res){
    if(typeof req.session.login === "undefined"){
        res.redirect("/showLogin");
    }
    else{
        EmployeeData.find({
            _id: req.params.id
        })
                .populate('depart_id')
                .exec(function(err, docs){
            res.render('viewEmployee',{
                title: "View employee",
                employee: docs[0],
                login: req.session.login
            });
        });
    }
});

router.post('/home', function(req, res){
    res.render('home');
});

router.get('/showCreate', function(req, res){
    res.render('create',{
        title: "Create account",
        messages: req.flash()
    });
});

router.post('/create', function(req, res){
    var name = req.body.name;
    var birthday = req.body.birthday;
    var email = req.body.email;
    var password = req.body.password;
    var confirmPass = req.body.confirmPass;
    req.check('name', 'Please enter the name').notEmpty();
    req.check('birthday', 'Please enter the birthday').notEmpty();
    req.check('email', 'Please enter the email').notEmpty();
    req.check('password', 'Please enter the password').notEmpty();
    req.check('confirmPass', 'Please confirm the password').notEmpty();
    req.check('confirmPass', 'Password confirm invalid').equals(password);
    req.check('password', 'Password must be 4-20 characters').isLength({min: 4, max: 20});
    //req.check('email', 'This email is exists').
    var errors = req.validationErrors();
    if (errors){
        req.flash('errors', errors);
        res.redirect('/showCreate');
        return;
    }else{
        UserData.find({
            email: email
        }, function(err, docs){
            if (docs.length === 0){
                UserData.collection.insert({
                    name: name,
                    birthday: birthday,
                    email: email,
                    password: password,
                    confirmPass: confirmPass
                }, function(err, docs){
                    res.redirect('/home');
                });
            }
            else{
                res.redirect('/showCreate');
            }
        });
    }   
});

router.get('/department', function(req, res){
    if(typeof req.session.login === "undefined"){
        res.redirect("/showLogin");
    }
    else{
        DepartmentData.find({}, function(err, docs){
            res.render('department',{
                title: "Department management",
                departmentlist: docs,
                login: req.session.login
            });
        });
    }
});

router.get('/showAddDepartment', function(req, res){
    if(typeof req.session.login === "undefined"){
        res.redirect("/showLogin");
    }
    else{
        res.render('addDepartment',{
            title: "Add department",
            login:req.session.login,
            messages: req.flash()
        });
    }
});

router.post('/addDepartment', function(req, res, next){
    if(typeof req.session.login === "undefined"){
        res.redirect("/showLogin");
    }
    else{
        var name = req.body.name;
        var description = req.body.description;
        req.check('name', 'Please enter the name').notEmpty();
        var errors = req.validationErrors();
        if (errors){
            req.flash('errors', errors);
            res.redirect('/showAddDepartment');
            return;
        }
        else{
            DepartmentData.collection.insert({
                name: name,
                description: description
            }, function(err, docs){
                res.redirect('/department');
            });
        }
    }
});

router.get('/deleteDepartment/:id', function(req, res){
    if(typeof req.session.login === "undefined"){
        res.redirect("/showLogin");
    }
    else{
        DepartmentData.find({
            _id: req.params.id
        }).remove(function(err, docs){
            res.redirect('/department');
        });
    }
});

router.get('/showEditDepartment/:id', function(req, res){
    if(typeof req.session.login === "undefined"){
        res.redirect("/showLogin");
    }
    else{
        DepartmentData.find({
            _id: req.params.id
        }, function(err, docs){
            res.render('editDepartment',{
                title: "Edit department",
                department: docs[0],
                login: req.session.login,
                messages: req.flash()
            });
        });
    }
});
router.post('/editDepartment/:id', function(req, res){
    if(typeof req.session.login === "undefined"){
        res.redirect("/showLogin");
    }
    else{
        var name = req.body.name;
        var description = req.body.description;
        req.check('name', 'Please enter the name').notEmpty();
        var errors = req.validationErrors();
        if (errors){
            req.flash('errors', errors);
            res.redirect('/showEditDepartment/'+req.params.id);
            return;
        }
        DepartmentData.findOneAndUpdate({
            _id: req.params.id
        },{
            name: name,
            description: description
        },{
            multi: false,
            upsert: false
        }, function(err, docs){
            res.redirect('/department');
        });
    }
});

router.post('/searchDepartment', function(req, res, next){
    if (typeof req.session.login === "undefined"){
        res.redirect("/showLogin");
    }
    else{
        var departmentname = req.body.searchDepartment;
        DepartmentData.find({
            name: {'$regex': departmentname}
        }, function(err, docs){
            res.render('department',{
                title: "Search department",
                departmentlist: docs,
                login: req.session.login
            });
        });
    }
});

router.get('/viewDepartment/:id', function(req, res){
    if(typeof req.session.login === "undefined"){
        res.redirect("/showLogin");
    }
    else{
        DepartmentData.find({
            _id: req.params.id
        }, function(err, docs){
            EmployeeData.find({
                depart_id: docs[0]._id
            }, function(err, list){
                res.render('viewDepartment',{
                    title: "View department",
                    employeelist: list,
                    department: docs[0],
                    login: req.session.login
                });
            });
        });
    }
});

router.get('/user', function(req, res){
    if (typeof req.session.login === "undefined"){
        res.redirect('/showLogin');
    }
    else{
        var login = req.session.login;
        UserData.findOne({
            _id: req.params.id
        }, function(err, docs){
            res.render('user',{
                login: req.session.login,
                title: "Account"
            });
        });
    }
});

router.get('/showChangePass', function(req, res){
    if (typeof req.session.login === "undefined"){
        res.redirect('/showLogin');
    }
    else{
        res.render('showChangePass',{
            login: req.session.login,
            title: "Account",
            messages: req.flash()
        });
    }
});

router.post('/changePass', function(req, res){
    if (typeof req.session.login === "undefined"){
        res.redirect('/showLogin');
    }
    else{
        var newPass = req.body.newPass;
        var confirmPass = req.body.confirmPass; 
        req.check('newPass', 'Please enter the new password').notEmpty();
        req.check('confirmPass', 'Please confirm the password').notEmpty();
        req.check('confirmPass', 'Password confirm invalid').equals(newPass);
        req.check('newPass', 'Password must be 4-20 characters').isLength({min: 4, max: 20});
        var errors = req.validationErrors();
        //UserData.find({}, function(err, docs){
            //if (password)
        if (errors){
            req.flash('errors', errors);
            res.redirect('/showChangePass');
        }
        else{
            UserData.findOneAndUpdate({},{
                password: newPass
            },{
                multi: false,
                upsert: false
            }, function(err, docs){
                res.redirect('/user');
            });
        }

    }
});
//
module.exports = router;

