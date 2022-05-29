const request = require('request')
const mongoose = require('mongoose')
const fs = require('fs')
const exec = require('child_process').exec
const execSync = require('child_process').execSync


const {Schema}  = mongoose

require('dotenv').config();


let DomainDB = null
let IpDB = null


function ValidateIPaddress(str){
  // Regular expression to check if string is a IP address
  const regexExp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gi;

  return regexExp.test(str);
}


/* Start Mongoose */
connectMongoose = async () => {

    /*
    try {
        db.users.find().forEach()

        const output = execSync('dig +short any google.com', { encoding: 'utf-8' }); // the default is 'buffer'
        //const output = execSync('nslookup -type=NS earth.google.com', { encoding: 'utf-8' }); // the default is 'buffer'
        console.log('Output was:\n', output);
    } catch (e) {
        console.log(e)
    }*/

    await mongoose.connect('mongodb://localhost:27017/domaincrawler', {
        authSource:  "admin",
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        useNewUrlParser: true,
        useUnifiedTopology: true,
//        useCreateIndex: true,
//       useFindAndModify: false
    }).then( async (db) => {
        console.log("Connected to local currencyup database")

        await setupMongoose()

        const users = await DomainDB.find({ domainName:"google.com" }).exec()

        console.log(users)

        process_data()

    }).catch(err => {
        console.log('Error connecting with local database.Exiting', err)
    })
}

connectMongoose()


setupMongoose = async () => {
    //Domain Schema
    const domainSchema = new Schema({}, { strict: false });
    domainSchema.set('collection', 'domaindbi');

    DomainDB = mongoose.model('DomainDB', domainSchema)

    //IP Schema
    const ipSchema = new Schema({}, { strict: false });
    ipSchema.set('collection', 'ip');

    IpDB = mongoose.model('IpDB', ipSchema)
}

let id = 0
let index = 0

const process_data = async () => {

    //await DomainDB.find().then(  )


    const cursor = DomainDB.find().cursor()

    //cursor.limit(50)
    cursor.addCursorFlag("noCursorTimeout",true)
    //console.log(cursor)

    cursor.on('data', function(domain) {

        console.log(doc)

        index++

        try {
            const digCommand = `dig +short A ${ domain.domainName }`
            const output = execSync( digCommand, { encoding: 'utf-8' }); // the default is 'buffer'

            const ips = output.split(/\r?\n/)

            const ip = []

            for (var i = 0; i < ips.length; i++) {
                ips[i]

                if(ips[i] !== "" && ValidateIPaddress(ips[i]) ) {
                    ip.push(ips[i])
                }
            }

            if(ip &&  ip.length > 0) {

                console.log(digCommand)
                console.log(output, typeof output)
                console.log("Doc",index,domain)

                for (var j = 0; j < ip.length; j++) {

                    /*
                    let result2 = await IpDB.update({ "ip": ip[j] }
                     ,{$set:{"domainName": domain.domainName }},
                      {upsert:false}
                    ).exec()*/

                    let ipRecord = IpDB({ ip: ip[j], domainName: domain.domainName })

                    await ipRecord.save()

                    console.log("result",ipRecord)
                }
            }

            let result = await DomainDB.update({ "domainName": domain.domainName }
             ,{$set:{"ip": ip }},
              {upsert:false}
            ).exec()

        } catch (e) {
            console.log(e)
        }
    });
    cursor.on('close', ()=>{
        console.log("close cursor")
    });

    
    for await (const domain of DomainDB.find()) {

    }

    /*
    let result = await DomainDB.update({ "domainName": { "$regex": this.term, "$options": "i" } }
         ,{$addToSet:{"tags": this.term }},
          {upsert:false, multi:true}
        ).exec()*/
}