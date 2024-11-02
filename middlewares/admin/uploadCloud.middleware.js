const streamUploadHelper = require("../../helpers/streamUpload.helper");

module.exports.uploadSingle = (req, res, next) => {
  if (req.file) {
    async function upload(req) {
      let result = await streamUploadHelper.streamUpload(req);
      req.body[req.file.fieldname] = result.url;
      console.log(result);
      next();
    }

    upload(req);
  } else {
    next();
  }
};
