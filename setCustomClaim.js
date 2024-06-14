const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Define custom claim for the admin role
const customClaims = {
  admin: true,
};

// Replace 'userUid' with the actual UID of the user
const userUid = "uLYvasW8IygUi1VCsuJb5ZrIzcq1";
// const userUid2 = "";

// Set custom claim for the specified user
admin
  .auth()
  .setCustomUserClaims(userUid, customClaims)
  .then(() => {
    console.log(`Custom claim "admin" set for user with UID: ${userUid}`);
    process.exit(0); // Exit the script after successful execution
  })
  .catch((error) => {
    console.error("Error setting custom claim:", error);
    process.exit(1); // Exit the script with error status
  });
