const request = require('request')
const mongoose = require('mongoose')
const fs = require('fs')
require('dotenv').config();


/* Start Mongoose */
connectMongoose = async () => {

    await mongoose.connect('mongodb://localhost:27017/domaincrawler', {
        authSource:  "admin",
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        useNewUrlParser: true,
        useUnifiedTopology: true,
//        useCreateIndex: true,
//       useFindAndModify: false
    }).then(async () => {
        console.log("Connected to local currencyup database")
        process_data()
    }).catch(err => {
        console.log('Error connecting with local database.Exiting', err)
    })
}

connectMongoose()


let id = 0

const process_data = async () => {

    const source = fs.createReadStream("../massoutput.json", "utf8")

    source.on('data', (chunk) => {
        id++

        if(id < 5) {
            console.log("line",id, typeof chunk, chunk.length)  
        }
    });
    source.on('end', function() {
        console.log("end");
    });
    source.on('error', function(err) {
        console.log("error" + err);
    });
}
