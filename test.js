import { getVideos } from "./components/getVideos.js";
import { checkChanges } from "./components/checkVideos.js";
import {
	getNewestFile,
	writeVideosToFile,
	deleteOldFiles,
} from "./components/fileManager.js";
import { sendWebhookMessage } from "./components/webhookManager.js";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
//const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "UCpB959t8iPrxQWj7G6n0ctQ"; // channel id for the channel 'SSSniperwolf' aka. An awful freebooter
const TMP_MAX = 100; // max number of files to keep in the .tmp folder

async function main() {
	// test function, so get data from a test file (.tmp/sample_data_new.json)
	let videos = JSON.parse(fs.readFileSync("./sample_data_input.json"));
	console.log(`comparing 'new' file: ${".tmp/sample_data_old.json"}`);
	if (!videos) {
		throw new Error("No videos found");
	}

	// create .tmp folder if it doesn't exist
	if (!fs.existsSync(".tmp")) {
		fs.mkdirSync(".tmp");
	}

	// if no files exist in the .tmp folder, skip the compare part
	let files = fs.readdirSync(".tmp");
	if (files.length == 0) {
		console.log("no files in .tmp folder");
		writeVideosToFile(videos);
		return;
	}

	// get's the newest file in the .tmp folder
	let youngestFile = getNewestFile();
	let old_videos = JSON.parse(fs.readFileSync(`.tmp/${youngestFile}`));

	// write videos to a new json file in a .tmp folder with the name `videos_{timstamp}.json`
	writeVideosToFile(videos);

	console.log(`comparing 'old' file: ${youngestFile}`);
	let changes = await checkChanges(videos, old_videos);

	// once the files reach a certain number, delete the oldest file
	deleteOldFiles(TMP_MAX);

	// add new change data to the changes.json file
	let changedArray = JSON.parse(fs.readFileSync("models/changes.json"));
	let removedVideos = changes.removed;
	let durationVideos = changes.duration;

	if (removedVideos.length > 0) {
		// call function to send post request to discord webhook
        for (let removedVideo of removedVideos) {
            await sendWebhookMessage(removedVideo);
        }
		changedArray = changedArray.concat(changedArray, removedVideos);
	}
	if (durationVideos.length > 0) {
		// call function to send post request to discord webhook
        for (let durationVideo of durationVideos) {
            await sendWebhookMessage(durationVideo);
        }
		changedArray = changedArray.concat(changedArray, durationVideos);
	}
	console.log("writing to changes.json");
	fs.writeFile(
		"models/changes.json",
		JSON.stringify(changedArray, null, 2),
		(err) => {
			if (err) throw err;
			console.log("Data written to file");
		}
	);
}

main();
