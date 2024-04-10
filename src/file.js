
const { BrowserWindow, dialog } = require('electron');
const { download } = require('electron-dl');
const path = require('node:path');
const fs = require('node:fs');

export const getFileContents = (app, payload) => {

  try {
    let fileContents = fs.readFileSync(payload);
    if (fileContents) {
      return {
        url: `file://${payload}`,
        contents: fileContents.toString('base64')
      };
    }
  } catch {}

  // default
  return null;

}

export const deleteFile = (app, payload) => {

  try {
    let path = payload.path;
    if (path.startsWith('file://')) {
      path = path.slice(7);
    }
    fs.unlinkSync(path);
    return true;
  } catch (error) {
    console.error('Error while deleting file', error);
    return false;
  }

}

export const pickFile = (app, payload) => {

  try {
    let fileURL = dialog.showOpenDialogSync({
      filters: payload?.filters
    });
    if (fileURL) {
      return getFileContents(app, fileURL[0]);
    }
  } catch {}

  // default
  return null;

}

export const downloadFile = async (app, payload) => {

  // parse properties
  let properties = payload.properties ? { ...payload.properties } : {};
  let defaultPath = app.getPath(properties.directory ? properties.directory : 'downloads');
  let defaultFileName = properties.filename ? properties.filename : payload.url.split('?')[0].split(path.sep).pop();
  if (properties.subdir) {
    defaultPath = path.join(defaultPath, properties.subdir);
    if (!fs.existsSync(defaultPath)) {
      fs.mkdirSync(defaultPath, { recursive: true })
    }
  }

  // now prompt or not
  let destinationURL = path.join(defaultPath, defaultFileName);
  if (properties.prompt !== false) {
    destinationURL = dialog.showSaveDialogSync({
      defaultPath: destinationURL
    });
  }

  // cancelled
  if (!destinationURL) {
    return null;
  }

  // if file to file, copy
  if (payload.url.startsWith('file://')) {
    try {
      let src = payload.url.slice(7);
      //console.log(`copying ${src} to ${destinationURL}`)
      await fs.copyFileSync(src, destinationURL);
      return destinationURL;
    } catch (err) {
      console.error('Error while copying file', err);
      return null;
    }
  }
  
  // download
  let filePath = destinationURL.split(path.sep);
  let filename = `${filePath.pop()}`;
  let directory = filePath.join(path.sep);
  properties = { ...properties, directory, filename };
  //console.log(`downloading ${payload.url} to ${JSON.stringify(properties)}`)

  try {
    await download(BrowserWindow.getFocusedWindow(),
      payload.url, {
      ...properties,
      onProgress: (status) => {
        //console.log(status);
      },
      onCompleted: (status) => {
        //console.log(status);
      },

    });
    return destinationURL;

  } catch (error) {
    console.error('Error while downloading file', error);
    return null
  }

}
