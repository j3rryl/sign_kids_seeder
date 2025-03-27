const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("./serviceAccount.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://signkids-87524.firebasestorage.app", // Replace with your Firebase Storage bucket
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Alphabets and Numbers
const items = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", ..."0123456789"];

function getRandomOptions(correct) {
  let allChoices = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", ..."0123456789"];
  allChoices = allChoices.filter((choice) => choice !== correct); // Remove correct answer
  let randomChoices = allChoices.sort(() => 0.5 - Math.random()).slice(0, 2); // Pick 2 random options
  return [...randomChoices, correct].sort(() => 0.5 - Math.random()); // Add correct answer & shuffle
}

async function uploadFile(localPath, destPath) {
  const file = bucket.file(destPath);
  await bucket.upload(localPath, { destination: destPath });
  await file.makePublic();
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

    await db
      .collection("modules")
      .doc(item)
      .set({
        answer: item,
        question: "What is this sign?",
        content: `This is the sign for the letter/item '${item}'.`,
        options: getRandomOptions(item),
        parentUid: "",
        userName: "Leah",
        userUid: "cl3m0JkOdxOtPwWmwuKux4dBmTk2",
        title: item,
        imagePath: imageUrl,
        videoPath: videoUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log(`Seeded ${item} successfully`);
  }
}

seedFirestore()
  .then(() => console.log("Seeding complete"))
  .catch((error) => console.error("Seeding failed", error));
