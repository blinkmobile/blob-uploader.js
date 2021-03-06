'use strict'

/* eslint-disable */
describe('BMUploader', () => {

  var originalTimeout;
  beforeEach(() => {
    fetchMock
      .post(/https:\/\/bm-blob-uploader-dev.api.blinkm.io\/v1\/signedURL/, { putUrl: 'www.putUrl.com', id: 'abc123' })
      .put(/https:\/\/bm-blob-uploader-dev.api.blinkm.io\/v1\/signedURL/, { getUrl: 'www.getUrl.com' })
      .put(/www.putUrl.com/, 200)
      .spy()
  })

  afterEach(() => {
    fetchMock.restore()
  })
    
  describe('Constructor', () => {
    it('should throw a type error if no url is supplied', () => {
      expect(() => { BMUploader() }).toThrow()
    })

    it('should succeed if url is supplied', () => {
      expect(() => { BMUploader('https://bm-blob-uploader-dev.api.blinkm.io/') }).toBeDefined()
    })
  })

  describe('retrieveContentUrl', () => {
    it('should reject if uuid not passed in', (done) => {
      const uploader = new BMUploader('https://bm-blob-uploader-dev.api.blinkm.io/')
      uploader.retrieveContentUrl()
        .then((blob) => { done.fail() })
        .catch((err) => { done() })
    })

    it('should succeed when given a id', (done) => {
      const uploader = new BMUploader('https://bm-blob-uploader-dev.api.blinkm.io/')
      try {
        uploader.retrieveContentUrl('1234')
          .then((url) => {
            expect(url).toBeDefined()
            expect(url.length).toBeGreaterThan(0)
            done()
          })
          .catch((err) => { done.fail(err) })
      }
      catch(e) {
        done.fail(e)
      }
    })
  })

  describe('uploadContent', () => {
    it('should reject if content not passed in', (done) => {
      const uploader = new BMUploader('https://bm-blob-uploader-dev.api.blinkm.io/')
      uploader.uploadContent()
        .then((id) => { done.fail() })
        .catch((err) => { done() })
    })

    it('should succeed when given a blob', (done) => {
      const uploader = new BMUploader('https://bm-blob-uploader-dev.api.blinkm.io/')
      try {
      uploader.uploadContent(new Blob(['111']))
        .then((uploader) => {
          expect(uploader.id.length).toBeGreaterThan(0)
          done()
        })
        .catch((err) => { done.fail(err) })
      }
      catch(e) {
        done.fail(e)
      }
    }, 150000)
  })
})
/* eslint-disable */
