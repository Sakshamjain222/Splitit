function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "ok",
      sheetId: ss.getId(),
      tabName: ss.getSheetByName("Sheet1") ? "Sheet1 exists ✅" : "Sheet1 NOT FOUND ❌"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
    if (!sheet) throw new Error("Sheet1 not found in this spreadsheet.");

    var data;
    if (e.parameter && e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error("No data received");
    }

    var timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    var formattedTime = Utilities.formatDate(timestamp, "Asia/Kolkata", "dd-MMM-yyyy hh:mm:ss a");

    sheet.appendRow([formattedTime, data.name, data.mobile, data.hostel, data.cartLink]);

    return ContentService
      .createTextOutput(JSON.stringify({status: "success", message: "Order logged successfully"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({status: "error", message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
