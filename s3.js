const S3 = require("aws-sdk/clients/s3")
require("dotenv").config()

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
})

function getImageStream(imagekey){
    return s3.getObject({bucket: bucketName, Key: imagekey}).createReadStream()
}

module.exports = {s3, getImageStream}