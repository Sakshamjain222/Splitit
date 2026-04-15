// SplitIt — Google Apps Script Backend
// ============================================
// TARGET SHEET: https://docs.google.com/spreadsheets/d/1GeymkP4E4MMMHezmmmrdff_glKrcrOcoGsJCwIbAERY/edit?gid=0#gid=0
// ============================================
// HOW TO USE:
// 1. Create a new Google Sheet at sheets.google.com
// 2. Add headers in Row 1: Timestamp | Name | Mobile | Location | Cart Link
// 3. Go to Extensions → Apps Script
// 4. Delete the default code and paste THIS entire file into Code.gs
// 5. Save (Ctrl+S)
// 6. Deploy → New deployment → Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 7. Authorize when prompted
// 8. Copy the Web App URL and paste it into index.html (SHEET_URL variable)
// ============================================

/**
 * Handles GET requests (health-check endpoint).
 * Visit the web app URL in a browser to verify deployment.
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "ok",
      message: "SplitIt backend is running ✅"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handles POST requests from the SplitIt form.
 * Parses the JSON body and appends a row to Sheet1.
 */
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");

    // Parse the incoming data
    // Handle both form-encoded (from browser no-cors) and direct JSON
    var data;
    if (e.parameter && e.parameter.data) {
      // Form-encoded: data comes as a URL parameter
      data = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      // Direct JSON POST
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error("No data received");
    }

    // Format the timestamp nicely (IST)
    var timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    var formattedTime = Utilities.formatDate(
      timestamp,
      "Asia/Kolkata",
      "dd-MMM-yyyy hh:mm:ss a"
    );

    // Append a new row with the order data
    sheet.appendRow([
      formattedTime,
      data.name,
      data.mobile,
      data.hostel,     // This is the "Location" field (Main Gate / Hostel name)
      data.cartLink
    ]);

    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        message: "Order logged successfully"
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
