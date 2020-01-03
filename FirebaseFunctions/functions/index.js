const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

exports.addPerson = functions.https.onCall((data,context)=>{
    let fName = data.firstName;
    let lName = data.lastName;

    return {
        firstName : fName,
        lastName : lName,
        name: fName + " " + lName
    };
});


