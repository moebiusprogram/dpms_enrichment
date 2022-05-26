const request = require('request')
const mongoose = require('mongoose')
const fs = require('fs')
const exec = require('child_process').exec
const execSync = require('child_process').execSync


const {Schema}  = mongoose

require('dotenv').config();


let DomainDB = null
let IpDB = null


function ValidateIPaddress(ipaddress) 
{
 if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(myForm.emailAddr.value))
  {
    return (true)
  }
alert("You have entered an invalid IP address!")
return (false)
}



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

    for await (const domain of DomainDB.find()) {

        index++

        const data = `ntp.occentus.net [178.255.228.77]
sdns4.occentus.net [88.99.91.108]
sdns2.occentus.net [178.255.228.67]
sdns3.occentus.net [91.121.19.9]
intranet.occentus.net [178.255.226.197]
mail.occentus.net [178.255.228.71]
connect.occentus.net [178.255.225.30]
webmail.occentus.net [178.255.228.71]
monitor.occentus.net [213.162.217.6]
pdns.occentus.net [178.255.226.10]
desarrollo.occentus.net [178.255.225.181]
soporte.occentus.net [178.255.228.76]
dnstest.occentus.net [178.255.225.65]
dev.occentus.net [178.255.228.76]
mail.plesk5.occentus.net [178.255.226.205]
git.occentus.net [178.255.228.74]
gestion.occentus.net [213.162.217.223]
devmarvin.occentus.net [178.255.225.233]
mail.pre.occentus.net [178.255.228.76]
plesk0.occentus.net [178.255.226.200]
www.occentus.net [178.255.228.75]
occentus.net [178.255.228.75]
gmonitor.occentus.net [178.255.225.100]
ox.occentus.net [178.255.225.37]
corp.occentus.net [178.255.228.76]
mdns.occentus.net [88.99.91.108]
plesk2.occentus.net [178.255.226.202]
vlc-s1d09-occ-c16.occentus.net [178.255.226.16]
plesk4.occentus.net [178.255.226.204]
mail.plesk2.occentus.net [178.255.226.202]
erp.occentus.net [178.255.228.72]
mail.plesk3.occentus.net [178.255.226.203]
cerebro.occentus.net [178.255.228.76]
plesk6.occentus.net [178.255.226.206]
plesk1.occentus.net [178.255.226.201]
mail.plesk1.occentus.net [178.255.226.201]
vlc-s1d09-occ-c05.occentus.net [178.255.226.15]
geo.occentus.net [178.255.225.11]
plesk3.occentus.net [178.255.226.203]
sdns1.occentus.net [178.255.225.10]
dns2.occentus.net [178.255.225.68]
old.occentus.net [178.255.228.76]
whmcs.occentus.net [178.255.228.66]
www.plesk1.occentus.net [178.255.226.201]
pre.occentus.net [178.255.228.76]
mail.old.occentus.net [178.255.228.76]
dns.occentus.net [178.255.225.67]
ftp.occentus.net [178.255.228.75]
marvin.occentus.net [178.255.228.66]
mail.plesk6.occentus.net [178.255.226.206]
www.old.occentus.net [178.255.228.76]
plesk5.occentus.net [178.255.226.205]
sdns.occentus.net [178.255.225.10]
mail.cerebro.occentus.net [178.255.228.76]
mail.plesk4.occentus.net [178.255.226.204]
mail.plesk0.occentus.net [178.255.226.200]
`


        try {

            const subfinderCommand = `subfinder -silent -d ${ domain.domainName } | dnsx -silent -a -resp`
            const output = execSync( subfinderCommand, { encoding: 'utf-8' }); // the default is 'buffer'
            //const output = execSync('nslookup -type=NS earth.google.com', { encoding: 'utf-8' }); // the default is 'buffer'

            const ips = output.split(/\r?\n/)

            const ip = []

            for (var i = 0; i < ips.length; i++) {
                ips[i]

                if(ips[i] !== "" && ValidateIPaddress(ips[i]) ) {
                    ip.push(ips[i])
                }
            }

            if(ip &&  ip.length > 0) {

                console.log(subfinderCommand)
                console.log(output, typeof output)
                console.log("Doc",index,domain)

                for (var j = 0; j < ip.length; j++) {

                    //let ipRecord = IpDB({ ip: ip[j], domainName: domain.domainName })
                    //await ipRecord.save()

                    console.log("result",ipRecord)
                }
            }

            /*
            let result = await DomainDB.update({ "domainName": domain.domainName }
             ,{$set:{"ip": ip }},
              {upsert:false}
            ).exec()*/

        } catch (e) {
            console.log(e)
        }
    }


    /*
    let result = await DomainDB.update({ "domainName": { "$regex": this.term, "$options": "i" } }
         ,{$addToSet:{"tags": this.term }},
          {upsert:false, multi:true}
        ).exec()*/
}