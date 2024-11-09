const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

exports.saveProfilePicture = functions.https.onCall(async (data, context) => {
  const {imageUrl, memberID} = data;

  // Optional: Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to upload a profile picture.",
    );
  }

  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(`members/${memberID}.png`);
    await file.save(Buffer.from(buffer), {
      metadata: {contentType: "image/png"},
    });

    // Get the public URL
    await file.makePublic();
    const bucketName = bucket.name;
    const fileName = file.name;
    const publicUrl =
      `https://storage.googleapis.com/${bucketName}/${fileName}`;

    return {success: true, url: publicUrl};
  } catch (error) {
    console.error("Error saving profile picture:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Error saving profile picture",
        error.message,
    );
  }
});

exports.deleteProfilePicture = functions.https.onCall(async (data, context) => {
  const {memberID} = data;

  // Optional: Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to delete a profile picture.",
    );
  }

  try {
    // Delete from Firebase Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(`members/${memberID}.png`);

    // Check if the file exists before attempting to delete
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("Profile picture does not exist");
    }

    await file.delete();

    return {success: true, message: "Profile picture deleted successfully"};
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Error deleting profile picture",
        error.message,
    );
  }
});

exports.saveConversationImage = functions.https.onCall(
    async (data, context) => {
      const {imageUrl, chatID, description} = data;

      try {
      // Download the image
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();

        // Upload to Firebase Storage
        const bucket = admin.storage().bucket();
        const fileName = `${Date.now()}.jpg`;
        const filePath = `chats/${chatID}/images/${fileName}`;
        const file = bucket.file(filePath);
        await file.save(Buffer.from(buffer), {
          metadata: {contentType: "image/jpeg"},
        });

        // Make the file public
        await file.makePublic();

        // Construct the public URL
        const bucketName = bucket.name;
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

        return {
          success: true,
          url: publicUrl,
          description: description,
        };
      } catch (error) {
        console.error("Error saving conversation image:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    },
);

exports.deleteConversationImage = functions.https.onCall(
    async (data, context) => {
      const {chatID, fileName} = data;

      try {
      // Construct the file path
        const filePath = `chats/${chatID}/images/${fileName}`;

        // Delete the file from Firebase Storage
        await admin.storage().bucket().file(filePath).delete();

        return {
          success: true,
          message: "Image deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting conversation image:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    },
);
