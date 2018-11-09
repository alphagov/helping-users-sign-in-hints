const express = require('express')
const router = express.Router()

var extend = require('util')._extend,
    fs = require('fs'),
    request = require('request'),
    querystring = require('querystring'),
    marked = require('marked');
    idpRoot = '/idp/',
    idps = require("./lib/idps.json"),
    dbURL = 'http://govuk-verify-db.herokuapp.com/prototypes/stable';



var userInfo = process.env.USER_INFO;

if (userInfo){
  userInfo = JSON.parse(userInfo);
} else {
 userInfo = require(__dirname+"/lib/user.json");
}

var NotifyClient = require('notifications-node-client').NotifyClient;
    notifyClient = new NotifyClient(process.env.NOTIFYAPIKEY);

var serviceLOA = ""

var getServices = function (callback){
  console.log("get services data");

  request(dbURL, function (error, response, body) {
    if (!error && response.statusCode == 200) {

      services = JSON.parse(body);

      callback();

    } else {
      callback(error);
    }
  });

};

var getService = function(req){
  var requestId = (req.query) ? req.query.requestId : req;

  console.log("getService("+requestId+")");

  if (!services[requestId]){
    return false;
  } else {
    return services[requestId];
  }
};

function getIDPBySlug(slug) {
  for (var i = idps.length - 1; i >= 0; i--) {
    if (slug == idps[i].slug) {
      return idps[i];
    }
  };

  return false;
}

function toArray(obj){
  var array = [];

  for (var i in obj){
    array.push(obj[i]);
  }

  return array;
};

router.use(function (req, res, next) {

  // send common data to every view:
  // service, IDP root

  var requestId = req.session.data['requestId'] || "view-share-driving-licence";

  getServices(function (error) {
    if (error) {
      res.status(500).send(error);
      return;
    }

    var service = getService(requestId);

    if (!service){
      res.status(404).send("Service not found");
      return;
    }

    var viewData = {};
    viewData.formData = "";
    viewData.formQuery = "?";
    viewData.formHash = {};

    for (var name in req.query){
      var value = req.query[name];

      if (typeof value == "object") {
        for (var i in value) {
          viewData.formData += '<input type="hidden" name="'+name+'['+i+']" value="' + value[i] + '">\n';
          viewData.formQuery += name + '['+i+']' + "=" + value[i] + "&";
        }
      } else {
        viewData.formData += '<input type="hidden" name="'+name+'" value="' + value + '">\n';
        viewData.formQuery += name + "=" + value + "&";
      }

      viewData.formHash[name] = value;
    }

    if (viewData.formQuery.length>1){
      viewData.formQuery = viewData.formQuery.slice(0,-1);
    }

    viewData.requestId = requestId;
    viewData.request = request;
    viewData.idpRoot = idpRoot;
    viewData.serviceName = service.name;
    viewData.serviceLOA = service.LOA;
    viewData.serviceAcceptsLOA1 = (service.LOA == "2,1");
    viewData.usersLOAis2 = (req.query.usersLOA == "2");
    viewData.serviceNameLower = service.name[0].toLowerCase() + service.name.substring(1);
    viewData.serviceProvider = service.provider;
    viewData.serviceOtherWays = (service.otherWays) ? marked(service.otherWays) : "";
    viewData.servicewhyVerifysUsed = service.whyVerifysUsed;
    viewData.serviceStartURL = service.urls.start
    viewData.serviceCompleteURL = service.urls.end
    viewData.userInfo = userInfo;
    viewData.idpName = getIDPBySlug(req.session.data['idpChoice']).name
    viewData.idpSlug = getIDPBySlug(req.session.data['idpChoice']).slug
    viewData.idpAccountName = getIDPBySlug(req.session.data['idpChoice']).accountName
    viewData.usersLOA = req.session.data['usersLOA']
    viewData.query = req.query;

    var serviceLOA = viewData.serviceLOA

    extend(res.locals, viewData);

    next();

  });
});


// Add your routes here - above the module.exports line

module.exports = router



// Route index page
router.get('/', function (req, res) {
  res.render('index')
})


// HUB ROUTING


// Sending user to their selected signin method

router.get('/hub/signin-method', function (req, res) {

  if (req.session.data['sign_in'] == 'gateway'){
    res.redirect('/hub/gateway' + res.locals.formQuery)
  } else if (req.session.data['sign_in'] == 'verify'){

    if (req.session.data['idpChoice'] != undefined){
      res.redirect('/hub/idp-reminder' + res.locals.formQuery)
    } else {
    res.redirect('/hub/verify-signin-picker' + res.locals.formQuery)
    }
  } else {
  res.redirect('create-account');
  }
});


// Sending data to sm-signin page

router.get('/hub/journey', function (req, res) {
  var data = {};

  data.idps = idps;

  if (req.session.data['registration'] == 'false'){
    res.redirect('/hub/signin-idp-picker' + res.locals.formQuery)
  } else if (req.session.data['registration'] == 'resume'){
    res.redirect('/idp/sign-in' + res.locals.formQuery)
  } else {
    res.render('hub/about', data);
  }
});


// Sending data to the idp picker

router.get('/hub/signin-idp-picker', function (req, res) {
  var data = {};

  data.idps = idps;

  res.render('hub/signin-idp-picker', data);
});

// Sending data to sm-signin page

router.get('/hub/sm-signin', function (req, res) {
  var data = {};

  data.idps = idps;

  res.render('hub/sm-signin', data);
});


// Routing past hub questions for LOA1 services

router.get('/hub/about-choosing-a-company', function(req,res){

  if (res.locals.serviceLOA < '2'){
    res.redirect('choose-a-company' + res.locals.formQuery)
  } else {
    res.render('hub/about-choosing-a-company')
  }
})


// 'About you' questions outcomes

router.get('/hub/select-documents', function(req,res){

  if (req.session.data['non-uk-group'] == 'false'){
    res.redirect('will-not-work' + res.locals.formQuery)
  } else if ((req.session.data['non-uk-group'] == 'false')||(req.session.data['user_age'] == 'false')){
    res.redirect('might-not-work' + res.locals.formQuery)
  } else {
    res.render('hub/select-documents')
  }
})


// 'UK documents' questions outcomes

router.get('/hub/select-other-documents', function(req,res){

  if ((req.session.data['passport'] == 'true')||(req.session.data['drivingLicence'] == 'true')){
    res.redirect('select-phone' + res.locals.formQuery)
  } else {
    res.render('hub/select-other-documents')
  }
})


// Company picker page

router.get('/hub/choose-a-company', function (req, res) {

  var query = req.query;

  var available_idps = [],
      unavailable_idps = [];

  var addValidCompany = function (slugs){
    slugs = [].concat(slugs);
    slugs.forEach(function(slug){
      available_idps.push(
        getIDPBySlug(slug)
      );
    });
  }

  var addInvalidCompany = function (slugs){
    slugs = [].concat(slugs);
    slugs.forEach(function(slug){
      unavailable_idps.push(
        getIDPBySlug(slug)
      );
    });
  }

  var removeValidCompany = function (slug) {
    console.log('removeValidCompany ' + slug)
    available_idps.forEach(function(idp, i) {
      if (idp.slug == slug) {
        console.log('splice ' + i)
        available_idps.splice(i, 1);
      }
    });
  }

  var removeInvalidCompany = function (slug) {
    unavailable_idps.forEach(function(idp, i) {
      if (idp.slug == slug) {
        unavailable_idps.splice(i, 1);
      }
    });
  }

  // +++ add picker logic here +++

  if (query.passport == "true" || query.driving_licence == "true") {
    // 2 docs
    console.log("2 docs");

    var tempValid = ["experian", "post-office", "digidentity", "barclays", "secureidentity" ];
    var tempInvalid = [];

    if (query.app != "true" && query.codeType == "code-text") {
      tempValid.splice(tempValid.indexOf("secureidentity"), 1);
      tempInvalid.push("secureidentity");
    }

    if (query.landline == "true") {
      tempValid = ["experian"];
      tempInvalid = ["barclays","digidentity","post-office","secureidentity",];
    }

    addValidCompany(tempValid);
    addInvalidCompany(tempInvalid);

  } else if (query.non_uk_id == "true" && query.app == "true") {
    // 2 docs
    console.log("2 docs");

    var tempValid = ["post-office", "experian", "digidentity"];
    var tempInvalid = [];

    if (query.app != "true" && query.codeType == "code-text") {
      tempValid.splice(tempValid.indexOf("secureidentity"), 1);
      tempInvalid.push("secureidentity");
    }

    if (query.landline == "true") {
      tempValid = ["experian"];
      tempInvalid = ["barclays","digidentity","post-office","secureidentity",];
    }

    addValidCompany(tempValid);
    addInvalidCompany(tempInvalid);

  } else {

    var tempValid = ["experian", "post-office", "digidentity", "barclays", "secureidentity" ];
    var tempInvalid = [];

    addValidCompany(tempValid);
    addInvalidCompany(tempInvalid);

  }

  console.log(JSON.stringify(req.session.data['connectedIDP'], null, "  "));

  let connectedIDP = req.session.data['connectedIDP']

  // go backwards through array to remove disconnected IDPs
  for (let index = available_idps.length-1; index >=0; index--){
    let idp = available_idps[index]
    console.log(idp.slug)
    if (connectedIDP.includes(idp.slug) == false){
      console.log('deleting ' + idp.slug)
      removeValidCompany(idp.slug)
      removeInvalidCompany(idp.slug)
    }
  }

  var data = {
    "available_idps" : available_idps,
    "unavailable_idps" : unavailable_idps
  };

  console.log(JSON.stringify(data, null, "  "));

  res.render('hub/choose-a-company', data);
});



// Hub sign in journey routing

router.get('/hub/hub-sign-in', function (req, res) {

  var data = {};

  data.idps = idps;
  console.log("session: " + JSON.stringify(req.session, null, "  "))

  res.render("hub/hub-sign-in", data);
});




// IDP ROUTING
router.get('/idp/sign-up', function(req, res){


    console.log( )

res.render('idp/sign-up');

});



router.post('/idp/security-code', function(req, res){

  req.session.data['mobileNumber'] = req.body.mobileNumber

  usersPhone = req.session.data['mobileNumber']

  personalisation = {
    'code': parseInt((Math.random())*10000)
  }

  notifyClient.sendSms("5c179906-df50-44c9-b42e-f71de4c26b50", usersPhone, personalisation);

res.redirect('/idp/security-code-enter' + res.locals.formQuery);

});


router.post('/idp/pause-warning', function(req, res){

  console.log("routing")

  usersEmail = req.session.data['email']
  name = req.session.data['firstName']

  personalisation = {
    'name': name,
    'idpname': res.locals.idpName,
    'idpslug': res.locals.idpSlug,
    'idpchoice': req.session.data["idpChoice"],
  }
  console.log("personalisation " + personalisation )

  notifyClient.sendEmail("6b5da1fb-6097-440f-af56-7aa562e9da32", usersEmail, personalisation);

  console.log("email sent" )


res.redirect('/hub/verify-paused' + res.locals.formQuery);

});



// Sending data to IDP sign in page

router.get('/idp/sign-in', function (req, res) {

    var data = {};
    data.services = services
    data.idps = idps;

  res.render("idp/sign-in", data);
});


router.post('/idp/sign-in-code-send', function (req, res) {

  usersPhone = req.session.data['mobileNumber']
  code = parseInt((Math.random())*10000)

  if (usersPhone != undefined ){

    personalisation = {
      'code': code
    }
    notifyClient.sendSms("5c179906-df50-44c9-b42e-f71de4c26b50", usersPhone, personalisation);
    console.log('Message sent: ' + code)
  }

  res.redirect("security-code-enter" + res.locals.formQuery);
});



// Routing Uplift, Sign in and Registering users after sign in/up pages

router.get('/idp/journey', function (req, res) {
  if (req.session.data['signUp'] != "true"){

      res.redirect('/idp/choose-id' + res.locals.formQuery)
    } else if (req.session.data['registration'] == 'false'){

    if ((res.locals.usersLOA == '1') && (res.locals.serviceLOA == '2')){
      res.redirect('/idp/uplift-warning' + res.locals.formQuery)
    } else {
      res.redirect('/hub/third-cycle-matching' + res.locals.formQuery)
    }
  } else {
    res.render("idp/name");
  }
});



// Taking LOA 1 users past id documents inputs

router.get('/idp/choose-id', function(req,res){

  if ((res.locals.serviceLOA < '2') && (res.locals.usersLOA < '1') ){
    res.redirect('identity-test-intro' + res.locals.formQuery)
  } else {
    res.render('idp/choose-id')
  }
})


// Taking uplifting users past KBVs

router.get('/idp/identity-test-intro', function(req,res){

  if (res.locals.usersLOA > '0'){
    res.redirect('/idp/verify-success' + res.locals.formQuery)
  } else {
    res.render('idp/identity-test-intro')
  }
})


// Forcing the user to fail

router.get('/idp/verify-success', function(req,res){

  if (req.session.data['verify'] == 'false') {
    res.redirect('/idp/verify-failed' + res.locals.formQuery)
  } else {
    res.render('idp/verify-success')
  }
})


// Sending uplift users past the hub confirmation page and straight into the service

router.get('/hub/verify-success', function(req,res){

  // if ((res.locals.serviceLOA == '2') && (res.locals.usersLOA == '1') ){
  //   res.redirect(res.locals.serviceCompleteURL + res.locals.formQuery)
  // } else {
    res.render('hub/verify-success')
  // }
})


// Sending the user to third cycle matching if it's enabled

router.get('/hub/third-cycle-matching', function(req,res){

  if (req.session.data['thirdCycle'] != 'true' ){
    res.redirect('/hub/waiting-for-match' + res.locals.formQuery)
  } else {
    res.render('hub/third-cycle-matching')
  }
})


// ADMIN TOOL


// admin (refactor to separate file?)
router.get('/admin', function(req, res){
  var servicesArray = toArray(services);
  servicesArray.sort(function(a,b){
    return (a.name > b.name) ? 1:-1;
  });

  res.render('admin', {'services': servicesArray});
});

router.post('/admin', function(req, res){
  var service = {
    "name": req.body.name,
    "provider": req.body.provider,
    "otherWays": req.body.otherWays,
    "whyVerifysUsed": req.body.whyVerifysUsed,
    "urls": {
      "start" : req.body.startURL,
      "end" : req.body.endURL
    },
    "LOA": req.body.LOA,
    "slug": req.body.slug
  }

  services[req.body.slug] = service;
  var servicesJSON = JSON.stringify(services);

  var postData = { "url": dbURL,
                   "form": { "data": servicesJSON }};

  request.post(postData, function(error, response, body){
    if (!error && response.statusCode == 200) {
      // TO DO confirmation message
      res.redirect('admin');
    } else {
      res.status(500).send(error);
    }
  });

});

router.get('/admin/services/:slug', function(req,res){
  var service = getService(req.params.slug);

  // request types dropdown

  var LOAoptions = [
    {"name": "LOA2",
     "value": "2",
     "selected" : (service.LOA == "2")},
    {"name": "LOA1",
     "value": "1",
     "selected" : (service.LOA == "1")}
  ];

  res.render('admin/service', {"service": service,
                               "isEdit": true,
                               "LOAoptions":LOAoptions});
});

router.get('/admin/add-service', function(req,res){

  var viewData = {};
  var service = getService(res.locals.requestId);

  var LOAoptions = [
    {"name": "LOA2",
     "value": "2",
     "selected" : (service.LOA == "2")},
    {"name": "LOA1",
     "value": "1",
     "selected" : (service.LOA == "1")}
  ];

  res.render('admin/service', {"isEdit": false,
                               "LOAoptions":LOAoptions});
});
