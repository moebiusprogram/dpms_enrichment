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


const process_subfinder = async (data) => {

    if(!data || data.length === 0 || data[0] === "") return []

    const dataArray = data.split(/\r?\n/)

    const processed_data = []

    for (var i = 0; i < dataArray.length; i++) {
        const line = dataArray[i]

        if(line === ""){
            continue
        }

        const start = line.indexOf("[")
        const end = line.indexOf("]")

        const ip = line.slice(start + 1, end)

        const domain = line.slice(0,start - 1)

        //console.log("result",ip,domain)

        processed_data.push({ [domain]: ip})
    }


    console.log("processed", processed_data)

    return processed_data
}


const process_data = async () => {

    const cursor = DomainDB.find().cursor()
    cursor.addCursorFlag("noCursorTimeout",true)
    cursor.on('data', async (domain) => {

        index++

        try {

            const subfinderCommand = `subfinder -silent -d ${ domain.domainName } | dnsx -silent -a -resp`
            const output = execSync( subfinderCommand, { encoding: 'utf-8' }); // the default is 'buffer'
            //const output = execSync('nslookup -type=NS earth.google.com', { encoding: 'utf-8' }); // the default is 'buffer'

            const ips = await process_subfinder(output)


            for (var i = 0; i < ips.length; i++) {

                const domainName = Object.keys(ips[i])

                console.log(domainName[0], ips[i][domainName[0]])
            
                if( !ValidateIPaddress( ips[i][domainName[0]])) continue

                try{
                    let dnsRecord = DomainDB({ domainName:  domainName[0], ip: [ ips[i][domainName[0]] ] })
                    await dnsRecord.save()
                } catch(e) {
                    console.log("E:",e.code)
                }

                let ipRecord = IpDB({ ip: ips[i][domainName[0]], domainName: domainName[0] })
                await ipRecord.save()
            }

            
            let result = await DomainDB.updateOne({ "domainName": domain.domainName }
             ,{$set:{"sub": ips }},
              {upsert:false}
            ).exec()

         
        } catch (e) {
            console.log(e)
        }
    });
    cursor.on('close', ()=>{
        console.log("close cursor")
    });

}