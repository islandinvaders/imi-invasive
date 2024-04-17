import { Reports } from '../../api/report/Report';

// DOWNLOAD CSV FILE
const download = function (data) {

  // Creating a Blob for having a csv file format
  // and passing the data with type
  const blob = new Blob([data], { type: 'text/csv' });

  // Creating an object for downloading url
  const url = window.URL.createObjectURL(blob);

  // Creating an anchor(a) tag of HTML
  const a = document.createElement('a');

  // Passing the blob downloading url
  a.setAttribute('href', url);

  // Setting the anchor tag attribute for downloading
  // and passing the download file name
  a.setAttribute('download', 'imi-invasive-verified-reports.csv');

  // Performing a download with click
  a.click();
};

// MAKE CSV FILE
const csvmaker = function (data) {

  // Declare csvRows before using it
  const csvRows = [];

  // Headers is basically a keys of an
  // object which is id, name, and
  // profession
  // Exclude the 'image' key
  const headers = Object.keys(data[0]).filter(key => key !== 'image');

  // As for making csv format, headers
  // must be separated by comma and
  // pushing it into array
  csvRows.push(headers.join(','));

  // Loop through each object in the data array
  data.forEach(item => {
    // Pushing Object values into array
    // with comma separation
    // Exclude the 'image' value
    const values = headers.map(header => item[header]).join(',');
    csvRows.push(values);
  });

  // Returning the array joining with new line
  return csvRows.join('\n');
};

// GET
export const get = async function () {
  try {
    // JavaScript object
    // Only include reports where 'verified' is 'Yes'
    const data = await Reports.collection.find({ verified: 'Yes' }).fetch();
    console.log(data);
    // Check if data is not null or undefined
    if (data && data.length > 0) {
      const csvdata = csvmaker(data);
      download(csvdata);
    } else {
      console.error('No data found');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
};
