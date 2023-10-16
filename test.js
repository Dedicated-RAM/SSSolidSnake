import { getVideos } from "./components/getVideos.js";
import { checkChanges } from "./components/checkVideos.js";
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
    // write videos to a new json file in a .tmp folder with the name `videos_{timstamp}.json`
    let file_timestamp = new Date().toISOString().replace(/:/g, "-");
    fs.writeFileSync(
        `.tmp/videos_${file_timestamp}.json`,
        JSON.stringify(videos, null, 2),
        (err) => {
            if (err) throw err;
            console.log("Data written to file");
            console.log(videos.length);
        }
    );

    // get the second youngest file from tmp folder
    let files = fs.readdirSync(".tmp");
    // can't compare on the first go around
    if (files.length < 2) {
        return;
    }
    let secondYoungestFile = files
        .map((file) => ({
            file: file,
            mtime: fs.statSync(".tmp/" + file).ctime.getTime(),
        }))
        .sort((a, b) => b.mtime - a.mtime)[1].file;
    let old_videos = JSON.parse(fs.readFileSync(`.tmp/${secondYoungestFile}`));
    console.log(`comparing 'old' file: ${secondYoungestFile}`);
    let changes = await checkChanges(videos, old_videos);

    // once the files reach a certain number, delete the oldest file
    if (files.length > TMP_MAX) {
        let oldestFile = files
            .map((file) => ({
                file: file,
                mtime: fs.statSync(".tmp/" + file).ctime.getTime(),
            }))
            .sort((a, b) => a.mtime - b.mtime)[0].file;
        fs.unlinkSync(`.tmp/${oldestFile}`);
    }
    // add new change data to the changes.json file
    let changedArray = JSON.parse(fs.readFileSync("models/changes.json"));
    let removedVideos = changes.removed;
    let durationVideos = changes.duration;

    if (removedVideos.length > 0) {
        // call function to send post request to discord webhook
        changedArray.concat(removedVideos);
    }
    if (durationVideos.length > 0) {
        // call function to send post request to discord webhook
        changedArray.concat(durationVideos);
    }
    fs.writeFileSync("models/changes.json", JSON.stringify(changedArray, null, 2));
    console.log(removedVideos);
    console.log(durationVideos);
}

main();