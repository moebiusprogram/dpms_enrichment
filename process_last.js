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


    const cursor = IpDB.find().cursor()

    //cursor.limit(50)
    cursor.addCursorFlag("noCursorTimeout",true)
    //console.log(cursor)

    const digCommand = `whois 195.149.84.101`
    const output = execSync( digCommand, { encoding: 'utf-8' }); // the default is 'buffer'

    const splitted = output.split(/\r?\n/)

    let blockowner = ""
    let netRange = ""
    let ASN = ""
    let descr = ""


    cursor.on('data', async (ip) => {

        index++

        try {
                for (var j = 0; j < splitted.length; j++) {
                    const line = splitted[j]
                    blockowner = ""
                    netRange = ""
                    ASN = ""
                    descr = ""

                    if(line.includes("inetnum:")) {

                        //console.log( JSON.parse( JSON.stringify( line.replace(/[(inetnum:) \t]/gi,"") ) ) )
                        netRange = line.replace(/^(inetnum:)/i,"").replace(/[ \s]/gi,"").replace("-"," - ")
                        console.log( netRange )
                    } else if(line.includes("descr:")) {
                        //console.log( "Descr" ,line.replace(/[(descr:) \t]/i,"") )
                        descr = line.replace(/^(descr:)/i,"").replace(/[ \s]/gi,"")
                        console.log(descr)
                    } else if(line.includes("origin:") || line.includes("OriginAS:") ) {
                        ASN = line.replace(/^(origin:)/i,"").replace(/^(OriginAS:)/i,"").replace(/[ \s]/gi,"")
                        console.log( ASN )
                    }  else if(line.includes("netName:") || line.includes("NetName:") ) {
                        blockowner = line.replace(/^(netName:)/i,"").replace(/^(NetName:)/i,"").replace(/[ \s]/gi,"")
                        console.log( blockowner )
                    }
                    

                }   

            let result = await IpDB.updateOne({ "ip": ip.ip }
             ,{$set:{
                blockowner,
                ASN,
                descr,
                netRange
             }},
              {upsert:false}
            ).exec()


/*
reversewhois


mantainer
block owner
ASN
Hosts (dominios y subdominios)


blockowner : netName: GOOGLE
descr: Organization: Google LLC (GOGL)

ASN: OriginAS: AS15169

whois 142.250.78.78 (google.com)

NetRange:       142.250.0.0 - 142.251.255.255
CIDR:           142.250.0.0/15
NetName:        GOOGLE
NetHandle:      NET-142-250-0-0-1
Parent:         NET142 (NET-142-0-0-0-0)
NetType:        Direct Allocation
OriginAS:       AS15169
Organization:   Google LLC (GOGL)
RegDate:        2012-05-24
Updated:        2012-05-24
Ref:            https://rdap.arin.net/registry/ip/142.250.0.0

            let result = await IpDB.updateOne({ "ip": ip.ip }
             ,{$set:{"ip": ip }},
              {upsert:false}
            ).exec()
*/


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