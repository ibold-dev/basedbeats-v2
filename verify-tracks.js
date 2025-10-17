/**
 * Script to verify all track URLs (audio and images) are working
 * Run with: node verify-tracks.js
 */

const fs = require("fs");
const path = require("path");

async function verifyUrls() {
  console.log("🔍 Verifying all track URLs...\n");

  const tracksDir = path.join(__dirname, "public", "tracks");
  const results = [];
  let totalAudioWorking = 0;
  let totalImagesWorking = 0;

  for (let i = 1; i <= 20; i++) {
    const filePath = path.join(tracksDir, `${i}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ Track ${i}: File not found`);
      continue;
    }

    const track = JSON.parse(fs.readFileSync(filePath, "utf8"));

    console.log(`Track ${i}: ${track.title} by ${track.artist}`);

    try {
      // Check audio URL
      const audioResponse = await fetch(track.audioUrl, { method: "HEAD" });
      const audioOk = audioResponse.ok;
      const audioStatus = audioOk ? "✅" : "❌";
      console.log(
        `  Audio: ${audioStatus} [${audioResponse.status}] ${track.audioUrl.split("/").pop()}`
      );

      if (audioOk) totalAudioWorking++;

      // Check image URL
      const imageResponse = await fetch(track.albumArt, { method: "HEAD" });
      const imageOk = imageResponse.ok;
      const imageStatus = imageOk ? "✅" : "❌";
      console.log(`  Image: ${imageStatus} [${imageResponse.status}]`);

      if (imageOk) totalImagesWorking++;

      results.push({
        id: i,
        title: track.title,
        artist: track.artist,
        audioOk,
        imageOk,
        audioUrl: track.audioUrl,
        albumArt: track.albumArt,
      });

      console.log("");
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
      results.push({
        id: i,
        title: track.title,
        artist: track.artist,
        audioOk: false,
        imageOk: false,
        error: error.message,
      });
    }
  }

  // Print summary
  console.log("═".repeat(60));
  console.log("📊 SUMMARY");
  console.log("═".repeat(60));
  console.log(`\n🎵 Audio URLs:  ${totalAudioWorking}/20 working`);
  console.log(`🖼️  Image URLs:  ${totalImagesWorking}/20 working`);

  const failedAudio = results.filter((r) => !r.audioOk);
  const failedImages = results.filter((r) => !r.imageOk);

  if (failedAudio.length > 0) {
    console.log("\n❌ Failed Audio URLs:");
    failedAudio.forEach((r) => {
      console.log(`  Track ${r.id}: ${r.title} by ${r.artist}`);
      console.log(`    URL: ${r.audioUrl}`);
    });
  } else {
    console.log("\n🎉 All audio URLs are working!");
  }

  if (failedImages.length > 0) {
    console.log("\n❌ Failed Image URLs:");
    failedImages.forEach((r) => {
      console.log(`  Track ${r.id}: ${r.title}`);
      console.log(`    URL: ${r.albumArt}`);
    });
  } else {
    console.log("🎉 All image URLs are working!");
  }

  console.log("\n" + "═".repeat(60));

  // Exit with error code if any URLs failed
  if (failedAudio.length > 0 || failedImages.length > 0) {
    process.exit(1);
  }
}

// Run the verification
verifyUrls().catch((error) => {
  console.error("\n💥 Verification script failed:", error);
  process.exit(1);
});
