import { getVideos } from "./components/getVideos";
import { checkChanges } from "./components/getVideoDetails";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "UCpB959t8iPrxQWj7G6n0ctQ"; // channel id for the channel 'SSSniperwolf' aka. An awful freebooter
const TMP_MAX = 100; // max number of files to keep in the .tmp folder


function main() {
    console.log("Running your function...");

    // wait until the clock minutes are 0 or 30
    // then get the videos and repeat
    let videos = getVideos(CHANNEL_ID, TOKEN).catch((error) =>
        console.error(error)
    );
    if (!videos) {
        throw new Error("No videos found");
    }
    // write videos to json in a .tmp folder with the name `videos_{timstamp}.json`
    fs.writeFile(
        `.tmp/videos_${new Date().toISOString()}}.json`,
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
    let changes = checkChanges(videos, old_videos);

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
    let changedArray = JSON.parse(fs.readFileSync(".tmp/changes.json"));
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
    // Schedule next run
    scheduleFunction();
}

function scheduleFunction() {
    var now = new Date();
    var delay = 30 - now.getMinutes() % 30; // minutes until next half hour mark
    if (delay === 30) delay = 0; // if we're on the half hour, no delay
    delay = delay * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds(); // convert to milliseconds and subtract seconds and milliseconds already passed in the current minute

    setTimeout(mainFunction, delay);
}

scheduleFunction();

// request count: 190

// plan, check every 30 minutes
