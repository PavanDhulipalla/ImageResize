const functions = require('firebase-functions');
const {tmpdir}  = require('os');
const {Storage}  = require('@google-cloud/storage');
const {dirname,join}  = require('path');
const sharp         = require("sharp");
const fs            = require("fs-extra");
const gcs           = new Storage();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

exports.resizeImage = functions
                        .runWith({memory:"2GB",timeoutSeconds:120})
                        .storage
                        .object()
                        .onFinalize(handler);
//object is the actual Image File which has been loaded into Storage
async function handler(object) {
    //After the onFinalize event (Image is succefully saved) - object is passed to handler
    //Get Required details from Object
    const bucket = gcs.bucket(object.bucket); //bucket detail
    const filePath = object.name; // downloadable path
    const fileName = filePath.split("/").pop(); // file name from the path
    const bucketDir = dirname(filePath); // bucket directory
    const workingDir = join(tmpdir(),"resize") // temporary location to save processed image
    const tmpFilePath = join(workingDir,"source.png") // //temp file path

    //As we are processing Image uploaded to Storage and Saving back to Storage, we may get into loop
    //We’ll set a name like myImage@s_1920.jpg for our resized image
    if(fileName.includes('@s_') || !object.contentType.includes('image')){
        return false;
        //exit from function - The image received is already processed one!
    }

    await bucket.file(filePath).download({destination : tmpFilePath});

    //Create Different Sizes
    const sizes = [1920,720,100];

    const uploadPromises = sizes.map(
        async (size) => {
            const ext = fileName.split('.').pop(); //Getting File extension from filename
            const imageName = fileName.replace(`.${ext}`,""); // Getting File Name by replacing extension
            const newImageName = `${imageName}@s_${size}.${ext}`;
            const newImagePath = join(workingDir,newImageName);

            await sharp(tmpFilePath).resize({width:size}).toFile(newImagePath);

            return bucket.upload(newImagePath, 
                {destination:join(bucketDir,newImageName)}
            );

        }
    );

    await Promise.all(uploadPromises);
    return fs.remove(workingDir);

}


