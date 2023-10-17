import axios from "axios";
import dotenv from "dotenv";
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
export async function sendWebhookMessage(change) {
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
	return {
		content: null,
		embeds: [
			{
				title: "Video Removed",
				description: `**${video.snippet.title}** was removed!`,
				color: 16711680, // red
				fields: [
					{
						name: "Video creation date:",
						value: video.snippet.publishedAt,
					},
				],
			},
		],
		username: AVATAR_NAME,
		avatar_url: AVATAR_URL,
		attachments: [],
	};
}

function durationVideoEmbed(change) {
	return {
		content: null,
		embeds: [
			{
				title: "Video Trimmed",
				description: `**${
					change.video.snippet.title
				}** was trimmed by ${timeString(
					change.old_duration - change.new_duration
				)}!`,
				color: 16740352, // orange
				fields: [
					{
						name: "Old duration:",
						value: timeString(change.old_duration),
					},
					{
						name: "New duration:",
						value: timeString(change.new_duration),
					},
				],
				image: {
					url: change.video.snippet.thumbnails.maxres,
				},
				thumbnail: {
					url: `https://youtube.com/watch?v=${change.video.id}`,
				},
			},
		],
		username: AVATAR_NAME,
		avatar_url: AVATAR_URL,
		attachments: [],
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
