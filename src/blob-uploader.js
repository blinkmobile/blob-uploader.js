// @flow
'use strict'

const privateVars = new WeakMap()

function blobUploader (apiUrl /* :string */) {
  if (!apiUrl) {
    throw new TypeError('blobUploader expects a api URL during instantiation')
  }
  privateVars.set(this, {
    uri: apiUrl
  })
}

blobUploader.prototype.retrieveBlobUrl = function (
  uuid /* :string */
) /* :Promise<string> */ {
  if (!uuid) {
    return Promise.reject(new Error('uuid argument not provided'))
  }

  if (!privateVars || !privateVars.get(this)) {
    return Promise.reject(new Error('blobUploader uri not configured'))
  }
  const vars = privateVars.get(this)
  if (!vars || !vars.hasOwnProperty('uri')) {
    return Promise.reject(new Error('blobUploader uri not configured'))
  }

  const request = new Request(vars.uri + 'v1/signedURL/' + uuid, {
    method: 'PUT',
    mode: 'cors'
  })

  return fetch(request)
    .then((response) => {
      if (!response.ok) {
        return Promise.reject(new Error(response.status + ' ' + response.statusText))
      }
      return response.json()
    })
    .then((apiResponse) => apiResponse.getUrl)
    .catch((err) => Promise.reject(new Error('Error retrieving blob url: ' + err)))
}

blobUploader.prototype.uploadBlob = function (
  blob /*: Blob */,
  progressFn /* ?:Function */,
  cancelEventName /* ?:string */
) /* :Promise<number> */ {
  if (!blob) {
    return Promise.reject(new Error('blob argument not provided'))
  }

  const vars = privateVars.get(this)
  if (!vars || !vars.hasOwnProperty('uri')) {
    return Promise.reject(new Error('blobUploader uri not configured'))
  }

  const request = new Request(vars.uri + 'v1/temporaryCredentials', {
    method: 'GET',
    mode: 'cors'
  })

  return fetch(request)
    .then((response) => {
      if (!response.ok) {
        return Promise.reject(new Error(response.status + ' ' + response.statusText))
      }
      return response.json()
    })
    .then((apiResponse) => {
      const S3 = require('aws-sdk/clients/s3')
      const s3 = new S3({
        accessKeyId: apiResponse.credentials.AccessKeyId,
        secretAccessKey: apiResponse.credentials.SecretAccessKey,
        sessionToken: apiResponse.credentials.SessionToken,
        region: 'ap-southeast-2'
      })
      const params = {
        Bucket: apiResponse.bucket,
        Key: apiResponse.id,
        Body: blob
      }
      const managedUpload = s3.upload(params)
      if (progressFn) {
        managedUpload.on('httpUploadProgress', (evt) => {
          progressFn(evt)
        })
      }
      if (cancelEventName) {
        window.addEventListener(cancelEventName, () => {
          managedUpload.abort()
        })
      }
      return managedUpload
        .promise()
        .then(() => apiResponse.id)
    })
    .catch((err) => Promise.reject(new Error('Error uploading to S3: ' + err)))
}

module.exports = blobUploader
