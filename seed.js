const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize Firebase Admin
const serviceAccount = require("./serviceAccount.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "your-project-id.appspot.com", // Replace with your Firebase Storage bucket
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Alphabets and Numbers
const items = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", ..."0123456789"];

async function uploadFile(localPath, destPath) {
  const file = bucket.file(destPath);
  await bucket.upload(localPath, { destination: destPath });
  await file.makePublic(); // Make it public (optional)
  return file.publicUrl();
}

async function seedFirestore() {
  for (const item of items) {
    const imagePath = path.join(__dirname, `images/${item}.png`);
    const videoPath = path.join(__dirname, `videos/${item}.mp4`);

    if (!fs.existsSync(imagePath) || !fs.existsSync(videoPath)) {
      console.warn(`Missing files for ${item}, skipping...`);
      continue;
    }

    const imageUrl = await uploadFile(imagePath, `modules/${item}.png`);
    const videoUrl = await uploadFile(videoPath, `modules/${item}.mp4`);

    await db.collection("modules").doc(item).set({
      title: item,
      image: imageUrl,
      video: videoUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Seeded ${item} successfully`);
  }
}

seedFirestore()
  .then(() => console.log("Seeding complete"))
  .catch((error) => console.error("Seeding failed", error));
