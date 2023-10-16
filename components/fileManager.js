import fs from "fs";

export function getNewestFile() {
    let files = fs.readdirSync(".tmp");
    let youngestFile = files
        .map((file) => ({
            file: file,
            mtime: fs.statSync(".tmp/" + file).ctime.getTime(),
        }))
        .sort((a, b) => b.mtime - a.mtime)[0].file;
    return youngestFile;
}

export function writeVideosToFile(videos) {
    let file_timestamp = new Date().toISOString().replace(/:/g, "-");
    fs.writeFile(
        `.tmp/videos_${file_timestamp}.json`,
        JSON.stringify(videos, null, 2),
        (err) => {
            if (err) throw err;
            console.log("Data written to file");
        }
    );
}

export function deleteOldFiles(tmp_max){
    let files = fs.readdirSync(".tmp");
    if (files.length > tmp_max) {
        let oldestFile = files
            .map((file) => ({
                file: file,
                ctime: fs.statSync(".tmp/" + file).ctime.getTime(),
            }))
            .sort((a, b) => a.ctime - b.ctime)[0].file;
        fs.unlinkSync(`.tmp/${oldestFile}`);
    }
}