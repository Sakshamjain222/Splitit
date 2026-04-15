function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
    if (!sheet) throw new Error("Sheet1 not found");

    var data;
    if (e.parameter && e.parameter.data) data = JSON.parse(e.parameter.data);
    else if (e.postData && e.postData.contents) data = JSON.parse(e.postData.contents);
    else throw new Error("No data received");

    var timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    var formattedTime = Utilities.formatDate(timestamp, "Asia/Kolkata", "dd-MMM-yyyy hh:mm:ss a");

    // Find the very first truly empty row searching column A (Timestamp)
    var columnValues = sheet.getRange("A:A").getValues();
    var firstEmptyRow = 2; // Default to row 2
    for (var i = 1; i < columnValues.length; i++) {
      if (columnValues[i][0] === "" || columnValues[i][0] === null) {
        firstEmptyRow = i + 1;
        break;
      }
    }

    // Insert the values at the first available empty row
    sheet.getRange(firstEmptyRow, 1, 1, 5).setValues([
      [formattedTime, data.name, data.mobile, data.hostel, data.cartLink]
    ]);

    return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
