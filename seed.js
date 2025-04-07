const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("./serviceAccount.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://signkids-ea83b.firebasestorage.app", // Replace with your Firebase Storage bucket
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Categories (folders)
const categories = ["Letters", "Numbers", "Shapes", "Colors"];

// Alphabets and Numbers
const items = {
  Letters: [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
  Numbers: [..."0123456789"],
  Shapes: ["Circle", "Heart", "Rectangle", "Star", "Triangle"],
  Colors: ["Blue", "Green", "Orange", "Purple", "Red", "Yellow"],
};

function getRandomOptions(correct, category) {
  let allChoices = [...items[category]]; // Use category-based options

  // Remove correct answer from choices
  allChoices = allChoices.filter((choice) => choice !== correct);

  // Pick 3 random options (including the correct one)
  let randomChoices = allChoices.sort(() => 0.5 - Math.random()).slice(0, 2);

  // Return the shuffled array with the correct answer included
  return [...randomChoices, correct].sort(() => 0.5 - Math.random());
}

function getQuestion(item, category) {
  if (category === "Letters") {
    return `What is the sign for the letter '${item}'?`;
  }
  if (category === "Numbers") {
    return `What is the sign for the number '${item}'?`;
  }
  if (category === "Shapes") {
    return `What is the sign for the shape '${item}'?`;
  }
  if (category === "Colors") {
    return `What is the sign for the color '${item}'?`;
  }
  return `What is this sign for '${item}'?`;
}

async function uploadFile(localPath, destPath) {
  const file = bucket.file(destPath);
  await bucket.upload(localPath, { destination: destPath });
  await file.makePublic();
  return file.publicUrl();
}

async function seedFirestore() {
  const iconPath = path.join(__dirname, `categories/icon.png`);
  if (!fs.existsSync(iconPath)) {
    console.warn(`Missing image Icon`);
    return;
  }

  const iconUrl = await uploadFile(iconPath, `images/const_path/icon.png`);
  // Loop through each category
  for (const category of categories) {
    const categoryPath = path.join(__dirname, `categories/${category}.mp4`);
    if (!fs.existsSync(categoryPath)) {
      console.warn(`Missing video file for category ${category}, skipping...`);
      return;
    }
    const categoryUrl = await uploadFile(
      categoryPath,
      `categories/${category}.mp4`
    );

    const categoryImagePath = path.join(
      __dirname,
      `categories/${category}.jpeg`
    );
    if (!fs.existsSync(categoryPath)) {
      console.warn(`Missing image file for category ${category}, skipping...`);
      return;
    }
    const categoryImageUrl = await uploadFile(
      categoryImagePath,
      `categories/${category}.jpeg`
    );
    await db
      .collection("modules")
      .doc(category)
      .set({
        answer: category,
        question: `What is this module?`,
        content: `This module contains all the signs for ${category}.`,
        options: getRandomOptions(category, category),
        parentUid: "",
        userName: "Leah Njoki",
        userUid: "ausseOodBQcuNWGFzRTfpBn5K4G2",
        title: category,
        videoPath: categoryUrl,
        imagePath: categoryImageUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    console.log(`Seeded category ${category} successfully`);

    // Loop through each item in the category
    for (const item of items[category]) {
      let imageUrl = "";
      const imagePath = path.join(
        __dirname,
        `images/${category}/${item}/${item}.jpeg`
      );
      const videoPath = path.join(__dirname, `videos/${category}/${item}.mp4`);

      // Check if the video file exists (if you want to use it)
      if (!fs.existsSync(videoPath)) {
        console.warn(
          `Missing video file for ${item} in category ${category}, skipping...`
        );
        continue;
      }

      if (!fs.existsSync(imagePath)) {
        console.warn(
          `Missing image file for ${item} in category ${category}, skipping...`
        );
        imageUrl = iconUrl;
      } else {
        imageUrl = await uploadFile(
          imagePath,
          `images/${category}/${item}.jpeg`
        );
      }

      const videoUrl = await uploadFile(
        videoPath,
        `videos/${category}/${item}.mp4`
      );

      const question = getQuestion(item, category); // Generate dynamic question

      // Add individual item to Firestore (e.g., "A", "B", "Circle")
      await db
        .collection("modules")
        .doc(item)
        .set({
          answer: item,
          question: question,
          content: `This is the sign for '${item}' in the ${category} category.`,
          options: getRandomOptions(item, category),
          userName: "Leah Njoki",
          userUid: "ausseOodBQcuNWGFzRTfpBn5K4G2",
          title: item,
          imagePath: imageUrl,
          parentUid: category, // Reference to the parent module
          videoPath: videoUrl,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      console.log(`Seeded ${item} in category ${category} successfully`);
    }
  }
}

seedFirestore()
  .then(() => console.log("Seeding complete"))
  .catch((error) => console.error("Seeding failed", error));
