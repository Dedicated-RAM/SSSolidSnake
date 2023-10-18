import axios from "axios";
import dotenv from "dotenv";
import { convertDuration } from "./checkVideos.js";
dotenv.config();

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const AVATAR_URL =
	"https://cdn.discordapp.com/avatars/150049682024955914/a_dbd4df1578dcdd28f0e8079429a3cfdf.gif?size=1024&width=0&height=384";
const AVATAR_NAME = "SSSolidSnake";
/**
 * Posts a webhook embed to announce a deleted or trimmed video
 * @param  {Object} change          Change object that has the change type and other attribs.
 * @return {boolean}                returns true if the webhook was sent successfully, false otherwise.
 */
async function sendWebhookMessage(change) {
	let webhookMessage;
	switch (change.type) {
		case "removed":
			webhookMessage = deletedVideoEmbed(change.old_video);
			break;
		case "duration":
			webhookMessage = durationVideoEmbed(change);
			break;
		default:
			throw new Error("Invalid change type");
	}
	webhookMessage = JSON.stringify(webhookMessage);
	var config = {
		method: "post",
		url: WEBHOOK_URL,
		headers: {
			"Content-Type": "application/json",
		},
		data: webhookMessage,
	};
	axios(config)
		.then(function (response) {
			console.log("Webhook sent successfully");
			return true;
		})
		.catch(function (error) {
			console.log(error);
			return false;
		});
}

function deletedVideoEmbed(video) {
	const videoTitle = video.snippet.title || "TITLE NOT FOUND";
	const publishedAt = video.snippet.publishedAt || "Not Found";
	let viewCount = "-1"
	if (video.hasOwnProperty("statistics")) {
		viewCount = video.statistics.viewCount
	}
	const videoLength = convertDuration(video.contentDetails.duration) || -1;
	const videoId = video.id;
	// turn videoLength into a human readable string
	const videoLengthString = timeString(videoLength);

	return {
		"username": AVATAR_NAME,
		"avatar_url": AVATAR_URL,
		"content": null,
		"embeds": [
		  {
			"author": {
			  "name": "Video Removed",
			  "icon_url": "https://creazilla-store.fra1.digitaloceanspaces.com/emojis/52603/wastebasket-emoji-clipart-xl.png"
			},
			"title": videoTitle,
			"description": "",
			"color": 16711680,
			"fields": [
			  {
				"name": "View Count",
				"value": `${readableNumber(viewCount)} views`,
				"inline": true
			  },
			  {
				"name": "Publish Date",
				"value": readableDate(publishedAt),
				"inline": true
			  },
					  {
				"name": "",
				"value": ""
			  },
					  {
				"name": "Video Length",
				"value": videoLengthString,
				"inline": true
			  },
					  {
				"name": "Video ID",
				"value": videoId,
				"inline": true
			  },
			  {
				name: "Between",
				value: `<t:${new Date().getTime() - 60 * 30}> and <t:${new Date().getTime()}>`
			}
			],
			"thumbnail": {
			  "url": ""
			},
			"footer": {
			  "text": "Note: if the bot was down for more than 30 minutes, the `between time` could be off.",
			  "icon_url": ""
			}
		  }
		]
	  };
}

function durationVideoEmbed(change) {
	const videoTitle = change.video.snippet.title || "TITLE NOT FOUND";
	const publishedAt = change.video.snippet.publishedAt || "Not Found";
	let viewCount = "-1"
	if (change.video.hasOwnProperty("statistics")) {
		viewCount = change.video.statistics.viewCount;
	}
	const videoId = change.video.id;
	const thumbnailUrl = change.video.snippet.thumbnails.maxres.url;
	const videoUrl = `https://youtube.com/watch?v=${videoId}`;

	return {
		username: AVATAR_NAME,
		avatar_url: AVATAR_URL,
		content: null,
		embeds: [
			{
				author: {
					name: "Video Trimmed",
					icon_url:
						"https://em-content.zobj.net/source/skype/289/scissors_2702-fe0f.png",
				},
				title: videoTitle,
				url: videoUrl,
				description: `${timeString(change.old_duration - change.new_duration)} trimmed from the video.`,
				color: 15258703,
				fields: [
					{
						name: "Time Before",
						value: timeString(change.old_duration),
						inline: true,
					},
					{
						name: "Time After",
						value: timeString(change.new_duration),
						inline: true,
					},
					{
						name: "View Count",
						value: `${readableNumber(viewCount)} views`,
						inline: true,
					},
					{
						name: "",
						value: "",
					},
					{
						name: "Publish Date",
						value: readableDate(publishedAt),
						inline: true,
					},
					{
						name: "Video ID",
						value: videoId,
						inline: true,
					},
					{
						name: "Between",
						value: `<t:${new Date().getTime() - 60 * 30}> and <t:${new Date().getTime()}>`
					}
				],
				thumbnail: {
					url: thumbnailUrl,
				},
				footer: {
					text: "Note: if the bot was down for more than 30 minutes, this video may have been trimmed more than once and the `between time` could be off.",
					icon_url: "",
				},
			},
		],
	};
}

function timeString(seconds) {
	let timeString = "";
	if (seconds >= 3600) {
		timeString += `${Math.floor(seconds / 3600)}h `;
		seconds %= 3600;
	}
	if (seconds >= 60) {
		timeString += `${Math.floor(seconds / 60)}m `;
		seconds %= 60;
	}
	timeString += `${seconds}s`;
	return timeString;
}

// converts "2023-10-16T22:40:54Z" to October 16, 2023
function readableDate(string) {
	let date = new Date(string);
	let formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
	return formattedDate;
}

// converts 14772862 to 14,772,862
function readableNumber(string) {
	let number = parseInt(string);
	let formattedNumber = number.toLocaleString('en-US');
	return formattedNumber;
}

// async function that slowly sends the webhook messages to avoid rate limiting
export async function sendWebhookMessages(changes) {
	for (let change of changes) {
		await sendWebhookMessage(change);
		await sleep(5000);
	}
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}