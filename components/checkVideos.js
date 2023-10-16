// converts time string ex. "PT9M40S" to seconds ex. 580
// another example: "PT1H9M40S" to 4180
export function convertDuration (timeStr) {
    let time = 0;
    let timeStrArr = timeStr.split("");
    let timeNum = "";
    for (let char of timeStrArr) {
        if (char === "P" || char === "T" || char === "H" || char === "M" || char === "S") {
            if (char === "H") {
                time += parseInt(timeNum) * 3600;
            } else if (char === "M") {
                time += parseInt(timeNum) * 60;
            } else if (char === "S") {
                time += parseInt(timeNum);
            }
            timeNum = "";
        } else {
            timeNum += char;
        }
    }
    return time;
};

/* checks for changes in the videos array
changes include:
    - new videos
    - removed videos
    - change in video duration (contentDetails.duration = "PT9M40S") (PT = period of time, M = minutes, S = seconds)
*/
/**
 * Reduces a sequence of names to initials.
 * @param  {Array} new_videos   Array of objects describing each current video, see sample_data.json for example.
 * @param  {Array} old_videos   Array of objects describing each video over 30 minutes ago, see sample_data.json for example.
 * @return {Array}              Array of objects describing any changes to videos.
 */
export async function checkChanges(new_videos, old_videos){
    let changes = {'removed': [], 'duration': []};
    let new_video_ids = new_videos.map((video) => video.id);
    let old_video_ids = old_videos.map((video) => video.id);
    let removed_video_ids = old_video_ids.filter((id) => !(new_video_ids.includes(id)));
    let changed_video_ids = new_video_ids.filter((id) => old_video_ids.includes(id));
    for (let id of removed_video_ids){
        changes.removed.push({
            "type": "removed",
            "old_video": old_videos.find((video) => video.id === id)
        });
    }
    for (let id of changed_video_ids){
        let new_video = new_videos.find((video) => video.id === id);
        let old_video = old_videos.find((video) => video.id === id);
        if (convertDuration(new_video.contentDetails.duration) < convertDuration(old_video.contentDetails.duration)){
            changes.duration.push({
                "type": "duration",
                "old_video": old_video,
                "new_video": new_video,
                "old_duration": convertDuration(old_video.contentDetails.duration),
                "new_duration": convertDuration(new_video.contentDetails.duration)
            });
        }
    }
    return changes;
}