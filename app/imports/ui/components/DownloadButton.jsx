import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Reports } from '../../api/report/Report';

// MAKE CSV FILE
// MAKE CSV FILE
const csvmaker = function (data) {
  const csvRows = [];
  const headers = Object.keys(data[0]).filter(key => key !== 'image');
  csvRows.push(headers.join(','));

  data.forEach(item => {
    const values = headers.map(header => {
      const escaped = (`${item[header]}`).replace(/"/g, '\\"');
      return `"${escaped}"`;
    }).join(',');
    csvRows.push(values);
  });

  return csvRows.join('\n');
};

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

// DOWNLOAD BUTTON
const DownloadButton = () => {
  const [data, setData] = useState(null);

  const { reports } = useTracker(() => {
    // Get access to Report documents.
    const subscription = Meteor.subscribe(Reports.userPublicationName);
    // Determine if the subscription is ready
    const rdy = subscription.ready();
    // Get the Report documents
    const reportItems = Reports.collection.find({}).fetch();
    return {
      reports: reportItems,
      ready: rdy,
    };
  }, []);

  useEffect(() => {
    if (reports && reports.length > 0) {
      setData(reports);
    }
  }, [reports]);

  const handleClick = () => {
    if (data && data.length > 0) {
      const csvdata = csvmaker(data);
      download(csvdata);
    }
  };

  return (
    <button type="button" onClick={handleClick}>
      Download CSV
    </button>
  );
};

export default DownloadButton;
