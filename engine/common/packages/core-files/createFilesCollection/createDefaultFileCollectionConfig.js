export default (collectionName, options) => ({
  collectionName,
  allowClientCode: false, // Disallow remove files from Client
  debug: Meteor.isServer && Meteor.isDevelopment,
  onBeforeUpload(file) {
    if (
      options.extensionRegex &&
      !options.extensionRegex.test(file.extension)
    ) {
      return 'filetype not allowed';
    }
    if (file.size > options.maxSize) {
      return 'file too big';
    }
    return true;
  },
});
